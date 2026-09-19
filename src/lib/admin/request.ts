/**
 * Segédfüggvények az Admin Route Handlerekhez (feltöltés, mentés letöltése).
 * A belépést és a kérés eredetét is ellenőrizzük (CSRF védelem – a süti
 * amúgy is SameSite=Lax, ez egy második védővonal).
 */
import { getSession, type AdminSession } from "@/lib/auth/session";

export function jsonError(message: string, status: number): Response {
  return Response.json({ ok: false, error: message }, { status });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // nem böngészőből jövő kérés – a belépést így is ellenőrizzük
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Belépett admin, vagy egy kész hibaválasz. */
export async function adminRequest(request: Request): Promise<AdminSession | Response> {
  if (!isSameOrigin(request)) return jsonError("Érvénytelen kérés.", 403);
  const session = await getSession();
  if (!session) return jsonError("Nincs jogosultságod ehhez a művelethez. Jelentkezz be újra!", 401);
  return session;
}
