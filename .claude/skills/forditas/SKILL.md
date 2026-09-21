---
name: forditas
description: A weboldal saját (kézzel beírt) szövegeinek lefordítása a többi nyelvre – az Admin „Saját szövegek fordítása” oldalán kért (és kérésre az összes hiányzó) szövegek. Használd, ha a felhasználó beírja, hogy /forditas, vagy azt kéri, hogy fordítsd le a fordításra váró szövegeket.
---

# Saját szövegek fordítása (`/forditas`)

A fordítás ingyenes: te (Claude Code) készíted el, és a kész fordítások az adatbázisba kerülnek.
A látogatók soha nem várnak online fordításra – mindig az elmentett szöveget látják.

## Lépések

1. **Mit fordítasz?** A parancs után írt szó dönti el:
   - semmi → csak a kért szövegek (Admin: „Fordításra vár”): `npm run translate:export`
   - `mind` / `minden` / `all` → a kértek + minden hiányzó és gépi elavult szöveg a bekapcsolt nyelveken:
     `npm run translate:export -- --all`
   - nyelvkód(ok), pl. `en` vagy `de,hr` → csak ezekre a nyelvekre: `npm run translate:export -- --lang=en` (kombinálható a `--all`-lal)

   Windowson PowerShellben `npm.cmd run …` (a Bash eszközben `npm run …`).
2. Ha a kiírás szerint nincs mit fordítani, mondd el röviden, és állj meg.
3. Olvasd be a `data/forditas/feladat.json` fájlt. Minden elemnél: `key`, `label` (mi ez), `format`
   (`text` = egy sor, `multiline` = sortörések maradhatnak, `markdown` = formázott), `maxLength`, `sourceHash`,
   `source` (a magyar eredeti) és `targets` (célnyelvek; a `previous` a korábbi, már elavult fordítás).
4. Fordíts le minden elemet minden célnyelvére (lásd a szabályokat lent), és írd az eredményt fájlba:
   - **JSON** (a legtöbb szöveghez): `data/forditas/eredmeny.json` – nagy feladatnál több fájlba is
     (`eredmeny-1.json`, `eredmeny-2.json`, …):
     ```json
     { "items": [ { "key": "hobbies:3:title", "sourceHash": "…", "translations": { "en": "Football", "de": "Fußball" } } ] }
     ```
     A `key` és a `sourceHash` pontosan a feladatfájlból jöjjön.
   - **Markdown fájl** a hosszú szövegekhez (pl. jogi szövegek, ~3000 karakter fölött) – nyelvenként egy fájl a
     `data/forditas/eredmeny/` mappában (pl. `legal-privacy-en.md`):
     ```
     ---
     key: legal_docs:privacy:bodyMd
     locale: en
     sourceHash: …
     ---
     (a lefordított Markdown szöveg)
     ```
5. Töltsd be: `npm run translate:import`. Ha hibát ír (pl. hibás JSON), javítsd a fájlt, és futtasd újra –
   hibás fájlnál semmi nem mentődik. A kihagyott elemek okát a parancs kiírja.
6. Foglald össze magyarul, egyszerűen: hány fordítás készült nyelvenként, mi maradt ki és miért, és kérd meg,
   hogy nézze át őket az Adminban (**Saját szövegek fordítása** → „Gépi – ellenőrizd”). A futó oldal legfeljebb
   egy percen belül átveszi a változást.

A betöltő a kézzel írt vagy jóváhagyott fordítást soha nem írja felül (csak ha az Adminban kifejezetten új
fordítást kértek rá), és kihagyja azt, aminek a magyar eredetije közben megváltozott.

## Fordítási szabályok

- **Hangnem:** ugyanaz, mint a magyar eredetiben – közvetlen, barátságos, egyes szám első személy (egy gyerek
  saját weboldala). Természetes, gördülékeny mondatok az adott nyelven, ne szó szerinti fordítás.
- **Tulajdonnevek maradnak:** Botondember, Botond, Real Madrid, játékosok, csapatok, játékok, YouTube-csatornák,
  dalok és előadók neve, márkanevek (PlayStation, Minecraft stb.). Ha egy játéknak vagy fogalomnak van az adott
  nyelven elterjedt hivatalos neve, azt használd.
- **Markdown:** a szerkezet maradjon pontosan ugyanaz (címsorok `#`, listák, **félkövér**, _dőlt_, bekezdések,
  táblázatok). Linkeknél `[szöveg](cím)`: a szöveget fordítsd, a címet ne.
- **`{{HELYŐRZŐK}}`** (pl. `{{ADATKEZELO_NEV}}`, `{{OLDAL_NEVE}}`) változatlanul maradjanak – ide kerülnek az
  Adminban megadott adatok. A betöltő ellenőrzi.
- **`text` formátum:** egyetlen sor, sortörés nélkül. Soha ne lépd túl a `maxLength`-et.
- **Kis- és nagybetű:** az eredeti szerint; a csupa nagybetűs megjelenést a weboldal stílusa adja, ne írd át.
- **Képleírás (alt szöveg):** rövid, tárgyilagos leírás arról, mi látszik a képen.
- **Jogi szövegek** (adatkezelési és cookie tájékoztató): pontos, hivatalos nyelvezet az adott nyelv szokásos
  GDPR-szakszavaival (pl. adatkezelő → data controller / Verantwortlicher / responsable del tratamiento /
  ábyrgðaraðili / voditelj obrade). A számozás és a fejezetek sorrendje maradjon. (Az oldal kiírja, hogy
  eltérés esetén a magyar változat az irányadó.)
- **Ha van `previous`** (korábbi fordítás): igazítsd az új magyar szöveghez, de ami még érvényes, abban tartsd
  meg a korábbi megfogalmazást.
- **Izlandi és horvát:** gondos, természetes nyelv a helyes ékezetekkel (izlandi: þ, ð, æ, ö, á, é, í, ó, ú, ý;
  horvát: č, ć, š, ž, đ). Horvátul nincs á, é, í, ó, ö, ő, ú, ü, ű – ezek a betűk a horvát szövegben csak
  tulajdonnévben maradhatnak.
- Csak a fordítást írd a fájlba – magyarázatot, megjegyzést, idézőjelet a szöveg köré ne.

## Tudnivalók

- A `data/forditas/` mappa nem kerül fel a GitHubra (a `data/` mappa ki van zárva) – a fordítások az
  adatbázisban vannak.
- A betöltött eredményfájlok a `data/forditas/kesz/` mappába költöznek (napló), törölhetők.
- Semmilyen fizetős szolgáltatás vagy API-kulcs nem kell hozzá.
