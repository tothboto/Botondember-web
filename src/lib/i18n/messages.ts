/**
 * A felület („keretrendszer”) szövegei öt nyelven – ez a kezdő adat (seed).
 * Az alapnyelv a magyar; a többi nyelv a magyarból készült fordítás.
 * Az adatbázisba kerülés után az Admin > Fordítások menüben szerkeszthetők.
 *
 * Új kulcs felvételekor mind az öt nyelvet töltsd ki! A seed a már meglévő
 * (esetleg az Adminban átírt) fordításokat soha nem írja felül.
 *
 * Helyőrzők: `{name}` alakban (pl. `{count} videó`).
 */

/** Az a nyelv, amelyen a szövegek készülnek, és amelyre hiány esetén visszaesünk. */
export const SOURCE_LOCALE = "hu";

export const SEED_LOCALES = [
  { code: "hu", name: "Magyar", flag: "hu", isDefault: true, sort: 1 },
  { code: "en", name: "English", flag: "gb", isDefault: false, sort: 2 },
  { code: "es", name: "Español", flag: "es", isDefault: false, sort: 3 },
  { code: "de", name: "Deutsch", flag: "de", isDefault: false, sort: 4 },
  { code: "is", name: "Íslenska", flag: "is", isDefault: false, sort: 5 },
] as const;

type Row = { hu: string; en: string; es: string; de: string; is: string };

export const SEED_MESSAGES: Record<string, Row> = {
  // --- Menü és navigáció ------------------------------------------------
  "nav.mainLabel": { hu: "Főmenü", en: "Main menu", es: "Menú principal", de: "Hauptmenü", is: "Aðalvalmynd" },
  "nav.menuTitle": { hu: "Menü", en: "Menu", es: "Menú", de: "Menü", is: "Valmynd" },
  "nav.openMenu": { hu: "Menü megnyitása", en: "Open menu", es: "Abrir el menú", de: "Menü öffnen", is: "Opna valmynd" },
  "nav.closeMenu": { hu: "Menü bezárása", en: "Close menu", es: "Cerrar el menú", de: "Menü schließen", is: "Loka valmynd" },
  "nav.home": { hu: "Kezdőlap", en: "Home", es: "Inicio", de: "Startseite", is: "Forsíða" },

  // --- Fejléc --------------------------------------------------------------
  "header.homeLinkLabel": {
    hu: "{title} – ugrás a kezdőlapra",
    en: "{title} – go to the home page",
    es: "{title} – ir a la página de inicio",
    de: "{title} – zur Startseite",
    is: "{title} – fara á forsíðuna",
  },
  "header.boss": { hu: "Itt a Főnök!", en: "The Boss is here!", es: "¡Aquí está el Jefe!", de: "Der Boss ist da!", is: "Hér er stjórinn!" },
  "header.bossHint": {
    hu: "Belépés az admin felületre",
    en: "Log in to the admin area",
    es: "Entrar en la zona de administración",
    de: "Im Adminbereich anmelden",
    is: "Skrá inn á stjórnborðið",
  },
  "header.admin": { hu: "Admin", en: "Admin", es: "Admin", de: "Admin", is: "Stjórnborð" },
  "header.logout": { hu: "Kilépés", en: "Log out", es: "Cerrar sesión", de: "Abmelden", is: "Skrá út" },

  // --- Nyelvválasztó --------------------------------------------------------
  "lang.label": { hu: "Nyelv", en: "Language", es: "Idioma", de: "Sprache", is: "Tungumál" },
  "lang.choose": { hu: "Nyelv kiválasztása", en: "Choose language", es: "Elegir idioma", de: "Sprache wählen", is: "Veldu tungumál" },
  "lang.switchTo": {
    hu: "Váltás erre a nyelvre: {name}",
    en: "Switch to {name}",
    es: "Cambiar a {name}",
    de: "Zu {name} wechseln",
    is: "Skipta yfir í {name}",
  },

  // --- Téma -------------------------------------------------------------------
  "theme.label": { hu: "Téma", en: "Theme", es: "Tema", de: "Farbschema", is: "Þema" },
  "theme.choose": { hu: "Téma kiválasztása", en: "Choose theme", es: "Elegir tema", de: "Farbschema wählen", is: "Veldu þema" },
  "theme.system": { hu: "Rendszer", en: "System", es: "Sistema", de: "System", is: "Kerfi" },
  "theme.light": { hu: "Világos", en: "Light", es: "Claro", de: "Hell", is: "Ljóst" },
  "theme.dark": { hu: "Sötét", en: "Dark", es: "Oscuro", de: "Dunkel", is: "Dökkt" },

  // --- Általános -----------------------------------------------------------------
  "common.backToTop": { hu: "Vissza a tetejére", en: "Back to top", es: "Volver arriba", de: "Nach oben", is: "Aftur efst" },
  "common.skipToContent": {
    hu: "Ugrás a tartalomra",
    en: "Skip to content",
    es: "Saltar al contenido",
    de: "Zum Inhalt springen",
    is: "Fara beint í efnið",
  },
  "common.opensInNewTab": {
    hu: "(új lapon nyílik meg)",
    en: "(opens in a new tab)",
    es: "(se abre en una pestaña nueva)",
    de: "(öffnet in einem neuen Tab)",
    is: "(opnast í nýjum flipa)",
  },
  "common.example": {
    hu: "Példa – cseréld le az Adminban",
    en: "Example – replace it in the Admin",
    es: "Ejemplo: cámbialo en el Admin",
    de: "Beispiel – im Admin ersetzen",
    is: "Dæmi – skiptu því út í stjórnborðinu",
  },
  "common.empty": {
    hu: "Még nincs itt semmi.",
    en: "Nothing here yet.",
    es: "Todavía no hay nada aquí.",
    de: "Hier ist noch nichts.",
    is: "Hér er ekkert ennþá.",
  },
  "common.close": { hu: "Bezárás", en: "Close", es: "Cerrar", de: "Schließen", is: "Loka" },
  "common.visit": { hu: "Megnézem", en: "Take a look", es: "Ver", de: "Ansehen", is: "Skoða" },

  // --- Kezdőlap ----------------------------------------------------------------------
  "home.motto": { hu: "Mottó", en: "Motto", es: "Lema", de: "Motto", is: "Kjörorð" },

  // --- Lábléc ------------------------------------------------------------------------
  "footer.label": { hu: "Lábléc", en: "Footer", es: "Pie de página", de: "Fußzeile", is: "Síðufótur" },
  "footer.privacy": {
    hu: "Adatkezelési tájékoztató",
    en: "Privacy notice",
    es: "Aviso de privacidad",
    de: "Datenschutzhinweise",
    is: "Persónuverndaryfirlýsing",
  },
  "footer.cookies": {
    hu: "Cookie (süti) tájékoztató",
    en: "Cookie notice",
    es: "Aviso de cookies",
    de: "Cookie-Hinweis",
    is: "Upplýsingar um vafrakökur",
  },
  "footer.links": { hu: "Hasznos linkek", en: "Links", es: "Enlaces", de: "Links", is: "Tenglar" },

  // --- Belépés --------------------------------------------------------------------------
  "login.title": { hu: "Belépés", en: "Log in", es: "Iniciar sesión", de: "Anmelden", is: "Innskráning" },
  "login.intro": {
    hu: "Ez a rész csak az oldal gazdájának szól.",
    en: "This area is only for the site owner.",
    es: "Esta zona es solo para el dueño de la web.",
    de: "Dieser Bereich ist nur für den Seitenbesitzer.",
    is: "Þetta svæði er aðeins fyrir eiganda síðunnar.",
  },
  "login.username": { hu: "Felhasználónév", en: "Username", es: "Nombre de usuario", de: "Benutzername", is: "Notandanafn" },
  "login.password": { hu: "Jelszó", en: "Password", es: "Contraseña", de: "Passwort", is: "Lykilorð" },
  "login.submit": { hu: "Belépés", en: "Log in", es: "Entrar", de: "Anmelden", is: "Skrá inn" },
  "login.submitting": { hu: "Belépés…", en: "Logging in…", es: "Entrando…", de: "Anmeldung läuft…", is: "Skrái inn…" },
  "login.error": {
    hu: "Hibás felhasználónév vagy jelszó.",
    en: "Incorrect username or password.",
    es: "Usuario o contraseña incorrectos.",
    de: "Benutzername oder Passwort ist falsch.",
    is: "Rangt notandanafn eða lykilorð.",
  },
  "login.tooMany": {
    hu: "Túl sok sikertelen próbálkozás. Kérlek, várj {minutes} percet, és próbáld újra!",
    en: "Too many failed attempts. Please wait {minutes} minutes and try again!",
    es: "Demasiados intentos fallidos. Espera {minutes} minutos y vuelve a intentarlo.",
    de: "Zu viele Fehlversuche. Bitte warte {minutes} Minuten und versuche es dann erneut!",
    is: "Of margar misheppnaðar tilraunir. Bíddu í {minutes} mínútur og reyndu svo aftur!",
  },
  "login.required": {
    hu: "Kérlek, töltsd ki mindkét mezőt!",
    en: "Please fill in both fields!",
    es: "¡Rellena los dos campos!",
    de: "Bitte fülle beide Felder aus!",
    is: "Fylltu út bæði svæðin!",
  },
  "login.genericError": {
    hu: "Valami hiba történt. Próbáld újra!",
    en: "Something went wrong. Please try again!",
    es: "Algo ha salido mal. ¡Inténtalo de nuevo!",
    de: "Etwas ist schiefgelaufen. Bitte versuche es erneut!",
    is: "Eitthvað fór úrskeiðis. Reyndu aftur!",
  },

  // --- 404 oldal ---------------------------------------------------------------------------
  "notFound.title": {
    hu: "Hoppá! Ez az oldal nem található.",
    en: "Oops! This page can't be found.",
    es: "¡Uy! No encontramos esta página.",
    de: "Hoppla! Diese Seite wurde nicht gefunden.",
    is: "Úbbs! Þessi síða fannst ekki.",
  },
  "notFound.text": {
    hu: "Lehet, hogy elírtad a címet, vagy az oldal már nem létezik.",
    en: "Maybe the address has a typo, or the page no longer exists.",
    es: "Puede que la dirección tenga un error o que la página ya no exista.",
    de: "Vielleicht ist die Adresse falsch geschrieben, oder die Seite existiert nicht mehr.",
    is: "Kannski er villa í slóðinni, eða síðan er ekki lengur til.",
  },
  "notFound.back": {
    hu: "Vissza a kezdőlapra",
    en: "Back to the home page",
    es: "Volver al inicio",
    de: "Zurück zur Startseite",
    is: "Aftur á forsíðuna",
  },
  "notFound.metaTitle": {
    hu: "Az oldal nem található",
    en: "Page not found",
    es: "Página no encontrada",
    de: "Seite nicht gefunden",
    is: "Síða fannst ekki",
  },

  // --- Oldalak: menüpont (menu) és nagy cím (title) ------------------------------------------
  "page.hobbies.menu": { hu: "Hobbijaim", en: "My hobbies", es: "Mis aficiones", de: "Meine Hobbys", is: "Áhugamálin mín" },
  "page.hobbies.title": { hu: "Hobbijaim", en: "My hobbies", es: "Mis aficiones", de: "Meine Hobbys", is: "Áhugamálin mín" },
  "page.games.menu": { hu: "Játékaim", en: "My games", es: "Mis juegos", de: "Meine Spiele", is: "Leikirnir mínir" },
  "page.games.title": {
    hu: "Kedvenc játékaim",
    en: "My favourite games",
    es: "Mis juegos favoritos",
    de: "Meine Lieblingsspiele",
    is: "Uppáhaldsleikirnir mínir",
  },
  "page.youtube.menu": { hu: "YouTube", en: "YouTube", es: "YouTube", de: "YouTube", is: "YouTube" },
  "page.youtube.title": {
    hu: "Kedvenceim YouTube-on",
    en: "My YouTube favourites",
    es: "Mis favoritos de YouTube",
    de: "Meine YouTube-Favoriten",
    is: "Uppáhaldið mitt á YouTube",
  },
  "page.football.menu": { hu: "Real Madrid", en: "Real Madrid", es: "Real Madrid", de: "Real Madrid", is: "Real Madrid" },
  "page.football.title": {
    hu: "Kedvenc focicsapatom: Real Madrid",
    en: "My favourite football team: Real Madrid",
    es: "Mi equipo de fútbol favorito: el Real Madrid",
    de: "Mein Lieblingsverein: Real Madrid",
    is: "Uppáhaldsfótboltaliðið mitt: Real Madrid",
  },

  // --- Hobbijaim -------------------------------------------------------------------------------
  "hobbies.since": { hu: "Mióta csinálom", en: "Since", es: "Desde", de: "Seit", is: "Síðan" },

  // --- Játékaim --------------------------------------------------------------------------------
  "games.featured": { hu: "Kiemelt", en: "Featured", es: "Destacado", de: "Empfohlen", is: "Í brennidepli" },
  "games.allGames": {
    hu: "Összes játékom",
    en: "All my games",
    es: "Todos mis juegos",
    de: "Alle meine Spiele",
    is: "Allir leikirnir mínir",
  },
  "games.rating": { hu: "Értékelésem", en: "My rating", es: "Mi valoración", de: "Meine Bewertung", is: "Einkunnin mín" },
  "games.ratingValue": {
    hu: "{rating} / 5 csillag",
    en: "{rating} out of 5 stars",
    es: "{rating} de 5 estrellas",
    de: "{rating} von 5 Sternen",
    is: "{rating} af 5 stjörnum",
  },
  "games.platforms": { hu: "Platformok", en: "Platforms", es: "Plataformas", de: "Plattformen", is: "Kerfi" },
  "games.genre": { hu: "Műfaj", en: "Genre", es: "Género", de: "Genre", is: "Tegund" },
  "games.platform.mobile": { hu: "Mobil", en: "Mobile", es: "Móvil", de: "Mobil", is: "Farsími" },

  // --- YouTube -------------------------------------------------------------------------------
  "youtube.filterLabel": {
    hu: "Szűrés típus szerint",
    en: "Filter by type",
    es: "Filtrar por tipo",
    de: "Nach Typ filtern",
    is: "Sía eftir tegund",
  },
  "youtube.tab.all": { hu: "Mind", en: "All", es: "Todo", de: "Alle", is: "Allt" },
  "youtube.tab.songs": { hu: "Zeneszámok", en: "Songs", es: "Canciones", de: "Songs", is: "Lög" },
  "youtube.tab.videos": { hu: "Videók", en: "Videos", es: "Vídeos", de: "Videos", is: "Myndbönd" },
  "youtube.tab.channels": { hu: "Csatornák", en: "Channels", es: "Canales", de: "Kanäle", is: "Rásir" },
  "youtube.tab.playlists": {
    hu: "Lejátszási listák",
    en: "Playlists",
    es: "Listas de reproducción",
    de: "Playlists",
    is: "Spilunarlistar",
  },
  "youtube.section.songs": { hu: "Zeneszámok", en: "Songs", es: "Canciones", de: "Songs", is: "Lög" },
  "youtube.section.videos": { hu: "Videók", en: "Videos", es: "Vídeos", de: "Videos", is: "Myndbönd" },
  "youtube.section.channels": {
    hu: "Kedvenc csatornáim",
    en: "My favourite channels",
    es: "Mis canales favoritos",
    de: "Meine Lieblingskanäle",
    is: "Uppáhaldsrásirnar mínar",
  },
  "youtube.section.playlists": {
    hu: "Kedvenc lejátszási listáim",
    en: "My favourite playlists",
    es: "Mis listas de reproducción favoritas",
    de: "Meine Lieblings-Playlists",
    is: "Uppáhaldsspilunarlistarnir mínir",
  },
  "youtube.itemCount": { hu: "{count} videó", en: "{count} videos", es: "{count} vídeos", de: "{count} Videos", is: "{count} myndbönd" },
  "youtube.watchOnYoutube": {
    hu: "Megnyitás a YouTube-on",
    en: "Open on YouTube",
    es: "Abrir en YouTube",
    de: "Auf YouTube öffnen",
    is: "Opna á YouTube",
  },

  // --- Real Madrid -----------------------------------------------------------------------------
  "football.section.why": {
    hu: "Miért a Real Madrid?",
    en: "Why Real Madrid?",
    es: "¿Por qué el Real Madrid?",
    de: "Warum Real Madrid?",
    is: "Af hverju Real Madrid?",
  },
  "football.section.players": {
    hu: "Kedvenc játékosaim",
    en: "My favourite players",
    es: "Mis jugadores favoritos",
    de: "Meine Lieblingsspieler",
    is: "Uppáhaldsleikmennirnir mínir",
  },
  "football.section.moments": {
    hu: "Kedvenc pillanataim és trófeák",
    en: "My favourite moments and trophies",
    es: "Mis momentos y trofeos favoritos",
    de: "Meine Lieblingsmomente und Trophäen",
    is: "Uppáhaldsaugnablik og titlar",
  },
  "football.section.facts": {
    hu: "Klub alapadatok",
    en: "Club facts",
    es: "Datos del club",
    de: "Vereinsdaten",
    is: "Staðreyndir um félagið",
  },
  "football.section.link": {
    hu: "A hivatalos oldal",
    en: "The official website",
    es: "La web oficial",
    de: "Die offizielle Website",
    is: "Opinber vefsíða",
  },
  "football.officialLink": {
    hu: "Tovább a Real Madrid hivatalos oldalára",
    en: "Go to the official Real Madrid website",
    es: "Ir a la web oficial del Real Madrid",
    de: "Zur offiziellen Website von Real Madrid",
    is: "Fara á opinbera vefsíðu Real Madrid",
  },
  "football.number": { hu: "Mezszám", en: "Shirt number", es: "Dorsal", de: "Rückennummer", is: "Treyjunúmer" },
  "football.position": { hu: "Poszt", en: "Position", es: "Posición", de: "Position", is: "Staða" },

  // --- Jogi oldalak ------------------------------------------------------------------------------
  "legal.toc": { hu: "Tartalomjegyzék", en: "Contents", es: "Índice", de: "Inhalt", is: "Efnisyfirlit" },
  "legal.updated": {
    hu: "Utoljára frissítve: {date}",
    en: "Last updated: {date}",
    es: "Última actualización: {date}",
    de: "Zuletzt aktualisiert: {date}",
    is: "Síðast uppfært: {date}",
  },
  "legal.onlyHungarian": {
    hu: "A tájékoztató magyar nyelvű.",
    en: "This notice is only available in Hungarian.",
    es: "Este aviso solo está disponible en húngaro.",
    de: "Dieser Hinweis ist nur auf Ungarisch verfügbar.",
    is: "Þessi tilkynning er aðeins á ungversku.",
  },
};

/** A fordítási kulcsok csoportjai az Admin > Fordítások táblázathoz. */
export const MESSAGE_GROUPS: Record<string, string> = {
  nav: "Menü és navigáció",
  header: "Fejléc",
  lang: "Nyelvválasztó",
  theme: "Téma",
  common: "Általános",
  home: "Kezdőlap",
  footer: "Lábléc",
  login: "Belépés",
  notFound: "404 oldal",
  page: "Oldalak (menüpont és cím)",
  hobbies: "Hobbijaim",
  games: "Játékaim",
  youtube: "YouTube",
  football: "Real Madrid",
  legal: "Jogi oldalak",
};
