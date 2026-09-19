"use client";

/**
 * A szótár a böngészőben futó komponenseknek (menü, téma-választó stb.).
 */
import { createContext, use, useMemo, type ReactNode } from "react";
import { translate, type Dictionary, type TranslateVars } from "./translate";

type I18nContextValue = { locale: string; dict: Dictionary };

const I18nContext = createContext<I18nContextValue>({ locale: "hu", dict: {} });

export function I18nProvider({ locale, dict, children }: I18nContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const { locale, dict } = use(I18nContext);
  return useMemo(
    () => ({ locale, t: (key: string, vars?: TranslateVars) => translate(dict, key, vars) }),
    [locale, dict],
  );
}
