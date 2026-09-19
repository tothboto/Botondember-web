/**
 * Jogosultság-ellenőrzés a szerveren. Minden admin oldal, Server Action és
 * Route Handler ezzel kezdődik – nem elég a gombokat elrejteni a felületen.
 */
import { redirect } from "next/navigation";
import { getSession, type AdminSession } from "./session";

export class AuthError extends Error {
  constructor() {
    super("Nincs jogosultságod ehhez a művelethez. Jelentkezz be újra!");
    this.name = "AuthError";
  }
}

/** Server Actionökhöz és Route Handlerekhez: belépés nélkül hibát dob. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new AuthError();
  return session;
}

/** Admin oldalakhoz: belépés nélkül a kezdőlapra küld, megnyitott belépő ablakkal. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/?login=1");
  return session;
}
