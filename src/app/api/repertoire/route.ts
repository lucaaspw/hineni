import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeekStart, getWeekEnd } from "@/lib/utils";

// Cache em memória para repertório (10 minutos)
// NOTA: Em ambientes serverless (Vercel, etc.), cada instância tem seu próprio cache.
// Para produção em escala, considere usar Redis ou similar.
let repertoireCache: unknown[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Função para invalidar cache
function invalidateRepertoireCache() {
  repertoireCache = null;
  cacheTimestamp = 0;
}

// GET - Listar repertório
export async function GET() {
  try {
    const now = Date.now();

    // Verificar cache
    if (repertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(repertoireCache, {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=1200",
          "X-Cache": "HIT",
        },
      });
    }

    // Calcular início e fim da semana atual para filtrar apenas o repertório desta semana
    // A semana começa na segunda-feira às 03h
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    // Query otimizada com seleção específica de campos
    // Filtra apenas o repertório da semana atual
    let repertoire = await prisma.weeklyRepertoire.findMany({
      where: {
        weekStart: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        id: true,
        position: true,
        isManual: true,
        weekStart: true,
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            lyrics: true,
            chords: true,
            isNewOfWeek: true,
          },
        },
      },
      orderBy: [
        {
          music: {
            isNewOfWeek: "desc", // Música nova da semana primeiro
          },
        },
        {
          position: "asc", // Depois por posição
        },
      ],
    });

    // Se não encontrou repertório com a nova lógica, buscar o mais recente
    // (pode ser que os dados antigos estejam com formato diferente)
    if (repertoire.length === 0) {
      console.log(`[Repertório] Nenhum repertório encontrado para semana atual (${weekStart.toISOString()} - ${weekEnd.toISOString()}), buscando mais recente...`);
      
      // Buscar o repertório mais recente (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      repertoire = await prisma.weeklyRepertoire.findMany({
        where: {
          weekStart: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          id: true,
          position: true,
          isManual: true,
          weekStart: true,
          music: {
            select: {
              id: true,
              title: true,
              artist: true,
              lyrics: true,
              chords: true,
              isNewOfWeek: true,
            },
          },
        },
        orderBy: [
          {
            weekStart: "desc", // Mais recente primeiro
          },
          {
            music: {
              isNewOfWeek: "desc",
            },
          },
          {
            position: "asc",
          },
        ],
        take: 6, // Limitar a 6 músicas (um repertório completo)
      });

      // Se encontrou repertório, agrupar por weekStart e pegar o mais recente
      if (repertoire.length > 0) {
        // Agrupar por weekStart
        const groupedByWeek = repertoire.reduce((acc, item) => {
          const weekKey = item.weekStart.toISOString().split('T')[0];
          if (!acc[weekKey]) {
            acc[weekKey] = [];
          }
          acc[weekKey].push(item);
          return acc;
        }, {} as Record<string, typeof repertoire>);

        // Pegar o grupo mais recente
        const latestWeek = Object.keys(groupedByWeek).sort().reverse()[0];
        repertoire = groupedByWeek[latestWeek] || [];
        
        console.log(`[Repertório] Encontrado repertório antigo com ${repertoire.length} músicas da semana ${latestWeek}`);
      } else {
        console.log('[Repertório] Nenhum repertório encontrado nos últimos 7 dias');
      }
    } else {
      console.log(`[Repertório] Encontrado ${repertoire.length} músicas para a semana atual`);
    }

    // Atualizar cache apenas se encontrou repertório
    if (repertoire.length > 0) {
      repertoireCache = repertoire;
      cacheTimestamp = now;
    } else {
      // Se não encontrou, invalidar cache para forçar nova busca
      invalidateRepertoireCache();
    }

    return NextResponse.json(repertoire, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=1200",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Adicionar ao repertório
export async function POST(request: NextRequest) {
  try {
    const { musicId, position, isManual } = await request.json();

    if (!musicId || !position) {
      return NextResponse.json(
        { message: "ID da música e posição são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar posição (deve ser entre 1 e 6)
    if (position < 1 || position > 6) {
      return NextResponse.json(
        { message: "A posição deve ser entre 1 e 6" },
        { status: 400 }
      );
    }

    // Verificar se já existem 6 itens no repertório
    const currentRepertoireCount = await prisma.weeklyRepertoire.count();
    if (currentRepertoireCount >= 6) {
      return NextResponse.json(
        { message: "O repertório já está completo (máximo de 6 músicas)" },
        { status: 400 }
      );
    }

    // Query otimizada para verificar se a música existe
    const music = await prisma.music.findUnique({
      where: { id: musicId },
      select: { id: true },
    });

    if (!music) {
      return NextResponse.json(
        { message: "Música não encontrada" },
        { status: 404 }
      );
    }

    // Calcular o início e fim da semana (segunda-feira às 03h) para validações e criação
    // A semana começa na segunda-feira às 03h
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    
    // Verificar se a música já está no repertório desta semana
    const musicAlreadyInRepertoire = await prisma.weeklyRepertoire.findFirst({
      where: { 
        musicId,
        weekStart: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: { id: true },
    });

    if (musicAlreadyInRepertoire) {
      return NextResponse.json(
        { message: "Esta música já está no repertório desta semana" },
        { status: 400 }
      );
    }
    
    // Query otimizada para verificar se a posição já está ocupada nesta semana
    const existingItem = await prisma.weeklyRepertoire.findFirst({
      where: { 
        position,
        weekStart: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: { id: true },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: `A posição ${position} já está ocupada nesta semana` },
        { status: 400 }
      );
    }
    
    const repertoireItem = await prisma.weeklyRepertoire.create({
      data: {
        musicId,
        position,
        isManual,
        weekStart,
      },
      select: {
        id: true,
        position: true,
        isManual: true,
        weekStart: true,
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            lyrics: true,
            chords: true,
            isNewOfWeek: true,
          },
        },
      },
    });

    // Invalidar cache
    invalidateRepertoireCache();

    return NextResponse.json(repertoireItem, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar ao repertório:", error);
    
    // Verificar se é erro de constraint única (posição duplicada)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Esta posição já está ocupada nesta semana" },
        { status: 400 }
      );
    }
    
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

// PUT - Trocar música do repertório
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, musicId } = body;
    
    if (!id || !musicId) {
      return NextResponse.json(
        { message: "ID do item e ID da música são obrigatórios" },
        { status: 400 }
      );
    }

    // Query otimizada para verificar se a música existe
    const music = await prisma.music.findUnique({ 
      where: { id: musicId },
      select: { id: true, title: true },
    });
    
    if (!music) {
      return NextResponse.json(
        { message: "Música não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o item do repertório existe
    const existingItem = await prisma.weeklyRepertoire.findUnique({
      where: { id },
      select: { id: true, position: true, musicId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Item do repertório não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o item do repertório com seleção otimizada
    const updated = await prisma.weeklyRepertoire.update({
      where: { id },
      data: { musicId },
      select: {
        id: true,
        position: true,
        isManual: true,
        weekStart: true,
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            lyrics: true,
            chords: true,
            isNewOfWeek: true,
          },
        },
      },
    });

    // Invalidar cache
    invalidateRepertoireCache();

    return NextResponse.json(updated, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Cache-Invalidated": "true",
      },
    });
  } catch (error) {
    console.error("Erro ao trocar música do repertório:", error);
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

// DELETE - Remover do repertório
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID do item é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.weeklyRepertoire.delete({
      where: { id },
    });

    // Invalidar cache
    invalidateRepertoireCache();

    return NextResponse.json({ message: "Item removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover do repertório:", error);
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
