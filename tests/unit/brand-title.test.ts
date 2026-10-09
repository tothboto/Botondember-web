import { describe, expect, it } from "vitest";
import { splitBrandTitle } from "@/lib/brand-title";

describe("a fejléc emblémájának felirata", () => {
  it("a név elöl áll: a többi szó a kis sorba kerül, alá", () => {
    expect(splitBrandTitle("Botondember első weboldala")).toEqual({
      lead: "Botondember",
      rest: "első weboldala",
      restFirst: false,
      initial: "B",
    });
    expect(splitBrandTitle("Botondember's first website").lead).toBe("Botondember's");
    expect(splitBrandTitle("Botondemberova prva web-stranica").rest).toBe("prva web-stranica");
  });

  it("a név hátul áll: a kis sor fölé kerül, a szórend nem változik", () => {
    expect(splitBrandTitle("La primera web de Botondember")).toEqual({
      lead: "Botondember",
      rest: "La primera web de",
      restFirst: true,
      initial: "B",
    });
    expect(splitBrandTitle("Fyrsta vefsíða Botondembers").lead).toBe("Botondembers");
  });

  it("ha a leghosszabb szó középen áll, vagy csak egy szó van, nem bont", () => {
    expect(splitBrandTitle("Az én legeslegjobb oldalam")).toMatchObject({ lead: "Az én legeslegjobb oldalam", rest: "" });
    expect(splitBrandTitle("  Botondember  ")).toMatchObject({ lead: "Botondember", rest: "", initial: "B" });
  });

  it("a jelvény betűje az első betű vagy szám, nagybetűvel", () => {
    expect(splitBrandTitle("élmények oldala").initial).toBe("É");
    expect(splitBrandTitle("„Botond” oldala").initial).toBe("B");
    expect(splitBrandTitle("★ ★").initial).toBe("");
  });
});
