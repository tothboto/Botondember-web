/**
 * Belépés kezelése a Next.js-ben: aláírt token egy httpOnly sütiben
 * (`admin_session`, SameSite=Lax, élesben Secure, 7 napos lejárat).
 */
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { authorize, SESSION_MAX_AGE_SECONDS, signSessionToken } from "./token";

/** A süti neve (a Cookie tájékoztatóban is ez szerepel). */
export const SESSION_COOKIE = "admin_session";

export type AdminSession = { userId: number; username: string };

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}

function secureCookies(): boolean {
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

async function findUser(id: number) {
  const rows = await getDb()
    .select({ id: adminUsers.id, username: adminUsers.username, updatedAt: adminUsers.updatedAt })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Az aktuális kérés belépett adminja (vagy `null`). Kérésenként egyszer fut le. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return authorize(token, sessionSecret(), findUser);
});

/** Belépés után: a süti beállítása (csak Server Action-ből vagy Route Handlerből hívható). */
export async function startSession(user: { id: number; updatedAt: number }): Promise<void> {
  const token = await signSessionToken({ userId: user.id, version: user.updatedAt }, sessionSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
