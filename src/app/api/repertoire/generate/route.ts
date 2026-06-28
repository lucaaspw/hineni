import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "@/lib/auth";
import { generateMonthlyRepertoire } from "@/lib/repertoire-generate";
import { fetchMonthRepertoireView } from "@/lib/repertoire-query";

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

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();
    const plan = await generateMonthlyRepertoire(prisma, now);
    const monthView = await fetchMonthRepertoireView(prisma, now);

    return NextResponse.json(
      {
        message: `Repertório do mês gerado com sucesso (${plan.sundaysCount} semana(s))`,
        ...monthView,
        total: plan.entries.length,
        sundaysCount: plan.sundaysCount,
        newMusicsCount: plan.newMusics.length,
        baseMusicsPerWeek: plan.weeks[0]?.baseMusics.length ?? 0,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Cache-Invalidated": "true",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao gerar repertório:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";
    const isValidation =
      error instanceof Error &&
      (message.includes("Não há") || message.includes("Não há domingos"));

    return NextResponse.json(
      {
        message,
        ...(process.env.NODE_ENV === "development" && {
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }),
      },
      { status: isValidation ? 400 : 500 }
    );
  }
}
