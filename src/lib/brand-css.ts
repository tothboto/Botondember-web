import { fontCssVar } from "./font-options";
import { resolveBrandColors, type AppearanceSettings } from "./settings";

/**
 * Az Adminban beállított színek és betűk CSS-ként (a gyökér-layout <head>-jébe).
 * Az értékek ellenőrzöttek (#RRGGBB színek, ismert betűnevek), így nem kerülhet
 * ide veszélyes kód.
 */
export function brandCss(appearance: AppearanceSettings): string {
  const colors = resolveBrandColors(appearance);
  const fonts = appearance.fonts;
  return [
    ":root:root{",
    `--rm-white:${colors.white};`,
    `--rm-blue:${colors.blue};`,
    `--rm-gold:${colors.gold};`,
    `--rm-navy:${colors.navy};`,
    `--rm-purple:${colors.purple};`,
    `--role-body:var(${fontCssVar(fonts.body)});`,
    `--role-heading:var(${fontCssVar(fonts.heading)});`,
    `--role-title:var(${fontCssVar(fonts.title)});`,
    `--role-hero:var(${fontCssVar(fonts.hero)});`,
    "}",
  ].join("");
}
