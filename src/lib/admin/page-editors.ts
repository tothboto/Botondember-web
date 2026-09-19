/** Az aloldal-sablonok neve és a tartalmuk szerkesztőjének címe az Adminban. */

export const TEMPLATE_LABELS: Record<string, string> = {
  hobbies: "Hobbijaim sablon",
  games: "Játékaim sablon",
  youtube: "YouTube sablon",
  football: "Real Madrid sablon",
  generic: "Általános sablon",
};

export function contentEditorHref(page: { id: number; template: string }): string {
  switch (page.template) {
    case "hobbies":
      return "/admin/hobbijaim";
    case "games":
      return "/admin/jatekaim";
    case "youtube":
      return "/admin/youtube";
    case "football":
      return "/admin/real-madrid";
    default:
      return `/admin/oldal/${page.id}`;
  }
}
