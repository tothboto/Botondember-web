/**
 * `npm run fonts:check` – ellenőrzi, hogy a betöltött betűtípusok tartalmazzák-e
 * a magyar hosszú ékezetes betűket (ő, ű, Ő, Ű).
 *
 * A `next/font` által letöltött betűfájlokat vizsgálja (.next/static/media),
 * ezért előbb futtatni kell egy buildet (`npm run build`) vagy a `npm run dev`-et.
 */
import fs from "node:fs";
import path from "node:path";
import * as fontkit from "fontkit";

const REQUIRED = ["ő", "ű", "Ő", "Ű", "á", "é", "í", "ó", "ö", "ú", "ü"];
const EXPECTED_FAMILIES = [
  "Inter",
  "Inter Tight",
  "Cinzel",
  "Roboto",
  "Montserrat",
  "Oswald",
  "Playfair Display",
  "Chakra Petch",
];

const dirs = [".next/static/media", ".next/dev/static/media"].map((d) => path.join(process.cwd(), d));
const files = dirs
  .filter((d) => fs.existsSync(d))
  .flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith(".woff2")).map((f) => path.join(d, f)));

if (files.length === 0) {
  console.error("Nem találtam betűfájlokat. Futtasd előbb: npm run build");
  process.exit(1);
}

// A változtatható betűk fájljában a név lehet pl. „Montserrat Thin” vagy „Chakra Petch Medium”,
// ezért a leghosszabb illeszkedő családnévhez soroljuk (így az Inter és az Inter Tight nem keveredik).
const byLength = [...EXPECTED_FAMILIES].sort((a, b) => b.length - a.length);
const coverage = new Map<string, Set<string>>();
for (const file of files) {
  const font = fontkit.create(fs.readFileSync(file));
  if (!("familyName" in font)) continue;
  const family = byLength.find((name) => font.familyName === name || font.familyName.startsWith(`${name} `));
  if (!family) continue;
  const found = coverage.get(family) ?? new Set<string>();
  for (const char of REQUIRED) {
    if (font.hasGlyphForCodePoint(char.codePointAt(0)!)) found.add(char);
  }
  coverage.set(family, found);
}

let ok = true;
console.log("Betűtípus".padEnd(20), "ő ű Ő Ű (és a többi ékezet)");
for (const family of EXPECTED_FAMILIES) {
  const found = coverage.get(family);
  if (!found) {
    console.log(family.padEnd(20), "⚠️  nincs letöltve (még nem használta az oldal)");
    continue;
  }
  const missing = REQUIRED.filter((c) => !found.has(c));
  if (missing.length === 0) {
    console.log(family.padEnd(20), "✔ minden ékezet megvan");
  } else {
    ok = false;
    console.log(family.padEnd(20), `❌ hiányzik: ${missing.join(" ")}`);
  }
}
process.exit(ok ? 0 : 1);
