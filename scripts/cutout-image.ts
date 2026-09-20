/**
 * `npm run image:cutout -- <kép> [kimenet.png]`
 *
 * Egyszínű (világos) hátterű rajzról levágja a hátteret, és átlátszó hátterű
 * PNG-t készít belőle. A kép szélétől indulva „kitölti” a háttérszínhez hasonló
 * pixeleket, ezért a rajzon belüli világos részek (pl. fehér felirat, cipő)
 * megmaradnak. A széleket lágyítja, végül körbevágja az üres részt.
 *
 * Kapcsolók:
 *   --tolerance=46   mennyire térhet el a háttérszíntől egy pixel (0–255)
 *   --soft=110       világos, halvány részek (pl. árnyék) eltűntetése
 *   --min-light=0.70 ehhez a „világossághoz” képest számít halványnak (0–1)
 *   --feather=40     a kivágás szélének lágyítása
 *   --pad=10         üres szegély a kész kép körül (képpont)
 *   --keep-shadow    a talajárnyékot is megtartja
 *   --seed=x,y       egy körülzárt háttérfolt (pl. a lábak között) egy pontja,
 *                    az EREDETI kép képpontjaiban; többször is megadható
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const raw = args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  const value = raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
};
const files = args.filter((a) => !a.startsWith("--"));
const input = files[0];
if (!input) {
  console.error('Használat: npm run image:cutout -- <kép> [kimenet.png]  (pl. "rajz.jpg")');
  process.exit(1);
}
const output = files[1] ?? `${input.replace(/\.[^.]+$/, "")}-kivagott.png`;

const tolerance = flag("tolerance", 46);
const soft = args.includes("--keep-shadow") ? tolerance : flag("soft", 110);
const minLight = flag("min-light", 0.7);
const feather = flag("feather", 40);
const pad = Math.max(0, Math.round(flag("pad", 10)));
const seeds = args
  .filter((a) => a.startsWith("--seed="))
  .map((a) => a.slice("--seed=".length).split(",").map(Number))
  .filter((pair) => pair.length === 2 && pair.every(Number.isFinite)) as [number, number][];

async function main() {
  if (!fs.existsSync(input)) {
    console.error(`Nincs ilyen fájl: ${input}`);
    process.exit(1);
  }
  const image = sharp(input).rotate().ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x: number, y: number) => (y * width + x) * channels;

  // A háttérszín a négy sarok átlaga.
  const corners = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((sum, [x, y]) => sum + data[at(x, y) + c], 0) / corners.length));
  const distance = (i: number) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
  const lightness = (i: number) => (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  const isBackground = (i: number) => {
    const dist = distance(i);
    if (dist <= tolerance) return true;
    // Halvány, világos folt (pl. a talajárnyék) – csak ha a rajznál világosabb.
    return dist <= soft && lightness(i) >= minLight;
  };

  // Elárasztásos kitöltés a kép széléről: csak az összefüggő háttér tűnik el.
  const outside = new Uint8Array(width * height);
  const queue: number[] = [];
  const push = (x: number, y: number) => {
    const index = y * width + x;
    if (outside[index]) return;
    if (!isBackground(index * channels)) return;
    outside[index] = 1;
    queue.push(index);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  // Körülzárt háttérfoltok (pl. a lábak között), ha meg lettek jelölve.
  for (const [x, y] of seeds) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      console.warn(`⚠️  A megjelölt pont a képen kívül van: ${x},${y}`);
      continue;
    }
    const before = queue.length;
    push(Math.round(x), Math.round(y));
    if (queue.length === before) console.warn(`⚠️  A megjelölt pont nem háttérszínű: ${x},${y}`);
  }
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head];
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  // Átlátszóság: a háttér teljesen eltűnik, a határon lévő pixelek lágyan halványulnak.
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const i = index * channels;
      if (outside[index]) {
        data[i + 3] = 0;
        continue;
      }
      const touchesOutside =
        (x > 0 && outside[index - 1]) ||
        (x < width - 1 && outside[index + 1]) ||
        (y > 0 && outside[index - width]) ||
        (y < height - 1 && outside[index + width]);
      if (touchesOutside && feather > 0) {
        const ramp = Math.min(1, Math.max(0, (distance(i) - tolerance) / feather));
        data[i + 3] = Math.round(data[i + 3] * ramp);
      }
      if (data[i + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    console.error("A kivágás után nem maradt semmi – próbáld kisebb --tolerance értékkel.");
    process.exit(1);
  }

  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cropWidth = Math.min(width - left, maxX - minX + 1 + pad * 2);
  const cropHeight = Math.min(height - top, maxY - minY + 1 + pad * 2);

  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  await sharp(data, { raw: { width, height, channels } })
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const removed = outside.reduce((sum, value) => sum + value, 0);
  console.log(`✔ ${output}`);
  console.log(`  Eredeti: ${width}×${height} → kivágva: ${cropWidth}×${cropHeight}`);
  console.log(`  Háttérszín: rgb(${bg.join(", ")}), eltávolítva a kép ${Math.round((removed / (width * height)) * 100)}%-a`);
}

main().catch((error) => {
  console.error("❌ A kivágás nem sikerült:", error);
  process.exit(1);
});
