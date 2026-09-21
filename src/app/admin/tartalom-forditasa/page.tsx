import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentTranslator, type ContentItem } from "@/components/admin/editors/ContentTranslator";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { locales } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guard";
import { listContentFields } from "@/lib/content-i18n/registry";
import { computeProgress, indexStored, readRequestSet, readStoredTranslations, requestId, statusOf } from "@/lib/content-i18n/store";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Saját szövegek fordítása – Admin" };

export default async function AdminContentTranslationPage({ searchParams }: PageProps<"/admin/tartalom-forditasa">) {
  await requireAdminPage();
  const db = getDb();
  const [localeRows, fields, stored, requests] = await Promise.all([
    db.select().from(locales).orderBy(asc(locales.sort), asc(locales.code)),
    listContentFields(db),
    readStoredTranslations(db),
    readRequestSet(db),
  ]);

  const header = (
    <AdminPageHeader
      title="Saját szövegek fordítása"
      description="A kézzel beírt szövegeid (kezdőlap, hobbik, játékok, leírások, képleírások, jogi szövegek) a többi nyelven. Bal oldalt a magyar eredeti, jobb oldalt a választott nyelv. Amíg egy szövegnek nincs fordítása, a látogatók magyarul látják."
      viewHref="/"
    />
  );

  const targets = localeRows.filter((l) => l.code !== SOURCE_LOCALE);
  if (targets.length === 0) {
    return (
      <>
        {header}
        <p className="rounded-2xl bg-bg p-6 ring-1 ring-line">
          Még nincs idegen nyelv. Vegyél fel egyet a{" "}
          <Link href="/admin/forditasok" className="font-bold text-link underline">
            Nyelvek és felület
          </Link>{" "}
          oldalon!
        </p>
      </>
    );
  }

  const requestedCode = (await searchParams).nyelv;
  const current =
    targets.find((l) => l.code === requestedCode) ?? targets.find((l) => l.enabled) ?? targets[0];

  const index = indexStored(stored);
  const progress = computeProgress(fields, index, requests, targets);

  const items: ContentItem[] = fields.map((field) => {
    const row = index.get(requestId(field.key, current.code));
    return {
      key: field.key,
      section: field.section,
      label: field.label,
      format: field.format,
      maxLength: field.maxLength,
      source: field.source,
      editHref: field.editHref,
      status: statusOf(field.source, index, requests, field.key, current.code),
      value: row && row.origin !== "keep" ? row.value : "",
      origin: row?.origin ?? null,
    };
  });

  return (
    <>
      {header}
      <ContentTranslator key={current.code} locale={current.code} progress={progress} items={items} />
    </>
  );
}
