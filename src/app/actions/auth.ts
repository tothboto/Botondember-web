"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { clientIp } from "@/lib/auth/ip";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { clearLoginFailures, isLoginAllowed, registerLoginFailure } from "@/lib/auth/rate-limit";
import { endSession, startSession } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export type LoginState = { error?: string; username?: string };

const loginSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(200),
});

/** Belépés az „Itt a Főnök!” ablakból. */
export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const { t } = await getI18n();
  const raw = {
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: t("login.required"), username: raw.username };

  const db = getDb();
  const ip = clientIp(await headers());
  const limit = await isLoginAllowed(db, ip);
  if (!limit.allowed) {
    return { error: t("login.tooMany", { minutes: limit.retryAfterMinutes }), username: raw.username };
  }

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.username, parsed.data.username)).limit(1);
  const user = rows[0];
  const ok = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : await burnPasswordCheck(parsed.data.password);

  if (!ok || !user) {
    await registerLoginFailure(db, ip);
    // Szándékosan általános üzenet: nem áruljuk el, melyik adat volt rossz.
    return { error: t("login.error"), username: raw.username };
  }

  await clearLoginFailures(db, ip);
  await startSession(user);
  await logActivity(db, "Fiók", "Belépés az Adminba");
  redirect("/admin");
}

/** Kilépés (a fejlécből és az Adminból). */
export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
