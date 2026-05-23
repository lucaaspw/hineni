import { NEW_MUSIC_TAG } from "@/lib/music-tags";

export function MusicTagBadge({ tag }: { tag: string }) {
  if (tag === NEW_MUSIC_TAG) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
        {tag}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
      {tag}
    </span>
  );
}
