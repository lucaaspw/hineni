import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache em memória para repertório (reduzido para 2 minutos em produção)
let repertoireCache: unknown[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 2 * 60 * 1000 : 10 * 60 * 1000; // 2 min produção, 10 min dev

// Função para invalidar cache
function invalidateCache() {
  repertoireCache = null;
  cacheTimestamp = 0;
}

// GET - Listar repertório
export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const isProduction = process.env.NODE_ENV === 'production';

    // Verificar cache apenas se não for uma requisição de refresh
    const isRefresh = request.headers.get('cache-control') === 'no-cache';
    
    if (!isRefresh && repertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(repertoireCache, {
        headers: {
          "Cache-Control": isProduction 
            ? "public, max-age=120, s-maxage=300, stale-while-revalidate=60"
            : "public, max-age=600, s-maxage=1200",
          "X-Cache": "HIT",
          "X-Cache-TTL": `${Math.ceil((CACHE_DURATION - (now - cacheTimestamp)) / 1000)}s`,
        },
      });
    }

    // Query otimizada com seleção específica de campos
    const repertoire = await prisma.weeklyRepertoire.findMany({
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
            updatedAt: true, // Adicionar updatedAt para melhor controle de cache
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

    // Atualizar cache
    repertoireCache = repertoire;
    cacheTimestamp = now;

    return NextResponse.json(repertoire, {
      headers: {
        "Cache-Control": isProduction 
          ? "public, max-age=120, s-maxage=300, stale-while-revalidate=60"
          : "public, max-age=600, s-maxage=1200",
        "X-Cache": "MISS",
        "X-Cache-TTL": `${Math.ceil(CACHE_DURATION / 1000)}s`,
        "ETag": `"${Date.now()}"`, // ETag para validação de cache
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

    // Query otimizada para verificar se a posição já está ocupada
    const existingItem = await prisma.weeklyRepertoire.findFirst({
      where: { position },
      select: { id: true },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: "Posição já está ocupada" },
        { status: 400 }
      );
    }

    const repertoireItem = await prisma.weeklyRepertoire.create({
      data: {
        musicId,
        position,
        isManual,
        weekStart: new Date(),
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
            updatedAt: true,
          },
        },
      },
    });

    // Invalidar cache imediatamente
    invalidateCache();

    return NextResponse.json(repertoireItem, { 
      status: 201,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.error("Erro ao adicionar ao repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Trocar música do repertório
export async function PUT(request: NextRequest) {
  try {
    const { id, musicId } = await request.json();
    if (!id || !musicId) {
      return NextResponse.json(
        { message: "ID do item e ID da música são obrigatórios" },
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
            updatedAt: true,
          },
        },
      },
    });

    // Invalidar cache imediatamente
    invalidateCache();

    return NextResponse.json(updated, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.error("Erro ao trocar música do repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
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

    // Invalidar cache imediatamente
    invalidateCache();

    return NextResponse.json({ message: "Item removido com sucesso" }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.error("Erro ao remover do repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
