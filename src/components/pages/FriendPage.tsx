import { ArrowLeft, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { FriendLinks } from "@/components/site/FriendLinks";
import { Markdown } from "@/components/site/Markdown";
import type { Friend, Page } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getFriends } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageHref, pageTitleKey } from "@/lib/data/pages";
import { friendRingColor } from "@/lib/friends";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";

/** Egy barát fordítható mezői az aloldalon. */
export const FRIEND_FIELDS = ["name"] as const;

/**
 * Egy barát saját aloldala (`/baratok/<slug>`): nagy kerek profilkép, a név,
 * a profiljaira mutató gombok, alatta a „Bemutatás” szöveg.
 */
export async function FriendPage({ page, friend: row }: { page: Page; friend: Friend }) {
  const [{ t }, rows, images, l] = await Promise.all([getI18n(), getFriends(), getImages(), getLocalizer()]);
  const friend = l.row("friends", row, FRIEND_FIELDS);
  const body = l.get("friends", row.id, "bodyMd", row.bodyMd);
  const image = images(row.mediaId);
  const ring = friendRingColor(Math.max(0, rows.findIndex((item) => item.id === row.id)));

  return (
    <div className="flex-1 bg-page-bg pb-16 text-page-fg">
      <div className="container-page pt-8 sm:pt-10">
        <Link
          href={pageHref(page)}
          className="inline-flex items-center gap-2 rounded-md font-semibold text-page-accent-text underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {t("friends.back")}
        </Link>
      </div>

      <article className="container-page pt-6">
        <header className="flex flex-col items-center gap-5 rounded-t-3xl bg-page-surface-2 px-6 py-10 text-center">
          <span
            style={{ borderColor: ring }}
            className="relative block h-44 w-44 overflow-hidden rounded-full border-[6px] bg-page-surface sm:h-52 sm:w-52"
          >
            {image ? (
              <Image
                src={image.src}
                alt={image.alt}
                lang={image.altLang}
                fill
                preload
                sizes="(min-width: 640px) 208px, 176px"
                className="object-cover"
              />
            ) : (
              <UserRound aria-hidden className="absolute inset-0 m-auto h-20 w-20 text-page-accent" strokeWidth={1.5} />
            )}
          </span>

          <p className="flex items-center gap-2 text-sm font-bold tracking-[0.22em] text-page-accent-text uppercase">
            <PageIcon name={page.icon} className="h-5 w-5 shrink-0" />
            {t(pageTitleKey(page))}
          </p>
          <h1 lang={friend.lang.name} className="font-display text-[clamp(1.9rem,5vw,3.25rem)] leading-tight font-black tracking-tight break-words">
            {friend.name}
          </h1>
          {row.isExample && <ExampleBadge label={t("common.example")} />}
          <FriendLinks
            links={row.links}
            name={friend.name}
            nameLang={friend.lang.name}
            networkName={(kind) => t(`friends.network.${kind}`)}
            label={(network) => t("friends.profileOn", { network })}
            newTabLabel={t("common.opensInNewTab")}
            size="large"
          />
        </header>

        {body.text && (
          <section className="rounded-b-3xl bg-page-surface px-6 py-8 ring-1 ring-page-line sm:px-10">
            <h2 className="text-sm font-bold tracking-[0.22em] text-page-muted uppercase">{t("friends.about")}</h2>
            <Markdown lang={body.lang} className="mt-4 max-w-2xl prose-lg">
              {body.text}
            </Markdown>
          </section>
        )}
      </article>
    </div>
  );
}
