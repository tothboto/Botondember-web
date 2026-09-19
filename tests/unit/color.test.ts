import { describe, expect, it } from "vitest";
import { contrastLevel, contrastRatio } from "@/lib/color";
import { BRAND_COLOR_DEFAULTS as C } from "@/lib/settings";

describe("színkontraszt (WCAG)", () => {
  it("fekete a fehéren 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("a Real Madrid kék a fehéren kb. 7,7:1 (AA) – ahogy a specifikáció írja", () => {
    const ratio = contrastRatio(C.blue, C.white);
    expect(ratio).toBeGreaterThan(7.5);
    expect(ratio).toBeLessThan(7.9);
    expect(contrastLevel(ratio)).toBe("AAA");
  });

  it("a sötétkék szöveg a fehér háttéren olvasható", () => {
    expect(contrastRatio(C.navy, C.white)).toBeGreaterThan(4.5);
  });

  it("az arany a sötétkéken olvasható (sötét mód), de a fehéren nem", () => {
    expect(contrastRatio(C.gold, C.navy)).toBeGreaterThan(4.5);
    expect(contrastRatio(C.gold, C.white)).toBeLessThan(3);
  });

  it("a szintek elnevezése", () => {
    expect(contrastLevel(8)).toBe("AAA");
    expect(contrastLevel(5)).toBe("AA");
    expect(contrastLevel(3.2)).toBe("AA nagy szövegnél");
    expect(contrastLevel(1.9)).toBe("Gyenge");
  });
});
