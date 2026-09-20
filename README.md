# Botondember-web

Első teszt-weboldalam a kedvenc zenéimmel, YouTube csatornáimmal és videóimmal. Később bővülni fog a tartalom!

---

**Botondember első weboldala** – személyes bemutatkozó oldal: kezdőlap egy nagy képpel (rajta a
**„Hol vagy? Mi ez?”** gombbal, ami elmondja a látogatónak, mi található az oldalon), **Hobbijaim**,
**Játékaim**, **YouTube-kedvenceim** és **Real Madrid** aloldal, öt nyelven (magyar, angol, spanyol,
német, izlandi), világos és sötét témával. Az oldal **minden szövege, képe és beállítása egy saját
Admin felületen szerkeszthető** – programozás nélkül.

> Ez a leírás kezdőknek készült. Ha egy lépés nem működik, nézd meg a
> [Gyakori hibák](#gyakori-hibák-és-megoldásuk) részt!

## Tartalom

1. [Amire szükséged lesz](#1-amire-szükséged-lesz)
2. [Első indítás lépésről lépésre](#2-első-indítás-lépésről-lépésre)
3. [Belépés az Adminba](#3-belépés-az-adminba-itt-a-főnök)
4. [Mit tudsz az Adminban szerkeszteni?](#4-mit-tudsz-az-adminban-szerkeszteni)
5. [Mentés és visszaállítás](#5-mentés-és-visszaállítás)
6. [Hol vannak az adataim?](#6-hol-vannak-az-adataim)
7. [Hasznos parancsok](#7-hasznos-parancsok)
8. [Gyakori hibák és megoldásuk](#gyakori-hibák-és-megoldásuk)
9. [Biztonság és adatvédelem](#8-biztonság-és-adatvédelem)
10. [Élesítés (később)](#9-élesítés-később)
11. [A projekt felépítése](#10-a-projekt-felépítése-programozóknak)

---

## 1. Amire szükséged lesz

| Program | Mire kell? | Honnan? |
|---|---|---|
| **Node.js** (LTS változat, legalább 20.9) | Ez futtatja az oldalt a gépeden. | <https://nodejs.org> – a zöld „LTS” gomb |
| **Git** | A kód letöltéséhez és a GitHub-szinkronhoz. | <https://git-scm.com> |
| **Visual Studio Code** (nem kötelező) | Kényelmes szerkesztő a fájlokhoz. | <https://code.visualstudio.com> |
| **Microsoft Edge** vagy Chrome | Az oldal megnézéséhez és a böngészős tesztekhez. | Windowson alapból megvan |

Telepítés után nyiss egy **új** parancssort (Windowson: Start → „PowerShell” vagy „Parancssor”),
és ellenőrizd:

```bash
node --version
```

```bash
git --version
```

Mindkettő egy verziószámot ír ki (pl. `v24.19.0`). Ha „nem ismert parancs” hibát kapsz, indítsd újra
a gépet, vagy telepítsd újra a programot.

> 💡 **Windows PowerShell:** ha az `npm` parancsra piros hibát kapsz („running scripts is disabled”),
> írd helyette azt, hogy **`npm.cmd`** (pl. `npm.cmd run dev`), vagy használd a „Parancssor” (cmd) ablakot.
> Részletek: [Gyakori hibák](#gyakori-hibák-és-megoldásuk).

## 2. Első indítás lépésről lépésre

**1. Töltsd le a kódot** (egy tetszőleges mappában, pl. a saját mappádban):

```bash
git clone https://github.com/tothboto/Botondember-web.git Botondember-elso-weboldala
```

```bash
cd Botondember-elso-weboldala
```

**2. Telepítsd a szükséges csomagokat** (első alkalommal pár perc):

```bash
npm install
```

**3. Állítsd be a belépési adatokat.** Az első beállítás létrehozza a `.env.local` fájlt (ebben vannak
a titkos beállítások – ez a fájl **soha nem kerül fel a GitHubra**):

```bash
npm run setup
```

- Ha a `.env.local` fájlban nincs admin jelszó, a setup **generál egy erős jelszót, és egyszer kiírja** –
  írd fel!
- Ha saját jelszót szeretnél: a setup előtt másold le a `.env.example` fájlt `.env.local` néven, és töltsd
  ki: `ADMIN_USERNAME="Botond"`, `ADMIN_PASSWORD="a-te-jelszavad"` (idézőjelek között).

**4. Indítsd el az oldalt:**

```bash
npm run dev
```

Nyisd meg a böngészőben: **<http://localhost:3000>** 🎉

Az oldal addig fut, amíg a parancssor-ablak nyitva van. Leállítás: kattints az ablakba, és nyomd meg a
**Ctrl + C** billentyűket. Legközelebb elég a `cd …` és az `npm run dev` parancs.

## 3. Belépés az Adminba („Itt a Főnök!”)

1. Az oldal fejlécében, jobb felül kattints az **„Itt a Főnök!”** gombra (mobilon és tableten a ☰ menüben
   találod).
2. Add meg a felhasználónevet és a jelszót → **Belépés**.
3. Máris az **Adminban** vagy. Az oldalra a „Weboldal megnyitása” gombbal térhetsz vissza.

> 🔐 **Első belépés után azonnal:**
> 1. Az **Admin → Fiók** oldalon változtasd meg a jelszót egy újra, amit csak te ismersz.
> 2. Töröld a régi jelszót a `.env.local` fájlból (az `ADMIN_PASSWORD=` sor végéről) – az oldalnak
>    már nincs rá szüksége, a jelszó titkosítva (hash-ként) van az adatbázisban.

Öt hibás próbálkozás után a belépés 15 percre letiltódik (így nem lehet kitalálgatni a jelszót).

**Elfelejtetted a jelszót?** Írd be az új jelszót a `.env.local` fájlba (`ADMIN_PASSWORD="uj-jelszo"`),
majd futtasd:

```bash
npm run admin:reset
```

Ez beállítja az új jelszót, és feloldja az esetleges tiltást. Belépés után töröld a jelszót a fájlból!

## 4. Mit tudsz az Adminban szerkeszteni?

| Menüpont | Mit csinálhatsz ott? |
|---|---|
| **Irányítópult** | Gyors linkek, az utolsó módosítások listája. |
| **Általános** | Az oldal neve, a fejléc felirata, alap téma (világos/sötét/automatikus), ragadós fejléc, elrejtés a keresők elől, lábléc szövege és linkjei, **favicon** (a böngészőfül ikonja) feltöltése. |
| **Megjelenés** | A márkaszínek (élő előnézettel és olvashatóság-ellenőrzéssel), a betűtípusok, az aloldalak kiemelő színe. |
| **Kezdőlap** | A nagy kép (fókuszponttal és sötétítéssel), az **előtérben álló alak** (pl. rajz rólad – hely és méret állítható, a szöveg mögötte fut), a fő üzenet, az alcím, a mottó – élő előnézettel –, valamint a **„Hol vagy? Mi ez?” gomb** mögötti útbaigazító leírás. |
| **Menü és aloldalak** | Menüpontok sorrendje, elrejtése, ikonja, URL-címe, neve nyelvenként; **új aloldal** létrehozása és törlése. |
| **Hobbijaim / Játékaim / YouTube / Real Madrid** | Az aloldalak tartalma: kártyák hozzáadása, szerkesztése, sorrendje, elrejtése, törlése. YouTube-nál elég beilleszteni a linket – a címet és a képet az oldal magától kitölti. |
| **Jogi oldalak** | Az Adatkezelési és a Cookie tájékoztató szövege (Markdown-szerkesztő előnézettel) és az adatkezelő adatai. |
| **Fordítások** | A felület szövegei öt nyelven (táblázat, keresés, a hiányzók kiemelve), nyelvek be/ki, új nyelv, zászlók ki/be. |
| **Médiatár** | Az összes kép: feltöltés, alt szöveg, törlés (figyelmeztet, ha a kép használatban van). |
| **Mentés és visszaállítás** | Az egész oldal letöltése egy fájlba, és visszatöltése. |
| **Fiók** | Jelszó és felhasználónév módosítása, kilépés (minden eszközön is). |

**Hasznos tudnivalók**

- Minden mentés után megjelenik a **„Mentve!”** felirat, és a változás azonnal látszik az oldalon
  (az „Oldal megtekintése” gombbal új lapon nyílik meg).
- Ha mentés nélkül akarnál elmenni egy oldalról, az Admin figyelmeztet.
- **Képek:** PNG, JPG, WEBP vagy GIF, legfeljebb 10 MB. Az oldal automatikusan kicsinyíti és WEBP-be
  alakítja őket, és **eltávolítja a rejtett adatokat** (pl. a fotó GPS-helyét). SVG-t biztonsági okból
  nem lehet feltölteni.
- **Alt szöveg:** minden képnél írd le röviden, mi látható rajta – a vakok és gyengénlátók
  képernyőolvasója ezt olvassa fel.
- A „Példa – cseréld le az Adminban” feliratú tartalmak mintaként szerepelnek: szerkesztés után a
  felirat magától eltűnik.
- A saját szövegeid minden nyelven magyarul jelennek meg; csak a felület (menü, gombok) fordítódik.
- A **Markdown** egy egyszerű formázás: `**félkövér**`, `_dőlt_`, `## Címsor`, `- felsorolás`,
  `[link szövege](https://…)`. A szerkesztő gombjai ezt be is írják helyetted.

## 5. Mentés és visszaállítás

- **Mentés:** Admin → Mentés és visszaállítás → **Mentés letöltése (.zip)**. A fájlban benne van minden
  szöveg, beállítás, fordítás és kép. A belépési adatok (felhasználónév, jelszó) **nincsenek** benne.
  Tartsd biztonságos helyen (pl. pendrive, felhő).
- **Visszaállítás:** ugyanott → **Mentésfájl kiválasztása…** A visszaállítás az oldal teljes jelenlegi
  tartalmát lecseréli, de előtte **automatikusan elmenti a mostani állapotot** (a `data/backups`
  mappába, a legutóbbi 5 marad meg) – így egy rossz fájl visszatöltése is visszavonható.
- Tipp: nagyobb változtatás előtt mindig tölts le egy mentést!

## 6. Hol vannak az adataim?

Minden adat a projekt **`data`** mappájában van a gépeden:

| Mappa / fájl | Mi van benne? |
|---|---|
| `data/site.db` | Az adatbázis (szövegek, beállítások, fordítások, a titkosított jelszó). |
| `data/uploads/` | A feltöltött képek és a favicon. |
| `data/backups/` | Az automatikus biztonsági mentések. |

A `data` mappa és a `.env.local` fájl **szándékosan nem kerül fel a GitHubra** (a `.gitignore` ezt
megakadályozza). Ha másik gépre költözöl: a kódot a GitHubról töltsd le, a tartalmat pedig az Admin
mentésével vidd át (vagy másold át a `data` mappát).

## 7. Hasznos parancsok

| Parancs | Mit csinál? |
|---|---|
| `npm run dev` | Elindítja az oldalt fejlesztői módban: <http://localhost:3000> |
| `npm run setup` | Első beállítás (`.env.local`, adatbázis, kezdő adatok). Többször is futtatható, nem ír felül semmit. |
| `npm run dev:sandbox` | **Homokozó:** az oldal egy külön, próba-adatbázissal és próba-adminnal (`data/sandbox`) – nyugodtan kísérletezhetsz, a valódi tartalom nem változik. A belépési adatok: `data/sandbox/credentials.json`. |
| `npm run admin:reset` | Elfelejtett jelszó visszaállítása (lásd a 3. pontot). |
| `npm run build` és `npm run start` | Az éles (gyors) változat elkészítése és indítása. |
| `npm run lint` · `npm run typecheck` | A kód ellenőrzése (stílus és típusok). |
| `npm run test` | Egységtesztek (pl. YouTube-link felismerés, fordítások, jogosultság, mentés). |
| `npm run test:e2e` | Böngészős tesztek egy külön tesztadatbázison (Edge böngészővel): menü, nyelvváltás, téma, belépés, Admin szerkesztők, mentés, akadálymentesség. |
| `npm run screenshots` | Képernyőképek az oldalakról több méretben, világos és sötét módban (`test-results/screenshots`). |
| `npm run image:cutout -- rajz.jpg` | Egyszínű (pl. fehér) hátterű rajzról levágja a hátteret → átlátszó hátterű PNG. Ha marad egy körülzárt folt (pl. a lábak között), jelöld meg: `--seed=1008,896`. |
| `npm run image:import -- kep.png --alt="leírás" --as=figure` | Betesz egy képet a médiatárba, és rögtön beállítja (`--as=figure`: előtérben álló alak, `--as=hero`: kezdőlapi nagy kép). |
| `npm run fonts:check` | Ellenőrzi, hogy minden betűtípus ismeri-e az ő, ű betűket. |
| `npm run db:stats` | Kiírja, mennyi adat van az adatbázisban. |
| `npm run check:secrets` | Ellenőrzi, hogy titkos adat (pl. jelszó) ne kerüljön a Gitbe. Commit előtt magától is lefut. |

## Gyakori hibák és megoldásuk

**„npm : … npm.ps1 cannot be loaded because running scripts is disabled on this system”**
A Windows PowerShell alapból nem futtat szkripteket. Megoldás: írd azt, hogy `npm.cmd` (pl.
`npm.cmd run dev`), vagy használd a „Parancssor” (cmd) ablakot. (A beállítást biztonsági okból nem
érdemes átírni.)

**„Port 3000 is in use”, vagy azt írja, hogy már fut egy másik `next dev`**
Már fut egy példány (lehet, hogy egy másik ablakban). Zárd be azt (Ctrl + C). Ha a 3000-es portot egy
másik program foglalja, indíts másik porton: `npm run dev -- --port 3001`, és nyisd meg a
<http://localhost:3001> címet.

**„Hibás felhasználónév vagy jelszó.”**
Figyelj a kis- és nagybetűkre! Öt hibás próbálkozás után 15 percig vár a rendszer. Ha elfelejtetted a
jelszót: `npm run admin:reset` (lásd a 3. pontot).

**Az oldal üres, vagy „no such table” hibát ír**
Futtasd le a beállítást: `npm run setup`, majd újra `npm run dev`.

**Nem jelennek meg a képek**
Ellenőrizd, hogy megvan-e a `data/uploads` mappa. A kezdő (minta)képeket a `npm run setup` újra
létrehozza.

**Hiba az `npm install` közben (pl. „sharp”)**
Ellenőrizd a Node.js verzióját (`node --version`, legalább 20.9 kell), majd töröld a `node_modules`
mappát, és futtasd újra az `npm install` parancsot.

**A böngészős tesztek (`npm run test:e2e`) nem indulnak**
A tesztek a gépen lévő Microsoft Edge-et használják. Ha nincs Edge (pl. Linuxon vagy Macen), futtasd:
`npx playwright install chromium`.

**A commit leáll „titkos érték került a fájlba” üzenettel**
Ez szándékos védelem: az egyik fájlban szerepel a `.env.local` egyik titkos értéke (pl. a jelszó).
Töröld ki onnan, és próbáld újra.

## 8. Biztonság és adatvédelem

- A GitHub-repó **nyilvános**: soha ne tölts fel jelszót, `.env.local` fájlt vagy a `data` mappát.
  A commit előtti ellenőrzés (`.githooks/pre-commit`) figyelmeztet, ha mégis bekerülne egy titkos érték.
- Az oldal alapból **rejtve van a keresők elől** (Admin → Általános → „Elrejtés a keresők elől”).
  Csak akkor kapcsold ki, ha már nyilvános lehet az oldal.
- Az oldal csak **feltétlenül szükséges** sütit és tárolót használ (a választott nyelv, a téma, és
  belépéskor az admin süti), ezért nem kell süti-hozzájárulási ablak. **Ha később statisztikát,
  beágyazott videót vagy külső betűtípust tennél az oldalra, akkor már kell** – és a Cookie
  tájékoztatót is frissíteni kell.
- A Jogi oldalak szövege **minta**, nem jogi tanácsadás – élesítés előtt érdemes átnézetni. Az adatkezelő
  (kiskorú üzemeltetőnél általában a szülő) adatait az Admin → Jogi oldalak menüben kell kitölteni.
- Az oldalon csak a „Botondember” név szerepel – teljes név, iskola, lakóhely ne kerüljön fel.
- Jogvédett képet (pl. klubcímer, logó) csak saját felelősségre tölts fel.

## 9. Élesítés (később)

Az oldal most a saját gépeden fut. Amikor nyilvánossá tennéd, ezekre lesz szükség:

1. **Tárhely**, ami Node.js alkalmazást futtat, és ahol a `data` mappa megmarad újraindítás után is
   (vagy: hosztolt libSQL adatbázis, pl. Turso – `DATABASE_URL`, `DATABASE_AUTH_TOKEN` –, és egy
   felhős fájltároló a képeknek).
2. `.env` beállítások a tárhelyen: `SESSION_SECRET` (új, véletlen érték), `SITE_URL` (pl.
   `https://botondember.hu`), és ha kell, `UPLOADS_DIR`, `BACKUPS_DIR`.
3. Erős, új admin jelszó (Admin → Fiók), a `.env` fájlokban ne maradjon sima jelszó.
4. Admin → Jogi oldalak: az adatkezelő és a tárhelyszolgáltató adatai.
5. Admin → Általános: a „rejtés a keresők elől” kikapcsolása, ha már indexelhető lehet az oldal.
6. Ha a tárhely proxy (terheléselosztó) mögött fut, a belépési korlátozás IP-címét hozzá kell igazítani
   (lásd a [döntésnaplót](docs/DONTESEK.md)).
7. Mérés a valódi címen: <https://pagespeed.web.dev>.

## 10. A projekt felépítése (programozóknak)

- **Next.js 16** (App Router, TypeScript), **Tailwind CSS 4**, **SQLite** (libSQL) + **Drizzle ORM**,
  `sharp` (képek), `bcryptjs` + `jose` (belépés), `zod` (ellenőrzés), `lucide-react` (ikonok),
  `flag-icons` (zászlók). Tesztek: **Vitest** és **Playwright** (+ axe-core akadálymentességi teszt).

```text
src/
  app/            oldalak és útvonalak (nyilvános oldalak, /admin, /api, /media)
    actions/      szerveroldali műveletek (Admin mentések, belépés)
  components/     felületi elemek (site = nyilvános oldal, admin = Admin, pages = aloldal-sablonok)
  db/             adatbázis-séma, kapcsolat, kezdő adatok (seed)
  lib/            logika: beállítások, fordítások, belépés, képek, mentés, YouTube, színek
drizzle/          adatbázis-migrációk
scripts/          segédprogramok (setup, homokozó, képernyőképek, titokellenőrzés…)
tests/unit/       egységtesztek (Vitest)
tests/e2e/        böngészős tesztek (Playwright)
docs/             a feladatleírás és a döntésnapló
```

- A teljes feladatleírás: [docs/SPECIFIKACIO.md](docs/SPECIFIKACIO.md)
- Minden fejlesztés közbeni döntés és indoklás: [docs/DONTESEK.md](docs/DONTESEK.md)
- A fejlesztési szabályok (Claude Code-nak): [CLAUDE.md](CLAUDE.md)
