/**
 * A fejléc emblémájához a feliratot két részre bontjuk: a kiemelt szó (a leghosszabb –
 * a gyakorlatban a név: „Botondember”) nagy betűvel áll, a többi kis sorban alatta vagy
 * fölötte. A szavak sorrendje nem változik, így minden nyelven olvasható marad:
 *   „Botondember első weboldala”      → BOTONDEMBER / első weboldala
 *   „La primera web de Botondember”   → la primera web de / BOTONDEMBER
 * Ha a leghosszabb szó a felirat közepén áll, nem bontunk: az egész felirat a kiemelt rész.
 */
export type BrandTitle = {
  /** A nagy betűs, kiemelt rész. */
  lead: string;
  /** A kis sor szövege (üres, ha nincs). */
  rest: string;
  /** A kis sor a kiemelt rész fölött (`true`) vagy alatta (`false`) áll. */
  restFirst: boolean;
  /** A jelvény betűje: a kiemelt rész első betűje, nagybetűvel. */
  initial: string;
};

export function splitBrandTitle(title: string): BrandTitle {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const whole = words.join(" ");
  let longest = 0;
  words.forEach((word, index) => {
    if (word.length > words[longest].length) longest = index;
  });

  let lead = whole;
  let rest = "";
  let restFirst = false;
  if (words.length > 1 && longest === 0) {
    lead = words[0];
    rest = words.slice(1).join(" ");
  } else if (words.length > 1 && longest === words.length - 1) {
    lead = words[longest];
    rest = words.slice(0, -1).join(" ");
    restFirst = true;
  }

  const initial = (Array.from(lead).find((char) => /\p{L}|\p{N}/u.test(char)) ?? "").toLocaleUpperCase();
  return { lead, rest, restFirst, initial };
}
