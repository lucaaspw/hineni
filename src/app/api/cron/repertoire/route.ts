import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMonthlyRepertoire } from "@/lib/repertoire-generate";

export const dynamic = "force-dynamic";

function isAuthorizedCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();

  if (now.getDate() !== 1) {
    return NextResponse.json({
      message: "Cron ignorado: executa apenas no dia 1 de cada mês",
      skipped: true,
    });
  }

  try {
    const plan = await generateMonthlyRepertoire(prisma, now);

    return NextResponse.json({
      message: "Repertório mensal gerado automaticamente",
      sundaysCount: plan.sundaysCount,
      totalEntries: plan.entries.length,
      newMusics: plan.newMusics.map((m) => m.title),
      weeks: plan.weeks.map((week) => ({
        sunday: week.sunday.toISOString().split("T")[0],
        weekStart: week.weekStart.toISOString(),
        baseMusics: week.baseMusics.map((m) => m.title),
      })),
    });
  } catch (error) {
    console.error("Erro no cron de repertório:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erro ao gerar repertório mensal",
      },
      { status: 500 }
    );
  }
}
