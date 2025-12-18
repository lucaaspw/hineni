import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { musicSchema, musicEditSchema } from "@/lib/validations";
import { AUTH_CONFIG } from "@/lib/auth";

// Cache em memória para músicas (10 minutos)
// NOTA: Em ambientes serverless (Vercel, etc.), cada instância tem seu próprio cache.
// Para produção em escala, considere usar Redis ou similar.
let musicsCache: unknown[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

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

// GET - Listar todas as músicas
export async function GET() {
  try {
    const now = Date.now();

    // Verificar cache
    if (musicsCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(musicsCache, {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=1200",
          "X-Cache": "HIT",
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Atualizar cache
    musicsCache = musics;
    cacheTimestamp = now;

    return NextResponse.json(musics, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=1200",
        "X-Cache": "MISS",
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
      },
    });

    // Invalidar cache apenas se necessário
    musicsCache = null;

    return NextResponse.json(music, { status: 201 });
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
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyrics: true,
        chords: true,
        isNewOfWeek: true,
        createdAt: true,
      },
    });

    // Invalidar cache apenas se necessário
    musicsCache = null;

    return NextResponse.json(music, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Cache-Invalidated": "true",
      },
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

    // Invalidar cache
    musicsCache = null;

    return NextResponse.json({ message: "Música removida com sucesso" }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Cache-Invalidated": "true",
      },
    });
  } catch (error) {
    console.error("Erro ao remover música:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
