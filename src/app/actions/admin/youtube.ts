"use server";

import { getDb } from "@/db/client";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { saveImage, type MediaInfo } from "@/lib/media/library";
import { getStorage } from "@/lib/media/storage";
import { fetchYoutubeDetails } from "@/lib/youtube/fetch";
import { parseYoutubeUrl } from "@/lib/youtube/parse";

export type YoutubeLookup = {
  type: "video" | "short" | "playlist" | "channel";
  url: string;
  ytId: string;
  title: string;
  author: string;
  thumb: MediaInfo | null;
  warning: string | null;
};

/**
 * Link beillesztése → a szerver lekéri a címet és a csatornanevet (oEmbed),
 * a bélyegképet letölti és helyben tárolja. Minden mező kézzel felülírható.
 */
export async function lookupYoutube(url: string): Promise<ActionResult<YoutubeLookup>> {
  return runAdmin(async () => {
    const input = String(url ?? "").slice(0, 500);
    const link = parseYoutubeUrl(input);
    if (!link) {
      throw new UserError(
        "Ezt a linket nem ismerem fel. Támogatott: youtube.com/watch?v=…, youtu.be/…, /shorts/…, /playlist?list=…, /@csatornanev, /channel/UC…",
      );
    }
    const details = await fetchYoutubeDetails(input);
    let thumb: MediaInfo | null = null;
    if (details?.thumbnail) {
      try {
        thumb = await saveImage(getDb(), getStorage(), details.thumbnail, {
          originalName: `youtube-${link.id.replace(/[^A-Za-z0-9_-]/g, "")}.jpg`,
          alt: details.title ? `${details.title} – bélyegkép` : "YouTube bélyegkép",
          source: "youtube",
          maxDimension: 1280,
        });
      } catch {
        thumb = null;
      }
    }
    const missing = !details?.title;
    return {
      type: link.type,
      url: link.url,
      ytId: link.id,
      title: details?.title ?? "",
      author: details?.author ?? "",
      thumb,
      warning: missing
        ? link.type === "channel"
          ? "A csatorna adatait nem sikerült automatikusan lekérni – töltsd ki kézzel, és tölts fel egy avatart!"
          : "Az adatokat nem sikerült lekérni (lehet, hogy privát vagy törölt a videó). Töltsd ki kézzel!"
        : thumb
          ? null
          : "A bélyegképet nem sikerült letölteni – tölts fel egyet kézzel!",
    };
  });
}
