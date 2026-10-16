import { Camera, Gamepad2, Globe, Link as LinkIcon, MessageCircle, Music, Video } from "lucide-react";
import type { ComponentType } from "react";
import { FRIEND_LINK_COLORS, isFriendLinkKind, type FriendLinkKind } from "@/lib/friends";

const ICONS: Record<FriendLinkKind, ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  youtube: Video,
  tiktok: Music,
  instagram: Camera,
  discord: MessageCircle,
  game: Gamepad2,
  website: Globe,
  other: LinkIcon,
};

/**
 * Egy barát profiljaira mutató kerek gombok. A gomb felirata a képernyőolvasónak
 * teljes mondat („Barát profilja: YouTube”), hogy több link között is egyértelmű legyen.
 */
export function FriendLinks({
  links,
  name,
  nameLang,
  networkName,
  label,
  newTabLabel,
  size = "small",
}: {
  links: { kind: string; url: string }[];
  name: string;
  nameLang?: string;
  /** A hálózat neve a látogató nyelvén (a márkanevek mindenhol ugyanazok). */
  networkName: (kind: FriendLinkKind) => string;
  /** A hálózat neve beillesztve, pl. „YouTube profil”. A név mögé kerül. */
  label: (network: string) => string;
  newTabLabel: string;
  size?: "small" | "large";
}) {
  const valid = links.filter((link) => isFriendLinkKind(link.kind) && link.url);
  if (valid.length === 0) return null;
  const box = size === "large" ? "h-11 w-11" : "h-9 w-9";
  const icon = size === "large" ? "h-5 w-5" : "h-4 w-4";

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {valid.map((link, index) => {
        const kind = link.kind as FriendLinkKind;
        const Icon = ICONS[kind];
        const network = networkName(kind);
        return (
          <li key={`${kind}-${index}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: FRIEND_LINK_COLORS[kind] }}
              className={`flex ${box} items-center justify-center rounded-full text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus`}
            >
              <Icon aria-hidden className={icon} strokeWidth={2.2} />
              <span className="sr-only">
                <span lang={nameLang}>{name}</span> {" – "}
                {label(network)} {newTabLabel}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
