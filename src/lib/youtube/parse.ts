/**
 * YouTube linkek felismerése (egységtesztelt).
 * Támogatott formák: youtube.com/watch?v=…, youtu.be/…, /shorts/…, /live/…,
 * /embed/…, /playlist?list=…, /@csatornanev, /channel/UC…, valamint az
 * m.youtube.com és a music.youtube.com változatok. Protokoll nélkül is működik.
 */

export type YoutubeLink =
  | { type: "video"; id: string; url: string }
  | { type: "short"; id: string; url: string }
  | { type: "playlist"; id: string; url: string }
  | { type: "channel"; id: string; url: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const HANDLE = /^@[A-Za-z0-9._-]{3,30}$/;
const LEGACY_NAME = /^[A-Za-z0-9._-]{1,100}$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

const video = (id: string): YoutubeLink => ({ type: "video", id, url: `https://www.youtube.com/watch?v=${id}` });
const short = (id: string): YoutubeLink => ({ type: "short", id, url: `https://www.youtube.com/shorts/${id}` });
const playlist = (id: string): YoutubeLink => ({
  type: "playlist",
  id,
  url: `https://www.youtube.com/playlist?list=${id}`,
});

export function parseYoutubeUrl(input: string): YoutubeLink | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  // youtu.be/<id>
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parts[0] ?? "";
    return VIDEO_ID.test(id) ? video(id) : null;
  }
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const first = parts[0] ?? "";

  // /watch?v=<id> (a &list= paraméter mellett is videóként kezeljük)
  if (first === "watch") {
    const id = url.searchParams.get("v") ?? "";
    if (VIDEO_ID.test(id)) return video(id);
    const list = url.searchParams.get("list") ?? "";
    return PLAYLIST_ID.test(list) ? playlist(list) : null;
  }
  // /shorts/<id>
  if (first === "shorts") {
    const id = parts[1] ?? "";
    return VIDEO_ID.test(id) ? short(id) : null;
  }
  // /embed/<id>, /live/<id>, /v/<id>
  if (first === "embed" || first === "live" || first === "v") {
    const id = parts[1] ?? "";
    return VIDEO_ID.test(id) ? video(id) : null;
  }
  // /playlist?list=<id>
  if (first === "playlist") {
    const id = url.searchParams.get("list") ?? "";
    return PLAYLIST_ID.test(id) ? playlist(id) : null;
  }
  // /@csatornanev (és alatta pl. /@nev/videos)
  if (first.startsWith("@")) {
    const handle = decodeURIComponent(first);
    return HANDLE.test(handle)
      ? { type: "channel", id: handle, url: `https://www.youtube.com/${handle}` }
      : null;
  }
  // /channel/UC…
  if (first === "channel") {
    const id = parts[1] ?? "";
    return CHANNEL_ID.test(id) ? { type: "channel", id, url: `https://www.youtube.com/channel/${id}` } : null;
  }
  // régi csatorna-címek: /c/<név>, /user/<név>
  if ((first === "c" || first === "user") && parts[1] && LEGACY_NAME.test(parts[1])) {
    return { type: "channel", id: `${first}/${parts[1]}`, url: `https://www.youtube.com/${first}/${parts[1]}` };
  }
  return null;
}

/** A bélyegkép címe egy videóhoz (maxres: 16:9 csík nélkül, hq: 4:3 fekete csíkkal). */
export function videoThumbnailUrls(id: string): { maxres: string; hq: string } {
  return {
    maxres: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    hq: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}
