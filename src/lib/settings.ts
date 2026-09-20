/**
 * Az oldal beállításai (a `settings` táblában, kulcsonként egy JSON érték).
 * Itt vannak a szerkezetük (zod séma) és az alapértékeik.
 * Ez a fájl a Next.js-től független, így a seed script is használja.
 */
import { z } from "zod";
import { FONT_KEYS } from "./font-options";
import { isSafeHttpUrl } from "./url";

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const FOCAL_POINTS = ["center", "top", "bottom", "left", "right"] as const;
export type FocalPoint = (typeof FOCAL_POINTS)[number];

/** A Real Madrid színei (spec 7.1) – az Adminban felülírhatók. */
export const BRAND_COLOR_DEFAULTS = {
  white: "#FFFFFF",
  blue: "#00529F",
  gold: "#FEBE10",
  navy: "#0B1F3F",
  purple: "#3D195B",
} as const;
export type BrandColorKey = keyof typeof BRAND_COLOR_DEFAULTS;
export const BRAND_COLOR_KEYS = Object.keys(BRAND_COLOR_DEFAULTS) as BrandColorKey[];

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Érvénytelen szín – a formátum #RRGGBB (pl. #00529F).");

export const safeUrl = z
  .string()
  .trim()
  .max(500, "Túl hosszú link.")
  .refine(isSafeHttpUrl, "Csak http:// vagy https:// kezdetű link adható meg.");

const emailOrEmpty = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Érvénytelen e-mail-cím.");

export const settingSchemas = {
  general: z.object({
    siteName: z.string().trim().min(1, "Add meg az oldal nevét!").max(80),
    headerTitle: z.string().trim().min(1, "Add meg a fejléc feliratát!").max(80),
    defaultTheme: z.enum(THEME_MODES),
    stickyHeader: z.boolean(),
    noindex: z.boolean(),
    /** A feltöltött favicon-készlet azonosítója; `null` = a beépített „B” monogram. */
    faviconVersion: z.string().regex(/^[a-z0-9-]{1,40}$/).nullable(),
  }),
  appearance: z.object({
    colors: z.object({
      white: hexColor.nullable(),
      blue: hexColor.nullable(),
      gold: hexColor.nullable(),
      navy: hexColor.nullable(),
      purple: hexColor.nullable(),
    }),
    fonts: z.object({
      body: z.enum(FONT_KEYS),
      heading: z.enum(FONT_KEYS),
      title: z.enum(FONT_KEYS),
    }),
  }),
  home: z.object({
    heroMediaId: z.number().int().positive().nullable(),
    focal: z.enum(FOCAL_POINTS),
    overlay: z.number().int().min(0).max(90),
    message: z.string().trim().min(1, "A fő üzenet nem lehet üres!").max(200),
    subtitle: z.string().trim().max(300),
    motto: z.object({
      enabled: z.boolean(),
      text: z.string().trim().max(300),
      author: z.string().trim().max(100),
    }),
    /** Útbaigazító leírás a kezdőlapon, egy gomb mögött („Hol vagy? Mi ez”). */
    guide: z.object({
      enabled: z.boolean(),
      button: z.string().trim().max(60),
      title: z.string().trim().max(120),
      text: z.string().trim().max(3000),
      /** Az aloldalak dobozai a szöveg alatt. */
      showPages: z.boolean(),
    }),
  }),
  footer: z.object({
    text: z.string().trim().max(500),
    links: z
      .array(
        z.object({
          label: z.string().trim().min(1, "A link szövege nem lehet üres!").max(60),
          url: safeUrl,
        }),
      )
      .max(12, "Legfeljebb 12 link adható meg."),
  }),
  i18n: z.object({
    showFlags: z.boolean(),
  }),
  legal: z.object({
    controllerName: z.string().trim().max(120),
    controllerEmail: emailOrEmpty,
    hostingProvider: z.string().trim().max(300),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A dátum formátuma: ÉÉÉÉ-HH-NN."),
  }),
};

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;
export type GeneralSettings = SettingValue<"general">;
export type AppearanceSettings = SettingValue<"appearance">;
export type HomeSettings = SettingValue<"home">;
export type FooterSettings = SettingValue<"footer">;
export type I18nSettings = SettingValue<"i18n">;
export type LegalSettings = SettingValue<"legal">;

export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];

export const settingDefaults: { [K in SettingKey]: SettingValue<K> } = {
  general: {
    siteName: "Botondember első weboldala",
    headerTitle: "Botondember első weboldala",
    defaultTheme: "system",
    stickyHeader: false,
    noindex: true,
    faviconVersion: null,
  },
  appearance: {
    colors: { white: null, blue: null, gold: null, navy: null, purple: null },
    fonts: { body: "inter", heading: "interTight", title: "cinzel" },
  },
  home: {
    heroMediaId: null,
    focal: "center",
    overlay: 55,
    message: "Helló! Botondember vagyok. Üdv az első honlapomon!",
    subtitle: "",
    motto: { enabled: false, text: "", author: "" },
    guide: {
      enabled: true,
      button: "Hol vagy? Mi ez?",
      title: "Hol vagy? Mi ez?",
      text: [
        "Szia, és köszönöm, hogy benéztél! **Botondember** vagyok, ez pedig az első saját weboldalam.",
        "",
        "Itt megmutatom, mi érdekel a legjobban: a hobbijaimat, a kedvenc játékaimat, a YouTube-kedvenceimet és a kedvenc focicsapatomat, a Real Madridot. Válassz egy témát az alábbi dobozok közül, vagy használd a fenti menüt!",
        "",
        "Az oldal öt nyelven olvasható – a fejléc zászlóival válthatsz –, és világos vagy sötét változatban is nézheted. Jó böngészést!",
      ].join("\n"),
      showPages: true,
    },
  },
  footer: {
    text: "© 2026 Botondember",
    links: [],
  },
  i18n: {
    showFlags: true,
  },
  legal: {
    controllerName: "",
    controllerEmail: "",
    hostingProvider: "",
    effectiveDate: "2026-09-19",
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Az alapértékekre „ráteszi” a tárolt értéket: csak az ismert kulcsokat veszi át,
 * a hiányzókat az alapértékből pótolja (így egy új beállítás sem okoz hibát).
 */
export function mergeWithDefaults<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : override) as T;
  }
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    if (!(key in override)) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    const overrideValue = override[key];
    result[key] =
      isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? mergeWithDefaults(baseValue, overrideValue)
        : overrideValue;
  }
  return result as T;
}

/** A tárolt (nyers) értékből érvényes beállítást készít; hibás adatnál az alapérték jön. */
export function parseSetting<K extends SettingKey>(key: K, raw: unknown): SettingValue<K> {
  const merged = mergeWithDefaults(settingDefaults[key], raw);
  const result = settingSchemas[key].safeParse(merged);
  return (result.success ? result.data : settingDefaults[key]) as SettingValue<K>;
}

/** A márkaszínek tényleges értéke (felülírás vagy alapérték). */
export function resolveBrandColors(appearance: AppearanceSettings): Record<BrandColorKey, string> {
  const out = { ...BRAND_COLOR_DEFAULTS } as Record<BrandColorKey, string>;
  for (const key of BRAND_COLOR_KEYS) {
    const value = appearance.colors[key];
    if (value) out[key] = value.toUpperCase();
  }
  return out;
}
