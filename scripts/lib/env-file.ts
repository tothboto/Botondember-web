/**
 * Egyszerű segédfüggvények a `.env.local` fájl olvasásához és módosításához
 * (a többi sort és a megjegyzéseket érintetlenül hagyja).
 */
import fs from "node:fs";
import path from "node:path";

export const ENV_FILE = ".env.local";

export function envFilePath(root = process.cwd()): string {
  return path.join(root, ENV_FILE);
}

export function readEnvValue(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) return null;
  let value = match[1].trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

export function setEnvValue(content: string, key: string, value: string): string {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(content) ? content.replace(pattern, () => line) : `${content.trimEnd()}\n${line}\n`;
}

/** Ha nincs `.env.local`, a `.env.example` alapján létrehozza. Visszaadja: létrehozta-e. */
export function ensureEnvFile(root = process.cwd()): boolean {
  const target = envFilePath(root);
  if (fs.existsSync(target)) return false;
  const example = path.join(root, ".env.example");
  const content = fs.existsSync(example) ? fs.readFileSync(example, "utf8") : "";
  fs.writeFileSync(target, content, "utf8");
  return true;
}

export function readEnvFile(root = process.cwd()): string {
  const target = envFilePath(root);
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
}

export function writeEnvFile(content: string, root = process.cwd()): void {
  fs.writeFileSync(envFilePath(root), content, "utf8");
}
