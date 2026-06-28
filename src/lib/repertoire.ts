/** Músicas da base por semana/domingo */
export const REPERTOIRE_SIZE = 3;

/** Músicas novas (tag "Nova") fixas por mês — exibidas no topo */
export const NEW_MUSICS_PER_MONTH = 2;

/** Alias semântico: músicas da base por semana */
export const BASE_MUSICS_COUNT = REPERTOIRE_SIZE;

export function getRepertoirePositions(): number[] {
  return Array.from({ length: REPERTOIRE_SIZE }, (_, i) => i + 1);
}

/** weekStart usado para armazenar as 2 novas do mês (dia 1 às 00:00) */
export function getMonthNewWeekStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function isMonthNewWeekStart(
  weekStart: Date,
  referenceDate: Date = new Date()
): boolean {
  const monthNew = getMonthNewWeekStart(referenceDate);
  return weekStart.getTime() === monthNew.getTime();
}
