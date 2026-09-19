/**
 * A belépést igazoló aláírt token (JWT, HS256) – a Next.js-től független,
 * egységtesztelt kód. A tokenben csak az admin azonosítója és egy „verzió”
 * (a fiók utolsó módosításának ideje) van: jelszócsere után a régi
 * belépések így automatikusan érvénytelenné válnak.
 */
import { jwtVerify, SignJWT } from "jose";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 nap

export type SessionPayload = { userId: number; version: number };

function keyFrom(secret: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error("A SESSION_SECRET hiányzik vagy túl rövid. Futtasd: npm run setup");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
  secret: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): Promise<string> {
  return new SignJWT({ ver: payload.version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(keyFrom(secret));
}

/** Érvényes-e a token (aláírás, lejárat, formátum). Hibánál `null`. */
export async function verifySessionToken(token: string | undefined, secret: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keyFrom(secret), { algorithms: ["HS256"] });
    const userId = Number(payload.sub);
    const version = Number(payload.ver);
    if (!Number.isInteger(userId) || userId <= 0 || !Number.isFinite(version)) return null;
    return { userId, version };
  } catch {
    return null;
  }
}

/**
 * Jogosultság-ellenőrzés: a token csak akkor ér valamit, ha a fiók még
 * létezik, és azóta nem változott (jelszó- vagy névcsere).
 */
export async function authorize(
  token: string | undefined,
  secret: string,
  findUser: (id: number) => Promise<{ id: number; username: string; updatedAt: number } | null>,
): Promise<{ userId: number; username: string } | null> {
  const payload = await verifySessionToken(token, secret);
  if (!payload) return null;
  const user = await findUser(payload.userId);
  if (!user || user.updatedAt !== payload.version) return null;
  return { userId: user.id, username: user.username };
}
