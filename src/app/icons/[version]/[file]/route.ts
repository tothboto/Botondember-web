/**
 * A favicon-készlet ikonjai: `/icons/<verzió>/<fájl>`.
 * - Konkrét verziónál az URL-ben lévő verzió miatt a böngészők egy új favicon
 *   feltöltése után biztosan az újat töltik le (hosszú gyorsítótár).
 * - A `current` „verzió” mindig az éppen aktívat adja – erre mutat a
 *   `/favicon.ico` is (lásd next.config.ts, rövid gyorsítótár).
 */
import { getAllSettings } from "@/lib/data/settings";
import { FAVICON_FILES, faviconKey, type FaviconFile } from "@/lib/media/favicon";
import { getStorage } from "@/lib/media/storage";

export async function GET(_request: Request, context: RouteContext<"/icons/[version]/[file]">) {
  const { version, file } = await context.params;
  if (!/^[a-z0-9-]{1,40}$/.test(version) || !FAVICON_FILES.includes(file as FaviconFile)) {
    return new Response("Nem található.", { status: 404 });
  }
  const storage = getStorage();
  const isCurrent = version === "current";
  const resolved = isCurrent ? ((await getAllSettings()).general.faviconVersion ?? "default") : version;

  let data = await storage.get(faviconKey(resolved, file as FaviconFile));
  if (!data && isCurrent) data = await storage.get(faviconKey("default", file as FaviconFile));
  if (!data) return new Response("Nem található.", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": file.endsWith(".ico") ? "image/x-icon" : "image/png",
      "Cache-Control": isCurrent ? "public, max-age=3600" : "public, max-age=31536000, immutable",
    },
  });
}
