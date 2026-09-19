/**
 * „Első lépések” az Irányítópulton: mi van még hátra, mielőtt az oldal igazán
 * a sajátod (és később nyilvános) lesz. Mindegyik pont magától kipipálódik.
 */
import { count, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  adminUsers,
  auditLog,
  footballMoments,
  footballPlayers,
  games,
  genericItems,
  hobbies,
  media,
  settings as settingsTable,
  youtubeItems,
} from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { readAllSettings } from "@/lib/data/settings";

export type ChecklistItem = { id: string; done: boolean; title: string; hint: string; href?: string };

/** A sikeres jelszócsere jelzője a `settings` táblában (a Fiók oldal írja). */
export const PASSWORD_CHANGED_KEY = "_account.passwordChanged";

/** Megjegyzi, hogy az admin jelszava az Adminban meg lett változtatva. */
export async function markPasswordChanged(db: Db): Promise<void> {
  const now = Date.now();
  await db
    .insert(settingsTable)
    .values({ key: PASSWORD_CHANGED_KEY, value: { at: now }, updatedAt: now })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: { at: now }, updatedAt: now } });
}

/** Megváltoztatta-e már a jelszót (a kezdő jelszó helyett saját van-e)? */
async function passwordWasChanged(db: Db, userId: number, envPassword: string): Promise<boolean> {
  const [flag] = await db.select({ key: settingsTable.key }).from(settingsTable).where(eq(settingsTable.key, PASSWORD_CHANGED_KEY));
  if (flag) return true;
  const [logged] = await db.select({ id: auditLog.id }).from(auditLog).where(eq(auditLog.message, "Jelszó megváltoztatva")).limit(1);
  if (logged) return true;
  if (!envPassword) return false; // nem tudjuk ellenőrizni → inkább jelezzük
  const [user] = await db.select({ passwordHash: adminUsers.passwordHash }).from(adminUsers).where(eq(adminUsers.id, userId));
  // Csak igen/nem: a .env.local-ban lévő (kezdő) jelszó még mindig érvényes-e.
  return Boolean(user) && !(await verifyPassword(envPassword, user.passwordHash));
}

export async function setupChecklist(db: Db, userId: number): Promise<ChecklistItem[]> {
  const settings = await readAllSettings();
  const envPassword = process.env.ADMIN_PASSWORD ?? "";
  const passwordChanged = await passwordWasChanged(db, userId, envPassword);

  const heroId = settings.home.heroMediaId;
  const [hero] = heroId ? await db.select({ source: media.source }).from(media).where(eq(media.id, heroId)) : [];
  const ownHero = Boolean(hero && hero.source !== "placeholder");

  const exampleCounts = await Promise.all([
    db.select({ n: count() }).from(hobbies).where(eq(hobbies.isExample, true)),
    db.select({ n: count() }).from(games).where(eq(games.isExample, true)),
    db.select({ n: count() }).from(youtubeItems).where(eq(youtubeItems.isExample, true)),
    db.select({ n: count() }).from(footballPlayers).where(eq(footballPlayers.isExample, true)),
    db.select({ n: count() }).from(footballMoments).where(eq(footballMoments.isExample, true)),
    db.select({ n: count() }).from(genericItems).where(eq(genericItems.isExample, true)),
  ]);
  const examples = exampleCounts.reduce((total, [row]) => total + row.n, 0);

  return [
    {
      id: "password",
      done: passwordChanged,
      title: "Változtasd meg a kezdő jelszót",
      hint: "Adj meg egy új jelszót, amit csak te ismersz.",
      href: "/admin/fiok",
    },
    {
      id: "env",
      done: !envPassword,
      title: "Töröld a kezdő jelszót a .env.local fájlból",
      hint: "Az ADMIN_PASSWORD= sor végéről – az oldalnak már nincs rá szüksége (utána indítsd újra az oldalt).",
    },
    {
      id: "legal",
      done: Boolean(settings.legal.controllerName.trim() && settings.legal.controllerEmail.trim()),
      title: "Add meg az adatkezelő adatait",
      hint: "Név és e-mail a jogi tájékoztatókhoz (kiskorú oldalánál általában a szülő).",
      href: "/admin/jogi-oldalak",
    },
    {
      id: "hero",
      done: ownHero,
      title: "Tölts fel egy saját képet a kezdőlapra",
      hint: "Például egy fotót rólad – most még a minta kép látszik.",
      href: "/admin/kezdolap",
    },
    {
      id: "examples",
      done: examples === 0,
      title: examples === 0 ? "Cseréld le a „Példa” tartalmakat" : `Cseréld le a „Példa” tartalmakat (még ${examples} db)`,
      hint: "Hobbik, játékok, YouTube-kedvencek, játékosok, pillanatok – szerkesztés után a „Példa” felirat eltűnik.",
      href: "/admin/hobbijaim",
    },
  ];
}
