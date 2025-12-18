import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSundaysOfYear, generateRotatedScales } from "@/lib/utils";
import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "@/lib/auth";

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

// Membros da equipe de louvor
const FEMALE_VOICES = [
  "Beatriz", // Soprano
  "Anna Beatriz", // Soprano
  "Leticia", // Soprano
  "Anna Julia", // Contralto
  "Sarah", // Contralto
  "Cristiane", // Contralto
  "Ingrid", // Contralto
  "Laura", // Contralto
];

const FIXED_MEMBER = "Lucas"; // Tenor - fixo todos os domingos

// GET - Listar escalas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear() + 1;

    if (isNaN(targetYear)) {
      return NextResponse.json(
        { message: "Ano inválido" },
        { status: 400 }
      );
    }

    const scales = await prisma.scale.findMany({
      where: {
        year: targetYear,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(scales, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar escalas:", error);
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        ...(process.env.NODE_ENV === "development" && {
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }),
      },
      { status: 500 }
    );
  }
}

// POST - Gerar escalas para um ano
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const year = body.year || new Date().getFullYear() + 1;

    if (isNaN(year) || year < 2024) {
      return NextResponse.json(
        { message: "Ano inválido. Deve ser 2024 ou superior." },
        { status: 400 }
      );
    }

    // Verificar se já existem escalas para este ano
    const existingScales = await prisma.scale.findFirst({
      where: { year },
    });

    if (existingScales) {
      return NextResponse.json(
        {
          message: `Já existem escalas geradas para o ano ${year}. Delete as escalas existentes antes de gerar novas.`,
        },
        { status: 409 }
      );
    }

    // Gerar todos os domingos do ano
    const sundays = getAllSundaysOfYear(year);

    if (sundays.length === 0) {
      return NextResponse.json(
        { message: "Não foi possível gerar domingos para o ano especificado" },
        { status: 400 }
      );
    }

    // Gerar escalas rotacionadas
    const scalesData = generateRotatedScales(
      FEMALE_VOICES,
      FIXED_MEMBER,
      sundays
    );

    // Validar dados antes de salvar
    if (!scalesData || scalesData.length === 0) {
      return NextResponse.json(
        { message: "Erro ao gerar dados das escalas" },
        { status: 500 }
      );
    }

    // Preparar dados para inserção
    const dataToInsert = scalesData.map((scale) => {
      const date = new Date(scale.date);
      // Validar data
      if (isNaN(date.getTime())) {
        throw new Error(`Data inválida: ${scale.date}`);
      }
      
      // Validar membros
      if (!Array.isArray(scale.members) || scale.members.length === 0) {
        throw new Error(`Membros inválidos para a data ${date.toISOString()}`);
      }
      
      return {
        date,
        year,
        members: scale.members,
      };
    });

    // Criar escalas no banco de dados em lotes para evitar problemas
    const batchSize = 50;
    let totalCreated = 0;
    
    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize);
      const result = await prisma.scale.createMany({
        data: batch,
        skipDuplicates: true, // Pular duplicatas se houver
      });
      totalCreated += result.count;
    }
    
    const createdScales = { count: totalCreated };

    // Buscar as escalas criadas para retornar
    const scales = await prisma.scale.findMany({
      where: { year },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(
      {
        message: `Escalas geradas com sucesso para o ano ${year}`,
        total: createdScales.count,
        scales,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao gerar escalas:", error);
    
    // Log detalhado do erro em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.error("Detalhes do erro:", {
        message: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
    }
    
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        ...(process.env.NODE_ENV === "development" && {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar escalas de um ano
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json(
        { message: "Ano é obrigatório" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json(
        { message: "Ano inválido" },
        { status: 400 }
      );
    }

    const result = await prisma.scale.deleteMany({
      where: { year: yearNum },
    });

    return NextResponse.json({
      message: `Escalas do ano ${yearNum} removidas com sucesso`,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Erro ao deletar escalas:", error);
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        ...(process.env.NODE_ENV === "development" && {
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }),
      },
      { status: 500 }
    );
  }
}

