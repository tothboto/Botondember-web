/**
 * A fordító parancs (`/forditas`) két lépése – a Next.js-től független, tesztelt kód:
 *
 * 1. `buildExport`: összegyűjti a fordításra váró szövegeket (a kérések, és `all`
 *    esetén minden hiányzó / gépi elavult szöveg) → `data/forditas/feladat.json`.
 * 2. `importResults`: ellenőrzi és elmenti a kész fordításokat „Gépi – ellenőrizd”
 *    állapotban. A kézzel írt vagy jóváhagyott fordítást nem írja felül (csak ha
 *    kifejezetten új fordítást kértél rá), és ha a magyar szöveg közben
 *    megváltozott, kihagyja (akkor újra kell kérni).
 */
import type { Db } from "@/db/client";
import { locales as localesTable } from "@/db/schema";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { listContentFields, type ContentFormat } from "./registry";
import { lostTokens, sourceHash } from "./status";
import {
  indexStored,
  needsMachineTranslation,
  readRequestSet,
  readStoredTranslations,
  requestId,
  statusOf,
  writeContentTranslation,
} from "./store";

export const EXPORT_FORMAT = "botondember-forditas";

export type ExportTarget = {
  locale: string;
  /** A nyelv neve (pl. „English”). */
  language: string;
  /** A korábbi (elavult) fordítás, ha van – segít a következetességben. */
  previous?: string;
};

export type ExportItem = {
  key: string;
  section: string;
  label: string;
  format: ContentFormat;
  maxLength: number;
  sourceHash: string;
  source: string;
  targets: ExportTarget[];
};

export type ExportFile = {
  format: typeof EXPORT_FORMAT;
  version: 1;
  createdAt: string;
  languages: Record<string, string>;
  items: ExportItem[];
};

/** A fordításra váró szövegek összegyűjtése. */
export async function buildExport(db: Db, options: { all?: boolean; only?: string[] } = {}): Promise<ExportFile> {
  const [fields, stored, requests, localeRows] = await Promise.all([
    listContentFields(db),
    readStoredTranslations(db),
    readRequestSet(db),
    db.select().from(localesTable),
  ]);
  const index = indexStored(stored);
  const targets = localeRows.filter((l) => l.code !== SOURCE_LOCALE && (!options.only || options.only.includes(l.code)));
  const languages = Object.fromEntries(targets.map((l) => [l.code, l.name]));

  const items: ExportItem[] = [];
  for (const field of fields) {
    const list: ExportTarget[] = [];
    for (const locale of targets) {
      const id = requestId(field.key, locale.code);
      const row = index.get(id);
      const wanted =
        requests.has(id) ||
        (options.all && locale.enabled && needsMachineTranslation(statusOf(field.source, index, requests, field.key, locale.code), row));
      if (!wanted) continue;
      list.push({
        locale: locale.code,
        language: locale.name,
        ...(row && row.origin !== "keep" && row.value.trim() ? { previous: row.value } : {}),
      });
    }
    if (list.length === 0) continue;
    items.push({
      key: field.key,
      section: field.section,
      label: field.label,
      format: field.format,
      maxLength: field.maxLength,
      sourceHash: sourceHash(field.source),
      source: field.source,
      targets: list,
    });
  }
  return { format: EXPORT_FORMAT, version: 1, createdAt: new Date().toISOString(), languages, items };
}

/** Egy kész fordítás (a fordító által megírt eredményfájlokból). */
export type ResultEntry = { key: string; locale: string; sourceHash: string; text: string; file?: string };

export type ImportReport = {
  saved: { key: string; locale: string }[];
  skipped: { key: string; locale: string; reason: string }[];
};

/**
 * Az eredményfájlok beolvasása. Két formátum:
 * - JSON: `{ "items": [{ "key", "sourceHash", "translations": { "en": "…", "de": "…" } }] }`
 * - Markdown (hosszú szövegekhez), fejléccel:
 *   `---\nkey: legal_docs:privacy:bodyMd\nlocale: en\nsourceHash: …\n---\n<a fordítás>`
 */
export function parseResultJson(content: string, file = "eredmeny.json"): ResultEntry[] {
  let data: unknown;
  try {
    data = JSON.parse(content.replace(/^﻿/, ""));
  } catch (error) {
    throw new Error(`${file}: hibás JSON (${(error as Error).message})`);
  }
  const items = (data as { items?: unknown })?.items;
  if (!Array.isArray(items)) throw new Error(`${file}: hiányzik az "items" lista.`);
  const out: ResultEntry[] = [];
  for (const item of items as Record<string, unknown>[]) {
    const translations = item?.translations;
    if (typeof item?.key !== "string" || typeof item?.sourceHash !== "string" || !translations || typeof translations !== "object") {
      throw new Error(`${file}: hibás elem (key, sourceHash és translations kell): ${JSON.stringify(item).slice(0, 120)}`);
    }
    for (const [locale, text] of Object.entries(translations as Record<string, unknown>)) {
      if (typeof text !== "string") throw new Error(`${file}: ${item.key} (${locale}) fordítása nem szöveg.`);
      out.push({ key: item.key, locale, sourceHash: item.sourceHash, text, file });
    }
  }
  return out;
}

export function parseResultMarkdown(content: string, file = "eredmeny.md"): ResultEntry {
  const match = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  if (!match) throw new Error(`${file}: hiányzik a fejléc (--- key / locale / sourceHash ---).`);
  const header = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => /^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1], m[2]]),
  );
  if (!header.key || !header.locale || !header.sourceHash) throw new Error(`${file}: a fejlécből hiányzik a key, a locale vagy a sourceHash.`);
  return { key: header.key, locale: header.locale, sourceHash: header.sourceHash, text: match[2], file };
}

/** A kész fordítások mentése (ellenőrzés után) „Gépi – ellenőrizd” állapotban. */
export async function importResults(db: Db, entries: ResultEntry[]): Promise<ImportReport> {
  const [fields, stored, requests, localeRows] = await Promise.all([
    listContentFields(db),
    readStoredTranslations(db),
    readRequestSet(db),
    db.select().from(localesTable),
  ]);
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const index = indexStored(stored);
  const known = new Set(localeRows.map((l) => l.code));
  const report: ImportReport = { saved: [], skipped: [] };
  const skip = (entry: ResultEntry, reason: string) => report.skipped.push({ key: entry.key, locale: entry.locale, reason });

  for (const entry of entries) {
    const field = byKey.get(entry.key);
    if (!field) {
      skip(entry, "ez a szöveg már nem létezik (törölték vagy kiürült)");
      continue;
    }
    if (entry.locale === SOURCE_LOCALE || !known.has(entry.locale)) {
      skip(entry, "ismeretlen nyelv");
      continue;
    }
    if (entry.sourceHash !== sourceHash(field.source)) {
      skip(entry, "a magyar szöveg közben megváltozott – kérd újra a fordítást");
      continue;
    }
    let text = entry.text.replace(/\r\n?/g, "\n").trim();
    if (field.format === "text") text = text.replace(/\s*\n\s*/g, " ");
    if (!text) {
      skip(entry, "üres fordítás");
      continue;
    }
    if (text.length > field.maxLength) {
      skip(entry, `túl hosszú (${text.length} > ${field.maxLength} karakter)`);
      continue;
    }
    const lost = lostTokens(field.source, text);
    if (lost.length > 0) {
      skip(entry, `hiányzik belőle: ${lost.map((t) => `{{${t}}}`).join(", ")}`);
      continue;
    }
    const id = requestId(entry.key, entry.locale);
    const current = index.get(id);
    if (current && current.origin !== "auto" && !requests.has(id)) {
      skip(entry, current.origin === "keep" ? "„Magyarul marad” jelölésű" : "kézzel írt / jóváhagyott fordítás – nem írom felül");
      continue;
    }
    await writeContentTranslation(db, {
      key: entry.key,
      locale: entry.locale,
      value: text,
      origin: "auto",
      source: field.source,
      hash: entry.sourceHash,
    });
    index.set(id, { key: entry.key, locale: entry.locale, value: text, origin: "auto", sourceHash: entry.sourceHash, updatedAt: Date.now() });
    requests.delete(id);
    report.saved.push({ key: entry.key, locale: entry.locale });
  }
  return report;
}
