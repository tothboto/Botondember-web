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

## Figyelmeztetések a jövőre

- ⚠️ **Süti-hozzájárulási banner:** most csak feltétlenül szükséges sütik és tárolók vannak, ezért
  nem kell banner. Ha később analitika, beágyazott YouTube-lejátszó (akár `youtube-nocookie.com`),
  külső betűtípus vagy más harmadik féltől származó tartalom kerül az oldalra, **akkor már kell**,
  és a Cookie tájékoztatót is frissíteni kell.
