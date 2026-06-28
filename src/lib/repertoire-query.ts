import type { PrismaClient } from "@prisma/client";
import { getMonthNewWeekStart } from "@/lib/repertoire";
import { getSundaysInMonth, getWeekStart } from "@/lib/utils";

export const repertoireMusicSelect = {
  id: true,
  title: true,
  artist: true,
  lyrics: true,
  chords: true,
  externalLink: true,
  isNewOfWeek: true,
  tags: true,
} as const;

export const repertoireItemSelect = {
  id: true,
  position: true,
  isManual: true,
  weekStart: true,
  music: { select: repertoireMusicSelect },
} as const;

export type RepertoireItemRecord = {
  id: string;
  position: number;
  isManual: boolean;
  weekStart: Date;
  music: {
    id: string;
    title: string;
    artist: string | null;
    lyrics: string;
    chords: string | null;
    externalLink: string | null;
    isNewOfWeek: boolean;
    tags: string[];
  };
};

export interface RepertoireWeekView {
  weekNumber: number;
  sunday: string;
  weekStart: string;
  items: RepertoireItemRecord[];
}

export interface RepertoireMonthView {
  monthNew: RepertoireItemRecord[];
  weeks: RepertoireWeekView[];
}

export interface RepertoirePublicView {
  monthNew: RepertoireItemRecord[];
  currentWeek: RepertoireItemRecord[];
}

export function normalizePublicRepertoireView(data: unknown): RepertoirePublicView {
  if (Array.isArray(data)) {
    return { monthNew: [], currentWeek: data };
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return {
      monthNew: Array.isArray(obj.monthNew) ? obj.monthNew : [],
      currentWeek: Array.isArray(obj.currentWeek) ? obj.currentWeek : [],
    };
  }

  return { monthNew: [], currentWeek: [] };
}

export function normalizeMonthRepertoireView(data: unknown): RepertoireMonthView {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { monthNew: [], weeks: [] };
  }

  const obj = data as Record<string, unknown>;

  return {
    monthNew: Array.isArray(obj.monthNew) ? obj.monthNew : [],
    weeks: Array.isArray(obj.weeks)
      ? obj.weeks.map((week, index) => {
          const w = week as Record<string, unknown>;
          return {
            weekNumber: typeof w.weekNumber === "number" ? w.weekNumber : index + 1,
            sunday: typeof w.sunday === "string" ? w.sunday : "",
            weekStart: typeof w.weekStart === "string" ? w.weekStart : "",
            items: Array.isArray(w.items) ? w.items : [],
          };
        })
      : [],
  };
}

export async function fetchMonthRepertoireView(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<RepertoireMonthView> {
  const monthNewWeekStart = getMonthNewWeekStart(referenceDate);
  const sundays = getSundaysInMonth(referenceDate);

  const monthNew = await prisma.weeklyRepertoire.findMany({
    where: { weekStart: monthNewWeekStart },
    select: repertoireItemSelect,
    orderBy: { position: "asc" },
  });

  const weeks: RepertoireWeekView[] = [];

  for (let i = 0; i < sundays.length; i++) {
    const sunday = sundays[i];
    const weekStart = getWeekStart(sunday);
    const items = await prisma.weeklyRepertoire.findMany({
      where: { weekStart },
      select: repertoireItemSelect,
      orderBy: { position: "asc" },
    });

    weeks.push({
      weekNumber: i + 1,
      sunday: sunday.toISOString().split("T")[0],
      weekStart: weekStart.toISOString(),
      items,
    });
  }

  return { monthNew, weeks };
}

export async function fetchPublicRepertoireView(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<RepertoirePublicView> {
  const monthNewWeekStart = getMonthNewWeekStart(referenceDate);
  const weekStart = getWeekStart(referenceDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [monthNew, currentWeek] = await Promise.all([
    prisma.weeklyRepertoire.findMany({
      where: { weekStart: monthNewWeekStart },
      select: repertoireItemSelect,
      orderBy: { position: "asc" },
    }),
    prisma.weeklyRepertoire.findMany({
      where: {
        weekStart: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: repertoireItemSelect,
      orderBy: { position: "asc" },
    }),
  ]);

  return { monthNew, currentWeek };
}
