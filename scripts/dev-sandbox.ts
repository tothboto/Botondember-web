/**
 * `npm run dev:sandbox` – „homokozó”: fejlesztői szerver egy KÜLÖN teszt-
 * adatbázissal (data/sandbox) és egy teszt-admin fiókkal. Nyugodtan lehet
 * benne kísérletezni, a valódi tartalmat nem érinti.
 * A teszt-admin belépési adatai: data/sandbox/credentials.json
 * Kapcsolók: --port=3000  --reset (a homokozó törlése és újra létrehozása)
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "data", "sandbox");
const credentialsFile = path.join(dir, "credentials.json");
const port = process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? "3000";

type Credentials = { username: string; password: string; sessionSecret: string };

async function main() {
  if (process.argv.includes("--reset")) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  let credentials: Credentials;
  if (fs.existsSync(credentialsFile)) {
    credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf8")) as Credentials;
  } else {
    credentials = {
      username: "teszt-admin",
      password: `Homokozo-${crypto.randomBytes(12).toString("base64url")}`,
      sessionSecret: crypto.randomBytes(48).toString("base64url"),
    };
    fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2), "utf8");
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: "file:./data/sandbox/site.db",
    DATABASE_AUTH_TOKEN: "",
    UPLOADS_DIR: "./data/sandbox/uploads",
    ADMIN_USERNAME: credentials.username,
    ADMIN_PASSWORD: credentials.password,
    SESSION_SECRET: credentials.sessionSecret,
    COOKIE_SECURE: "false",
  };
  Object.assign(process.env, env);

  const { createDb } = await import("../src/db/client");
  const { runMigrations } = await import("../src/db/migrate");
  const { seed } = await import("../src/db/seed");
  const { getStorage } = await import("../src/lib/media/storage");
  const { db, client } = createDb();
  await runMigrations(db);
  await seed(db, getStorage(), { adminUsername: credentials.username, adminPassword: credentials.password });
  client.close();

  console.log(`\n🧪 Homokozó: http://localhost:${port}`);
  console.log(`   Teszt-admin: ${credentials.username} (a jelszó: data/sandbox/credentials.json)\n`);

  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "--port", port], { env, stdio: "inherit" });
  const stop = () => child.kill();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
