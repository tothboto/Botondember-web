/**
 * A jogi oldalak első változata (Markdown). Szerkezetük a radnaimark.hu
 * láblécében lévő két dokumentumot követi, a tartalom erre az oldalra szabva.
 *
 * Helyőrzők (megjelenítéskor az Admin > Jogi oldalak adataival cserélődnek):
 *   {{OLDAL_NEVE}}, {{ADATKEZELO_NEV}}, {{ADATKEZELO_EMAIL}},
 *   {{TARHELYSZOLGALTATO}}, {{HATALYBALEPES}}
 *
 * Nem minősül jogi tanácsnak – élesítés előtt érdemes szakemberrel átnézetni.
 */

export const PRIVACY_MD = `## 1. Bevezetés

Ez a tájékoztató a **{{OLDAL_NEVE}}** című weboldalra (a továbbiakban: *Weboldal*) vonatkozik. Célja, hogy közérthetően leírja, milyen személyes adatok kezelése történik a Weboldal használata során, miért és meddig, valamint milyen jogok illetik meg a látogatókat.

A Weboldal egy diák személyes, nem üzleti célú bemutatkozó oldala. **Nincs rajta regisztráció, űrlap, hírlevél, webáruház, reklám, látogatottságmérés (analitika), közösségi beépülő modul és beágyazott videó.**

A tájékoztató az alábbi jogszabályokon alapul:

- az Európai Parlament és a Tanács (EU) 2016/679 rendelete – általános adatvédelmi rendelet (a továbbiakban: **GDPR**),
- az információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény (a továbbiakban: **Infotv.**).

A tájékoztató hatálybalépésének napja: **{{HATALYBALEPES}}**. A tájékoztató szükség esetén módosulhat; a mindenkor hatályos változat ezen az oldalon olvasható.

## 2. Az adatkezelő

- **Név:** {{ADATKEZELO_NEV}}
- **E-mail:** {{ADATKEZELO_EMAIL}}

Mivel a Weboldal egy kiskorú saját oldala, az adatkezelői feladatokat a törvényes képviselője (szülője) látja el.

## 3. Fogalmak

- **Személyes adat:** azonosított vagy azonosítható természetes személyre (érintettre) vonatkozó bármely információ – például név, e-mail-cím vagy IP-cím.
- **Érintett:** az a természetes személy, akire a személyes adat vonatkozik – például a Weboldal látogatója.
- **Adatkezelő:** aki az adatkezelés céljait és eszközeit meghatározza – ennél a Weboldalnál a 2. pontban megnevezett személy.
- **Adatfeldolgozó:** aki az adatkezelő megbízásából, annak nevében kezel személyes adatot – például a tárhelyszolgáltató.
- **Adatkezelés:** a személyes adatokon végzett bármely művelet – például gyűjtés, tárolás, felhasználás vagy törlés.
- **Adatvédelmi incidens:** a biztonság olyan sérülése, amely a személyes adatok véletlen vagy jogellenes megsemmisítését, elvesztését, megváltoztatását, jogosulatlan közlését vagy az azokhoz való jogosulatlan hozzáférést eredményezi.

## 4. Adatkezelési elvek

A Weboldal üzemeltetése során az adatkezelő a GDPR 5. cikkében rögzített elveket követi:

- **Jogszerűség, tisztességes eljárás és átláthatóság** – csak jogalappal rendelkező adatkezelés történik, és erről ez a tájékoztató ad számot.
- **Célhoz kötöttség** – az adatokat csak az itt leírt célokra használja.
- **Adattakarékosság** – csak a feltétlenül szükséges adatok kezelése történik; a Weboldal szándékosan nem gyűjt adatot a látogatóiról.
- **Pontosság** – a kezelt adatoknak pontosnak és naprakésznek kell lenniük.
- **Korlátozott tárolhatóság** – az adatokat csak a szükséges ideig őrzi.
- **Integritás és bizalmasság** – megfelelő technikai és szervezési intézkedésekkel védi az adatokat.
- **Elszámoltathatóság** – az adatkezelő felel az elvek betartásáért, és igazolni tudja azt.

## 5. Az adatkezelés módja és biztonsága

A Weboldal a látogatókról nem készít profilt, nem követi őket más weboldalakon, és nem ad át adatot reklám- vagy elemzőcégeknek. A betűtípusokat és a YouTube-videók előnézeti képeit is a Weboldal saját tárhelye szolgálja ki, így az oldal megtekintésekor a böngésző nem kommunikál harmadik féllel (például a Google-lel).

Technikai és szervezési intézkedések:

- a Weboldal kezelőfelülete (Admin) jelszóval védett, a jelszó csak visszafejthetetlen (bcrypt) formában van tárolva;
- a sikertelen belépési kísérletek száma korlátozott (IP-címenként legfeljebb 5 kísérlet 15 percenként);
- a feltöltött képekből a rejtett adatok (például a fényképezés helye) automatikusan törlődnek;
- éles üzemben a Weboldal titkosított (HTTPS) kapcsolaton érhető el.

**Adatvédelmi incidens esetén** az adatkezelő az incidenst – ha az valószínűsíthetően kockázattal jár az érintettek jogaira nézve – indokolatlan késedelem nélkül, lehetőleg legkésőbb **72 órán belül** bejelenti a Nemzeti Adatvédelmi és Információszabadság Hatóságnak (GDPR 33. cikk). Ha az incidens valószínűsíthetően magas kockázattal jár, az érintetteket is tájékoztatja (GDPR 34. cikk). Az incidenseket – a megtett intézkedésekkel együtt – nyilvántartja.

## 6. Az egyes adatkezelések

### 6.1 A Weboldal látogatása (szervernaplók)

- **Cél:** a Weboldal működtetése, biztonságának védelme és a hibák felderítése.
- **Jogalap:** az adatkezelő jogos érdeke (GDPR 6. cikk (1) bekezdés f) pont).
- **Kezelt adatok köre:** a látogató IP-címe, a látogatás időpontja, a megnyitott oldal címe, a böngésző és az operációs rendszer típusa, a hivatkozó oldal címe.
- **Időtartam:** a naplófájlokat a tárhelyszolgáltató a saját beállításai szerint őrzi, majd automatikusan törli (jellemzően legfeljebb 30 napig).
- **Megjegyzés:** a naplókat a tárhelyszolgáltató szervere automatikusan készíti; az adatkezelő ezek alapján nem azonosítja a látogatókat.

### 6.2 Nyelv- és témabeállítás tárolása

- **Cél:** hogy a Weboldal a látogató által választott nyelven és színtémában (világos vagy sötét) jelenjen meg.
- **Jogalap:** az adatkezelő jogos érdeke (GDPR 6. cikk (1) bekezdés f) pont); a tárolás a látogató által kifejezetten kért funkcióhoz feltétlenül szükséges.
- **Kezelt adatok köre:** a választott nyelv kódja (például \`hu\`) egy sütiben, valamint a választott téma (\`system\`, \`light\` vagy \`dark\`) a böngésző helyi tárolójában. Egyik sem tartalmaz azonosítót.
- **Időtartam:** a nyelvi süti 1 évig, a témabeállítás addig marad meg, amíg a látogató a böngészőjében nem törli.
- A részleteket a [Cookie (süti) tájékoztató](/cookie-tajekoztato) tartalmazza.

### 6.3 Admin bejelentkezés (csak az üzemeltető)

- **Cél:** a Weboldal tartalmának biztonságos szerkesztése. Ez az adatkezelés kizárólag a Weboldal üzemeltetőjét érinti, a látogatókat nem.
- **Jogalap:** az adatkezelő jogos érdeke (GDPR 6. cikk (1) bekezdés f) pont).
- **Kezelt adatok köre:** felhasználónév, a jelszó visszafejthetetlen (bcrypt) lenyomata és a bejelentkezést igazoló munkamenet-süti; sikertelen belépési kísérletnél az IP-cím, a kísérletek száma és időpontja.
- **Időtartam:** a munkamenet-süti kilépésig, legfeljebb 7 napig érvényes; a sikertelen kísérletek adatai legfeljebb 24 óráig tárolódnak.

### 6.4 Külső hivatkozások (YouTube)

A Weboldalon YouTube-videókra, -csatornákra és -lejátszási listákra mutató hivatkozások vannak, amelyek új lapon nyitják meg a YouTube oldalát. A Weboldal nem ágyaz be videólejátszót, így a YouTube-hoz csak akkor jut el bármilyen adat, ha a látogató egy ilyen hivatkozásra kattint. Onnantól a YouTube-ot üzemeltető Google Ireland Limited adatkezelési szabályai érvényesek: [Google Adatvédelmi irányelvek](https://policies.google.com/privacy?hl=hu).

## 7. Adatfeldolgozók

- **Tárhelyszolgáltató:** {{TARHELYSZOLGALTATO}}
  - Feladata: a Weboldal tárolása és elérhetővé tétele, valamint a szervernaplók kezelése (6.1 pont).

Más adatfeldolgozót a Weboldal nem vesz igénybe, és személyes adatot nem továbbít harmadik országba.

## 8. Az érintettek jogai

A GDPR alapján az érintettet az alábbi jogok illetik meg:

- **Tájékoztatáshoz való jog** – ezt a jelen tájékoztató szolgálja (GDPR 13–14. cikk).
- **Hozzáférési jog** – tájékoztatást kérhet arról, hogy az adatkezelő kezeli-e a személyes adatait, és ha igen, melyeket (GDPR 15. cikk).
- **Helyesbítéshez való jog** – kérheti a pontatlan adatok javítását (GDPR 16. cikk).
- **Törléshez való jog („elfeledtetéshez való jog”)** – kérheti az adatai törlését (GDPR 17. cikk).
- **Az adatkezelés korlátozásához való jog** (GDPR 18. cikk).
- **Adathordozhatósághoz való jog** (GDPR 20. cikk).
- **Tiltakozáshoz való jog** – tiltakozhat a jogos érdeken alapuló adatkezelés ellen (GDPR 21. cikk).
- **A hozzájárulás visszavonásának joga** – a hozzájáruláson alapuló adatkezeléshez adott hozzájárulás bármikor visszavonható (GDPR 7. cikk (3) bekezdés). A Weboldal jelenleg nem végez hozzájáruláson alapuló adatkezelést.

A kérelmek a 2. pontban megadott e-mail-címre küldhetők. Az adatkezelő a kérelmet indokolatlan késedelem nélkül, legfeljebb egy hónapon belül megválaszolja (GDPR 12. cikk (3) bekezdés).

A sütik és a böngészőben tárolt beállítások a látogató által bármikor törölhetők – ennek módját a [Cookie (süti) tájékoztató](/cookie-tajekoztato) írja le.

## 9. Jogorvoslat

Ha az érintett úgy érzi, hogy személyes adatainak kezelése során jogsérelem érte, kérjük, először az adatkezelőhöz forduljon (2. pont) – a problémát igyekszünk gyorsan orvosolni.

Panasz tehető a felügyeleti hatóságnál is:

**Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)**

- Cím: 1055 Budapest, Falk Miksa utca 9-11.
- Postacím: 1363 Budapest, Pf. 9.
- Telefon: +36 (1) 391-1400
- E-mail: ugyfelszolgalat@naih.hu
- Honlap: [www.naih.hu](https://www.naih.hu)

Jogai megsértése esetén az érintett bírósághoz is fordulhat (GDPR 79. cikk). A per – az érintett választása szerint – a lakóhelye vagy tartózkodási helye szerinti törvényszék előtt is megindítható.
`;

export const COOKIE_MD = `## 1. Az üzemeltető adatai

A **{{OLDAL_NEVE}}** című weboldal (a továbbiakban: *Weboldal*) üzemeltetője és adatkezelője:

- **Név:** {{ADATKEZELO_NEV}}
- **E-mail:** {{ADATKEZELO_EMAIL}}

## 2. Mi az a süti?

A süti (angolul *cookie*) egy kis szöveges fájl, amelyet a weboldal a látogató böngészőjében helyez el, és amelyet a böngésző a weboldal következő megnyitásakor visszaküld. Hasonló célt szolgál a böngésző **helyi tárolója** (*localStorage*) is: ebben a weboldal apró beállításokat jegyezhet meg a látogató eszközén.

A sütik segítségével egy weboldal megjegyezheti például, hogy a látogató milyen nyelven szeretné olvasni az oldalt. Sok weboldal sütiket használ statisztikák készítésére vagy célzott reklámokhoz is – **ez a Weboldal nem ilyen.**

## 3. Milyen sütiket használunk?

A Weboldal **kizárólag feltétlenül szükséges (funkcionális)** sütiket és böngészőtárolást használ. Ezek nélkül a látogató által kért funkció – például a nyelvváltás – nem működne.

- **Statisztikai (analitikai) sütik nincsenek.**
- **Marketing- és reklámsütik nincsenek.**
- **Harmadik féltől származó sütik nincsenek** – a Weboldal nem ágyaz be külső tartalmat (videólejátszót, közösségi gombokat, térképet), és a betűtípusokat is saját maga szolgálja ki.

Az elektronikus hírközlésről szóló 2003. évi C. törvény 155. § (4) bekezdése szerint a feltétlenül szükséges sütikhez nem kell a látogató hozzájárulása, ezért a Weboldal nem jelenít meg süti-hozzájárulási ablakot.

## 4. Süti táblázat

| Név | Szolgáltató | Leírás | Jogalap | Tárolási idő |
|---|---|---|---|---|
| \`locale\` (süti) | A Weboldal (saját, első fél) | A látogató által a zászlókkal választott nyelv kódja (pl. \`en\`). Csak akkor jön létre, ha a látogató nyelvet vált. | Jogos érdek – a kért funkcióhoz feltétlenül szükséges | 1 év |
| \`theme\` (böngésző helyi tárolója, *localStorage*) | A Weboldal (saját, első fél) | A választott téma: \`system\` (a számítógép beállítása szerint), \`light\` (világos) vagy \`dark\` (sötét). Csak akkor jön létre, ha a látogató témát választ. | Jogos érdek – a kért funkcióhoz feltétlenül szükséges | Amíg a látogató nem törli |
| \`admin_session\` (süti, *httpOnly*) | A Weboldal (saját, első fél) | Az üzemeltető bejelentkezését igazolja az Admin felületen. **A látogatóknál nem jön létre.** | Jogos érdek – a Weboldal biztonságos kezelése | Kilépésig, legfeljebb 7 nap |

## 5. Adatfeldolgozók

A Weboldal által igénybe vett adatfeldolgozókat (tárhelyszolgáltató) és az adatkezelés további részleteit az [Adatkezelési tájékoztató](/adatkezelesi-tajekoztato) tartalmazza.

## 6. Sütik kezelése és törlése

A sütik és a böngésző helyi tárolója bármikor törölhetők, és a böngésző beállításaiban le is tilthatók. Letiltásuk esetén a Weboldal továbbra is működik, csak nem jegyzi meg a választott nyelvet és témát.

Útmutatók a legelterjedtebb böngészőkhöz:

- [Google Chrome](https://support.google.com/chrome/answer/95647?hl=hu)
- [Microsoft Edge](https://support.microsoft.com/hu-hu/microsoft-edge/cookie-k-t%C3%B6rl%C3%A9se-a-microsoft-edge-ben-63947406-40ac-c3b8-57b9-2a946a29ae09)
- [Mozilla Firefox](https://support.mozilla.org/hu/kb/weboldalak-altal-elhelyezett-sutik-torlese-szamito)
- [Apple Safari](https://support.apple.com/hu-hu/guide/safari/sfri11471/mac)
`;

export const LEGAL_SEED = [
  { slug: "privacy", bodyMd: PRIVACY_MD },
  { slug: "cookie", bodyMd: COOKIE_MD },
] as const;
