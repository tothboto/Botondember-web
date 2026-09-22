@AGENTS.md

# Botondember első weboldala – tartós szabályok (Claude Code)

## Kinek dolgozol és hogyan

- A megrendelő **Botond** (kezdő, ez az első weboldala) és az **apukája**. Velük **magyarul**,
  egyszerűen kommunikálj; ha szakszót használsz, egy mondatban magyarázd el.
- **Önállóan dolgozz.** Nem egyértelmű kérdésben dönts a legjobb tudásod szerint, és írd be a
  `docs/DONTESEK.md` naplóba (dátum · kérdés · döntés · 1–2 mondatos indoklás).
- A teljes feladatleírás: `docs/SPECIFIKACIO.md` (jelszó nélküli másolat). A döntésnapló pontosítja.
- Mérföldkövek / nagyobb lépések végén rövid (3–6 soros) magyar összefoglaló: mi készült el, hol nézhető meg.
- **Proaktivitás (a felhasználó kifejezetten megköszönte):** ha munka közben hibát vagy hiányosságot
  találsz, javítsd ki, és az összefoglalóban röviden jelezd. Az eredményt ellenőrizd is (tesztek,
  képernyőképek több képernyőméretben), mielőtt késznek mondod.

## Git és GitHub szinkron – kérdezés nélkül, folyamatosan

- A felhasználó kérése: minden kisebb, **működő** lépés után `git add` → `git commit` → `git push`
  (ág: `main`, remote: `origin` = https://github.com/tothboto/Botondember-web). Ne kérdezz rá.
- Commit előtt: `npm run lint` és `npm run typecheck` hibátlan. Mérföldkő végén `npm run test`
  és `npm run build` is. Törött állapotot ne pusholj.
- Commit üzenetek magyarul: `feat: …`, `fix: …`, `docs: …`, `chore: …`, `test: …`, `style: …`.
- **Soha** ne használj force pusht, és ne írd át a történetet.
- A repó **nyilvános**. A commit-szerző a GitHub noreply címe (repó-szintű `git config`) –
  ne cseréld valódi e-mail-címre.

## Titkok és adatvédelem

- A `.env*` fájlok (kivéve `.env.example`), a `data/` mappa és a `botondember-weboldal-spec.md`
  soha nem kerülhet a repóba. Commit előtt nézd meg a `git status`-t.
- Jelszót, titkos kulcsot soha ne írj commitolt fájlba (README, docs, tesztek sem) – **példának
  sem**. Tesztekben mindig kitalált, nyilvánvalóan hamis értéket használj (pl. `Pelda-Jelszo-2026`).
- Commit előtt a `.githooks/pre-commit` horog lefuttatja a `scripts/check-secrets.mjs`-t: ha a
  `.env.local` bármelyik titkos értéke a commitba kerülne, leállítja. (Bekapcsolás: `npm install`
  magától megcsinálja, vagy `git config core.hooksPath .githooks`.) A horgot soha ne kerüld meg.
- Gyerek weboldala: a tartalomban csak a „Botondember” név szerepelhet – teljes név, iskola,
  lakóhely nem. Feltöltött képekről a sharp eltávolítja az EXIF adatokat (pl. GPS).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack). Ez újabb, mint amit fejből ismersz:
  **a telepített verzió dokumentációját kövesd**: `node_modules/next/dist/docs/`.
  - Nincs `cacheComponents`; adat-cache: `unstable_cache` + `content` tag, mentés után
    `invalidateContent()` (lásd `src/lib/cache.ts`).
- **Tailwind CSS 4** (CSS-first konfiguráció a `src/app/globals.css`-ben), design tokenek CSS változókkal.
- **SQLite** (`data/site.db`) **libSQL** klienssel + **Drizzle ORM**. Séma: `src/db/schema.ts`,
  migrációk: `drizzle/` (séma módosítása után `npm run db:generate`).
- Belépés: `bcryptjs` + `jose` (aláírt token httpOnly sütiben). Validáció: `zod`. Képek: `sharp`.
  Ikonok: `lucide-react`. Zászlók: `flag-icons` (SVG, a `public/flags`-be másolódik telepítéskor).
- Tesztek: Vitest (`tests/unit`), Playwright (`tests/e2e`, a gépen lévő Edge böngészővel).

## Konvenciók

- **Minden tartalom és beállítás az adatbázisból jön**, és az Adminból szerkeszthető.
  Tartalmat ne égess a kódba.
- Felületi („keretrendszer”) szövegek: `translations` tábla (kulcs × nyelv). Új kulcsot a
  seed-listába (`src/lib/i18n/messages.ts`) is vegyél fel mind a hat nyelven (hu, en, es, de, is, hr).
  Hiányzó fordításnál a magyar szöveg jelenik meg.
- A beírt tartalom (Botond saját szövegei) **fordítható**: a magyar marad az eredeti helyén, a
  fordítások a `content_translations` táblába kerülnek (kulcs: `entitás:azonosító:mező`). Minden
  fordítható mező a jegyzékben van: `src/lib/content-i18n/registry.ts` – **új szabad szöveges mezőt
  ide is vegyél fel**, és a nyilvános oldalon a `getLocalizer()`-rel jelenítsd meg (a `lang`
  attribútum a fordítás nyelve, fordítás hiányában `"hu"`). Elem törlésekor a fordításait is töröld
  (`deleteContentForEntity`).
- A saját szövegek gépi fordítását ingyenesen a Claude Code készíti: `/forditas` parancs
  (`.claude/skills/forditas/SKILL.md`, `npm run translate:export` → fordítás → `npm run translate:import`).
  A kézzel írt / jóváhagyott fordítást (`origin = manual`) gép soha nem írja felül.
- Minden admin műveletet **a szerveren** ellenőrizz (`requireAdmin()`), minden bemenetet `zod`-dal
  validálj. Mentés után hívd meg az `invalidateContent()`-et.
- Feltöltött fájl a tároló-rétegen át a `data/uploads`-ba kerül; a `/media/...` route szolgálja ki.
  **SVG feltöltés tilos.**
- Scriptek platformfüggetlenek legyenek (Node / tsx), Windows-on is működjenek.
- Nincs hover-animáció (csak fókuszkeret, szín- és aláhúzás-változás). A `prefers-reduced-motion`
  beállítást tartsd tiszteletben.
- Mindkét témában (világos/sötét) WCAG AA kontraszt; arany szöveg fehér háttéren tilos.

## ⚠️ Süti-hozzájárulási banner

Jelenleg csak feltétlenül szükséges sütik és tárolók vannak (`locale`, `admin_session`, `theme`),
ezért **nem kell** süti-banner. Ha analitika, beágyazott YouTube-lejátszó, külső betűtípus vagy más
harmadik féltől származó tartalom kerül az oldalra, **akkor már kell**, és a Cookie tájékoztatót is
frissíteni kell.

## Hasznos parancsok

- `npm run setup` – `.env.local` létrehozása, adatbázis-migráció, kezdő adatok (seed)
- `npm run dev` – fejlesztői szerver: http://localhost:3000
- `npm run dev:sandbox` – ugyanez külön próba-adatbázissal (`data/sandbox`) – Admin-kísérletekhez és
  képernyőképekhez ezt használd, ne Botond valódi adatait (`scripts/admin-shots.ts` ide lép be)
- `npm run admin:reset` – elfelejtett admin jelszó visszaállítása a `.env.local` alapján
- `npm run lint` · `npm run typecheck` · `npm run test` · `npm run test:e2e` · `npm run build`
- Windows PowerShellben, ha a `npm` parancs le van tiltva: `npm.cmd …`
