/**
 * A kérés nyelve és szótára (szerveroldalon).
 * A nyelv a `locale` sütiből jön; ha a zászlók ki vannak kapcsolva, vagy a
 * süti nem egy bekapcsolt nyelvre mutat, az alapnyelv (magyar) érvényes.
 */
import { cookies } from "next/headers";
import { cache } from "react";
import { getLocales, getTranslationRows } from "@/lib/data/i18n";
import { getAllSettings } from "@/lib/data/settings";
import { LOCALE_COOKIE } from "./constants";
import { SEED_MESSAGES, SOURCE_LOCALE } from "./messages";
import { buildDictionary, translate, type Dictionary, type TranslateVars } from "./translate";

const BUILTIN_HU: Dictionary = Object.fromEntries(
  Object.entries(SEED_MESSAGES).map(([key, row]) => [key, row.hu]),
);

export type PublicLocale = { code: string; name: string; flag: string };

export type I18n = {
  locale: string;
  defaultLocale: string;
  showFlags: boolean;
  locales: PublicLocale[];
  dict: Dictionary;
  t: (key: string, vars?: TranslateVars) => string;
};

export const getI18n = cache(async (): Promise<I18n> => {
  const [settings, allLocales, rows] = await Promise.all([getAllSettings(), getLocales(), getTranslationRows()]);
  const enabled = allLocales.filter((l) => l.enabled);
  const defaultLocale = enabled.find((l) => l.isDefault)?.code ?? enabled[0]?.code ?? SOURCE_LOCALE;
  const showFlags = settings.i18n.showFlags && enabled.length > 1;

  let locale = defaultLocale;
  if (showFlags) {
    const requested = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (requested && enabled.some((l) => l.code === requested)) locale = requested;
  }

  const dict = buildDictionary(rows, locale, SOURCE_LOCALE, BUILTIN_HU);
  return {
    locale,
    defaultLocale,
    showFlags,
    locales: enabled.map((l) => ({ code: l.code, name: l.name, flag: l.flag })),
    dict,
    t: (key, vars) => translate(dict, key, vars),
  };
});
