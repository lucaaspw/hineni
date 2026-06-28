import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeekStart, getWeekEnd } from "@/lib/utils";
import { REPERTOIRE_SIZE } from "@/lib/repertoire";
import {
  fetchMonthRepertoireView,
  fetchPublicRepertoireView,
  normalizePublicRepertoireView,
} from "@/lib/repertoire-query";

let repertoireCache: unknown | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1 * 60 * 1000;

function invalidateRepertoireCache() {
  repertoireCache = null;
  cacheTimestamp = 0;
}

export async function GET(request: NextRequest) {
  try {
    const view = request.nextUrl.searchParams.get("view");
    const now = Date.now();

    if (view === "month") {
      const data = await fetchMonthRepertoireView(prisma);
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Cache": "MISS",
        },
      });
    }

    if (repertoireCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(normalizePublicRepertoireView(repertoireCache), {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=1200",
          "X-Cache": "HIT",
        },
      });
    }

    let data = await fetchPublicRepertoireView(prisma);

    if (data.currentWeek.length === 0 && data.monthNew.length === 0) {
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();
      console.log(
        `[Repertório] Nenhum repertório para semana atual (${weekStart.toISOString()} - ${weekEnd.toISOString()}), buscando mais recente...`
      );

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const fallback = await prisma.weeklyRepertoire.findMany({
        where: { weekStart: { gte: sevenDaysAgo } },
        select: {
          id: true,
          position: true,
          isManual: true,
          weekStart: true,
          music: {
            select: {
              id: true,
              title: true,
              artist: true,
              lyrics: true,
              chords: true,
              externalLink: true,
              isNewOfWeek: true,
              tags: true,
            },
          },
        },
        orderBy: [{ weekStart: "desc" }, { position: "asc" }],
      });

      if (fallback.length > 0) {
        const groupedByWeek = fallback.reduce(
          (acc, item) => {
            const weekKey = item.weekStart.toISOString();
            if (!acc[weekKey]) acc[weekKey] = [];
            acc[weekKey].push(item);
            return acc;
          },
          {} as Record<string, typeof fallback>
        );

        const latestWeekKey = Object.keys(groupedByWeek).sort().reverse()[0];
        data = {
          monthNew: [],
          currentWeek: (groupedByWeek[latestWeekKey] || []).slice(
            0,
            REPERTOIRE_SIZE
          ),
        };
      }
    }

    data = normalizePublicRepertoireView(data);

    if (data.currentWeek.length > 0 || data.monthNew.length > 0) {
      repertoireCache = data;
      cacheTimestamp = now;
    } else {
      invalidateRepertoireCache();
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=1200",
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

export async function POST(request: NextRequest) {
  try {
    const { musicId, position, isManual } = await request.json();

    if (!musicId || !position) {
      return NextResponse.json(
        { message: "ID da música e posição são obrigatórios" },
        { status: 400 }
      );
    }

    if (position < 1 || position > REPERTOIRE_SIZE) {
      return NextResponse.json(
        { message: `A posição deve ser entre 1 e ${REPERTOIRE_SIZE}` },
        { status: 400 }
      );
    }

    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    const currentWeekCount = await prisma.weeklyRepertoire.count({
      where: {
        weekStart: { gte: weekStart, lt: weekEnd },
      },
    });

    if (currentWeekCount >= REPERTOIRE_SIZE) {
      return NextResponse.json(
        {
          message: `A semana já está completa (máximo de ${REPERTOIRE_SIZE} músicas)`,
        },
        { status: 400 }
      );
    }

    const music = await prisma.music.findUnique({
      where: { id: musicId },
      select: { id: true },
    });

    if (!music) {
      return NextResponse.json(
        { message: "Música não encontrada" },
        { status: 404 }
      );
    }

    const musicAlreadyInRepertoire = await prisma.weeklyRepertoire.findFirst({
      where: {
        musicId,
        weekStart: { gte: weekStart, lt: weekEnd },
      },
      select: { id: true },
    });

    if (musicAlreadyInRepertoire) {
      return NextResponse.json(
        { message: "Esta música já está no repertório desta semana" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.weeklyRepertoire.findFirst({
      where: {
        position,
        weekStart: { gte: weekStart, lt: weekEnd },
      },
      select: { id: true },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: `A posição ${position} já está ocupada nesta semana` },
        { status: 400 }
      );
    }

    const repertoireItem = await prisma.weeklyRepertoire.create({
      data: {
        musicId,
        position,
        isManual,
        weekStart,
      },
      select: {
        id: true,
        position: true,
        isManual: true,
        weekStart: true,
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            lyrics: true,
            chords: true,
            externalLink: true,
            isNewOfWeek: true,
            tags: true,
          },
        },
      },
    });

    invalidateRepertoireCache();

    return NextResponse.json(repertoireItem, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar ao repertório:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Esta posição já está ocupada nesta semana" },
        { status: 400 }
      );
    }

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, musicId } = body;

    if (!id || !musicId) {
      return NextResponse.json(
        { message: "ID do item e ID da música são obrigatórios" },
        { status: 400 }
      );
    }

    const music = await prisma.music.findUnique({
      where: { id: musicId },
      select: { id: true, title: true },
    });

    if (!music) {
      return NextResponse.json(
        { message: "Música não encontrada" },
        { status: 404 }
      );
    }

    const existingItem = await prisma.weeklyRepertoire.findUnique({
      where: { id },
      select: { id: true, position: true, musicId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Item do repertório não encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.weeklyRepertoire.update({
      where: { id },
      data: { musicId },
      select: {
        id: true,
        position: true,
        isManual: true,
        weekStart: true,
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            lyrics: true,
            chords: true,
            externalLink: true,
            isNewOfWeek: true,
            tags: true,
          },
        },
      },
    });

    invalidateRepertoireCache();

    return NextResponse.json(updated, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Cache-Invalidated": "true",
      },
    });
  } catch (error) {
    console.error("Erro ao trocar música do repertório:", error);
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

    invalidateRepertoireCache();

    return NextResponse.json({ message: "Item removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover do repertório:", error);
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
