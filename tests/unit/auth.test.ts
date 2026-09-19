import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/auth/ip";
import { isValidPasswordLength } from "@/lib/auth/password";
import { checkAttempts, LOGIN_MAX_FAILURES, LOGIN_WINDOW_MS, nextFailureState } from "@/lib/auth/rate-limit";
import { authorize, signSessionToken, verifySessionToken } from "@/lib/auth/token";

const SECRET = "teszt-titok-ami-legalabb-harminckét-karakter-hosszú";
const OTHER_SECRET = "egy-masik-titok-ami-szinten-eleg-hosszu-12345";

const user = { id: 1, username: "Botond", updatedAt: 1_700_000_000_000 };
const findUser = async (id: number) => (id === user.id ? user : null);

describe("belépési token", () => {
  it("az érvényes tokent elfogadja", async () => {
    const token = await signSessionToken({ userId: 1, version: user.updatedAt }, SECRET);
    expect(await verifySessionToken(token, SECRET)).toEqual({ userId: 1, version: user.updatedAt });
  });

  it("a módosított (meghamisított) tokent elutasítja", async () => {
    const token = await signSessionToken({ userId: 1, version: user.updatedAt }, SECRET);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "1", ver: user.updatedAt, exp: 9999999999 })).toString(
      "base64url",
    );
    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it("a más kulccsal aláírt tokent elutasítja", async () => {
    const token = await signSessionToken({ userId: 1, version: user.updatedAt }, OTHER_SECRET);
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("a lejárt tokent elutasítja", async () => {
    const token = await signSessionToken({ userId: 1, version: user.updatedAt }, SECRET, -10);
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("hiányzó vagy szemét tokenre null", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
    expect(await verifySessionToken("nem.egy.token", SECRET)).toBeNull();
  });

  it("túl rövid titkos kulccsal nem enged aláírni", async () => {
    await expect(signSessionToken({ userId: 1, version: 1 }, "rovid")).rejects.toThrow(/SESSION_SECRET/);
  });
});

describe("jogosultság-ellenőrzés", () => {
  it("érvényes token + létező, változatlan fiók → admin", async () => {
    const token = await signSessionToken({ userId: 1, version: user.updatedAt }, SECRET);
    expect(await authorize(token, SECRET, findUser)).toEqual({ userId: 1, username: "Botond" });
  });

  it("jelszócsere után (új verzió) a régi belépés érvénytelen", async () => {
    const token = await signSessionToken({ userId: 1, version: user.updatedAt - 1 }, SECRET);
    expect(await authorize(token, SECRET, findUser)).toBeNull();
  });

  it("törölt fiókkal nincs jogosultság", async () => {
    const token = await signSessionToken({ userId: 42, version: user.updatedAt }, SECRET);
    expect(await authorize(token, SECRET, findUser)).toBeNull();
  });

  it("süti nélkül nincs jogosultság", async () => {
    expect(await authorize(undefined, SECRET, findUser)).toBeNull();
  });
});

describe("brute force védelem", () => {
  const now = 1_800_000_000_000;

  it(`${LOGIN_MAX_FAILURES} hibás kísérlet után 15 percre letilt`, () => {
    let state = null as ReturnType<typeof nextFailureState> | null;
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) {
      expect(checkAttempts(state, now).allowed).toBe(true);
      state = nextFailureState(state, now);
    }
    const result = checkAttempts(state, now + 60_000);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.retryAfterMinutes).toBe(14);
  });

  it("15 perc után újra lehet próbálkozni, és a számláló újraindul", () => {
    const blocked = { count: LOGIN_MAX_FAILURES, windowStart: now };
    expect(checkAttempts(blocked, now + LOGIN_WINDOW_MS).allowed).toBe(true);
    expect(nextFailureState(blocked, now + LOGIN_WINDOW_MS)).toEqual({ count: 1, windowStart: now + LOGIN_WINDOW_MS });
  });
});

describe("egyéb", () => {
  it("az IP-címet a proxy fejlécből veszi, ennek hiányában „helyi”", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIp(new Headers())).toBe("helyi");
  });

  it("jelszóhossz: legalább 8 karakter, legfeljebb 72 bájt", () => {
    expect(isValidPasswordLength("rovid")).toBe(false);
    expect(isValidPasswordLength("Pelda-Jelszo-2026")).toBe(true);
    expect(isValidPasswordLength("ő".repeat(37))).toBe(false);
  });
});
