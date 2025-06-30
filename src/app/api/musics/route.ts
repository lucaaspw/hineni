import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { musicSchema, musicEditSchema } from "@/lib/validations";

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

// GET - Listar todas as músicas
export async function GET() {
  try {
    const musics = await prisma.music.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(musics);
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

    // Verificar se já existe uma música com o mesmo título e artista
    const existingMusic = await prisma.music.findFirst({
      where: {
        title: {
          equals: title,
          mode: "insensitive", // Case insensitive
        },
        artist: artist
          ? {
              equals: artist,
              mode: "insensitive", // Case insensitive
            }
          : null,
      },
    });

    if (existingMusic) {
      return NextResponse.json(
        {
          message: "Já existe uma música com este título e artista",
          existingMusic: {
            id: existingMusic.id,
            title: existingMusic.title,
            artist: existingMusic.artist,
          },
        },
        { status: 409 }
      );
    }

    // Se for música nova da semana, verificar se já existe uma
    if (isNewOfWeek) {
      const existingNewOfWeek = await prisma.music.findFirst({
        where: { isNewOfWeek: true },
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
    });

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

    // Verificar se já existe uma música com o mesmo título e artista (excluindo a atual)
    const existingMusic = await prisma.music.findFirst({
      where: {
        id: { not: id }, // Excluir a música atual
        title: {
          equals: title,
          mode: "insensitive", // Case insensitive
        },
        artist: artist
          ? {
              equals: artist,
              mode: "insensitive", // Case insensitive
            }
          : null,
      },
    });

    if (existingMusic) {
      return NextResponse.json(
        {
          message: "Já existe uma música com este título e artista",
          existingMusic: {
            id: existingMusic.id,
            title: existingMusic.title,
            artist: existingMusic.artist,
          },
        },
        { status: 409 }
      );
    }

    // Se for música nova da semana, verificar se já existe uma (excluindo a atual)
    if (isNewOfWeek) {
      const existingNewOfWeek = await prisma.music.findFirst({
        where: {
          isNewOfWeek: true,
          id: { not: id }, // Excluir a música atual
        },
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
    });

    return NextResponse.json(music);
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

    return NextResponse.json({ message: "Música removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover música:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
