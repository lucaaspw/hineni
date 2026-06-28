import { getWeekStart, getWeekEnd } from "@/lib/utils";
import { isNewCatalogMusic } from "@/lib/music-tags";

export interface RepertoireMessageItem {
  position: number;
  music: {
    title: string;
    artist?: string | null;
    externalLink?: string | null;
    tags?: string[];
  };
}

function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  const end = new Date(weekEnd);
  end.setDate(end.getDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(weekStart)} a ${fmt(end)}`;
}

function formatMusicLine(item: RepertoireMessageItem, index: number): string[] {
  const { music } = item;
  const artist = music.artist?.trim();
  const titleLine = artist
    ? `*${music.title}* — ${artist}`
    : `*${music.title}*`;

  let line = `${index + 1}. ${titleLine}`;
  if (isNewCatalogMusic(music.tags)) {
    line += " ⭐";
  }

  const lines = [line];
  if (music.externalLink?.trim()) {
    lines.push(`   🔗 ${music.externalLink.trim()}`);
  }
  return lines;
}

export function formatRepertoireForWhatsApp(
  items: RepertoireMessageItem[],
  options?: { siteUrl?: string; monthNew?: RepertoireMessageItem[] }
): string {
  const monthNew = options?.monthNew ?? [];
  const weekItems = items;

  if (monthNew.length === 0 && weekItems.length === 0) {
    return "";
  }

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const lines: string[] = [
    "*Repertório da Semana* 🎵",
    `_${formatWeekRange(weekStart, weekEnd)}_`,
    "",
  ];

  if (monthNew.length > 0) {
    lines.push("*Músicas novas do mês* ⭐");
    monthNew.forEach((item, index) => {
      lines.push(...formatMusicLine(item, index));
    });
    lines.push("");
  }

  if (weekItems.length > 0) {
    lines.push("*Esta semana*");
    weekItems.forEach((item, index) => {
      lines.push(...formatMusicLine(item, index));
    });
    lines.push("");
  }

  if (options?.siteUrl) {
    lines.push(`Cifras e letras: ${options.siteUrl}`);
  }

  return lines.join("\n");
}

export function formatMonthRepertoireForWhatsApp(
  monthNew: RepertoireMessageItem[],
  weeks: Array<{ weekNumber: number; items: RepertoireMessageItem[] }>,
  options?: { siteUrl?: string }
): string {
  if (monthNew.length === 0 && weeks.every((w) => w.items.length === 0)) {
    return "";
  }

  const lines: string[] = ["*Repertório do Mês* 🎵", ""];

  if (monthNew.length > 0) {
    lines.push("*Músicas novas do mês* ⭐");
    monthNew.forEach((item, index) => {
      lines.push(...formatMusicLine(item, index));
    });
    lines.push("");
  }

  for (const week of weeks) {
    if (week.items.length === 0) continue;
    lines.push(`*Semana ${week.weekNumber}*`);
    week.items.forEach((item, index) => {
      lines.push(...formatMusicLine(item, index));
    });
    lines.push("");
  }

  if (options?.siteUrl) {
    lines.push(`Cifras e letras: ${options.siteUrl}`);
  }

  return lines.join("\n");
}
