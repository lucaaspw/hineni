import type { PrismaClient } from "@prisma/client";
import {
  BASE_MUSICS_COUNT,
  getMonthNewWeekStart,
  NEW_MUSICS_PER_MONTH,
  REPERTOIRE_SIZE,
} from "@/lib/repertoire";
import { isNewCatalogMusic, NEW_MUSIC_TAG } from "@/lib/music-tags";
import {
  getMonthEnd,
  getMonthStart,
  getSundaysInMonth,
  getWeekStart,
} from "@/lib/utils";

export interface MusicPick {
  id: string;
  title: string;
}

export interface GeneratedRepertoireMusics {
  newMusics: MusicPick[];
  baseMusics: MusicPick[];
}

export interface MonthlyRepertoireResult {
  entries: Array<{
    musicId: string;
    position: number;
    isManual: boolean;
    weekStart: Date;
  }>;
  sundaysCount: number;
  newMusics: MusicPick[];
  weeks: Array<{
    weekNumber: number;
    weekStart: Date;
    sunday: Date;
    baseMusics: MusicPick[];
  }>;
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function mergeUniqueById<T extends { id: string }>(
  primary: T[],
  secondary: T[],
  limit: number
): T[] {
  const result = uniqueById([...primary, ...secondary]);
  return result.slice(0, limit);
}

export async function selectRepertoireMusics(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<GeneratedRepertoireMusics> {
  const monthStart = getMonthStart(referenceDate);
  const monthEnd = getMonthEnd(referenceDate);

  const newMusics = await selectMonthlyNewMusics(
    prisma,
    monthStart,
    monthEnd,
    referenceDate
  );
  const newMusicIds = newMusics.map((m) => m.id);
  const baseMusics = await selectBaseMusicsForWeek(
    prisma,
    newMusicIds,
    new Set<string>(),
    BASE_MUSICS_COUNT
  );

  return { newMusics, baseMusics };
}

async function selectMonthlyNewMusics(
  prisma: PrismaClient,
  monthStart: Date,
  monthEnd: Date,
  referenceDate: Date = new Date()
): Promise<MusicPick[]> {
  const monthNewWeekStart = getMonthNewWeekStart(referenceDate);

  const monthNewEntries = await prisma.weeklyRepertoire.findMany({
    where: { weekStart: monthNewWeekStart },
    include: {
      music: { select: { id: true, title: true, tags: true } },
    },
    orderBy: { position: "asc" },
  });

  const alreadyUsed = uniqueById(
    monthNewEntries.map((item) => ({
      id: item.music.id,
      title: item.music.title,
    }))
  );

  if (alreadyUsed.length >= NEW_MUSICS_PER_MONTH) {
    return alreadyUsed.slice(0, NEW_MUSICS_PER_MONTH);
  }

  const needed = NEW_MUSICS_PER_MONTH - alreadyUsed.length;
  const excludeIds = alreadyUsed.map((m) => m.id);

  const fromPool = await prisma.music.findMany({
    where: {
      tags: { has: NEW_MUSIC_TAG },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: needed,
    select: { id: true, title: true },
  });

  return [...alreadyUsed, ...fromPool];
}

async function getUsedBaseIdsThisMonth(
  prisma: PrismaClient,
  referenceDate: Date
): Promise<Set<string>> {
  const sundays = getSundaysInMonth(referenceDate);
  const weekStarts = sundays.map((s) => getWeekStart(s));

  if (weekStarts.length === 0) return new Set();

  const repertoireThisMonth = await prisma.weeklyRepertoire.findMany({
    where: { weekStart: { in: weekStarts } },
    include: {
      music: { select: { id: true, tags: true } },
    },
  });

  return new Set(
    repertoireThisMonth
      .filter((item) => !isNewCatalogMusic(item.music.tags))
      .map((item) => item.music.id)
  );
}

async function selectBaseMusicsForWeek(
  prisma: PrismaClient,
  excludeIds: string[],
  usedBaseIdsThisMonth: Set<string>,
  count: number
): Promise<MusicPick[]> {
  const skipIds = [...new Set([...excludeIds, ...usedBaseIdsThisMonth])];

  const unusedThisMonth = await prisma.music.findMany({
    where: {
      NOT: { tags: { has: NEW_MUSIC_TAG } },
      ...(skipIds.length > 0 ? { id: { notIn: skipIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: count,
    select: { id: true, title: true },
  });

  if (unusedThisMonth.length >= count) {
    return unusedThisMonth;
  }

  const fallback = await prisma.music.findMany({
    where: {
      NOT: { tags: { has: NEW_MUSIC_TAG } },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: count,
    select: { id: true, title: true },
  });

  return mergeUniqueById(unusedThisMonth, fallback, count);
}

function buildMonthNewEntries(
  newMusics: MusicPick[],
  monthNewWeekStart: Date
): MonthlyRepertoireResult["entries"] {
  return newMusics.map((music, index) => ({
    musicId: music.id,
    position: index + 1,
    isManual: false,
    weekStart: monthNewWeekStart,
  }));
}

function buildWeekBaseEntries(
  baseMusics: MusicPick[],
  weekStart: Date
): MonthlyRepertoireResult["entries"] {
  return baseMusics.map((music, index) => ({
    musicId: music.id,
    position: index + 1,
    isManual: false,
    weekStart,
  }));
}

export function buildRepertoireEntries(
  musics: GeneratedRepertoireMusics,
  weekStart: Date
): Array<{
  musicId: string;
  position: number;
  isManual: boolean;
  weekStart: Date;
}> {
  return buildWeekBaseEntries(musics.baseMusics, weekStart);
}

export function validateRepertoireSelection(musics: GeneratedRepertoireMusics): {
  ok: boolean;
  message?: string;
  available: number;
} {
  const total = musics.newMusics.length + musics.baseMusics.length;

  if (musics.newMusics.length < NEW_MUSICS_PER_MONTH) {
    return {
      ok: false,
      message: `Não há músicas novas suficientes. Necessário: ${NEW_MUSICS_PER_MONTH}, disponível: ${musics.newMusics.length}`,
      available: total,
    };
  }

  if (musics.baseMusics.length < REPERTOIRE_SIZE) {
    return {
      ok: false,
      message: `Não há músicas da base suficientes para a semana. Necessário: ${REPERTOIRE_SIZE}, disponível: ${musics.baseMusics.length}`,
      available: total,
    };
  }

  return { ok: true, available: total };
}

export async function buildMonthlyRepertoirePlan(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<MonthlyRepertoireResult> {
  const monthNewWeekStart = getMonthNewWeekStart(referenceDate);
  const monthEnd = getMonthEnd(referenceDate);
  const sundays = getSundaysInMonth(referenceDate);

  if (sundays.length === 0) {
    throw new Error("Não há domingos no mês de referência");
  }

  const newMusics = await selectMonthlyNewMusics(
    prisma,
    getMonthStart(referenceDate),
    monthEnd,
    referenceDate
  );

  if (newMusics.length < NEW_MUSICS_PER_MONTH) {
    throw new Error(
      `Não há músicas novas suficientes. Necessário: ${NEW_MUSICS_PER_MONTH}, disponível: ${newMusics.length}`
    );
  }

  const newMusicIds = newMusics.map((m) => m.id);
  const usedBaseIds = await getUsedBaseIdsThisMonth(prisma, referenceDate);
  const weeks: MonthlyRepertoireResult["weeks"] = [];
  const entries: MonthlyRepertoireResult["entries"] = [
    ...buildMonthNewEntries(newMusics, monthNewWeekStart),
  ];

  for (let i = 0; i < sundays.length; i++) {
    const sunday = sundays[i];
    const baseMusics = await selectBaseMusicsForWeek(
      prisma,
      newMusicIds,
      usedBaseIds,
      BASE_MUSICS_COUNT
    );

    if (baseMusics.length < BASE_MUSICS_COUNT) {
      throw new Error(
        `Não há músicas da base suficientes para ${sundays.length} semana(s). Faltam ${BASE_MUSICS_COUNT - baseMusics.length} na semana ${i + 1}`
      );
    }

    baseMusics.forEach((music) => usedBaseIds.add(music.id));

    const weekStart = getWeekStart(sunday);
    weeks.push({
      weekNumber: i + 1,
      weekStart,
      sunday,
      baseMusics,
    });
    entries.push(...buildWeekBaseEntries(baseMusics, weekStart));
  }

  return {
    entries,
    sundaysCount: sundays.length,
    newMusics,
    weeks,
  };
}

export async function clearMonthlyRepertoire(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<void> {
  const monthNewWeekStart = getMonthNewWeekStart(referenceDate);
  const sundays = getSundaysInMonth(referenceDate);
  const weekStarts = [
    monthNewWeekStart,
    ...sundays.map((s) => getWeekStart(s)),
  ];
  const uniqueWeekStarts = [
    ...new Map(weekStarts.map((d) => [d.getTime(), d])).values(),
  ];

  await prisma.weeklyRepertoire.deleteMany({
    where: { weekStart: { in: uniqueWeekStarts } },
  });
}

export async function generateMonthlyRepertoire(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<MonthlyRepertoireResult> {
  const plan = await buildMonthlyRepertoirePlan(prisma, referenceDate);

  await clearMonthlyRepertoire(prisma, referenceDate);

  if (plan.entries.length > 0) {
    await prisma.weeklyRepertoire.createMany({
      data: plan.entries,
    });
  }

  return plan;
}
