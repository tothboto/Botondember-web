import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "./constants";

/** A választott nyelv mentése a `locale` sütibe (1 évre) – a böngészőben fut. */
export function setLocaleCookie(code: string): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}
