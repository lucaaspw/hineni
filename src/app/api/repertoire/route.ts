import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache em memória para repertório (5 minutos)
let repertoireCache: unknown[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// GET - Listar repertório
export async function GET() {
  try {
    const now = Date.now();

    // Verificar cache
    if (repertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(repertoireCache, {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600",
          "X-Cache": "HIT",
        },
      });
    }

    // Buscar dados do banco
    const repertoire = await prisma.weeklyRepertoire.findMany({
      include: {
        music: true,
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
        "Cache-Control": "public, max-age=300, s-maxage=600",
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

    // Verificar se a música existe
    const music = await prisma.music.findUnique({
      where: { id: musicId },
    });

    if (!music) {
      return NextResponse.json(
        { message: "Música não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a posição já está ocupada
    const existingItem = await prisma.weeklyRepertoire.findFirst({
      where: { position },
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
      include: {
        music: true,
      },
    });

    // Invalidar cache
    repertoireCache = null;

    return NextResponse.json(repertoireItem, { status: 201 });
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

    // Verificar se a música existe
    const music = await prisma.music.findUnique({ where: { id: musicId } });
    if (!music) {
      return NextResponse.json(
        { message: "Música não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar o item do repertório
    const updated = await prisma.weeklyRepertoire.update({
      where: { id },
      data: { musicId },
      include: { music: true },
    });

    // Invalidar cache
    repertoireCache = null;

    return NextResponse.json(updated);
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

    // Invalidar cache
    repertoireCache = null;

    return NextResponse.json({ message: "Item removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover do repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
