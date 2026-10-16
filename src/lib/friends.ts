/**
 * A barátok közösségi linkjeinek fajtái. Márkalogót szándékosan nem használunk
 * (ahogy a YouTube oldalon sem) – semleges ikon + a hálózat neve szerepel, így
 * a képernyőolvasó is pontosan felolvassa, melyik profilra mutat a link.
 */
export const FRIEND_LINK_KINDS = ["youtube", "tiktok", "instagram", "discord", "game", "website", "other"] as const;

export type FriendLinkKind = (typeof FRIEND_LINK_KINDS)[number];

/** A hálózat neve (tulajdonnév, nem fordítjuk) és az ikonjának színe. */
export const FRIEND_LINK_LABELS: Record<FriendLinkKind, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  discord: "Discord",
  game: "Játék",
  website: "Honlap",
  other: "Link",
};

/** A profilgombok színe – mindegyik elég sötét ahhoz, hogy fehér ikon legyen rajta. */
export const FRIEND_LINK_COLORS: Record<FriendLinkKind, string> = {
  youtube: "#b3231d",
  tiktok: "#1f2430",
  instagram: "#a3366f",
  discord: "#4451b8",
  game: "#2f6b4f",
  website: "#1f5aa8",
  other: "#5b4636",
};

/** A profilkép kerete – a lista sorrendje szerint váltakozik. */
export const FRIEND_RING_COLORS = ["#1f5aa8", "#7b3fb8", "#1f8a6d", "#b3561d", "#a3366f"] as const;

export function friendRingColor(index: number): string {
  return FRIEND_RING_COLORS[index % FRIEND_RING_COLORS.length];
}

export function isFriendLinkKind(value: unknown): value is FriendLinkKind {
  return typeof value === "string" && (FRIEND_LINK_KINDS as readonly string[]).includes(value);
}
