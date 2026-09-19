> **Megjegyzés:** Ez a specifikáció jelszó nélküli másolata. Az admin kezdő jelszava a helyi `.env.local` fájlban van (ez nem kerül fel a GitHubra).

# Botondember első weboldala – indító specifikáció Claude Code-hoz

> **Botondnak és Apának, indítás előtt:**
> 1. Írd be a GitHub repód linkjét a lenti **0. pont** táblázatába.
> 2. Hozz létre egy üres mappát a gépeden (pl. `botondember-weboldal`), és nyisd meg a Claude alkalmazás **Code** részében.
> 3. Csatold ezt a fájlt, és írd be: *„Olvasd el ezt a specifikációt, és kezdd el a fejlesztést."*

---

**Claude Code, ez a feladatleírásod.** Olvasd végig az egészet, mielőtt bármihez hozzákezdesz, majd dolgozz a **15. pont (Fejlesztési sorrend)** szerint, mérföldkőről mérföldkőre.

## 0. Kitöltendő adatok

| Adat | Érték |
|---|---|
| GitHub repó URL | `https://github.com/tothboto/Botondember-web` ← **ide írd be a sajátodat** |
| Admin felhasználónév | `Botond` |
| Admin kezdő jelszó | `[a .env.local fájlban]` |

- Ha a repó URL még a sablonszöveg: nézd meg `git remote -v`-vel. Ha ott sincs, **egyetlen egyszer** kérdezd meg a felhasználót. Ez az egyetlen git-tel kapcsolatos kérdés, amit feltehetsz.
- ⚠️ Ez a fájl jelszót tartalmaz: **soha ne commitold változatlanul** (lásd 3. pont).

## 1. Kinek dolgozol és hogyan

- A megrendelő **Botond** (kezdő, ez az első weboldala) és az **Apukája**. Velük **magyarul**, egyszerűen, szakzsargon nélkül kommunikálj. Ha szakszót használsz, egy mondatban magyarázd el.
- **Önállóan dolgozz.** Ha valami nem egyértelmű, a legjobb tudásod szerint döntsd el, és írd be a `docs/DONTESEK.md` naplóba (dátum · kérdés · döntés · 1–2 mondatos indoklás). Csak akkor kérdezz, ha tényleg nem tudsz haladni.
- A kódot te írod és tartod karban. Botond a tartalmat egy beépített **Admin felületen** kezeli, ezért **szinte minden tartalom és beállítás az Adminból legyen módosítható**, semmi ne legyen a kódba „beégetve", ami tartalom.
- Minden mérföldkő végén írj egy rövid (3–6 soros) magyar összefoglalót: mi készült el, és hol nézhető meg (pl. `http://localhost:3000/jatekaim`). Ne várj jóváhagyásra, haladj tovább; a felhasználó bármikor közbeszólhat.
- A fejlesztés Botond gépén, lokálisan fut (valószínűleg **Windows**). Minden script legyen platformfüggetlen (Node-scriptek, ne csak bash-ben működő parancsok).
- Az első lépésben hozz létre a repó gyökerében egy `CLAUDE.md` fájlt a tartós szabályokkal (git szinkron, stack, konvenciók, hol van a specifikáció és a döntésnapló) – **jelszó nélkül**.

## 2. Git és GitHub szinkron – folyamatosan, kérdezés nélkül

A felhasználó kérése szó szerint: *„A fejlesztést szinkronizáld fel a GitHub repómba folyamatosan! Erre rá se kérdezz később, folyamatosan szinkronizálj!"*

- Minden kisebb, **működő** lépés után: `git add` → `git commit` → `git push`. Ne kérdezd meg, hogy pusholj-e.
- Törött állapotot ne pusholj: commit előtt legalább a típusellenőrzés és a lint fusson le hibátlanul; mérföldkövek végén a `npm run build` és a tesztek is.
- Commit üzenetek magyarul, rövid, beszédes formában, pl. `feat: YouTube aloldal kártyarácsa`, `fix: sötét mód kontraszt a láblécben`.
- Egy ág: `main`. **Soha** ne használj force pusht, és ne írd át a történetet.
- Indulás: ha a mappa még nem git repó → `git init`, `main` ág, remote hozzáadása. Ha a távoli repó nem üres (pl. van benne README), előbb `git pull --rebase origin main`.
- Állítsd be a projekt `.claude/settings.json` fájlját úgy, hogy a gyakori git parancsok (status, add, commit, push, pull, diff, log) és az `npm` scriptek engedélyezve legyenek, így a szinkron tényleg kérdés nélkül megy.
- Ha a push hitelesítési hiba miatt nem sikerül, egyszer, egyszerűen mondd el, mit kell tenni (pl. `gh auth login` vagy Git Credential Manager), aztán folytasd a munkát.

## 3. Titkok és biztonság

- A `.gitignore`-ba **már az első commit előtt** kerüljön be: `.env*` (kivéve `.env.example`), `/data/` (adatbázis és feltöltött képek), `node_modules`, build mappák, és **ennek a fájlnak a neve** (`botondember-weboldal-spec.md`), ha a projektmappában van.
- Ennek a specifikációnak egy **jelszó nélküli** másolatát mentsd el `docs/SPECIFIKACIO.md` néven (a jelszó helyére: `[a .env.local fájlban]`). Ez már mehet a repóba.
- Admin adatok: `.env.local` → `ADMIN_USERNAME` és `ADMIN_PASSWORD` (idézőjelek között, a `!` miatt). Az első indításkor a seed a jelszót **bcrypt hash**-ként menti az adatbázisba; ezután a jelszó az Adminból módosítható. A README-ben írd le, hogy a sima jelszó a seed után törölhető a `.env.local`-ból, és élesítés előtt érdemes jelszót cserélni.
- `SESSION_SECRET` (legalább 32 bájt véletlen): a setup script generálja le, ha hiányzik.
- Session: aláírt token (pl. `jose`) httpOnly, `SameSite=Lax` sütiben, élesben `Secure`; lejárat 7 nap.
- Brute force védelem: IP-nként legfeljebb 5 hibás próbálkozás / 15 perc, utána barátságos magyar hibaüzenet.
- Minden admin műveletet **a szerveren** ellenőrizz (nem elég a felületen elrejteni). Minden bemenetet validálj (pl. `zod`).
- Feltöltés: csak képek (PNG, JPG, WEBP, GIF; faviconhoz PNG vagy ICO), max. 10 MB, típusellenőrzés a fájl tartalma alapján, újrakódolás/átméretezés `sharp`-pal. **SVG feltöltést ne engedj** (XSS kockázat).
- A Markdown tartalom megjelenítése sanitizálva történjen.
- Ez egy gyerek weboldala, és később nyilvános lesz:
  - az oldal alapból **rejtve van a keresők elől** (`noindex`), ez az Adminban kapcsolható;
  - a seed tartalom csak a „Botondember" nevet használja – ne kerüljön bele teljes név, iskola, lakóhely.

## 4. Tech stack

A kérdőív Next.js + Tailwind CSS-t javasolt; ez jó választás. Ha jó okod van rá, eltérhetsz, de írd be a döntésnaplóba.

| Terület | Választás | Indok |
|---|---|---|
| Keretrendszer | **Next.js (App Router) + TypeScript**, aktuális stabil verzió | szerveroldali renderelés, admin és publikus oldal egy projektben |
| Stílus | **Tailwind CSS**, aktuális verzió | gyors, jól karbantartható, design tokenek CSS változókkal |
| Adatbázis | **SQLite fájl** (`./data/site.db`) **libSQL** klienssel + **Drizzle ORM** | lokálisan nem kell semmit telepíteni; élesítéskor ugyanaz a kód egy hosztolt libSQL-re (pl. Turso) mutathat, csak env változó kérdése |
| Feltöltött fájlok | `./data/uploads` + egy **tároló-réteg** (interface) | később S3/R2/Vercel Blob-ra cserélhető a kód átírása nélkül |
| Képfeldolgozás | `sharp` | átméretezés, WEBP, favicon méretek |
| Belépés | saját, egyetlen admin: `bcryptjs` + `jose` | nincs natív fordítás Windowson, egyszerű |
| Többnyelvűség | `next-intl` (vagy saját megoldás), **a szövegek az adatbázisból** | lásd 8. pont |
| Téma | `next-themes` | rendszer/világos/sötét, villanásmentesen |
| Ikonok | `lucide-react` | csak a menüpontok ikonjaihoz |
| Zászlók | SVG zászlók (pl. `flag-icons` csomag) | **Windows nem jeleníti meg a zászló emojikat**, csak betűket |
| Validáció | `zod` | |
| Tesztek | Vitest (unit) + Playwright (e2e, képernyőképek) | |

Fontos technikai megjegyzések:

- Ha egy API-ban bizonytalan vagy (pl. Next.js verzióváltozások), a **telepített verzió** dokumentációját kövesd, ne emlékezetből dolgozz.
- Futásidőben feltöltött fájlt **ne** a `public/` mappába ments: production buildben a Next.js csak a build idején ott lévő fájlokat szolgálja ki. A feltöltéseket egy route handler adja vissza (pl. `/media/...`), megfelelő cache fejlécekkel.
- Betűtípusok `next/font`-tal, **self-hostolva** (a látogató böngészője ne kérjen semmit a Google-től). Minden betűnek támogatnia kell a magyar ékezeteket – **ő, ű, Ő, Ű** (`latin-ext`) –, ezt ellenőrizd is!
- A publikus oldalak szerveren renderelődnek és cache-elődnek; admin mentés után `revalidatePath`/`revalidateTag`, hogy a változás azonnal látszódjon.
- Scriptek a `package.json`-ban legalább: `setup` (env generálás + migráció + seed), `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:seed`.

## 5. Oldaltérkép

| Oldal | URL | Hol érhető el |
|---|---|---|
| Kezdőlap | `/` | a fejléc díszes feliratára kattintva |
| Hobbijaim | `/hobbijaim` | menü (1.) |
| Kedvenc játékaim | `/jatekaim` | menü (2.) |
| Kedvenceim YouTube-on | `/youtube` | menü (3.) |
| Kedvenc focicsapatom – Real Madrid | `/real-madrid` | menü (4.) |
| Adatkezelési tájékoztató | `/adatkezelesi-tajekoztato` | lábléc |
| Cookie (süti) tájékoztató | `/cookie-tajekoztato` | lábléc |
| Admin | `/admin` | csak az „Itt a Főnök!" gombbal |
| 404 | – | hibás URL esetén |

- A nyelvváltás **nem változtatja az URL-t** (a választott nyelv sütiben tárolódik). Ez egyszerűbb, és a tartalom első körben úgyis egynyelvű.
- A végleges menüszerkezet még nem biztos, ezért az aloldalak az Adminból **átnevezhetők, sorrendezhetők, elrejthetők**, az ikonjuk és az URL-jük (slug) cserélhető, és **új aloldal is létrehozható** egy „Általános" sablonnal (cím, bevezető, kép, Markdown szöveg, kártyalista).

## 6. Közös elemek (minden oldalon)

### 6.1 Fejléc

- **Bal oldalt:** a díszes felirat: **„Botondember első weboldala"**. Kattintásra a kezdőlapra visz. Stílus: királyi hatás (a „Real" király jelentésére utalva) – arany színátmenet vagy arany + fehér/sötétkék kombináció, előtte egy kis korona ikon; díszes, de jól olvasható betű (pl. Cinzel, ha az ő/ű jól jelenik meg). A szöveg az Adminból szerkeszthető.
- **Jobb oldalt:** a menüpontok **NAGYBETŰVEL**, mindegyik előtt a saját, témához illő ikonjával. Az aktív menüpont jelölve (pl. arany aláhúzás). Javasolt ikonok (lucide, vagy a legközelebbi elérhető): Hobbijaim – `Sparkles`, Játékaim – `Gamepad2`, YouTube – `MonitorPlay`, Real Madrid – `Crown` vagy `Trophy`.
- **Jobb felső sarok** (kis sáv a menü fölött): nyelvi zászlók (ha be vannak kapcsolva), téma-választó, és az **„Itt a Főnök!"** gomb. Bejelentkezve a gomb helyén: „Admin" és „Kilépés".
- **Mobilon és tableten:** felirat + hamburger ikon; jobbról beúszó panel a menüvel, zászlókkal, téma-választóval és az „Itt a Főnök!" gombbal.
- A **kezdőlapon** a fejléc átlátszó, és a hero képre simul (Rainbow Six hangulat); a többi oldalon az adott oldal stílusához illő hátteret kap.
- Rögzített (sticky) fejléc: alapból **ki**, az Adminban bekapcsolható.

### 6.2 Lábléc

- Két link: **Adatkezelési tájékoztató** és **Cookie (süti) tájékoztató**.
- Egy szabad szöveges mező, alapból: `© 2026 Botondember`. Később ide kerül elérhetőség is – ezért Adminból szerkeszthető, és üresen is hagyható.
- Opcionális linklista (később pl. közösségi profilok): Adminból bővíthető, alapból üres. Külön „Kapcsolat" oldal **nem kell**.

### 6.3 „Vissza a tetejére" gomb

- **Minden oldalon kötelező** (kezdőlap, összes aloldal, jogi oldalak).
- Jobb alsó sarokban, kb. 400 px görgetés után jelenik meg. Billentyűzettel is elérhető, fordított `aria-label`-lel. Sima görgetés, kivéve ha a látogató gépén be van kapcsolva a „csökkentett mozgás" (`prefers-reduced-motion`).

### 6.4 Világos és sötét mód

- Három állapot: **Rendszer** (alapértelmezett – a számítógép világos/sötét beállítását követi), **Világos**, **Sötét**. Más színtéma nem kell.
- Betöltéskor ne villanjon fel rossz téma.
- **Minden aloldal-stílusnak** legyen világos és sötét változata is.
- Az alapértelmezett mód az Adminban állítható.

## 7. Design rendszer

Általános benyomás (kérdőív): **letisztult, átlátható kinézet, érdekes, figyelemfelhívó tartalom.** A közönség: Apa, Anya és a barátok – barátságos, de igényes hangvétel.

### 7.1 Színek – a Real Madrid színei

A hivatalos klub-weboldal dizájnját **ne** másold, csak a csapat színeit és letisztult, prémium hangulatát vedd át.

| Token | Érték | Felhasználás |
|---|---|---|
| `--rm-white` | `#FFFFFF` | világos mód háttér, a csapat „fehér" identitása |
| `--rm-blue` | `#00529F` | elsődleges szín: linkek, gombok (fehér háttéren ~7,7:1 kontraszt, AA-nak megfelel) |
| `--rm-gold` | `#FEBE10` | kiemelés, díszítés, aktív jelölés |
| `--rm-navy` | `#0B1F3F` *(származtatott)* | sötét mód háttér, világos módban sötét szöveg |
| `--rm-purple` | `#3D195B` *(címer ihlette, opcionális)* | ritka akcentus |

- **Arany szöveget fehér háttéren ne használj** (kevés a kontraszt): világos háttéren az arany csak díszítés lehet, szövegként sötét háttéren működik. Mindkét témában **WCAG AA** kontraszt kell.
- A színek design tokenként (CSS változók) legyenek, és az **Adminból felülírhatók** (színválasztó + „Alaphelyzet" gomb).

### 7.2 Betűk

- A Real Madrid saját betűje az **RM Neue** (Cotype, fizetős, nem használható). Ingyenes, hasonló neo-groteszk helyettesítő: **Inter Tight** (vagy Inter). Címek: nagybetűs, erős súly.
- Díszes fejléc felirat: **Cinzel** vagy hasonló királyi hatású betű.
- Oldalankénti eltérések a 9. pontban.
- A kérdőív szerint a betűket később finomhangoljuk, ezért az Adminban egy **előre betöltött listából** (5–8 darab `latin-ext` betű, `next/font`, CSS változók) választhatók legyenek a szerepek: törzsszöveg, címek, fejléc felirat.

### 7.3 Animációk

Első körben **nincsenek** hover-animációk (nincs nagyítás, mozgás, számláló, animált elem). Csak az alap, akadálymentes állapotok: látható fókuszkeret, színváltás/aláhúzás linkek fölött.

## 8. Többnyelvűség

- **Alapnyelv: magyar.** Minden felületi szöveg magyarul készül, a többi nyelv **a magyarból** fordítódik.
- Nyelvek első körben: **magyar** (alap), **angol**, **spanyol** (a Real Madrid miatt), **német** és **izlandi**. Az Adminban kapcsolhatók, sorrendezhetők, és új nyelv is felvehető (kód, név, zászló).
- A fordításokat **te készíted el most, fejlesztés közben** (seed), és **az adatbázisban tárolódnak**. Az oldal **soha nem fordít „élőben"** – nincs futásidejű fordító API.
- Admin kapcsoló: **„Nyelvválasztó zászlók megjelenítése"**. Ha ki van kapcsolva, nem látszanak a zászlók, és az oldal magyarul jelenik meg.
- Zászlóra kattintva a keretrendszer szövegei az adott nyelvre váltanak; a választás sütiben megmarad. A `<html lang>` az aktuális nyelvet mutatja.

**Mi fordítódik első körben (az oldal „keretrendszere"):** menüpontok, oldal- és szekciócímek (pl. „Kedvenc csatornáim"), gombok (az „Itt a Főnök!" is), „Vissza a tetejére", téma-választó, lábléc linkek, 404 oldal, üres állapotok szövegei, akadálymentességi (aria) címkék, böngészőfül címek.

**Mi NEM fordítódik első körben (beírt tartalom):** minden, amit Botond az Adminban beír – hero szöveg, mottó, hobbi- és játékleírások, videócímek, jogi oldalak szövege stb. Ez **minden nyelven az eredeti, beírt formájában marad.**
- A kérdőívben itt az áll, hogy a beírt adat „maradjon angolul". Mivel a kezdő tartalom magyar, ezt úgy értelmezzük: **fordítás nélkül, ahogy be lett írva**. Rögzítsd a döntésnaplóban nyitott kérdésként.
- Az ilyen blokkok kapjanak `lang="hu"` attribútumot (a képernyőolvasók miatt).
- Az adatmodell legyen felkészítve arra, hogy később a tartalom is fordítható legyen (pl. egy `content_translations` tábla: entitás · id · mező · nyelv · érték; ha nincs fordítás, az eredeti jelenik meg). **A felületét most még ne építsd meg** – a felhasználó később dönt róla.
- Az Admin felület maga csak magyar nyelvű.

## 9. Oldalak részletesen

Minden aloldalnak **saját, a témájához illő stílusa** van (világos + sötét változattal), de a fejléc, lábléc és a „Vissza a tetejére" gomb mindenhol ugyanúgy működik. Minden aloldal tetején: nagy cím az ikonnal + rövid bevezető (Adminból).

### 9.1 Kezdőlap – `/`

Hangulat: a **Rainbow Six Siege** weboldala (https://www.ubisoft.com/en-gb/game/rainbow-six/siege), de **nagyon minimalista**: sötét, filmszerű, nagy kép, kevés, de ütős szöveg.

- **Egyetlen kép** teljes képernyőn: Botondról készült fotó (Adminból feltölthető; addig egy semleges, saját generálású helykitöltő). Sötét színátmenetes rátét, hogy a szöveg olvasható legyen – erőssége Adminból csúszkával állítható. A kép fókuszpontja (fent/közép/lent/bal/jobb) Adminból választható.
- **Egy rövid üzenet**, nagy, vastag, nagybetűs szedéssel: **„Helló! Botondember vagyok. Üdv az első honlapomon!"** – ez egyben a „Rólam" szöveg is. Alatta opcionális alcím (alapból üres).
- **Mottó blokk:** alapból **kikapcsolva**; az Adminban bekapcsolható, szöveg + szerző.
- Semmi más: nincs galéria, számláló, óra, időjárás, animáció.
- A kérdőív 10. válaszában a kezdőlaphoz ígért referencia („WEB") **hiányzik** → most a Rainbow Six irányból dolgozz; ha a felhasználó később megadja, igazítsd hozzá.

### 9.2 Hobbijaim – `/hobbijaim`

Stílus: **sportos magazin / edzésnapló** – nagy, bátor tipográfia, erős színblokkok (kék/arany), átlós díszítő elemek, sok levegő.

- Kártyarács: kép, hobbi neve, rövid leírás, „Mióta csinálom" (opcionális), címke (szabad szöveg, pl. sport / kreatív / tech).
- Adminból: bevezető szöveg, kártyák létrehozása / szerkesztése / törlése, sorrend, láthatóság.
- Seed: 3 példa kártya, egyértelműen jelölve: „Példa – cseréld le az Adminban".

### 9.3 Kedvenc játékaim – `/jatekaim`

Stílus: **játékindító / játékbolt hangulat** (Steam, PlayStation Store, Xbox): sötét alap neon kék akcentussal; világos módban is jól kell kinéznie.

- Kiemelt játék nagy bannerrel (Adminban „Kiemelt" jelölés).
- Borítórács (álló, 3:4 arányú borítók): cím, platform jelvények (PC, PlayStation, Xbox, Switch, mobil…), műfaj, saját értékelés 1–5 csillaggal, rövid vélemény, opcionális link.
- Címekhez „gamer" betű (pl. Rajdhani vagy Chakra Petch – a `latin-ext` támogatást ellenőrizd), törzsszöveg: Inter.
- Seed: 3–4 példa játék helykitöltő borítóval, „Példa" jelöléssel.

### 9.4 Kedvenceim YouTube-on – `/youtube`

Stílus: **a YouTube weboldal kinézete** (saját megvalósítás, a YouTube logója és védjegyei nélkül): fehér / `#0F0F0F` háttér, piros (`#FF0000`) akcentus, Roboto betű, 12 px-re lekerekített 16:9 bélyegképek, kétsoros címek, szürke másodlagos szöveg, felül „chip" sáv.

- Chip sáv (szűrő fülek): **Mind · Zeneszámok · Videók · Csatornák · Lejátszási listák** (URL-ben pl. `?tab=zeneszamok`, hogy megosztható legyen).
- Négy szekció:
  1. **Zeneszámok** – vegyes kedvenc zenék, videókártyákként.
  2. **Videók** – vegyes kedvenc videók, videókártyákként.
  3. **Kedvenc csatornáim** – kerek avatar, csatornanév, rövid megjegyzés.
  4. **Kedvenc lejátszási listáim** – „egymásra rakott" bélyegkép-hatás, cím, opcionális elemszám jelvény.
- A kérdőívben szereplő „random" szót úgy értelmezzük: **vegyes, válogatott** elemek; a sorrend az Adminból állítható. (Döntésnaplóba.)
- Kattintásra az elem **új lapon** nyílik meg a YouTube-on. **Nincs beágyazott lejátszó** első körben.
- **Admin kényelem:** elég beilleszteni a linket → a szerver a YouTube oEmbed végpontjával lekéri a címet és a csatornanevet, a bélyegképet letölti és **helyben tárolja** (így a látogatók böngészője nem kommunikál a Google-lel, és nem kell süti-hozzájárulás). Minden mező kézzel felülírható. Csatornánál az avatar kézzel feltölthető.
- Támogatott link formák: `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, `/playlist?list=…`, `/@csatornanev`, `/channel/UC…`. Ehhez unit tesztek kellenek.
- Üres szekció esetén barátságos üres állapot („Még nincs itt semmi.").

### 9.5 Kedvenc focicsapatom: Real Madrid – `/real-madrid`

Stílus: **prémium klub-oldal** – fehér + sötétkék + arany, nagy stadion hero kép (Adminból), elegáns, sok levegő, nagybetűs címek, Inter Tight.

Szekciók (mind szerkeszthető, elrejthető, sorrendezhető az Adminban):

- **Hero:** cím, alcím, háttérkép.
- **Miért a Real Madrid?** – Botond szövege (Markdown).
- **Kedvenc játékosaim** – kártyák: nagy mezszám, név, poszt, kép, rövid megjegyzés.
- **Kedvenc pillanataim / trófeák** – idővonal: év, cím, rövid szöveg, opcionális kép és link.
- **Klub alapadatok** – kulcs–érték lista (pl. Alapítva: 1902 · Stadion: Santiago Bernabéu · Becenév: Los Blancos).
- **Link a hivatalos oldalra.**

Szabályok:

- Ne tegyél a kódba jogvédett képet, címert vagy logót – ezeket Botond töltheti fel az Adminban. Helykitöltőnek saját, semleges grafikát használj.
- Időben változó adatot (aktuális keret, trófeák száma) ne égess be; a seedben helykitöltő játékoskártyák legyenek.

### 9.6 Jogi oldalak – `/adatkezelesi-tajekoztato`, `/cookie-tajekoztato`

Letisztult, jól olvasható szövegoldal (max. ~70 karakteres sorhossz, tartalomjegyzék a fejezetekre ugráshoz). Tartalom: lásd **10. pont**.

### 9.7 404 oldal

Barátságos, a design rendszerhez illő, fordított szöveg, gomb vissza a kezdőlapra.

## 10. Adatkezelési és Cookie (süti) tájékoztató

**Minta:** a https://radnaimark.hu oldal láblécében lévő két dokumentum (ott PDF-ként: „Adatkezelési tájékoztató" és „Cookie (süti) tájékoztató"). A **szerkezetüket** vedd át, de a tartalmat **erre az oldalra szabva** írd meg, weboldalként (nem PDF). Az első változatot te írod meg; utána mindkettő az Adminból szerkeszthető (Markdown + előnézet, „Utoljára frissítve" dátum automatikusan).

### 10.1 Tények, amikre a szöveg épül

- Nincs regisztráció, űrlap, hírlevél, analitika, reklám, közösségi beépülő modul és beágyazott videó.
- A látogatóknál csak **funkcionális tárolás** történik: a választott nyelv (süti) és a téma (localStorage). Az admin session süti csak a bejelentkezett üzemeltetőnél jön létre.
- A betűk és a YouTube bélyegképek helyben vannak tárolva → a látogatás során nincs adattovábbítás harmadik félnek. Ha a látogató egy YouTube linkre kattint, onnantól a YouTube (Google) adatkezelése vonatkozik rá – ezt írd le.
- Szervernaplók (IP-cím, időpont, böngésző adatai) a tárhelyszolgáltatónál keletkezhetnek; a tárhely még nincs kiválasztva → helykitöltő.
- **Adatkezelő:** helykitöltő mezők (név, e-mail), Adminból kitölthetők. Javaslat a helykitöltő szövegben: mivel kiskorú oldaláról van szó, az adatkezelő a szülő legyen.

### 10.2 Adatkezelési tájékoztató – fejezetek

1. **Bevezetés** – hatály (melyik weboldal), hatálybalépés dátuma.
2. **Az adatkezelő** – név, e-mail (Adminból).
3. **Fogalmak** – rövid GDPR-definíciók (személyes adat, érintett, adatkezelő, adatfeldolgozó, adatkezelés).
4. **Adatkezelési elvek** – jogszerűség, célhoz kötöttség, adattakarékosság, korlátozott tárolhatóság, integritás és bizalmasság, elszámoltathatóság.
5. **Az adatkezelés módja és biztonsága** – technikai és szervezési intézkedések, adatvédelmi incidens kezelése (bejelentés a hatóságnak 72 órán belül, ha szükséges).
6. **Az egyes adatkezelések** – mindegyiknél: cél, jogalap, kezelt adatok köre, időtartam:
   - 6.1 A weboldal látogatása (szervernaplók)
   - 6.2 Nyelv- és témabeállítás tárolása
   - 6.3 Admin bejelentkezés (csak az üzemeltető)
7. **Adatfeldolgozók** – tárhelyszolgáltató (helykitöltő).
8. **Az érintettek jogai** – tájékoztatás, hozzáférés, helyesbítés, törlés, korlátozás, tiltakozás, adathordozhatóság, hozzájárulás visszavonása.
9. **Jogorvoslat** – panasz az adatkezelőnél, a NAIH-nál, illetve bírósághoz fordulás.

Jogszabályok: **GDPR** – (EU) 2016/679 rendelet; **Infotv.** – 2011. évi CXII. törvény.

NAIH elérhetőségei (a mintadokumentum szerint):
Nemzeti Adatvédelmi és Információszabadság Hatóság · 1055 Budapest, Falk Miksa utca 9-11. · Postacím: 1363 Budapest, Pf. 9. · Telefon: +36 (1) 391-1400 · E-mail: ugyfelszolgalat@naih.hu · Web: www.naih.hu

### 10.3 Cookie (süti) tájékoztató – fejezetek

1. **Az üzemeltető adatai**
2. **Mi az a süti?** – közérthető magyarázat.
3. **Milyen sütiket használunk?** – kizárólag feltétlenül szükséges / funkcionális sütiket. Mondja ki külön, hogy **statisztikai és marketing sütik nincsenek**.
4. **Süti táblázat** – oszlopok: Név · Szolgáltató · Leírás · Jogalap · Tárolási idő. A ténylegesen használt sütik és böngészőtárolók **pontos nevével** – ezeket a kódból vedd, ne találd ki.
5. **Adatfeldolgozók** – hivatkozás az adatkezelési tájékoztatóra.
6. **Sütik kezelése és törlése** – linkek a böngészők súgójához (Chrome, Edge, Firefox, Safari).

Megjegyzések:

- Mivel csak feltétlenül szükséges sütik vannak, **nem kell süti-hozzájárulási (cookie) banner**. Ha később analitika, beágyazott YouTube vagy hasonló kerül az oldalra, akkor már kell – ezt figyelmeztetésként írd be a döntésnaplóba és a `CLAUDE.md`-be.
- A README-ben jelezd, hogy a tájékoztatók nem minősülnek jogi tanácsnak; élesítés előtt érdemes átnézetni.

## 11. Admin felület

### 11.1 Belépés

- Jobb felül az **„Itt a Főnök!"** gomb → felugró ablak (modál) két mezővel: **Felhasználónév**, **Jelszó**, és egy „Belépés" gombbal. Esc vagy X bezárja.
- Hibás adatnál általános üzenet: „Hibás felhasználónév vagy jelszó." (nem árulja el, melyik rossz).
- Sikeres belépés → átirányítás az `/admin` oldalra. Ha valaki belépés nélkül nyitja meg az `/admin`-t, a kezdőlapra kerül, megnyitott belépő ablakkal.
- Kezdő adatok: felhasználónév `Botond`, jelszó a `.env.local`-ból (0. és 3. pont).

### 11.2 Felépítés és kezelhetőség

- Bal oldali menü (mobilon lenyíló), magyarul, nagy, egyértelmű gombokkal. Az Admin mobilon is használható legyen.
- Minden mentés után „Mentve!" visszajelzés; hibáknál érthető magyar üzenet; figyelmeztetés, ha mentetlen változással akar kilépni az oldalról.
- Minden szerkesztőnél „Oldal megtekintése" link.
- Minden képfeltöltő mezőhöz tartozik **alt szöveg** mező (akadálymentesség).
- Hosszabb szövegek Markdown szerkesztővel, élő előnézettel.

### 11.3 Mit lehet módosítani (minimum)

| Admin menüpont | Tartalom |
|---|---|
| **Irányítópult** | gyors linkek, utolsó módosítások |
| **Általános** | oldal neve (böngészőfül), fejléc díszes felirata, **favicon feltöltés** (PNG legalább 512×512 px vagy ICO; a 16, 32, 180, 192 és 512 px-es méreteket automatikusan generálja), alapértelmezett téma (Rendszer/Világos/Sötét), sticky fejléc be/ki, keresők elől rejtés be/ki, lábléc szöveg és linkek |
| **Megjelenés** | márkaszínek (színválasztó + Alaphelyzet), betűtípusok választása listából, aloldalanként akcentusszín |
| **Kezdőlap** | hero kép, fókuszpont, rátét erőssége, fő üzenet, alcím, mottó (be/ki, szöveg, szerző) |
| **Menü és aloldalak** | sorrend (fel/le gombok vagy húzás), elrejtés, ikon választás előnézettel, slug, új „Általános" aloldal létrehozása és törlése; a menüpont neve nyelvenként (a Fordításokhoz kapcsolódik) |
| **Hobbijaim** | bevezető + kártyák (létrehozás, szerkesztés, törlés, sorrend, láthatóság) |
| **Játékaim** | bevezető + játékok, „Kiemelt" jelölés |
| **YouTube** | a négy lista kezelése; link beillesztése → automatikus adatkitöltés |
| **Real Madrid** | minden szekció a 9.5 pont szerint |
| **Jogi oldalak** | két Markdown szerkesztő előnézettel + az adatkezelő adatai |
| **Fordítások** | táblázat (kulcs × nyelv), kereső, hiányzó fordítások kiemelése; nyelvek be/ki, sorrend, alapnyelv; zászlók megjelenítése be/ki; új nyelv felvétele (kód, név, zászló) |
| **Médiatár** | feltöltött képek listája, alt szöveg szerkesztése, törlés (figyelmeztet, ha a kép használatban van) |
| **Mentés és visszaállítás** | a teljes tartalom exportja egy ZIP fájlba (JSON + képek) és importálása – ezzel költözik majd a lokális tartalom az éles oldalra |
| **Fiók** | felhasználónév és jelszó módosítása (a régi jelszó megadásával), kilépés |

A favicon alapértelmezése: egy saját generálású „B" monogram arany–sötétkék színekben.

## 12. Adatmodell (javaslat – finomíthatod)

| Tábla | Fő mezők |
|---|---|
| `settings` | `key` (PK), `value` (JSON) – általános, megjelenés, kezdőlap, lábléc, adatkezelő adatai |
| `locales` | `code`, `name`, `flag`, `enabled`, `is_default`, `sort` |
| `translations` | `key`, `locale`, `value` – PK: (`key`, `locale`); pl. `nav.hobbijaim`, `youtube.channels`, `common.backToTop` |
| `pages` | `id`, `slug`, `template` (home · hobbies · games · youtube · football · generic · legal), `icon`, `sort`, `visible`, `is_core`, `intro_md`, `hero_media_id`, `accent_color`, `seo_description` |
| `media` | `id`, `path`, `mime`, `width`, `height`, `alt`, `created_at` |
| `hobbies` | `id`, `title`, `body`, `media_id`, `since`, `tag`, `sort`, `visible` |
| `games` | `id`, `title`, `platforms`, `genre`, `rating`, `review`, `link`, `cover_media_id`, `featured`, `sort`, `visible` |
| `youtube_items` | `id`, `kind` (song · video · channel · playlist), `url`, `yt_id`, `title`, `author`, `thumb_media_id`, `note`, `sort`, `visible` |
| `football_sections` | `id`, `type`, `title`, `body_md`, `media_id`, `sort`, `visible` |
| `football_players` | `id`, `name`, `number`, `position`, `media_id`, `note`, `sort`, `visible` |
| `football_moments` | `id`, `year`, `title`, `body`, `media_id`, `link`, `sort`, `visible` |
| `football_facts` | `id`, `label`, `value`, `sort` |
| `generic_items` | `id`, `page_id`, `title`, `body`, `media_id`, `link`, `sort`, `visible` – az „Általános" sablonhoz |
| `legal_docs` | `slug` (privacy · cookie), `locale`, `body_md`, `updated_at` |
| `admin_users` | `id`, `username`, `password_hash`, `updated_at` |
| `login_attempts` | `ip`, `count`, `window_start` |
| *(később)* `content_translations` | `entity`, `entity_id`, `field`, `locale`, `value` |

A migrációk verziókezeltek legyenek (Drizzle migrations), a seed pedig többször is lefuttatható (ne duplikáljon).

## 13. Amit most NEM kell megcsinálni

A kérdőív alapján ezek kifejezetten **nem** kellenek (vagy csak később):

- fotógaléria · külön „Kedvencek" szekció · külön eredmények/projektlista (ezek az aloldalakon lesznek)
- kapcsolat oldal vagy űrlap (később a láblécbe kerül elérhetőség)
- visszaszámláló, animált elemek, hover-animációk
- kvíz, szavazás · vendégkönyv / üzenőfal
- zenelejátszó, beágyazott videó
- kereső · időjárás, dátum/óra kijelző
- extra színtémák (csak világos/sötét) · extra ikoncsomagok (csak a menüikonok)
- a beírt tartalom fordítása · bármilyen „élő" (futásidejű) fordítás
- élesítés (nyilvános webre tétel) – ez a következő kör

## 14. Minőségi elvárások

- **Reszponzív:** 360 px-től 1920 px felett is tökéletes. Ellenőrizd 375, 768, 1024 és 1440 px szélességen, világos és sötét módban (Playwright képernyőképek).
- **Akadálymentesség:** WCAG 2.1 AA kontraszt mindkét témában, billentyűzettel bejárható, látható fókusz, alt szövegek, helyes címsor-hierarchia.
- **Teljesítmény:** a kezdőlap mobilos Lighthouse értékei (Performance, Accessibility, Best Practices) legalább 90; képek `next/image`-dzsel, modern formátumban.
- **SEO alapok:** oldalanként title és description, Open Graph kép (a hero kép) – a `noindex` kapcsolóval összhangban.
- **Tesztek:**
  - unit: YouTube URL-feldolgozó, fordítás-visszaesés (hiányzó fordításnál magyar), jogosultság-ellenőrzés;
  - e2e smoke: a kezdőlap betölt; a menü minden oldalra elvisz; a nyelvváltás átírja a menüt; a téma váltása működik; a „Vissza a tetejére" gomb megjelenik és működik; hibás belépés elutasítva; sikeres belépés után a hero szöveg módosítása megjelenik a kezdőlapon.
- Minden mérföldkő végén zöld: `lint`, `typecheck`, `test`, `build`.
- **README magyarul, kezdőknek:** előfeltételek (Node.js LTS, Git), telepítés, `npm run setup`, `npm run dev`, belépés az Adminba, mentés és visszaállítás, gyakori hibák és megoldásuk.

## 15. Fejlesztési sorrend (mérföldkövek)

Minden mérföldkő végén: `lint` + `typecheck` + `test` + `build` → commit → push → rövid magyar összefoglaló. **Közben is** commitolj és pusholj minden működő részlépés után.

| # | Mérföldkő | Elkészült, ha… |
|---|---|---|
| 0 | **Előkészítés** – Node LTS, npm, git ellenőrzése (ha hiányzik valami, egyszerűen elmagyarázod a telepítést); Next.js projekt; `.gitignore`, `.env.example`, `CLAUDE.md`, `docs/SPECIFIKACIO.md` (jelszó nélkül), `docs/DONTESEK.md`, `.claude/settings.json`; git remote | az üres projekt fut, és az első push megtörtént |
| 1 | **Adatbázis + seed** – séma, migrációk, `npm run setup` (env generálás, migráció, seed: admin, 4 nyelv, összes fordítás, oldalak, példatartalmak, jogi szövegek), helykitöltő képek generálása | egy paranccsal feláll a teljes adatbázis |
| 2 | **Design rendszer + keret** – tokenek, betűk, téma, fejléc, mobil menü, lábléc, „Vissza a tetejére", zászlók és nyelvváltás, 404 | minden oldalon működik a keret, mindkét témában és 4 nyelven |
| 3 | **Kezdőlap** | Rainbow Six-szerű minimalista hero az adatbázisból |
| 4 | **Aloldalak** – Hobbijaim, Játékaim, YouTube, Real Madrid | mind a saját stílusában, világos + sötét, mobilon is |
| 5 | **Jogi oldalak** | mindkét tájékoztató elérhető a láblécből |
| 6 | **Belépés + Admin váz** – modál, session, védelem, rate limit, admin elrendezés | be- és kilépés működik, az `/admin` védett |
| 7 | **Admin szerkesztők** – Általános (favicon!), Megjelenés, Kezdőlap, Menü és aloldalak, Hobbijaim, Játékaim, YouTube (oEmbed), Real Madrid, Jogi oldalak, Médiatár | minden tartalom az Adminból módosítható, és azonnal látszik az oldalon |
| 8 | **Fordítások admin, Mentés és visszaállítás, Fiók** | fordítás szerkeszthető; export–import oda-vissza működik; jelszó cserélhető |
| 9 | **Minőség és átadás** – reszponzív ellenőrzés képernyőképekkel, akadálymentesség, Lighthouse, e2e tesztek, README | záró összefoglaló a felhasználónak: mi készült el, hogyan indítsa, mik a nyitott kérdések |

A munka végén indítsd el a fejlesztői szervert (`npm run dev`), és add meg a linket, ahol Botond megnézheti az oldalt.

## 16. Később (most ne, de az architektúra ne zárja ki)

- **Élesítés** a nyilvános webre: vagy (a) Vercel + Turso + Vercel Blob/R2, vagy (b) saját VPS Node.js-sel és ugyanazzal a SQLite fájllal; domain. Élesítés előtt: jelszócsere, döntés a `noindex`-ről, az adatkezelő adatainak és a tárhelyszolgáltatónak a kitöltése a tájékoztatókban.
- A beírt tartalom fordítása más nyelvekre (a módja még nyitott).
- Vendégkönyv, beágyazott videók (`youtube-nocookie.com` + süti-hozzájárulás), hover-animációk, kereső, elérhetőségek a láblécben.
- A kezdőlap finomhangolása a hiányzó referencia alapján; betűk finomhangolása.

## 17. Nyitott kérdések – döntsd el, és rögzítsd a döntésnaplóban

1. **Kezdőlap referencia:** a kérdőív 10. válaszában a link („WEB") hiányzik. → Most: Rainbow Six irány.
2. **„Maradjon angolul":** a beírt tartalom nyelve. → Most: fordítás nélkül, ahogy be lett írva. | Updatelve Botond által: ez typo: helyesen ez "Maradjon magyarul"
3. **Nyelvek listája** nincs megadva. → Most: magyar, angol, spanyol, német. | Updatelve Botond által: magyar, angol, spanyol, német, izlandi
4. **Menüpontok elhelyezése** („az oldal jobb oldalán"). → Most: a fejléc jobb oldalán, nagybetűvel, ikonnal; mobilon jobbról beúszó panel.
5. **Adatkezelő neve és e-mail címe** a jogi oldalakhoz. → Helykitöltő, Adminból kitölthető.
6. **Tárhely és domain.** → Később.
7. **A hobbik, játékok, videók konkrét tartalma.** → Botond tölti fel az Adminban; addig jelölt példák.

## Függelék – a kérdőív válaszai röviden (forrás)

| # | Kérdés | Válasz lényege | Hol a specben |
|---|---|---|---|
| 1 | Oldal neve | Botondember első weboldala | 6.1 |
| 2 | Cél | bemutatkozás + 4 aloldal: hobbik, játékok, YouTube (zenék, videók, csatornák, playlistek), Real Madrid | 5, 9 |
| 3 | Közönség | Apa, Anya, barátok | 7 |
| 4 | Benyomás | letisztult, átlátható; érdekes, figyelemfelhívó tartalom | 7 |
| 5 | Nyelv | magyar alap; zászlós nyelvváltás; fordítás DB-ben, nem élőben; első körben csak a keret fordul | 8 |
| 6 | Színek | Real Madrid színei (nem a klub-oldal dizájnja) | 7.1 |
| 7 | Téma | világos/sötét + a gép beállításának követése | 6.4 |
| 8 | Stílus | kezdőlap: minimalista Rainbow Six; menü jobbra, nagybetű, ikon; aloldalanként saját téma (pl. YouTube-stílus) | 6.1, 9 |
| 9 | Betűk | Real Madrid-szerű, később finomhangolva | 7.2 |
| 10 | Referencia | kezdőlapra „WEB" – hiányzik | 17 |
| 11 | Oldalak | a 2. válasz menüpontjai, mind egyedi stílusú aloldallal | 5 |
| 12 | Fejléc | díszes felirat: Botondember első weboldala | 6.1 |
| 13 | Lábléc | Adatkezelési + Cookie tájékoztató, radnaimark.hu mintájára | 6.2, 10 |
| 14 | Fix elemek | „Vissza a tetejére" mindenhol | 6.3 |
| 15–16 | Hero / Rólam | „Helló! Botondember vagyok. Üdv az első honlapomon!" | 9.1 |
| 17, 19, 21 | Hobbik, kedvencek, eredmények | az aloldalakon | 9 |
| 18 | Galéria | nem | 13 |
| 20 | Mottó | most nem, de Adminból állítható | 9.1, 11.3 |
| 22 | Kapcsolat | később a láblécben, külön oldal nem kell | 6.2 |
| 23–29 | Extrák | nem / később | 13 |
| 30 | Reszponzív | igen | 14 |
| 31 | Technológia | Next.js + Tailwind CSS javasolt | 4 |
| 32 | Favicon | igen, Adminból cserélhető | 11.3 |
| 33 | Ikonok | csak a menüpontok ikonjai | 6.1 |
| 34 | Képek | Adminból kezelve | 11 |
| 35 | Admin | „Itt a Főnök!" gomb jobb felül → felhasználónév + jelszó → admin, ahol szinte minden módosítható | 11 |

## További, utólag hozzáadott kérések
A weboldalnak ismerje fel, ha mobiltelefonon vagy tableten nyitjuk meg és méretezze át az oldalt az eszköz kijelzőjének mérete szerint.