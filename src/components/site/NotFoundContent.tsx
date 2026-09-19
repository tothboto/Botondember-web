import { House } from "lucide-react";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

/** Barátságos 404 oldal – a design rendszerhez illő, lefordított szöveggel. */
export async function NotFoundContent() {
  const { t } = await getI18n();
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--rm-blue)_14%,transparent),transparent)]"
      />
      <div className="container-page grid min-h-[62vh] place-items-center py-16 text-center">
        <div className="max-w-xl space-y-6">
          <p aria-hidden className="brand-text font-royal text-[clamp(5rem,22vw,10rem)] leading-none font-bold">
            404
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase sm:text-4xl">
            {t("notFound.title")}
          </h1>
          <p className="text-lg text-muted">{t("notFound.text")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold tracking-wider text-primary-fg uppercase hover:brightness-110"
          >
            <House aria-hidden className="h-5 w-5" />
            {t("notFound.back")}
          </Link>
        </div>
      </div>
    </section>
  );
}
