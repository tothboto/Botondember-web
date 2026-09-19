/**
 * Adatok lekérése egy YouTube linkhez (csak az Adminban, a szerveren):
 * cím, csatornanév és bélyegkép. Videóknál és listáknál a YouTube hivatalos
 * oEmbed végpontját használjuk; csatornáknál a nyilvános oldal meta-adatait.
 * A bélyegképet letöltjük és helyben tároljuk, így a látogatók böngészője
 * nem kommunikál a Google-lel.
 */
import sharp from "sharp";
import { downloadImage } from "@/lib/media/remote";
import { parseYoutubeUrl, videoThumbnailUrls, type YoutubeLink } from "./parse";

export type YoutubeDetails = {
  link: YoutubeLink;
  title: string;
  author: string;
  thumbnail: Buffer | null;
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Accept-Language": "hu,en;q=0.8",
  // „Mindent elutasítok” süti-választás – így nem a hozzájárulási oldal jön vissza.
  Cookie: "SOCS=CAI",
};

async function oembed(url: string): Promise<{ title: string; author: string; thumbnailUrl: string | null } | null> {
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  try {
    const response = await fetch(endpoint, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    return {
      title: typeof data.title === "string" ? data.title : "",
      author: typeof data.author_name === "string" ? data.author_name : "",
      thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
    };
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function metaContent(html: string, property: string): string | null {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`, "i");
  const match = pattern.exec(html);
  return match ? decodeEntities(match[1]) : null;
}

async function channelMeta(url: string): Promise<{ title: string; imageUrl: string | null } | null> {
  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, 2_000_000);
    const title = metaContent(html, "og:title");
    if (!title) return null;
    return { title, imageUrl: metaContent(html, "og:image") };
  } catch {
    return null;
  }
}

/** A régi (4:3) bélyegképről levágja a fekete csíkokat, hogy 16:9 legyen. */
async function cropToWide(image: Buffer): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  if (!meta.width || !meta.height) return image;
  const targetHeight = Math.round((meta.width * 9) / 16);
  if (targetHeight >= meta.height) return image;
  const top = Math.round((meta.height - targetHeight) / 2);
  return sharp(image).extract({ left: 0, top, width: meta.width, height: targetHeight }).toBuffer();
}

async function tryDownload(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    return await downloadImage(url);
  } catch {
    return null;
  }
}

export async function fetchYoutubeDetails(input: string): Promise<YoutubeDetails | null> {
  const link = parseYoutubeUrl(input);
  if (!link) return null;

  if (link.type === "channel") {
    const meta = await channelMeta(link.url);
    return {
      link,
      title: meta?.title ?? "",
      author: "",
      thumbnail: await tryDownload(meta?.imageUrl ?? null),
    };
  }

  const info = await oembed(link.type === "short" ? `https://www.youtube.com/watch?v=${link.id}` : link.url);
  let thumbnail: Buffer | null = null;
  if (link.type === "video" || link.type === "short") {
    const urls = videoThumbnailUrls(link.id);
    thumbnail = await tryDownload(urls.maxres);
    if (!thumbnail) {
      const hq = await tryDownload(urls.hq);
      thumbnail = hq ? await cropToWide(hq) : null;
    }
  } else {
    thumbnail = await tryDownload(info?.thumbnailUrl ?? null);
    if (thumbnail) thumbnail = await cropToWide(thumbnail);
  }
  return { link, title: info?.title ?? "", author: info?.author ?? "", thumbnail };
}
