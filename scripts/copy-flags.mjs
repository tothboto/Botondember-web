// A flag-icons csomag SVG zászlóit a public/flags mappába másolja (npm install után automatikusan fut).
// Így bármelyik ország zászlója választható egy új nyelvhez, és a zászlók a saját tárhelyről töltődnek.
import fs from "node:fs";
import path from "node:path";

const source = path.join(process.cwd(), "node_modules", "flag-icons", "flags", "4x3");
const target = path.join(process.cwd(), "public", "flags");

if (!fs.existsSync(source)) {
  console.warn("flag-icons nincs telepítve – a zászlók másolása kimarad.");
  process.exit(0);
}

fs.mkdirSync(target, { recursive: true });
let count = 0;
for (const file of fs.readdirSync(source)) {
  if (!file.endsWith(".svg")) continue;
  fs.copyFileSync(path.join(source, file), path.join(target, file));
  count++;
}
console.log(`Zászlók átmásolva: ${count} db → public/flags`);
