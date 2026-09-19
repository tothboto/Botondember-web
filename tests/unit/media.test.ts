import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { buildIco, icoLargestToPng } from "@/lib/media/favicon";
import { detectImageType, ImageError, processImage } from "@/lib/media/process";
import { isSafeKey, mimeForKey } from "@/lib/media/storage";

async function samplePng(size = 64) {
  return sharp({ create: { width: size, height: size, channels: 4, background: "#00529F" } }).png().toBuffer();
}

describe("képtípus felismerése a fájl tartalma alapján", () => {
  it("felismeri a PNG, JPG, GIF, WEBP és ICO fájlokat", async () => {
    const base = sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } });
    expect(detectImageType(await base.clone().png().toBuffer())).toBe("png");
    expect(detectImageType(await base.clone().jpeg().toBuffer())).toBe("jpeg");
    expect(detectImageType(await base.clone().gif().toBuffer())).toBe("gif");
    expect(detectImageType(await base.clone().webp().toBuffer())).toBe("webp");
    expect(detectImageType(buildIco([{ size: 16, png: await samplePng(16) }]))).toBe("ico");
  });

  it("az SVG-t és a szöveget nem fogadja el képnek", () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(detectImageType(svg)).toBeNull();
    expect(detectImageType(Buffer.from("<html><body>Szia</body></html>"))).toBeNull();
  });

  it("a feldolgozott kép WEBP lesz, és legfeljebb a megadott méretű", async () => {
    const big = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: "#FEBE10" } })
      .jpeg()
      .toBuffer();
    const result = await processImage(big);
    expect(detectImageType(result.data)).toBe("webp");
    expect(result.width).toBe(2560);
    expect(result.height).toBe(1280);
  });

  it("SVG feltöltést barátságos hibaüzenettel elutasít", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
    await expect(processImage(svg)).rejects.toBeInstanceOf(ImageError);
  });
});

describe("favicon (ICO)", () => {
  it("az ICO fájlból visszanyeri a legnagyobb képet", async () => {
    const ico = buildIco([
      { size: 16, png: await samplePng(16) },
      { size: 48, png: await samplePng(48) },
      { size: 32, png: await samplePng(32) },
    ]);
    const { png, size } = await icoLargestToPng(ico);
    expect(size).toBe(48);
    expect(detectImageType(png)).toBe("png");
  });
});

describe("biztonságos fájlkulcsok", () => {
  it("elfogadja a normál kulcsokat", () => {
    expect(isSafeKey("img/2026/09/abc123.webp")).toBe(true);
    expect(isSafeKey("favicon/default/icon-32.png")).toBe(true);
    expect(isSafeKey("favicon/v1/favicon.ico")).toBe(true);
  });

  it("elutasítja a trükkös útvonalakat és a tiltott kiterjesztéseket", () => {
    for (const key of [
      "../.env.local",
      "img/../../secret.webp",
      "img//a.webp",
      "/etc/passwd.png",
      "img\\a.webp",
      "C:/a.png",
      "img/a.svg",
      "img/a.html",
      "IMG/A.WEBP",
      "",
    ]) {
      expect(isSafeKey(key), key).toBe(false);
    }
  });

  it("a kiterjesztésből megadja a típust", () => {
    expect(mimeForKey("a/b.webp")).toBe("image/webp");
    expect(mimeForKey("favicon.ico")).toBe("image/x-icon");
    expect(mimeForKey("a.svg")).toBeNull();
  });
});
