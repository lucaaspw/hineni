import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

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

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // Limpar repertório atual
    await prisma.weeklyRepertoire.deleteMany();

    // Buscar músicas disponíveis
    const availableMusics = await prisma.music.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Pegar 5 músicas para preencher automaticamente
    });

    // Se não há músicas suficientes, retornar erro
    if (availableMusics.length < 5) {
      return NextResponse.json(
        { message: "Não há músicas suficientes para gerar o repertório" },
        { status: 400 }
      );
    }

    // Adicionar músicas ao repertório
    const weekStart = new Date();
    await prisma.weeklyRepertoire.createMany({
      data: availableMusics.map((music: { id: string }, index: number) => ({
        musicId: music.id,
        position: index + 1,
        isManual: false,
        weekStart,
      })),
    });

    return NextResponse.json({ message: "Repertório gerado automaticamente" });
  } catch (error) {
    console.error("Erro ao gerar repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
