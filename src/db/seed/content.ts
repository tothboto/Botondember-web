/**
 * Kezdő (példa) tartalom. Minden példa `isExample` jelölést kap, így az oldalon
 * látszik rajta a „Példa – cseréld le az Adminban” felirat. Amint az Adminban
 * szerkesztik, a jelölés eltűnik.
 *
 * Csak a „Botondember” név szerepelhet – teljes név, iskola, lakóhely nem.
 */

/** A menüben megjelenő, alapból meglévő aloldalak. */
export const CORE_PAGES = [
  {
    key: "hobbies",
    slug: "hobbijaim",
    template: "hobbies",
    icon: "Sparkles",
    sort: 1,
    introMd: "Ezekkel töltöm a szabadidőmet – sport, alkotás és egy kis programozás.",
    seoDescription: "Botondember hobbijai: sport, alkotás és programozás.",
  },
  {
    key: "games",
    slug: "jatekaim",
    template: "games",
    icon: "Gamepad2",
    sort: 2,
    introMd: "A kedvenc játékaim értékeléssel és egy-két mondatos véleménnyel.",
    seoDescription: "Botondember kedvenc játékai értékeléssel és véleménnyel.",
  },
  {
    key: "youtube",
    slug: "youtube",
    template: "youtube",
    icon: "MonitorPlay",
    sort: 3,
    introMd:
      "Zenék, videók, csatornák és lejátszási listák, amiket szeretek. Kattints bármelyikre – új lapon nyílik meg a YouTube-on.",
    seoDescription: "Botondember kedvenc zenéi, videói, csatornái és lejátszási listái a YouTube-on.",
  },
  {
    key: "football",
    slug: "real-madrid",
    template: "football",
    icon: "Crown",
    sort: 4,
    introMd: "Hala Madrid! Ez a kedvenc focicsapatom – itt mesélek róla.",
    seoDescription: "Botondember kedvenc focicsapata, a Real Madrid: kedvenc játékosok, pillanatok és érdekességek.",
  },
] as const;

export const FOOTBALL_SECTIONS = [
  { type: "hero", sort: 1, title: "Real Madrid", bodyMd: "Hala Madrid y nada más!", link: "" },
  {
    type: "why",
    sort: 2,
    title: "",
    bodyMd:
      "**Példa szöveg – írd át az Adminban!**\n\n" +
      "Itt meséld el, hogyan lettél Real Madrid-szurkoló: melyik volt az első meccs, amit láttál, " +
      "ki a kedvenc játékosod, és mi tetszik a legjobban a csapatban.\n\n" +
      "- Mióta szurkolsz nekik?\n- Mi a kedvenc emléked?\n- Kivel szoktad nézni a meccseket?",
    link: "",
  },
  { type: "players", sort: 3, title: "", bodyMd: "", link: "" },
  { type: "moments", sort: 4, title: "", bodyMd: "", link: "" },
  { type: "facts", sort: 5, title: "", bodyMd: "", link: "" },
  { type: "link", sort: 6, title: "", bodyMd: "", link: "https://www.realmadrid.com" },
] as const;

export const EXAMPLE_HOBBIES = [
  {
    title: "Foci",
    body: "Edzés a csapattal hetente kétszer, hétvégén meccs. A kedvenc posztom a támadó.",
    since: "2020",
    tag: "sport",
    placeholder: "hobby-sport",
  },
  {
    title: "Rajzolás",
    body: "Képregényfigurákat és saját tervezésű focimezeket rajzolok.",
    since: "",
    tag: "kreatív",
    placeholder: "hobby-creative",
  },
  {
    title: "Programozás",
    body: "Most tanulom, hogyan készül egy weboldal – ez itt az első!",
    since: "2026",
    tag: "tech",
    placeholder: "hobby-tech",
  },
] as const;

export const EXAMPLE_GAMES = [
  {
    title: "Neon Liga",
    platforms: ["pc", "playstation", "xbox"],
    genre: "Sport / foci",
    rating: 5,
    review: "Gyors meccsek, jó csapatépítés – barátokkal a legjobb.",
    featured: true,
    placeholder: "game-league",
  },
  {
    title: "Árnyék Osztag",
    platforms: ["pc", "playstation"],
    genre: "Taktikai lövöldözős",
    rating: 4,
    review: "Csapatjáték, ahol a tervezés fontosabb, mint a gyorsaság.",
    featured: false,
    placeholder: "game-squad",
  },
  {
    title: "Kockavilág",
    platforms: ["pc", "switch", "mobile"],
    genre: "Építős / kaland",
    rating: 4,
    review: "Bármit meg lehet építeni – a kreatív módot szeretem a legjobban.",
    featured: false,
    placeholder: "game-blocks",
  },
  {
    title: "Turbó Kupa",
    platforms: ["switch", "xbox"],
    genre: "Autóverseny",
    rating: 3,
    review: "Vicces pályák, de néha túl nehéz.",
    featured: false,
    placeholder: "game-racer",
  },
] as const;

const YT_HOME = "https://www.youtube.com/";

export const EXAMPLE_YOUTUBE = [
  { kind: "song", title: "Példa zeneszám 1", author: "Példa előadó", note: "", placeholder: "yt-song-1", itemCount: null },
  { kind: "song", title: "Példa zeneszám 2", author: "Példa előadó", note: "", placeholder: "yt-song-2", itemCount: null },
  { kind: "song", title: "Példa zeneszám 3", author: "Példa előadó", note: "", placeholder: "yt-song-3", itemCount: null },
  { kind: "video", title: "Példa videó 1", author: "Példa csatorna", note: "", placeholder: "yt-video-1", itemCount: null },
  { kind: "video", title: "Példa videó 2", author: "Példa csatorna", note: "", placeholder: "yt-video-2", itemCount: null },
  { kind: "video", title: "Példa videó 3", author: "Példa csatorna", note: "", placeholder: "yt-video-3", itemCount: null },
  {
    kind: "channel",
    title: "Példa csatorna 1",
    author: "",
    note: "Rövid megjegyzés: miért szeretem ezt a csatornát.",
    placeholder: "yt-channel-1",
    itemCount: null,
  },
  {
    kind: "channel",
    title: "Példa csatorna 2",
    author: "",
    note: "Rövid megjegyzés: miért szeretem ezt a csatornát.",
    placeholder: "yt-channel-2",
    itemCount: null,
  },
  {
    kind: "channel",
    title: "Példa csatorna 3",
    author: "",
    note: "Rövid megjegyzés: miért szeretem ezt a csatornát.",
    placeholder: "yt-channel-3",
    itemCount: null,
  },
  { kind: "playlist", title: "Példa lejátszási lista 1", author: "Botondember", note: "", placeholder: "yt-playlist-1", itemCount: 12 },
  { kind: "playlist", title: "Példa lejátszási lista 2", author: "Botondember", note: "", placeholder: "yt-playlist-2", itemCount: 25 },
].map((item) => ({ ...item, url: YT_HOME }));

export const EXAMPLE_PLAYERS = [
  { name: "Példa játékos", number: "7", position: "Támadó", note: "Írd ide, miért ő a kedvenced!", placeholder: "football-player-1" },
  { name: "Példa játékos", number: "10", position: "Középpályás", note: "Írd ide, miért ő a kedvenced!", placeholder: "football-player-2" },
  { name: "Példa játékos", number: "1", position: "Kapus", note: "Írd ide, miért ő a kedvenced!", placeholder: "football-player-3" },
] as const;

export const EXAMPLE_MOMENTS = [
  {
    year: "2024",
    title: "Példa pillanat",
    body: "Írd le, mi történt, és miért volt emlékezetes!",
    placeholder: "football-moment-1",
  },
  {
    year: "2026",
    title: "Példa trófea",
    body: "Melyik győzelemre emlékszel a legszívesebben?",
    placeholder: "football-moment-2",
  },
] as const;

/** Tartós, időben nem változó klubadatok (spec 9.5 példája alapján). */
export const EXAMPLE_FACTS = [
  { label: "Alapítva", value: "1902" },
  { label: "Stadion", value: "Santiago Bernabéu" },
  { label: "Város", value: "Madrid" },
  { label: "Becenév", value: "Los Blancos" },
  { label: "Színek", value: "fehér" },
] as const;
