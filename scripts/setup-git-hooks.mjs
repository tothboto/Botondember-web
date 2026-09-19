/**
 * Bekapcsolja a projekt Git-horgait (.githooks mappa) – pl. a commit előtti
 * titokellenőrzést. Az `npm install` után magától lefut. Ha nincs Git, vagy a
 * mappa nem Git-repó (pl. ZIP-ből kicsomagolva), csendben kihagyja.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".git") && existsSync(".githooks")) {
  try {
    execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
  } catch {
    // Nincs Git a gépen – nem baj, az oldal enélkül is működik.
  }
}
