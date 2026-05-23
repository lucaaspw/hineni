export const REPERTOIRE_SIZE = 4;

export function getRepertoirePositions(hasNewOfWeek: boolean): number[] {
  const count = hasNewOfWeek ? REPERTOIRE_SIZE - 1 : REPERTOIRE_SIZE;
  const start = hasNewOfWeek ? 2 : 1;
  return Array.from({ length: count }, (_, i) => start + i);
}

export function getOtherMusicsCount(hasNewOfWeek: boolean): number {
  return hasNewOfWeek ? REPERTOIRE_SIZE - 1 : REPERTOIRE_SIZE;
}
