import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A projekt generált / helyi mappái:
    "data/**",
    "public/flags/**",
    "drizzle/**",
    "test-results/**",
    "playwright-report/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
