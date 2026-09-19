/**
 * Saját generálású helykitöltő képek (SVG → WEBP a sharp-pal).
 * Semmilyen jogvédett kép, címer vagy logó nincs bennük – csak formák és
 * színátmenetek. Szöveget szándékosan nem tartalmaznak (a gépen lévő
 * betűktől függetlenül mindenhol ugyanúgy nézzenek ki).
 */
import { eq } from "drizzle-orm";
import sharp from "sharp";
import type { Db } from "../client";
import { media } from "../schema";
import type { MediaStorage } from "@/lib/media/storage";

type PlaceholderSpec = { name: string; width: number; height: number; alt: string; svg: string };

const svgDoc = (w: number, h: number, defs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

const linear = (id: string, stops: [string, string][], x2 = 1, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

const radial = (id: string, cx: number, cy: number, r: number, color: string, opacity: number) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

// ---------------------------------------------------------------------------
// Kezdőlap: sötét, filmszerű háttér (Rainbow Six hangulat, királyi aranyfényekkel)
// ---------------------------------------------------------------------------
function homeHero(): PlaceholderSpec {
  const w = 2400;
  const h = 1350;
  const defs = [
    linear("bg", [["0", "#05080F"], ["0.5", "#0B1F3F"], ["1", "#04070D"]]),
    radial("gb", 0.28, 0.4, 0.6, "#00529F", 0.55),
    radial("gg", 0.82, 0.78, 0.5, "#FEBE10", 0.26),
    `<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.11"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    `<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="28"/></filter>`,
    `<pattern id="grid" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M96 0H0V96" fill="none" stroke="#fff" stroke-opacity="0.035" stroke-width="2"/></pattern>`,
    `<linearGradient id="vig" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>`,
  ].join("");
  const body = `
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" fill="url(#grid)"/>
    <rect width="${w}" height="${h}" fill="url(#gb)"/>
    <rect width="${w}" height="${h}" fill="url(#gg)"/>
    <g filter="url(#blur)">
      <polygon points="1320,0 1560,0 930,1350 640,1350" fill="url(#beam)"/>
      <polygon points="1760,0 1880,0 1390,1350 1210,1350" fill="url(#beam)"/>
      <polygon points="2080,0 2160,0 1760,1350 1640,1350" fill="url(#beam)"/>
    </g>
    <g fill="none" stroke="#FEBE10" stroke-linejoin="round" stroke-linecap="round">
      <path d="M1640 760 L1760 560 L1880 720 L2000 500 L2120 720 L2240 560 L2360 760 Z" stroke-opacity="0.22" stroke-width="7"/>
      <path d="M1660 820 H2340" stroke-opacity="0.22" stroke-width="7"/>
    </g>
    <g fill="#FEBE10" fill-opacity="0.28">
      <circle cx="1760" cy="560" r="12"/><circle cx="2000" cy="500" r="14"/><circle cx="2240" cy="560" r="12"/>
    </g>
    <polygon points="1450,1350 2400,640 2400,1350" fill="#000" fill-opacity="0.32"/>
    <polygon points="0,1350 0,860 760,1350" fill="#000" fill-opacity="0.38"/>
    <polygon points="0,0 520,0 0,420" fill="#00529F" fill-opacity="0.12"/>
    <rect width="${w}" height="${h}" fill="url(#vig)"/>`;
  return {
    name: "home-hero",
    width: w,
    height: h,
    alt: "Sötétkék, filmszerű háttér arany fényekkel és egy halvány korona rajzával (helykitöltő kép)",
    svg: svgDoc(w, h, defs, body),
  };
}

// ---------------------------------------------------------------------------
// Hobbik (4:3)
// ---------------------------------------------------------------------------
function hobbyCard(variant: "sport" | "creative" | "tech"): PlaceholderSpec {
  const w = 1200;
  const h = 900;
  const palette = {
    sport: ["#0062BD", "#00376B"],
    creative: ["#4A1F6E", "#221034"],
    tech: ["#0E2A52", "#060F22"],
  }[variant];
  const defs = [
    linear("bg", [["0", palette[0]], ["1", palette[1]]]),
    `<pattern id="st" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="20" height="40" fill="#fff" fill-opacity="0.04"/></pattern>`,
  ].join("");
  const band = `<polygon points="690,0 880,0 330,900 140,900" fill="#FEBE10"/><polygon points="905,0 950,0 400,900 355,900" fill="#FEBE10" fill-opacity="0.55"/>`;
  let symbol = "";
  if (variant === "sport") {
    const cx = 850;
    const cy = 450;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return [cx + 62 * Math.cos(a), cy + 62 * Math.sin(a)];
    });
    const outer = pts.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy);
      return [cx + (dx / len) * 185, cy + (dy / len) * 185];
    });
    symbol = `
      <circle cx="${cx}" cy="${cy}" r="185" fill="#fff"/>
      <polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="#0B1F3F"/>
      ${pts.map((p, i) => `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${outer[i][0].toFixed(1)}" y2="${outer[i][1].toFixed(1)}" stroke="#0B1F3F" stroke-width="14"/>`).join("")}
      <circle cx="${cx}" cy="${cy}" r="185" fill="none" stroke="#0B1F3F" stroke-width="10"/>`;
  } else if (variant === "creative") {
    symbol = `
      <path d="M850 262 C 980 262 1060 350 1060 450 C 1060 540 1000 560 950 560 C 900 560 880 590 900 630 C 925 680 890 700 830 700 C 700 700 620 600 620 480 C 620 360 720 262 850 262 Z" fill="#fff"/>
      <circle cx="760" cy="420" r="38" fill="#FEBE10"/>
      <circle cx="860" cy="360" r="38" fill="#FF6B9A"/>
      <circle cx="960" cy="420" r="38" fill="#22C3A6"/>
      <circle cx="760" cy="540" r="38" fill="#3B82F6"/>
      <circle cx="905" cy="520" r="30" fill="${palette[1]}"/>`;
  } else {
    symbol = `
      <g fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="760,330 640,450 760,570"/>
        <polyline points="940,330 1060,450 940,570"/>
        <line x1="885" y1="290" x2="815" y2="610"/>
      </g>`;
  }
  const alt = {
    sport: "Kék háttér arany csíkkal és egy fehér focilabda rajzával (helykitöltő kép)",
    creative: "Lila háttér arany csíkkal és egy festőpaletta rajzával (helykitöltő kép)",
    tech: "Sötétkék háttér arany csíkkal és programkód-jelekkel (helykitöltő kép)",
  }[variant];
  return {
    name: `hobby-${variant}`,
    width: w,
    height: h,
    alt,
    svg: svgDoc(w, h, defs, `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#st)"/>${band}${symbol}`),
  };
}

// ---------------------------------------------------------------------------
// Játékborítók (3:4, neon hangulat)
// ---------------------------------------------------------------------------
function gameCover(variant: "league" | "squad" | "blocks" | "racer"): PlaceholderSpec {
  const w = 900;
  const h = 1200;
  const blur = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>`;
  let defs = "";
  let body = "";
  let alt = "";
  if (variant === "league") {
    defs = linear("bg", [["0", "#050A14"], ["1", "#0A2240"]], 0, 1) + blur;
    const pitch = `<g fill="none" stroke="#22D3EE" stroke-width="8">
        <rect x="170" y="230" width="560" height="760" rx="6"/>
        <line x1="170" y1="610" x2="730" y2="610"/>
        <circle cx="450" cy="610" r="95"/>
        <rect x="320" y="230" width="260" height="120"/>
        <rect x="320" y="870" width="260" height="120"/>
      </g>`;
    body = `<rect width="${w}" height="${h}" fill="url(#bg)"/><g filter="url(#glow)" opacity="0.9">${pitch}</g>${pitch}
      <circle cx="450" cy="610" r="22" fill="#fff"/>
      <polygon points="0,1200 0,980 900,1120 900,1200" fill="#22D3EE" fill-opacity="0.12"/>`;
    alt = "Sötét borító neonkék focipálya-rajzzal (helykitöltő kép)";
  } else if (variant === "squad") {
    defs = linear("bg", [["0", "#0B0B10"], ["1", "#2A1606"]], 0, 1) + blur +
      `<pattern id="hex" width="84" height="146" patternUnits="userSpaceOnUse"><path d="M42 0 L84 24 L84 73 L42 97 L0 73 L0 24 Z M42 97 L42 146" fill="none" stroke="#F59E0B" stroke-opacity="0.12" stroke-width="3"/></pattern>`;
    const shards = `<g fill="#F59E0B">
        <polygon points="120,760 430,300 520,420 260,900" fill-opacity="0.85"/>
        <polygon points="560,380 800,210 760,560" fill-opacity="0.55"/>
        <polygon points="420,980 780,640 820,1010" fill-opacity="0.7"/>
      </g>`;
    body = `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#hex)"/><g filter="url(#glow)">${shards}</g>${shards}`;
    alt = "Sötét borító borostyánszínű, szögletes szilánkokkal (helykitöltő kép)";
  } else if (variant === "blocks") {
    defs = linear("bg", [["0", "#04120D"], ["1", "#0F3325"]], 0, 1) + blur;
    const cube = (x: number, y: number, s: number) => `
      <polygon points="${x},${y} ${x + s},${y - s / 2} ${x + 2 * s},${y} ${x + s},${y + s / 2}" fill="#4ADE80"/>
      <polygon points="${x},${y} ${x + s},${y + s / 2} ${x + s},${y + 1.5 * s} ${x},${y + s}" fill="#16A34A"/>
      <polygon points="${x + s},${y + s / 2} ${x + 2 * s},${y} ${x + 2 * s},${y + s} ${x + s},${y + 1.5 * s}" fill="#166534"/>`;
    body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>
      <g filter="url(#glow)" opacity="0.6">${cube(270, 520, 180)}</g>
      ${cube(270, 520, 180)}${cube(90, 790, 180)}${cube(450, 790, 180)}${cube(270, 1060, 180)}`;
    alt = "Sötétzöld borító egymásra rakott, zöld kockákkal (helykitöltő kép)";
  } else {
    defs = linear("bg", [["0", "#12051C"], ["1", "#34104A"]], 1, 1) + blur;
    const lines = Array.from({ length: 9 }, (_, i) => {
      const y = 260 + i * 90;
      const color = i % 2 ? "#22D3EE" : "#EC4899";
      return `<line x1="${60 + (i % 3) * 40}" y1="${y}" x2="${520 - (i % 4) * 60}" y2="${y}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`;
    }).join("");
    const wheel = `<circle cx="640" cy="640" r="170" fill="none" stroke="#EC4899" stroke-width="30"/>
      <circle cx="640" cy="640" r="60" fill="#22D3EE"/>
      <g stroke="#EC4899" stroke-width="14">${[0, 60, 120].map((a) => `<line x1="${640 + 150 * Math.cos((a * Math.PI) / 180)}" y1="${640 + 150 * Math.sin((a * Math.PI) / 180)}" x2="${640 - 150 * Math.cos((a * Math.PI) / 180)}" y2="${640 - 150 * Math.sin((a * Math.PI) / 180)}"/>`).join("")}</g>`;
    body = `<rect width="${w}" height="${h}" fill="url(#bg)"/><g filter="url(#glow)">${lines}${wheel}</g>${lines}${wheel}`;
    alt = "Lila borító rózsaszín és kék sebességcsíkokkal és egy kerékkel (helykitöltő kép)";
  }
  return { name: `game-${variant}`, width: w, height: h, alt, svg: svgDoc(w, h, defs, body) };
}

// ---------------------------------------------------------------------------
// YouTube bélyegképek (16:9) és csatorna-avatarok (kör)
// ---------------------------------------------------------------------------
function ytThumb(name: string, from: string, to: string, icon: "note" | "play" | "stack", alt: string): PlaceholderSpec {
  const w = 1280;
  const h = 720;
  const defs = linear("bg", [["0", from], ["1", to]]);
  let symbol = "";
  if (icon === "note") {
    symbol = `<g fill="#fff">
        <rect x="610" y="210" width="26" height="250"/>
        <rect x="790" y="180" width="26" height="250"/>
        <polygon points="610,210 816,180 816,240 610,270"/>
        <ellipse cx="578" cy="462" rx="62" ry="46"/>
        <ellipse cx="758" cy="432" rx="62" ry="46"/>
      </g>`;
  } else if (icon === "play") {
    symbol = `<circle cx="640" cy="360" r="150" fill="none" stroke="#fff" stroke-width="22"/>
      <polygon points="600,280 600,440 730,360" fill="#fff"/>`;
  } else {
    symbol = `<g fill="#fff">
        <rect x="430" y="220" width="420" height="44" rx="12" fill-opacity="0.55"/>
        <rect x="430" y="300" width="420" height="44" rx="12" fill-opacity="0.75"/>
        <rect x="430" y="380" width="300" height="44" rx="12"/>
        <polygon points="780,370 780,500 880,435"/>
      </g>`;
  }
  return {
    name,
    width: w,
    height: h,
    alt,
    svg: svgDoc(w, h, defs, `<rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="1180" cy="80" r="260" fill="#fff" fill-opacity="0.07"/><circle cx="120" cy="680" r="200" fill="#000" fill-opacity="0.08"/>${symbol}`),
  };
}

function ytAvatar(name: string, from: string, to: string, shape: "star" | "bolt" | "smile", alt: string): PlaceholderSpec {
  const s = 400;
  const defs = linear("bg", [["0", from], ["1", to]]);
  let symbol = "";
  if (shape === "star") {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 62 : 140;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(200 + r * Math.cos(a)).toFixed(1)},${(205 + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
    symbol = `<polygon points="${pts}" fill="#fff"/>`;
  } else if (shape === "bolt") {
    symbol = `<polygon points="225,60 110,230 190,230 165,340 290,160 205,160" fill="#fff"/>`;
  } else {
    symbol = `<circle cx="150" cy="170" r="26" fill="#fff"/><circle cx="250" cy="170" r="26" fill="#fff"/>
      <path d="M120 245 Q200 320 280 245" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round"/>`;
  }
  return { name, width: s, height: s, alt, svg: svgDoc(s, s, defs, `<rect width="${s}" height="${s}" fill="url(#bg)"/>${symbol}`) };
}

// ---------------------------------------------------------------------------
// Real Madrid oldal: stadion-hangulat, játékos-sziluett, trófea
// ---------------------------------------------------------------------------
function stadium(): PlaceholderSpec {
  const w = 2400;
  const h = 1200;
  const defs = [
    linear("sky", [["0", "#020611"], ["0.6", "#0B1F3F"], ["1", "#0F2B55"]], 0, 1),
    linear("pitch", [["0", "#0E4F33"], ["1", "#07301F"]], 0, 1),
    `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>`,
    `<linearGradient id="lb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  ].join("");
  const towers = [300, 900, 1500, 2100]
    .map(
      (x) => `<rect x="${x - 6}" y="160" width="12" height="360" fill="#0A1A33"/>
        <rect x="${x - 70}" y="130" width="140" height="44" rx="8" fill="#F8F4E3"/>
        <polygon points="${x - 70},170 ${x + 70},170 ${x + 360},1200 ${x - 360},1200" fill="url(#lb)" filter="url(#blur)"/>`,
    )
    .join("");
  const stripes = Array.from({ length: 10 }, (_, i) =>
    i % 2 ? "" : `<polygon points="${200 + i * 200},760 ${400 + i * 200},760 ${260 + i * 240},1200 ${20 + i * 240},1200" fill="#fff" fill-opacity="0.035"/>`,
  ).join("");
  const body = `
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    ${towers}
    <path d="M0 600 Q1200 330 2400 600 L2400 820 Q1200 600 0 820 Z" fill="#081630"/>
    <path d="M0 600 Q1200 330 2400 600" fill="none" stroke="#FEBE10" stroke-opacity="0.5" stroke-width="6"/>
    <path d="M0 700 Q1200 460 2400 700" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="18"/>
    <path d="M0 820 Q1200 600 2400 820 L2400 1200 L0 1200 Z" fill="url(#pitch)"/>
    ${stripes}
    <path d="M0 1010 Q1200 830 2400 1010" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="6"/>
    <ellipse cx="1200" cy="1080" rx="260" ry="70" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="6"/>
    <rect width="${w}" height="${h}" fill="#000" fill-opacity="0.12"/>`;
  return {
    name: "football-stadium",
    width: w,
    height: h,
    alt: "Esti stadion-hangulat: reflektorok, lelátó és zöld pálya (helykitöltő kép)",
    svg: svgDoc(w, h, defs, body),
  };
}

function player(variant: 1 | 2 | 3): PlaceholderSpec {
  const w = 800;
  const h = 1000;
  const accent = ["#FEBE10", "#FFFFFF", "#7FB3E8"][variant - 1];
  const defs = linear("bg", [["0", "#0B1F3F"], ["1", "#00529F"]], 0.4, 1);
  const body = `
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <polygon points="520,0 700,0 180,1000 0,1000" fill="${accent}" fill-opacity="0.18"/>
    <circle cx="400" cy="340" r="130" fill="#fff" fill-opacity="0.92"/>
    <path d="M110 1000 C 120 690 260 560 400 560 C 540 560 680 690 690 1000 Z" fill="#fff" fill-opacity="0.92"/>
    <path d="M300 575 L400 660 L500 575" fill="none" stroke="#0B1F3F" stroke-opacity="0.25" stroke-width="10"/>`;
  return {
    name: `football-player-${variant}`,
    width: w,
    height: h,
    alt: "Játékos-sziluett sötétkék háttér előtt (helykitöltő kép)",
    svg: svgDoc(w, h, defs, body),
  };
}

function trophy(variant: 1 | 2): PlaceholderSpec {
  const w = 1200;
  const h = 800;
  const defs = [
    linear("bg", [["0", variant === 1 ? "#0B1F3F" : "#1B2F57"], ["1", "#050B18"]]),
    linear("gold", [["0", "#FFE58A"], ["0.5", "#FEBE10"], ["1", "#C98A00"]], 1, 0),
  ].join("");
  const confetti = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 197) % 1200;
    const y = (i * 131) % 760;
    const c = i % 3 === 0 ? "#FEBE10" : i % 3 === 1 ? "#FFFFFF" : "#7FB3E8";
    return `<rect x="${x}" y="${y}" width="16" height="8" rx="2" fill="${c}" fill-opacity="0.6" transform="rotate(${(i * 37) % 180} ${x + 8} ${y + 4})"/>`;
  }).join("");
  const body = `
    <rect width="${w}" height="${h}" fill="url(#bg)"/>${confetti}
    <g fill="url(#gold)">
      <path d="M470 170 H730 V300 C730 400 670 470 600 480 C530 470 470 400 470 300 Z"/>
      <path d="M470 200 H400 C390 290 430 350 480 365 L488 335 C455 322 430 290 432 232 H470 Z"/>
      <path d="M730 200 H800 C810 290 770 350 720 365 L712 335 C745 322 770 290 768 232 H730 Z"/>
      <rect x="578" y="478" width="44" height="90"/>
      <rect x="520" y="566" width="160" height="34" rx="6"/>
      <rect x="490" y="600" width="220" height="44" rx="8"/>
    </g>`;
  return {
    name: `football-moment-${variant}`,
    width: w,
    height: h,
    alt: "Arany serleg rajza konfettivel, sötétkék háttér előtt (helykitöltő kép)",
    svg: svgDoc(w, h, defs, body),
  };
}

/** Az alapértelmezett favicon: arany „B” monogram sötétkék alapon. */
export function monogramSvg(): string {
  const defs = [
    linear("nb", [["0", "#0B1F3F"], ["1", "#00529F"]]),
    linear("gd", [["0", "#FFE58A"], ["0.55", "#FEBE10"], ["1", "#D99A00"]], 0, 1),
  ].join("");
  const body = `
    <rect width="512" height="512" rx="112" fill="url(#nb)"/>
    <rect x="22" y="22" width="468" height="468" rx="94" fill="none" stroke="#FEBE10" stroke-opacity="0.85" stroke-width="10"/>
    <path fill="url(#gd)" fill-rule="evenodd" d="
      M150 108 H290 C342 108 372 140 372 182 C372 214 354 236 328 247
      C364 258 390 286 390 326 C390 372 354 404 300 404 H150 Z
      M208 158 H284 C303 158 315 171 315 189 C315 207 303 220 284 220 H208 Z
      M208 268 H292 C315 268 330 284 330 306 C330 330 315 354 292 354 H208 Z"/>`;
  return svgDoc(512, 512, defs, body);
}

/** Az összes helykitöltő (név → leírás). */
export function placeholderSpecs(): PlaceholderSpec[] {
  return [
    homeHero(),
    hobbyCard("sport"),
    hobbyCard("creative"),
    hobbyCard("tech"),
    gameCover("league"),
    gameCover("squad"),
    gameCover("blocks"),
    gameCover("racer"),
    ytThumb("yt-song-1", "#FF5F6D", "#FFC371", "note", "Narancsos színátmenet hangjegyekkel (helykitöltő kép)"),
    ytThumb("yt-song-2", "#7F00FF", "#E100FF", "note", "Lila színátmenet hangjegyekkel (helykitöltő kép)"),
    ytThumb("yt-song-3", "#00C6FF", "#0072FF", "note", "Kék színátmenet hangjegyekkel (helykitöltő kép)"),
    ytThumb("yt-video-1", "#11998E", "#38EF7D", "play", "Zöld színátmenet lejátszás jellel (helykitöltő kép)"),
    ytThumb("yt-video-2", "#FC466B", "#3F5EFB", "play", "Rózsaszín–kék színátmenet lejátszás jellel (helykitöltő kép)"),
    ytThumb("yt-video-3", "#F7971E", "#FFD200", "play", "Sárga színátmenet lejátszás jellel (helykitöltő kép)"),
    ytThumb("yt-playlist-1", "#434343", "#000000", "stack", "Szürke színátmenet lista-jellel (helykitöltő kép)"),
    ytThumb("yt-playlist-2", "#1D2B64", "#F8CDDA", "stack", "Kék–rózsaszín színátmenet lista-jellel (helykitöltő kép)"),
    ytAvatar("yt-channel-1", "#F7971E", "#FF5F6D", "star", "Narancs kör csillaggal (helykitöltő kép)"),
    ytAvatar("yt-channel-2", "#00C6FF", "#0072FF", "bolt", "Kék kör villámmal (helykitöltő kép)"),
    ytAvatar("yt-channel-3", "#11998E", "#38EF7D", "smile", "Zöld kör mosolygós arccal (helykitöltő kép)"),
    stadium(),
    player(1),
    player(2),
    player(3),
    trophy(1),
    trophy(2),
  ];
}

export function placeholderKey(name: string): string {
  return `placeholders/${name}.webp`;
}

/**
 * Létrehozza a hiányzó helykitöltő képeket (fájl + `media` sor).
 * Visszaadja: név → media azonosító.
 */
export async function ensurePlaceholders(db: Db, storage: MediaStorage): Promise<Record<string, number>> {
  const ids: Record<string, number> = {};
  for (const spec of placeholderSpecs()) {
    const key = placeholderKey(spec.name);
    const existing = await db.select({ id: media.id }).from(media).where(eq(media.path, key)).limit(1);
    const fileExists = await storage.exists(key);
    if (existing.length > 0 && fileExists) {
      ids[spec.name] = existing[0].id;
      continue;
    }
    const data = await sharp(Buffer.from(spec.svg)).webp({ quality: 84, effort: 5 }).toBuffer();
    await storage.put(key, data);
    if (existing.length > 0) {
      ids[spec.name] = existing[0].id;
      continue;
    }
    const inserted = await db
      .insert(media)
      .values({
        path: key,
        mime: "image/webp",
        width: spec.width,
        height: spec.height,
        size: data.length,
        alt: spec.alt,
        originalName: `${spec.name}.webp`,
        source: "placeholder",
        createdAt: Date.now(),
      })
      .returning({ id: media.id });
    ids[spec.name] = inserted[0].id;
  }
  return ids;
}
