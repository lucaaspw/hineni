import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { musicSchema, musicEditSchema } from "@/lib/validations";

// Cache em memória para músicas (reduzido para 2 minutos em produção)
let musicsCache: unknown[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 2 * 60 * 1000 : 10 * 60 * 1000; // 2 min produção, 10 min dev

// Middleware para verificar autenticação
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );
    return decoded;
  } catch {
    return null;
  }
}

// Função para invalidar cache
function invalidateCache() {
  musicsCache = null;
  cacheTimestamp = 0;
}

// GET - Listar todas as músicas
export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const isProduction = process.env.NODE_ENV === 'production';

    // Verificar cache apenas se não for uma requisição de refresh
    const isRefresh = request.headers.get('cache-control') === 'no-cache';
    
    if (!isRefresh && musicsCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(musicsCache, {
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
    const musics = await prisma.music.findMany({
      select: {
        id: true,
        title: true,
        artist: true,
        lyrics: true,
        chords: true,
        isNewOfWeek: true,
        createdAt: true,
        updatedAt: true, // Adicionar updatedAt para melhor controle de cache
      },
      orderBy: { createdAt: "desc" },
    });

    // Atualizar cache
    musicsCache = musics;
    cacheTimestamp = now;

    return NextResponse.json(musics, {
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
    console.error("Erro ao buscar músicas:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Adicionar nova música
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar dados com Zod
    const validationResult = musicSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, artist, lyrics, chords, isNewOfWeek } =
      validationResult.data;

    // Query otimizada para verificar duplicatas
    const existingMusic = await prisma.music.findFirst({
      where: {
        title: {
          equals: title,
          mode: "insensitive",
        },
        artist: artist
          ? {
              equals: artist,
              mode: "insensitive",
            }
          : null,
      },
      select: {
        id: true,
        title: true,
        artist: true,
      },
    });

    if (existingMusic) {
      return NextResponse.json(
        {
          message: "Já existe uma música com este título e artista",
          existingMusic,
        },
        { status: 409 }
      );
    }

    // Se for música nova da semana, verificar se já existe uma
    if (isNewOfWeek) {
      const existingNewOfWeek = await prisma.music.findFirst({
        where: { isNewOfWeek: true },
        select: { id: true },
      });

      if (existingNewOfWeek) {
        return NextResponse.json(
          { message: "Já existe uma música nova da semana" },
          { status: 400 }
        );
      }
    }

    const music = await prisma.music.create({
      data: {
        title,
        artist,
        lyrics,
        chords,
        isNewOfWeek,
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyrics: true,
        chords: true,
        isNewOfWeek: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidar cache imediatamente
    invalidateCache();

    return NextResponse.json(music, { 
      status: 201,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.error("Erro ao criar música:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar música
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar dados com Zod
    const validationResult = musicEditSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { id, title, artist, lyrics, chords, isNewOfWeek } =
      validationResult.data;

    // Query otimizada para verificar duplicatas
    const existingMusic = await prisma.music.findFirst({
      where: {
        id: { not: id },
        title: {
          equals: title,
          mode: "insensitive",
        },
        artist: artist
          ? {
              equals: artist,
              mode: "insensitive",
            }
          : null,
      },
      select: {
        id: true,
        title: true,
        artist: true,
      },
    });

    if (existingMusic) {
      return NextResponse.json(
        {
          message: "Já existe uma música com este título e artista",
          existingMusic,
        },
        { status: 409 }
      );
    }

    // Se for música nova da semana, verificar se já existe uma (excluindo a atual)
    if (isNewOfWeek) {
      const existingNewOfWeek = await prisma.music.findFirst({
        where: {
          isNewOfWeek: true,
          id: { not: id },
        },
        select: { id: true },
      });

      if (existingNewOfWeek) {
        return NextResponse.json(
          { message: "Já existe uma música nova da semana" },
          { status: 400 }
        );
      }
    }

    const music = await prisma.music.update({
      where: { id },
      data: {
        title,
        artist,
        lyrics,
        chords,
        isNewOfWeek,
        updatedAt: new Date(), // Forçar atualização do timestamp
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyrics: true,
        chords: true,
        isNewOfWeek: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidar cache imediatamente
    invalidateCache();

    return NextResponse.json(music, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar música:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Remover música
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID da música é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.music.delete({
      where: { id },
    });

    // Invalidar cache imediatamente
    invalidateCache();

    return NextResponse.json({ message: "Música removida com sucesso" }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.error("Erro ao remover música:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
