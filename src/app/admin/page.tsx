import { count } from "drizzle-orm";
import { ArrowRight, Circle, CircleCheck, History } from "lucide-react";
import Link from "next/link";
import { LanguageFlag, ProgressBar, progressSummary } from "@/components/admin/TranslationProgress";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { ADMIN_NAV } from "@/components/admin/nav";
import { getDb } from "@/db/client";
import { games, hobbies, locales, media, youtubeItems } from "@/db/schema";
import { setupChecklist } from "@/lib/admin/checklist";
import { recentActivity } from "@/lib/audit";
import { listContentFields } from "@/lib/content-i18n/registry";
import { computeProgress, indexStored, readRequestSet, readStoredTranslations } from "@/lib/content-i18n/store";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { requireAdminPage } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/format";

/** Irányítópult: első lépések, gyors linkek és az utolsó módosítások. */
export default async function AdminDashboard() {
  const session = await requireAdminPage();
  const db = getDb();
  const [activity, hobbyCount, gameCount, ytCount, mediaCount, checklist, fields, stored, requests, localeRows] = await Promise.all([
    recentActivity(db, 10),
    db.select({ n: count() }).from(hobbies),
    db.select({ n: count() }).from(games),
    db.select({ n: count() }).from(youtubeItems),
    db.select({ n: count() }).from(media),
    setupChecklist(db, session.userId),
    listContentFields(db),
    readStoredTranslations(db),
    readRequestSet(db),
    db.select().from(locales),
  ]);
  // A saját szövegek fordításának állása a bekapcsolt idegen nyelveken.
  const translation = computeProgress(
    fields,
    indexStored(stored),
    requests,
    localeRows.filter((l) => l.enabled && l.code !== SOURCE_LOCALE).sort((a, b) => a.sort - b.sort),
  );
  const remaining = checklist.filter((item) => !item.done).length;

  const stats = [
    { label: "Hobbi", value: hobbyCount[0].n, href: "/admin/hobbijaim" },
    { label: "Játék", value: gameCount[0].n, href: "/admin/jatekaim" },
    { label: "YouTube elem", value: ytCount[0].n, href: "/admin/youtube" },
    { label: "Kép a médiatárban", value: mediaCount[0].n, href: "/admin/mediatar" },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Szia, ${session.username}! 👋`}
        description="Itt tudod szerkeszteni a weboldalad teljes tartalmát. Minden mentés azonnal megjelenik az oldalon."
        viewHref="/"
      />

      {remaining > 0 && (
        <Card
          title="Első lépések"
          description={`Még ${remaining} teendő van hátra, hogy az oldal igazán a tiéd legyen. A kész lépések maguktól kipipálódnak.`}
          className="mb-8"
        >
          <ul className="space-y-2">
            {checklist.map((item) => {
              const content = (
                <>
                  {item.done ? (
                    <CircleCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                  )}
                  <span className="min-w-0">
                    <span className={`block font-semibold ${item.done ? "text-muted line-through" : ""}`}>
                      <span className="sr-only">{item.done ? "Kész: " : "Hátravan: "}</span>
                      {item.title}
                    </span>
                    {!item.done && <span className="block text-sm text-muted">{item.hint}</span>}
                  </span>
                </>
              );
              return (
                <li key={item.id}>
                  {item.href && !item.done ? (
                    <Link href={item.href} className="flex items-start gap-3 rounded-xl border border-line p-3 hover:border-primary hover:bg-surface">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-line p-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <ul className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className="block rounded-2xl bg-bg p-5 shadow-sm ring-1 ring-line hover:ring-primary">
              <span className="block font-display text-4xl font-black">{stat.value}</span>
              <span className="text-muted">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {translation.length > 0 && fields.length > 0 && (
        <Card
          title="Saját szövegek fordítása"
          description="Hol tartanak a saját szövegeid fordításai az egyes nyelveken? Kattints egy nyelvre a folytatáshoz!"
          className="mb-8"
        >
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {translation.map((p) => (
              <li key={p.code}>
                <Link
                  href={`/admin/tartalom-forditasa?nyelv=${p.code}`}
                  className="flex h-full flex-col gap-2 rounded-xl border border-line p-4 hover:border-primary hover:bg-surface"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <LanguageFlag code={p.flag} />
                    {p.name}
                  </span>
                  <ProgressBar progress={p} />
                  <span className="text-sm text-muted">{progressSummary(p)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Gyors linkek">
          <ul className="grid gap-3 sm:grid-cols-2">
            {ADMIN_NAV.filter((item) => item.href !== "/admin").map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex h-full items-start gap-3 rounded-xl border border-line p-4 hover:border-primary hover:bg-surface"
                  >
                    <Icon aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-link" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-bold">
                        {item.label}
                        <ArrowRight aria-hidden className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                      </span>
                      <span className="block text-sm text-muted">{item.description}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Utolsó módosítások">
          {activity.length === 0 ? (
            <p className="text-muted">Még nincs módosítás.</p>
          ) : (
            <ol className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <History aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="font-semibold">
                      <span className="text-link">{entry.area}:</span> {entry.message}
                    </p>
                    <p className="text-sm text-muted">{formatDateTime(entry.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
