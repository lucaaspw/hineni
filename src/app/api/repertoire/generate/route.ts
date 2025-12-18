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

    // Limpar repertório atual
    await prisma.weeklyRepertoire.deleteMany();

    // Buscar música nova da semana (se existir)
    const newOfWeekMusic = await prisma.music.findFirst({
      where: { isNewOfWeek: true },
      select: { id: true, title: true },
    });

    // Buscar outras músicas disponíveis (excluindo a nova da semana)
    const otherMusics = await prisma.music.findMany({
      where: newOfWeekMusic ? { id: { not: newOfWeekMusic.id } } : {},
      orderBy: [
        { createdAt: "desc" }, // Músicas mais recentes primeiro
      ],
      take: 5, // Pegar 5 músicas para preencher o repertório
      select: { id: true, title: true },
    });

    // Se não há músicas suficientes, retornar erro
    const totalMusics = (newOfWeekMusic ? 1 : 0) + otherMusics.length;
    if (totalMusics < 6) {
      return NextResponse.json(
        { 
          message: `Não há músicas suficientes para gerar o repertório. Necessário: 6, Disponível: ${totalMusics}`,
          available: totalMusics,
          required: 6
        },
        { status: 400 }
      );
    }

    // Preparar dados para o repertório
    // Calcular o início da semana (domingo)
    const weekStart = getWeekStart();
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
      where: { weekStart },
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
