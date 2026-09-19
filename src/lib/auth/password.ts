import bcrypt from "bcryptjs";

/** bcrypt csak az első 72 bájtot veszi figyelembe – ennél hosszabbat nem engedünk. */
export function isValidPasswordLength(password: string): boolean {
  return password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Ha nincs ilyen felhasználó, akkor is elvégzünk egy (hamis) ellenőrzést,
 * hogy a válaszidőből ne lehessen kitalálni, létezik-e a felhasználónév.
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5Qe9TT3m1sQfZl3XjB0Q0/7u7GvVZ1K";
export async function burnPasswordCheck(password: string): Promise<false> {
  await verifyPassword(password, DUMMY_HASH);
  return false;
}
