import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

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

    const { title, artist, lyrics, chords, isNewOfWeek } = await request.json();

    // Validar campos obrigatórios
    if (!title || !lyrics) {
      return NextResponse.json(
        { message: "Título e letra são obrigatórios" },
        { status: 400 }
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

    const { id, title, artist, lyrics, chords, isNewOfWeek } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID da música é obrigatório" },
        { status: 400 }
      );
    }

    // Se for música nova da semana, verificar se já existe outra
    if (isNewOfWeek) {
      const existingNewOfWeek = await prisma.music.findFirst({
        where: {
          isNewOfWeek: true,
          id: { not: id },
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
