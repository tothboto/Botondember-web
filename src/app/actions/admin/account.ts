"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb, type Db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { clientIp } from "@/lib/auth/ip";
import { hashPassword, isValidPasswordLength, verifyPassword } from "@/lib/auth/password";
import { clearLoginFailures, isLoginAllowed, registerLoginFailure } from "@/lib/auth/rate-limit";
import { startSession, type AdminSession } from "@/lib/auth/session";

const newPassword = z
  .string()
  .refine(isValidPasswordLength, "A jelszó legalább 8 karakter legyen (és legfeljebb 72 bájt – kb. 70 betű).");

const passwordInput = z.object({
  currentPassword: z.string().min(1, "Add meg a jelenlegi jelszavad!").max(200),
  newPassword,
  confirmPassword: z.string().max(200),
});

const usernameInput = z.object({
  username: z
    .string()
    .trim()
    .min(3, "A felhasználónév legalább 3 karakter legyen.")
    .max(40, "A felhasználónév legfeljebb 40 karakter lehet.")
    .regex(/^[\p{L}\p{N}._-]+$/u, "A felhasználónévben csak betű, szám, pont, kötőjel és aláhúzás lehet (szóköz nem)."),
  currentPassword: z.string().min(1, "Add meg a jelenlegi jelszavad!").max(200),
});

/**
 * A jelenlegi jelszó ellenőrzése. A hibás próbálkozások ugyanúgy számítanak,
 * mint a belépésnél (5 hibás próbálkozás / 15 perc), így ezen az úton sem lehet találgatni.
 */
async function verifyCurrentPassword(db: Db, session: AdminSession, password: string) {
  const ip = clientIp(await headers());
  const limit = await isLoginAllowed(db, ip);
  if (!limit.allowed) {
    throw new UserError(`Túl sok hibás próbálkozás. Próbáld újra ${limit.retryAfterMinutes} perc múlva!`);
  }
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
  if (!user) throw new UserError("A fiók nem található – lépj be újra!");
  if (!(await verifyPassword(password, user.passwordHash))) {
    await registerLoginFailure(db, ip);
    throw new UserError("A jelenlegi jelszó nem jó.", "currentPassword");
  }
  await clearLoginFailures(db, ip);
  return user;
}

/** Új „verzió” a fióknak: a régi belépések (más gépeken) érvénytelenné válnak. */
function nextVersion(previous: number): number {
  return Math.max(Date.now(), previous + 1);
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  return runAdmin(async (session) => {
    const value = passwordInput.parse(input);
    if (value.newPassword !== value.confirmPassword) {
      throw new UserError("A két új jelszó nem egyezik.", "confirmPassword");
    }
    const db = getDb();
    const user = await verifyCurrentPassword(db, session, value.currentPassword);
    if (value.newPassword === value.currentPassword) {
      throw new UserError("Az új jelszó nem lehet ugyanaz, mint a régi.", "newPassword");
    }
    const updatedAt = nextVersion(user.updatedAt);
    await db
      .update(adminUsers)
      .set({ passwordHash: await hashPassword(value.newPassword), updatedAt })
      .where(eq(adminUsers.id, user.id));
    // Ez a böngésző belépve marad, a többi eszközön újra be kell lépni.
    await startSession({ id: user.id, updatedAt });
    await logActivity(db, "Fiók", "Jelszó megváltoztatva");
    return null;
  });
}

export async function changeUsername(input: unknown): Promise<ActionResult> {
  return runAdmin(async (session) => {
    const value = usernameInput.parse(input);
    const db = getDb();
    const user = await verifyCurrentPassword(db, session, value.currentPassword);
    if (value.username === user.username) throw new UserError("Ez már most is a felhasználóneved.", "username");
    const taken = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(and(eq(adminUsers.username, value.username), ne(adminUsers.id, user.id)));
    if (taken.length > 0) throw new UserError("Ez a felhasználónév már foglalt.", "username");
    const updatedAt = nextVersion(user.updatedAt);
    await db.update(adminUsers).set({ username: value.username, updatedAt }).where(eq(adminUsers.id, user.id));
    await startSession({ id: user.id, updatedAt });
    await logActivity(db, "Fiók", "Felhasználónév megváltoztatva");
    return null;
  });
}

/** Kilépés minden más eszközön (pl. ha egy idegen gépen bent maradtál). */
export async function logoutOtherSessions(): Promise<ActionResult> {
  return runAdmin(async (session) => {
    const db = getDb();
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
    if (!user) throw new UserError("A fiók nem található – lépj be újra!");
    const updatedAt = nextVersion(user.updatedAt);
    await db.update(adminUsers).set({ updatedAt }).where(eq(adminUsers.id, user.id));
    await startSession({ id: user.id, updatedAt });
    await logActivity(db, "Fiók", "Kilépés minden más eszközön");
    return null;
  });
}
