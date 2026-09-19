import { describe, expect, it } from "vitest";
import { parseYoutubeUrl } from "@/lib/youtube/parse";

const ID = "dQw4w9WgXcQ";
const WATCH = `https://www.youtube.com/watch?v=${ID}`;

describe("YouTube linkek felismerése", () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`http://youtube.com/watch?v=${ID}`],
    [`youtube.com/watch?v=${ID}`],
    [`https://m.youtube.com/watch?v=${ID}&t=42s`],
    [`https://music.youtube.com/watch?v=${ID}&feature=share`],
    [`https://www.youtube.com/watch?v=${ID}&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&index=3`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abcDEF123`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube.com/live/${ID}?feature=shared`],
  ])("videó: %s", (input) => {
    expect(parseYoutubeUrl(input)).toEqual({ type: "video", id: ID, url: WATCH });
  });

  it("shorts", () => {
    expect(parseYoutubeUrl(`https://www.youtube.com/shorts/${ID}`)).toEqual({
      type: "short",
      id: ID,
      url: `https://www.youtube.com/shorts/${ID}`,
    });
    expect(parseYoutubeUrl(`youtube.com/shorts/${ID}?feature=share`)?.type).toBe("short");
  });

  it("lejátszási lista", () => {
    const list = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";
    expect(parseYoutubeUrl(`https://www.youtube.com/playlist?list=${list}`)).toEqual({
      type: "playlist",
      id: list,
      url: `https://www.youtube.com/playlist?list=${list}`,
    });
    // watch link csak listával (videó nélkül)
    expect(parseYoutubeUrl(`https://www.youtube.com/watch?list=${list}`)?.type).toBe("playlist");
  });

  it("csatorna @névvel", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/@realmadrid")).toEqual({
      type: "channel",
      id: "@realmadrid",
      url: "https://www.youtube.com/@realmadrid",
    });
    expect(parseYoutubeUrl("youtube.com/@Pelda.Csatorna_1/videos")?.id).toBe("@Pelda.Csatorna_1");
  });

  it("csatorna /channel/UC… azonosítóval", () => {
    const channel = "UCWV3obpZVGgJ3j9FVhEjF2Q";
    expect(parseYoutubeUrl(`https://www.youtube.com/channel/${channel}`)).toEqual({
      type: "channel",
      id: channel,
      url: `https://www.youtube.com/channel/${channel}`,
    });
  });

  it("régi csatorna-címek (/c/, /user/)", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/c/PeldaCsatorna")?.type).toBe("channel");
    expect(parseYoutubeUrl("https://www.youtube.com/user/pelda")?.url).toBe("https://www.youtube.com/user/pelda");
  });

  it.each([
    [""],
    ["nem link"],
    ["https://example.com/watch?v=dQw4w9WgXcQ"],
    ["https://www.youtube.com.evil.com/watch?v=dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=tul-rovid"],
    ["https://www.youtube.com/channel/nem-uc-azonosito"],
    ["javascript:alert(1)"],
    ["ftp://youtube.com/watch?v=dQw4w9WgXcQ"],
    ["https://www.youtube.com/"],
  ])("nem YouTube / hibás link: „%s” → null", (input) => {
    expect(parseYoutubeUrl(input)).toBeNull();
  });
});
