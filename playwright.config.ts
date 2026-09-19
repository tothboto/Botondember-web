import crypto from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/**
 * Böngészős (e2e) tesztek – egy teljesen KÜLÖN tesztkörnyezetben futnak:
 * saját, minden futtatáskor újra létrehozott adatbázissal (data/e2e) és egy
 * véletlenszerű jelszavú teszt-adminnal. A valódi adatokat nem érintik.
 *
 * Futtatás: `npm run test:e2e` (előtte buildel).
 * Windowson a gépre telepített Microsoft Edge-et használja (nem kell letölteni böngészőt).
 */
// A konfigurációt a tesztfolyamatok is betöltik – a jelszó egyszer készül, a többiek öröklik.
process.env.E2E_ADMIN_USERNAME ??= "teszt-admin";
process.env.E2E_ADMIN_PASSWORD ??= `E2e-${crypto.randomBytes(15).toString("base64url")}`;
process.env.E2E_SESSION_SECRET ??= crypto.randomBytes(48).toString("base64url");

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
const isWindows = process.platform === "win32";

export default defineConfig({
  testDir: "tests/e2e",
  // A Playwright a futás elején kiüríti ezt a mappát – a képernyőképek máshová kerülnek.
  outputDir: "test-results/e2e",
  // Egy közös adatbázist használnak, ezért egymás után futnak.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  // A képernyőkép-készítő „teszt” csak kérésre fut (SCREENS=1).
  grepInvert: process.env.SCREENS ? undefined : /@screens/,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    locale: "hu-HU",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: isWindows ? "edge" : "chromium",
      use: isWindows ? { ...devices["Desktop Edge"], channel: "msedge" } : { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx tsx scripts/e2e-server.ts",
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    env: {
      E2E_PORT: String(PORT),
      E2E_ADMIN_USERNAME: process.env.E2E_ADMIN_USERNAME,
      E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD,
      E2E_SESSION_SECRET: process.env.E2E_SESSION_SECRET,
    },
  },
});
