import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { TranslationsEditor, type TranslationEntry } from "@/components/admin/editors/TranslationsEditor";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { locales, translations } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guard";
import { readAllSettings } from "@/lib/data/settings";
import { MESSAGE_GROUPS, SEED_MESSAGES } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Nyelvek és felület – Admin" };

export default async function AdminTranslationsPage() {
  await requireAdminPage();
  const db = getDb();
  const [localeRows, rows, settings] = await Promise.all([
    db.select().from(locales).orderBy(asc(locales.sort), asc(locales.code)),
    db.select({ key: translations.key, locale: translations.locale, value: translations.value }).from(translations),
    readAllSettings(),
  ]);

  // A kulcsok: a beépítettek (a kódbeli sorrendben), majd az Adminban létrehozottak (pl. új aloldalak).
  const keys = [...Object.keys(SEED_MESSAGES)];
  for (const key of [...new Set(rows.map((r) => r.key))].sort()) if (!(key in SEED_MESSAGES)) keys.push(key);
  const groupOrder = Object.keys(MESSAGE_GROUPS);
  const groupOf = (key: string) => {
    const prefix = key.split(".")[0];
    return prefix in MESSAGE_GROUPS ? prefix : "common";
  };
  keys.sort((a, b) => groupOrder.indexOf(groupOf(a)) - groupOrder.indexOf(groupOf(b)));

  const entries: TranslationEntry[] = keys.map((key) => ({
    key,
    group: groupOf(key),
    builtinHu: SEED_MESSAGES[key]?.hu ?? "",
    values: Object.fromEntries(rows.filter((r) => r.key === key).map((r) => [r.locale, r.value])),
  }));

  return (
    <>
      <AdminPageHeader
        title="Nyelvek és felület"
        description={
          <>
            A nyelvek és a felület szövegei (menü, gombok, feliratok) minden nyelven. A saját szövegeidet (hobbik, leírások,
            kezdőlap) a{" "}
            <Link href="/admin/tartalom-forditasa" className="font-bold text-link underline">
              Saját szövegek fordítása
            </Link>{" "}
            oldalon fordíthatod le.
          </>
        }
        viewHref="/"
      />
      <TranslationsEditor
        locales={localeRows.map((l) => ({ code: l.code, name: l.name, flag: l.flag, enabled: l.enabled, isDefault: l.isDefault }))}
        entries={entries}
        groups={MESSAGE_GROUPS}
        showFlags={settings.i18n.showFlags}
      />
    </>
  );
}
