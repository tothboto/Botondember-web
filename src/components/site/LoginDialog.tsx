"use client";

import { Crown, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { OPEN_LOGIN_EVENT } from "./BossArea";

const INITIAL: LoginState = {};

/**
 * Belépő ablak (modál): Felhasználónév, Jelszó, „Belépés” gomb.
 * Az „Itt a Főnök!” gomb nyitja meg, vagy ha az URL-ben `?login=1` van
 * (pl. belépés nélkül megnyitott /admin után). Esc vagy X bezárja.
 */
export function LoginDialog() {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const open = () => {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
    };
    window.addEventListener(OPEN_LOGIN_EVENT, open);

    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      open();
      params.delete("login");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    return () => window.removeEventListener(OPEN_LOGIN_EVENT, open);
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="login-title"
      aria-describedby="login-intro"
      className="modal [--focus:var(--rm-blue)] dark:[--focus:var(--rm-gold)]"
      data-testid="login-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form action={formAction} className="space-y-5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="login-title" className="flex items-center gap-2 font-display text-2xl font-black tracking-wide uppercase">
              <Crown aria-hidden className="h-6 w-6 text-rm-gold" />
              {t("login.title")}
            </h2>
            <p id="login-intro" className="mt-1 text-sm text-muted">
              {t("login.intro")}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t("common.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line hover:bg-surface"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900"
          >
            {state.error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="login-username" className="block text-sm font-semibold">
            {t("login.username")}
          </label>
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            required
            maxLength={60}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-sm font-semibold">
            {t("login.password")}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-base"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-primary px-5 py-3 font-display font-bold tracking-wider text-primary-fg uppercase hover:brightness-110 disabled:opacity-70"
        >
          {pending ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </dialog>
  );
}
