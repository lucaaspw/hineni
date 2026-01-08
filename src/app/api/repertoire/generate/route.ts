import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "@/lib/auth";
import { getWeekStart } from "@/lib/utils";

// Middleware para verificar autenticação
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret);
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // Calcular o início da semana (domingo) para limpar apenas o repertório desta semana
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Limpar repertório apenas da semana atual
    await prisma.weeklyRepertoire.deleteMany({
      where: {
        weekStart: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    // Buscar música nova da semana (se existir)
    const newOfWeekMusic = await prisma.music.findFirst({
      where: { isNewOfWeek: true },
      select: { id: true, title: true },
    });

    // Buscar todas as músicas disponíveis (excluindo a nova da semana)
    const allAvailableMusics = await prisma.music.findMany({
      where: newOfWeekMusic ? { id: { not: newOfWeekMusic.id } } : {},
      select: { id: true, title: true },
    });

    // Função para embaralhar array aleatoriamente (Fisher-Yates shuffle)
    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    // Calcular quantas músicas são necessárias (6 total, menos 1 se houver música nova da semana)
    const musicsNeeded = newOfWeekMusic ? 5 : 6;

    // Verificar se há músicas suficientes antes de embaralhar
    if (allAvailableMusics.length < musicsNeeded) {
      const totalMusics = (newOfWeekMusic ? 1 : 0) + allAvailableMusics.length;
      return NextResponse.json(
        { 
          message: `Não há músicas suficientes para gerar o repertório. Necessário: 6, Disponível: ${totalMusics}`,
          available: totalMusics,
          required: 6
        },
        { status: 400 }
      );
    }

    // Embaralhar músicas aleatoriamente e pegar as necessárias
    const shuffledMusics = shuffleArray(allAvailableMusics);
    const otherMusics = shuffledMusics.slice(0, musicsNeeded);

    // Preparar dados para o repertório
    const repertoireData = [];

    // Posição 1: Música nova da semana (se existir)
    if (newOfWeekMusic) {
      repertoireData.push({
        musicId: newOfWeekMusic.id,
        position: 1,
        isManual: false,
        weekStart,
      });
    }

    // Posições 2-6: Outras músicas
    const positionsToFill = newOfWeekMusic ? [2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
    
    otherMusics.forEach((music, index) => {
      const position = positionsToFill[index];
      repertoireData.push({
        musicId: music.id,
        position,
        isManual: false,
        weekStart,
      });
    });

    // Criar o repertório
    await prisma.weeklyRepertoire.createMany({
      data: repertoireData,
    });

    // Buscar o repertório criado para retornar
    const createdRepertoire = await prisma.weeklyRepertoire.findMany({
      where: {
        weekStart: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      include: {
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            isNewOfWeek: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ 
      message: "Repertório gerado automaticamente com sucesso",
      repertoire: createdRepertoire,
      total: createdRepertoire.length,
      weekStart: weekStart.toISOString().split('T')[0], // Data formatada
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Cache-Invalidated": "true",
      },
    });

  } catch (error) {
    console.error("Erro ao gerar repertório:", error);
    return NextResponse.json(
      { 
        message: "Erro interno do servidor",
        ...(process.env.NODE_ENV === "development" && { 
          error: error instanceof Error ? error.message : "Erro desconhecido" 
        })
      },
      { status: 500 }
    );
  }
}
