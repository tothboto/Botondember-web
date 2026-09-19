# Döntésnapló

Itt gyűjtöm azokat a kérdéseket, amelyekre a specifikáció nem adott egyértelmű választ, és a
döntést, amit hoztam. Formátum: **dátum · kérdés · döntés · indoklás**.
Bármelyik döntés később megváltoztatható – szólj, és átírom!

## Nyitott kérdések a specifikációból (17. pont)

| # | Dátum | Kérdés | Döntés | Indoklás |
|---|---|---|---|---|
| 1 | 2026-09-19 | Kezdőlap referencia: a kérdőív 10. válaszában a link („WEB”) hiányzik. | **Nyitott.** Addig a Rainbow Six Siege weboldal irányát követem: sötét, filmszerű, egy nagy kép, kevés, de ütős szöveg. | Ha megvan a hiányzó link, a kezdőlapot hozzáigazítom. |
| 2 | 2026-09-19 | „Maradjon angolul”: milyen nyelven jelenjen meg a beírt tartalom? | **Lezárva:** Botond pontosított, elírás volt, helyesen „maradjon magyarul”. A beírt tartalom minden nyelven úgy jelenik meg, ahogy beírták (fordítás nélkül), `lang="hu"` jelöléssel. | Botond pontosítása a specifikációban. |
| 3 | 2026-09-19 | Nyelvek listája | **Lezárva:** magyar (alap), angol, spanyol, német, izlandi. | Botond pontosítása a specifikációban. |
| 4 | 2026-09-19 | Menüpontok elhelyezése („az oldal jobb oldalán”) | A fejléc jobb oldalán, nagybetűvel, ikonnal. Mobilon és tableten (1280 px szélesség alatt) hamburger ikon, jobbról beúszó panellel. | 4 menüpont ikonnal + a díszes felirat 1024 px-en már nem fér el szépen egy sorban, ezért a teljes menü 1280 px-től jelenik meg. |
| 5 | 2026-09-19 | Adatkezelő neve és e-mail címe a jogi oldalakhoz | Helykitöltő, az Admin > Jogi oldalak menüben kitölthető. Javaslat: mivel kiskorú oldaláról van szó, az adatkezelő a szülő legyen. | Személyes adatot nem találhatok ki. |
| 6 | 2026-09-19 | Tárhely és domain | Később (élesítés a következő kör). A tájékoztatókban a tárhelyszolgáltató helykitöltő. | A specifikáció szerint most nem kell élesíteni. |
| 7 | 2026-09-19 | A hobbik, játékok, videók konkrét tartalma | Botond tölti fel az Adminban; addig „Példa – cseréld le az Adminban” jelölésű mintatartalom. | A specifikáció szerint. |

## Fejlesztés közbeni döntések

| Dátum | Kérdés | Döntés | Indoklás |
|---|---|---|---|
| 2026-09-19 | Hol legyen a projekt? | `C:\Users\User1\Botondember-elso-weboldala` (a felhasználó kérése szerinti név). Az npm csomagnév `botondember-web`. | Az npm csomagnév nem tartalmazhat nagybetűt; a mappanév ettől még maradhat. A OneDrive-os mappákat szándékosan kerültem (a `node_modules` több tízezer fájlját nem jó szinkronizálni). |
| 2026-09-19 | Hiányzott a Node.js és a Git | A felhasználó kérésére és engedélyével telepítettem a winget-tel: Node.js 24 LTS és Git for Windows (Git Credential Managerrel). | A specifikáció Node LTS-t és Gitet kér. |
| 2026-09-19 | Milyen névvel és e-mail-címmel készüljenek a commitok? | Név: `tothboto`, e-mail: a GitHub saját „noreply” címe. Csak ebben a repóban van beállítva. | A repó nyilvános: így a valódi e-mail-cím nem kerül nyilvánosságra, a commitok mégis a GitHub-fiókhoz kötődnek. |
| 2026-09-19 | Világos/sötét téma megvalósítása | A `next-themes` csomag helyett saját, pár soros megoldás, a Next.js 16 dokumentációjában javasolt beágyazott szkripttel. A viselkedés ugyanaz: Rendszer / Világos / Sötét, villanás nélkül, a választás a böngésző `localStorage`-ében (`theme` kulcs). | A `next-themes` React 19 alatt fejlesztői hibaüzenetet ír ki (szkript egy kliens komponensben), ami egy kezdőt megzavarna. Eggyel kevesebb függőség. |
| 2026-09-19 | Többnyelvűség: `next-intl` vagy saját megoldás? | Saját, egyszerű megoldás: a szövegek az adatbázisból jönnek, a nyelv egy sütiben (`locale`) van, az URL nem változik. | A specifikáció mindkettőt megengedi. Nincs szükség bonyolult üzenet-formázásra; így kevesebb a függőség, és minden szöveg az Adminból szerkeszthető. |
| 2026-09-19 | Gyorsítótár (cache) | A „klasszikus” modellt használom (`unstable_cache` + `content` címke), nem az új Cache Components-t. Admin mentés után: `revalidateTag('content', { expire: 0 })` + `revalidatePath('/', 'layout')`. Biztonsági hálóként 60 másodperces időalapú frissítés. | A nyelv sütiből jön, így minden oldal kérésenként renderelődik; a Cache Components ehhez nagy átszervezést igényelne. Az adatok így is gyorsítótárban vannak, és mentés után azonnal frissülnek. |
| 2026-09-19 | Playwright böngésző | A tesztek a Windowsba beépített Microsoft Edge-et használják (máshol a Playwright saját Chromiumát). | Nem kell külön ~150 MB-os böngészőt letölteni. |
| 2026-09-19 | PowerShell letiltja az `npm` parancsot | A README-ben leírom: PowerShellben `npm.cmd …` használható, vagy a Parancssor (cmd). | Windows alapbeállítás szerint a PowerShell nem futtat szkripteket (`npm.ps1`); ezt a gépen nem állítom át, mert az biztonsági beállítás. |
| 2026-09-19 | Adatmodell: a kezdőlap és a jogi oldalak a `pages` táblában? | A `pages` tábla csak a menüben szereplő aloldalakat tartalmazza (hobbies, games, youtube, football, generic). A kezdőlap adatai a `settings.home`, a jogi szövegek a `legal_docs` táblában vannak. Új oszlopok: `pages.key` (a fordítási kulcsokhoz), `pages.body_md` (az „Általános” sablonhoz), `is_example` (a példák jelölése), `youtube_items.item_count`, `football_sections.link`, valamint egy `audit_log` tábla az Irányítópult „utolsó módosítások” listájához. | A specifikáció maga is „javaslatként” adta meg a modellt; így egyszerűbb és átláthatóbb. |
| 2026-09-19 | Kereső elől rejtés (`noindex`) | Bekapcsolva (alapértelmezés): `<meta name="robots" content="noindex, nofollow">` **és** `robots.txt`-ben `Disallow: /`. Kikapcsolva: indexelhető, csak az `/admin` tiltott. | Egy gyerek oldalánál a biztosabb megoldás a kettő együtt. |
| 2026-09-19 | Fejléc a kezdőlapon | Átlátszó, a hero képre simul (felül enyhe sötét színátmenettel, hogy olvasható legyen). Ha a „rögzített fejléc” be van kapcsolva, a kezdőlapon görgetés után sötétkék hátteret kap. | Így a kezdőlap filmszerű marad, a többi oldalon pedig a fejléc az oldal stílusához illő hátteret kap. |
| 2026-09-19 | Lábléc stílusa | Minden oldalon egységes: sötétkék, arany felső csíkkal (sötét módban még sötétebb). | A fejléc és a tartalom oldalanként változik; az egységes lábléc „keretet” ad. |
| 2026-09-19 | Ha a zászlók ki vannak kapcsolva | Az oldal az **alapnyelven** jelenik meg (ez alapból a magyar; a Fordítások menüben módosítható), a süti figyelmen kívül marad. | A specifikáció szerint ilyenkor magyarul jelenik meg az oldal. |
| 2026-09-19 | Zászlók forrása | A `flag-icons` csomag SVG-it a telepítés (`postinstall`) átmásolja a `public/flags` mappába (nincs a Gitben). Így bármelyik ország zászlója választható egy új nyelvhez, és a zászlók a saját tárhelyről töltődnek. | Nem kell a teljes zászló-CSS-t (kb. 270 zászló) minden oldalon betölteni. |
| 2026-09-19 | `/favicon.ico` | Egy átirányítás (`rewrite`) mindig az éppen aktív ikonkészletre mutat (`/icons/current/favicon.ico`); a többi ikon URL-jében benne van a verzió, így új favicon feltöltése után a böngészők biztosan frissítenek. | A Next.js a `favicon.ico` nevet különlegesen kezeli, ezért erre nem lehet saját útvonalat írni. |
| 2026-09-19 | Betűk ellenőrzése | `npm run fonts:check`: a ténylegesen letöltött betűfájlokban ellenőrzi az ő, ű, Ő, Ű (és a többi ékezetes betű) meglétét. Eredmény: mind a 8 betűtípus rendben. | A specifikáció kifejezetten kérte az ellenőrzést. |
| 2026-09-19 | Az Admin kipróbálása a valódi adatok nélkül | `npm run dev:sandbox`: külön „homokozó” adatbázis (`data/sandbox`) generált teszt-belépési adatokkal. Az Admin képernyőképei és a kézi próbák ezen készülnek, a valódi adatbázishoz és jelszóhoz nem nyúlok. | Így a fejlesztés közben semmi sem íródik felül Botond saját tartalmában. |
| 2026-09-19 | Kiemelt játék | Egyszerre csak egy játék lehet „kiemelt” (a Játékaim oldal tetején nagyban): ha egy másikat kiemelsz, az előző kiemelése megszűnik. | A „kiemelt” kártya egyetlen nagy helyet foglal el az oldal tetején. |
| 2026-09-19 | Mentés gomb és visszajelzés az Adminban | Minden űrlapnak saját „Mentés” gombja van; mentés után „Mentve!” üzenet jelenik meg, hibánál magyar hibaüzenet (a hibás mező alatt is). Ha mentetlen változás van, az oldal elhagyása előtt rákérdez. A menüpontok sorrendje, láthatósága és a törlés azonnal érvényes (külön mentés nélkül). | Egyszerű, kiszámítható működés egy kezdőnek. |
| 2026-09-19 | Új aloldal | Az Adminban létrehozott aloldal az „Általános” sablont kapja (cím, bevezető, kép, szöveg, kártyák). Az URL-cím a címből készül automatikusan (ékezet nélkül, pl. `kedvenc-filmjeim`), de átírható. Csak az így létrehozott oldalak törölhetők; a négy alap aloldal csak elrejthető. | A specifikáció szerint. Az alap aloldalak saját, egyedi sablont kaptak, ezek törlése nem lenne visszafordítható. |
| 2026-09-19 | Színek megváltoztatása | A Megjelenés oldalon a márkaszínek mellett élő előnézet és kontraszt-ellenőrzés (WCAG AA) látszik; ha egy szín rontaná az olvashatóságot, piros „Gyenge” jelzést kap. Mentést nem tiltok le, csak figyelmeztetek. | Botond szabadon kísérletezhet, de látja, ha valami nehezen olvasható lesz. |
| 2026-09-19 | Új nyelv felvétele | Az új nyelv **kikapcsolva** jön létre: a szövegei addig a magyar változattal jelennek meg (sárgán kiemelve a Fordítások táblázatban). Ha kész a fordítás, egy kattintással bekapcsolható. A magyar nem törölhető (ez minden szöveg alapja), az alapnyelv nem kapcsolható ki. | Így a látogatók nem látnak félkész fordítást. |
| 2026-09-19 | `{helyőrzők}` a fordításokban | Ha egy fordításból kimarad egy `{count}`-hoz hasonló jel, a mentés nem engedi (és a mező alatt piros figyelmeztetés jelenik meg). | Különben pl. „videos” jelenne meg a „12 videos” helyett. |
| 2026-09-19 | Mentés és visszaállítás | Egyetlen ZIP: `mentes.json` (az adatbázis tartalma) + `fajlok/` (képek, favicon) + `OLVASS-EL.txt`. A belépési adatok (admin fiók, jelszó-hash, belépési kísérletek) **nincsenek benne**, és visszaállításkor sem változnak. Visszaállítás előtt az oldal automatikusan elmenti a mostani állapotot (`data/backups`, a legutóbbi 5 marad), minden adatot és fájlt ellenőriz (típus, útvonal, méret), az adatbázist egyetlen tranzakcióban cseréli, végül törli a már nem használt képeket. | Egyszerű, egy fájlos mentés, amit egy kezdő is biztonságosan használhat; egy rossz fájl visszatöltése is visszavonható. |
| 2026-09-19 | Jelszócsere | Csak a régi jelszó megadásával lehet. Utána a többi eszközön (más böngészőben) újra be kell lépni; az aktuális böngésző belépve marad. A régi jelszó hibás megadása ugyanúgy számít, mint egy hibás belépés (5 próbálkozás / 15 perc). | Ha valaki egy nyitva hagyott gépen hozzáfér az Adminhoz, se ne tudja kitalálni, se ne tudja csendben megváltoztatni a jelszót. |
| 2026-09-19 | Képek törlése a médiatárból | A használatban lévő képnél a törlés előtt megmutatom, hol szerepel; ha mégis törli, ezekről a helyekről a kép eltűnik (a tartalom megmarad). | A specifikáció kérése: figyelmeztetés, ha a kép használatban van. |

## Biztonsági esemény

| Dátum | Mi történt | Mit tettem | Mi a teendő |
|---|---|---|---|
| 2026-09-19 | A 6. mérföldkő commitjában (`79f7b54`) egy egységteszt **példaként a valódi kezdő admin-jelszót** használta, és ez felkerült a nyilvános GitHub-repóba. (Az én hibám.) | A jelszót eltávolítottam a tesztből. Beépítettem egy automatikus ellenőrzést (`.githooks/pre-commit` + `scripts/check-secrets.mjs`): ha a `.env.local` bármelyik titkos értéke egy commitba kerülne, a commit leáll. | A kezdő jelszót nyilvánosnak kell tekinteni: **élesítés előtt mindenképp cseréld le** (Admin > Fiók), és ha máshol is használod ezt a jelszót, ott is változtasd meg. A régi commit a Git-előzményekben megmarad; az előzmények átírása csak Botond kifejezett kérésére történhet (lásd a szabályt: nincs force push). |

## Figyelmeztetések a jövőre

- ⚠️ **Süti-hozzájárulási banner:** most csak feltétlenül szükséges sütik és tárolók vannak, ezért
  nem kell banner. Ha később analitika, beágyazott YouTube-lejátszó (akár `youtube-nocookie.com`),
  külső betűtípus vagy más harmadik féltől származó tartalom kerül az oldalra, **akkor már kell**,
  és a Cookie tájékoztatót is frissíteni kell.
- ⚠️ **Belépési próbálkozások korlátozása élesítéskor:** a rendszer az IP-cím alapján korlátoz
  (5 hibás próbálkozás / 15 perc). Az IP-címet az `x-forwarded-for` fejlécből veszi, amit csak egy
  megbízható proxy (pl. a tárhely saját terheléselosztója) mögött szabad elhinni. Élesítéskor ezt a
  tárhelyhez kell igazítani.
