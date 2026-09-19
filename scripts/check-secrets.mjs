/**
 * Titokellenőrzés commit előtt (a .githooks/pre-commit futtatja).
 *
 * Megnézi, hogy a commitba kerülő fájlok egyikében sem szerepel-e a
 * .env.local egyik titkos értéke (admin jelszó, munkamenet-kulcs, adatbázis-token).
 * Ha igen, leállítja a commitot. A titkos értéket soha nem írja ki.
 *
 * Kézzel is futtatható: node scripts/check-secrets.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const SECRET_KEYS = ["ADMIN_PASSWORD", "SESSION_SECRET", "DATABASE_AUTH_TOKEN"];

function readSecrets() {
  if (!existsSync(".env.local")) return [];
  const secrets = [];
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || !SECRET_KEYS.includes(match[1])) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    // A nagyon rövid értékek (pl. üres) nem számítanak titoknak.
    if (value.length >= 6) secrets.push({ key: match[1], value });
  }
  return secrets;
}

function git(args) {
  return execFileSync("git", args, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
}

const secrets = readSecrets();
if (secrets.length === 0) process.exit(0);

const files = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"])
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const problems = [];
for (const file of files) {
  let content;
  try {
    content = git(["show", `:${file}`]).toString("utf8");
  } catch {
    continue;
  }
  for (const secret of secrets) {
    if (content.includes(secret.value)) problems.push(`${file} (a .env.local ${secret.key} értéke)`);
  }
}

if (problems.length > 0) {
  console.error("\n⛔ A commit leállt: titkos érték került a következő fájl(ok)ba:");
  for (const problem of problems) console.error(`   – ${problem}`);
  console.error("\nTávolítsd el a titkos értéket a fájlból, majd próbáld újra.\n");
  process.exit(1);
}
