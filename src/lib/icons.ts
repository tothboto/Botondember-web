/**
 * A menüpontokhoz választható ikonok (lucide-react). Csak ezek kerülnek az
 * oldalba, így kicsi marad a letöltendő kód. Az Adminban ebből a listából
 * lehet ikont választani előnézettel.
 */
import {
  Award,
  Bike,
  BookOpen,
  Bot,
  Camera,
  Car,
  Cat,
  Code,
  Crown,
  Dog,
  Dumbbell,
  FileText,
  Film,
  Flame,
  Footprints,
  Gamepad2,
  Ghost,
  Globe,
  Guitar,
  Headphones,
  Heart,
  House,
  Joystick,
  Lightbulb,
  Medal,
  MonitorPlay,
  Mountain,
  Music,
  Palette,
  Pizza,
  Plane,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Tv,
  Volleyball,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

export const PAGE_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  Sparkles: { icon: Sparkles, label: "Csillogás" },
  Gamepad2: { icon: Gamepad2, label: "Kontroller" },
  MonitorPlay: { icon: MonitorPlay, label: "Videó" },
  Crown: { icon: Crown, label: "Korona" },
  Trophy: { icon: Trophy, label: "Kupa" },
  Medal: { icon: Medal, label: "Érem" },
  Award: { icon: Award, label: "Díj" },
  Star: { icon: Star, label: "Csillag" },
  Heart: { icon: Heart, label: "Szív" },
  Volleyball: { icon: Volleyball, label: "Labda" },
  Footprints: { icon: Footprints, label: "Lábnyomok" },
  Dumbbell: { icon: Dumbbell, label: "Súlyzó" },
  Bike: { icon: Bike, label: "Bicikli" },
  Target: { icon: Target, label: "Céltábla" },
  Shield: { icon: Shield, label: "Pajzs" },
  Joystick: { icon: Joystick, label: "Joystick" },
  Music: { icon: Music, label: "Zene" },
  Headphones: { icon: Headphones, label: "Fejhallgató" },
  Guitar: { icon: Guitar, label: "Gitár" },
  Tv: { icon: Tv, label: "Tévé" },
  Film: { icon: Film, label: "Film" },
  Camera: { icon: Camera, label: "Fényképező" },
  Palette: { icon: Palette, label: "Paletta" },
  BookOpen: { icon: BookOpen, label: "Könyv" },
  Code: { icon: Code, label: "Kód" },
  Bot: { icon: Bot, label: "Robot" },
  Rocket: { icon: Rocket, label: "Rakéta" },
  Lightbulb: { icon: Lightbulb, label: "Ötlet" },
  Puzzle: { icon: Puzzle, label: "Kirakós" },
  Zap: { icon: Zap, label: "Villám" },
  Flame: { icon: Flame, label: "Láng" },
  Globe: { icon: Globe, label: "Földgömb" },
  Plane: { icon: Plane, label: "Repülő" },
  Car: { icon: Car, label: "Autó" },
  Mountain: { icon: Mountain, label: "Hegy" },
  Dog: { icon: Dog, label: "Kutya" },
  Cat: { icon: Cat, label: "Macska" },
  Ghost: { icon: Ghost, label: "Szellem" },
  Pizza: { icon: Pizza, label: "Pizza" },
  House: { icon: House, label: "Ház" },
  FileText: { icon: FileText, label: "Dokumentum" },
};

export const DEFAULT_PAGE_ICON = "FileText";

export function getPageIcon(name: string | null | undefined): LucideIcon {
  return (name && PAGE_ICONS[name]?.icon) || FileText;
}

/** Egy menüikon kirajzolása a neve alapján (ismeretlen névre dokumentum ikon). */
export function PageIcon({ name, ...props }: { name: string | null | undefined } & LucideProps) {
  return createElement(getPageIcon(name), { "aria-hidden": true, ...props });
}

export function isKnownIcon(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PAGE_ICONS, name);
}
