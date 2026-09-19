/**
 * Világos / sötét téma – villanás nélkül.
 *
 * A Next.js 16 dokumentációjában javasolt módszer: egy apró, beágyazott szkript
 * a <head>-ben még az első kirajzolás előtt beállítja a `dark` osztályt a
 * <html> elemen. A választás a böngésző helyi tárolójában van (`theme` kulcs).
 * Három állapot: `system` (a számítógép beállítása szerint), `light`, `dark`.
 */
import type { ThemeMode } from "./settings";

export const THEME_STORAGE_KEY = "theme";

/** A <head>-be kerülő szkript. Az alapértelmezett módot az Admin adja meg. */
export function themeScript(defaultMode: ThemeMode): string {
  return `(function(){try{var d=document.documentElement,m=null;try{m=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}if(m!=="light"&&m!=="dark"&&m!=="system")m=${JSON.stringify(defaultMode)};var k=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",k);d.style.colorScheme=k?"dark":"light";d.setAttribute("data-theme-mode",m);d.setAttribute("data-theme-default",${JSON.stringify(defaultMode)})}catch(e){}})();`;
}

// ---------------------------------------------------------------------------
// Böngészőoldali „tároló” (a téma-választó gombokhoz)
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

function isMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function storedMode(): ThemeMode | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function defaultMode(): ThemeMode {
  const value = document.documentElement.getAttribute("data-theme-default");
  return isMode(value) ? value : "system";
}

export function currentMode(): ThemeMode {
  return storedMode() ?? defaultMode();
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  root.setAttribute("data-theme-mode", mode);
}

export function setThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Privát ablakban a tárolás tiltva lehet – a téma ettől még átvált.
  }
  applyTheme(mode);
  notifyTheme();
}

export function notifyTheme(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
