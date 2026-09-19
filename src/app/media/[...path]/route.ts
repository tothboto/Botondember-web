/**
 * A feltöltött (és generált) képek kiszolgálása: `/media/<kulcs>`.
 * A fájlok nem a `public/` mappában vannak (production buildben a Next.js csak
 * a build idején ott lévő fájlokat szolgálná ki), hanem a tároló-rétegben.
 */
import { getStorage, isSafeKey, mimeForKey } from "@/lib/media/storage";

export async function GET(_request: Request, context: RouteContext<"/media/[...path]">) {
  const { path } = await context.params;
  const key = path.join("/");
  const mime = mimeForKey(key);
  if (!isSafeKey(key) || !mime) return new Response("Nem található.", { status: 404 });

  const data = await getStorage().get(key);
  if (!data) return new Response("Nem található.", { status: 404 });

  // A feltöltött képek neve egyedi (véletlen azonosító), így sosem változnak.
  const immutable = key.startsWith("img/") || key.startsWith("yt/");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
