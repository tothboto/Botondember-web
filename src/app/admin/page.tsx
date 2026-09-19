import { count, eq } from "drizzle-orm";
import { ArrowRight, History } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { ADMIN_NAV } from "@/components/admin/nav";
import { getDb } from "@/db/client";
import { games, hobbies, media, youtubeItems } from "@/db/schema";
import { recentActivity } from "@/lib/audit";
import { requireAdminPage } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/format";

/** Irányítópult: gyors linkek és az utolsó módosítások. */
export default async function AdminDashboard() {
  const session = await requireAdminPage();
  const db = getDb();
  const [activity, hobbyCount, gameCount, ytCount, mediaCount, examples] = await Promise.all([
    recentActivity(db, 10),
    db.select({ n: count() }).from(hobbies),
    db.select({ n: count() }).from(games),
    db.select({ n: count() }).from(youtubeItems),
    db.select({ n: count() }).from(media),
    Promise.all([
      db.select({ n: count() }).from(hobbies).where(eq(hobbies.isExample, true)),
      db.select({ n: count() }).from(games).where(eq(games.isExample, true)),
      db.select({ n: count() }).from(youtubeItems).where(eq(youtubeItems.isExample, true)),
    ]),
  ]);
  const exampleCount = examples.reduce((sum, rows) => sum + rows[0].n, 0);

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

      {exampleCount > 0 && (
        <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-800">
          <strong>Tipp:</strong> még {exampleCount} darab „Példa” tartalom van az oldalon. Cseréld le őket a saját
          hobbijaidra, játékaidra és videóidra – szerkesztés után a „Példa” felirat magától eltűnik.
        </p>
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
