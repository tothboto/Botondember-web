import { UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { FriendLinks } from "@/components/site/FriendLinks";
import { PageHeader } from "@/components/site/PageHeader";
import type { Page } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getFriends } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageHref, pageTitleKey } from "@/lib/data/pages";
import { friendRingColor } from "@/lib/friends";
import { getI18n } from "@/lib/i18n/server";

/** A barátok fordítható mezői a listában. */
export const FRIEND_CARD_FIELDS = ["name"] as const;

/**
 * Barátok – kerek profilképes kártyák. A névre kattintva a barát saját
 * aloldala nyílik meg, a kártyán pedig ott vannak a profiljaira mutató gombok.
 */
export async function FriendsPage({ page }: { page: Page }) {
  const [{ t }, rows, images, l] = await Promise.all([getI18n(), getFriends(), getImages(), getLocalizer()]);
  const intro = l.get("pages", page.id, "introMd", page.introMd);
  const items = rows.map((friend) => l.row("friends", friend, FRIEND_CARD_FIELDS));

  return (
    <div className="flex-1 bg-page-bg pb-16 text-page-fg">
      <PageHeader
        title={t(pageTitleKey(page))}
        icon={page.icon}
        intro={intro.text}
        introLang={intro.lang}
        titleClassName="font-display"
      />

      <section className="container-page">
        {items.length === 0 ? (
          <EmptyState text={t("common.empty")} />
        ) : (
          <>
            <p className="mb-6 text-sm font-semibold tracking-[0.18em] text-page-muted uppercase">
              {t("friends.count", { count: items.length })}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((friend, index) => {
                const image = images(friend.mediaId);
                const ring = friendRingColor(index);
                return (
                  <li key={friend.id}>
                    <article className="flex h-full flex-col items-center gap-4 rounded-2xl bg-page-surface p-6 text-center ring-1 ring-page-line">
                      {friend.isExample && <ExampleBadge label={t("common.example")} />}
                      <Link
                        href={`${pageHref(page)}/${friend.slug}`}
                        className="group flex flex-col items-center gap-4 rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        <span
                          style={{ borderColor: ring }}
                          className="relative block h-36 w-36 overflow-hidden rounded-full border-4 bg-page-surface-2"
                        >
                          {image ? (
                            <Image
                              src={image.src}
                              alt={image.alt}
                              lang={image.altLang}
                              fill
                              preload={index === 0}
                              sizes="144px"
                              className="object-cover"
                            />
                          ) : (
                            <UserRound aria-hidden className="absolute inset-0 m-auto h-16 w-16 text-page-accent" strokeWidth={1.6} />
                          )}
                        </span>
                        <h2 lang={friend.lang.name} className="font-display text-xl leading-tight font-bold group-hover:underline">
                          {friend.name}
                        </h2>
                      </Link>
                      <div className="mt-auto">
                        <FriendLinks
                          links={friend.links}
                          name={friend.name}
                          nameLang={friend.lang.name}
                          networkName={(kind) => t(`friends.network.${kind}`)}
                          label={(network) => t("friends.profileOn", { network })}
                          newTabLabel={t("common.opensInNewTab")}
                        />
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
