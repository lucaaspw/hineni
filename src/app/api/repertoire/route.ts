import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { repertoireSchema } from "@/lib/validations";

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

// GET - Obter repertório da semana
export async function GET() {
  try {
    const repertoire = await prisma.weeklyRepertoire.findMany({
      include: {
        music: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json(repertoire);
  } catch (error) {
    console.error("Erro ao buscar repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Atualizar repertório da semana
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar dados com Zod
    const validationResult = repertoireSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { positions } = validationResult.data;

    // Limpar repertório atual
    await prisma.weeklyRepertoire.deleteMany();

    // Adicionar novas posições
    await prisma.weeklyRepertoire.createMany({
      data: positions.map((musicId: string, index: number) => ({
        musicId,
        position: index + 1,
        isManual: true,
      })),
    });

    return NextResponse.json({ message: "Repertório atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar repertório:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função para gerar repertório automático
// (Removida pois não é usada diretamente nos handlers exportados)
