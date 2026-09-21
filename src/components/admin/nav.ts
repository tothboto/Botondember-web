import {
  BookOpenText,
  Crown,
  DatabaseBackup,
  Gamepad2,
  House,
  Images,
  KeyRound,
  Languages,
  LayoutDashboard,
  ListTree,
  MonitorPlay,
  Paintbrush,
  Scale,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon; description: string };

/** Az Admin menüpontjai (magyarul, nagy, egyértelmű gombokkal). */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Irányítópult", icon: LayoutDashboard, description: "Gyors linkek és az utolsó módosítások" },
  {
    href: "/admin/altalanos",
    label: "Általános",
    icon: Settings,
    description: "Oldal neve, fejléc felirata, favicon, téma, keresők, lábléc",
  },
  { href: "/admin/megjelenes", label: "Megjelenés", icon: Paintbrush, description: "Színek, betűtípusok, aloldalak színe" },
  { href: "/admin/kezdolap", label: "Kezdőlap", icon: House, description: "Hero kép, fő üzenet, alcím, mottó" },
  {
    href: "/admin/menu",
    label: "Menü és aloldalak",
    icon: ListTree,
    description: "Sorrend, elrejtés, ikonok, címek, új aloldal",
  },
  { href: "/admin/hobbijaim", label: "Hobbijaim", icon: Sparkles, description: "Bevezető és hobbi-kártyák" },
  { href: "/admin/jatekaim", label: "Játékaim", icon: Gamepad2, description: "Bevezető, játékok, kiemelt játék" },
  { href: "/admin/youtube", label: "YouTube", icon: MonitorPlay, description: "Zenék, videók, csatornák, listák" },
  { href: "/admin/real-madrid", label: "Real Madrid", icon: Crown, description: "Szekciók, játékosok, pillanatok, adatok" },
  { href: "/admin/jogi-oldalak", label: "Jogi oldalak", icon: Scale, description: "Tájékoztatók és az adatkezelő adatai" },
  {
    href: "/admin/tartalom-forditasa",
    label: "Saját szövegek fordítása",
    icon: BookOpenText,
    description: "A saját szövegeid (hobbik, leírások, kezdőlap) más nyelveken",
  },
  {
    href: "/admin/forditasok",
    label: "Nyelvek és felület",
    icon: Languages,
    description: "Nyelvek, zászlók és a felület (menü, gombok) szövegei",
  },
  { href: "/admin/mediatar", label: "Médiatár", icon: Images, description: "Feltöltött képek, alt szövegek" },
  {
    href: "/admin/mentes",
    label: "Mentés és visszaállítás",
    icon: DatabaseBackup,
    description: "A teljes tartalom mentése és visszatöltése",
  },
  { href: "/admin/fiok", label: "Fiók", icon: KeyRound, description: "Felhasználónév és jelszó" },
];
