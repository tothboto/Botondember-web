/**
 * Brute force védelem: IP-címenként legfeljebb 5 hibás belépési kísérlet
 * 15 percenként. A régi (24 óránál öregebb) bejegyzések automatikusan törlődnek.
 */
import { eq, lt } from "drizzle-orm";
import type { Db } from "@/db/client";
import { loginAttempts } from "@/db/schema";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export type AttemptState = { count: number; windowStart: number };

/** Le van-e tiltva az IP, és ha igen, hány perc múlva próbálkozhat újra. */
export function checkAttempts(
  state: AttemptState | null | undefined,
  now: number,
): { allowed: true } | { allowed: false; retryAfterMinutes: number } {
  if (!state) return { allowed: true };
  const elapsed = now - state.windowStart;
  if (elapsed >= LOGIN_WINDOW_MS || state.count < LOGIN_MAX_FAILURES) return { allowed: true };
  return { allowed: false, retryAfterMinutes: Math.max(1, Math.ceil((LOGIN_WINDOW_MS - elapsed) / 60000)) };
}

/** Egy újabb hibás kísérlet után az új állapot (lejárt ablaknál újraindul). */
export function nextFailureState(state: AttemptState | null | undefined, now: number): AttemptState {
  if (!state || now - state.windowStart >= LOGIN_WINDOW_MS) return { count: 1, windowStart: now };
  return { count: state.count + 1, windowStart: state.windowStart };
}

async function readState(db: Db, ip: string): Promise<AttemptState | null> {
  const rows = await db.select().from(loginAttempts).where(eq(loginAttempts.ip, ip)).limit(1);
  return rows[0] ? { count: rows[0].count, windowStart: rows[0].windowStart } : null;
}

export async function isLoginAllowed(db: Db, ip: string, now = Date.now()) {
  await db.delete(loginAttempts).where(lt(loginAttempts.windowStart, now - LOGIN_ATTEMPT_RETENTION_MS));
  return checkAttempts(await readState(db, ip), now);
}

export async function registerLoginFailure(db: Db, ip: string, now = Date.now()): Promise<void> {
  const next = nextFailureState(await readState(db, ip), now);
  await db
    .insert(loginAttempts)
    .values({ ip, ...next })
    .onConflictDoUpdate({ target: loginAttempts.ip, set: next });
}

export async function clearLoginFailures(db: Db, ip: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
}
