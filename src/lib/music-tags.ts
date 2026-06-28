export const NEW_MUSIC_TAG = "Nova";

export function hasMusicTag(tags: string[] | undefined, tag: string): boolean {
  return tags?.includes(tag) ?? false;
}

export function isNewCatalogMusic(tags: string[] | undefined): boolean {
  return hasMusicTag(tags, NEW_MUSIC_TAG);
}
