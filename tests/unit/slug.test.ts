import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/admin/slug";
import { slugSchema } from "@/lib/admin/schemas";

describe("slugify (URL-cím a címből)", () => {
  it("eltávolítja az ékezeteket, a szóközből kötőjel lesz", () => {
    expect(slugify("Kedvenc filmjeim")).toBe("kedvenc-filmjeim");
    expect(slugify("Árvíztűrő tükörfúrógép")).toBe("arvizturo-tukorfurogep");
  });

  it("az írásjeleket és a felesleges kötőjeleket kiszűri", () => {
    expect(slugify("  Helló, világ!!  ")).toBe("hello-vilag");
    expect(slugify("--Lego -- 2026--")).toBe("lego-2026");
  });

  it("legfeljebb 60 karakter, és nem végződik kötőjelre", () => {
    const slug = slugify(`${"a".repeat(59)} b`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("az eredmény megfelel a szerveroldali szabálynak", () => {
    expect(slugSchema.safeParse(slugify("Kedvenc könyveim és képregényeim")).success).toBe(true);
  });

  it("a foglalt címeket a szerver elutasítja", () => {
    expect(slugSchema.safeParse("admin").success).toBe(false);
    expect(slugSchema.safeParse("adatkezelesi-tajekoztato").success).toBe(false);
    expect(slugSchema.safeParse("Nagybetu").success).toBe(true); // kisbetűsítve elfogadható
    expect(slugSchema.safeParse("ékezetes").success).toBe(false);
  });
});
