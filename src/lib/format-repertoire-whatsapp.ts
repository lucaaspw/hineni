import { getWeekStart, getWeekEnd } from "@/lib/utils";

export interface RepertoireMessageItem {
  position: number;
  music: {
    title: string;
    artist?: string | null;
    externalLink?: string | null;
    isNewOfWeek?: boolean;
  };
}

function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  const end = new Date(weekEnd);
  end.setDate(end.getDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(weekStart)} a ${fmt(end)}`;
}

function sortRepertoireItems(items: RepertoireMessageItem[]): RepertoireMessageItem[] {
  return [...items].sort((a, b) => {
    if (a.music.isNewOfWeek && !b.music.isNewOfWeek) return -1;
    if (!a.music.isNewOfWeek && b.music.isNewOfWeek) return 1;
    return a.position - b.position;
  });
}

export function formatRepertoireForWhatsApp(
  items: RepertoireMessageItem[],
  options?: { siteUrl?: string }
): string {
  if (items.length === 0) {
    return "";
  }

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const sorted = sortRepertoireItems(items);

  const lines: string[] = [
    "*Repertório da Semana* 🎵",
    `_${formatWeekRange(weekStart, weekEnd)}_`,
    "",
  ];

  sorted.forEach((item, index) => {
    const { music } = item;
    const artist = music.artist?.trim();
    const titleLine = artist
      ? `*${music.title}* — ${artist}`
      : `*${music.title}*`;

    let line = `${index + 1}. ${titleLine}`;
    if (music.isNewOfWeek) {
      line += " ⭐";
    }
    lines.push(line);

    if (music.externalLink?.trim()) {
      lines.push(`   🔗 ${music.externalLink.trim()}`);
    }
  });

  lines.push("");
  if (options?.siteUrl) {
    lines.push(`Cifras e letras: ${options.siteUrl}`);
  }

  return lines.join("\n");
}
