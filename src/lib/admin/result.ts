/**
 * Az Admin műveletek egységes eredménye és hibakezelése.
 * Minden művelet a `runAdmin`-nal kezdődik: ez ellenőrzi a belépést, és a
 * hibákat érthető magyar üzenetté alakítja.
 */
import { ZodError } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth/guard";
import type { AdminSession } from "@/lib/auth/session";
import { ImageError } from "@/lib/media/process";

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Barátságos hibaüzenet a felhasználónak (pl. „Ez a cím már foglalt”).
 * Ha megadod a mező nevét, az űrlap a hibát a mező alatt is megmutatja.
 */
export class UserError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function toActionError(error: unknown): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  if (error instanceof AuthError) return { ok: false, error: error.message };
  if (error instanceof UserError) {
    return { ok: false, error: error.message, ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) };
  }
  if (error instanceof ImageError) return { ok: false, error: error.message };
  if (error instanceof ZodError) {
    const fieldErrors = zodFieldErrors(error);
    return { ok: false, error: error.issues[0]?.message ?? "Hibás adat.", fieldErrors };
  }
  console.error("[admin]", error);
  return { ok: false, error: "Váratlan hiba történt. Próbáld újra, vagy frissítsd az oldalt!" };
}

/** Belépés-ellenőrzés + egységes hibakezelés egy Admin művelet köré. */
export async function runAdmin<T>(fn: (session: AdminSession) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const session = await requireAdmin();
    const data = await fn(session);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
