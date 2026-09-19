import { expect, test, type Page } from "@playwright/test";

/** A fókuszban lévő elem: neve és hogy látszik-e rajta a fókuszkeret. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    return {
      name: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " "),
      tag: el.tagName.toLowerCase(),
      id: el.id,
      outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
      inDialog: Boolean(el.closest("dialog[open]")),
    };
  });
}

test.describe("Billentyűzetes kezelés", () => {
  test("az első Tab az „Ugrás a tartalomra” linkre visz, és az Enter a tartalomra ugrik", async ({ page }) => {
    await page.goto("/hobbijaim");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Ugrás a tartalomra" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    expect((await focused(page))?.outline).toBe(true);
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await focused(page))?.id).toBe("main-content");
  });

  test("a fejléc minden eleme elérhető Tab-bal, látható fókuszkerettel; a belépő ablak Esc-re bezárul", async ({ page }) => {
    await page.goto("/");
    const visited: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const current = await focused(page);
      expect(current, "valaminek fókuszban kell lennie").not.toBeNull();
      expect(current?.outline, `látható fókuszkeret: ${current?.name}`).toBe(true);
      visited.push(current?.name ?? "");
      if (current?.name.includes("Itt a Főnök!")) break;
    }
    expect(visited.some((name) => name.includes("Itt a Főnök!")), visited.join(" | ")).toBe(true);
    // A menüpontok is sorra kerültek (a fejléc felirata előtt vagy után).
    expect(visited.join(" | ")).toContain("Váltás erre a nyelvre: English");

    await page.keyboard.press("Enter");
    const dialog = page.getByTestId("login-dialog");
    await expect(dialog).toBeVisible();
    expect((await focused(page))?.inDialog).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect((await focused(page))?.name).toContain("Itt a Főnök!");
  });

  test("a menüpontok is végigjárhatók Tab-bal (asztali nézet)", async ({ page }) => {
    await page.goto("/");
    const names: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const current = await focused(page);
      if (!current) break;
      expect(current.outline, `látható fókuszkeret: ${current.name}`).toBe(true);
      names.push(current.name);
      if (current.name.includes("Real Madrid")) break;
    }
    for (const label of ["Hobbijaim", "Játékaim", "YouTube", "Real Madrid"]) {
      expect(names.some((name) => name.includes(label)), `${label} – ${names.join(" | ")}`).toBe(true);
    }
  });

  test.describe("mobil nézet", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("a menü billentyűzettel nyitható, a fókusz a panelen belül marad, Esc bezárja", async ({ page }) => {
      await page.goto("/");
      const opener = page.getByRole("button", { name: "Menü megnyitása" });
      await opener.focus();
      await page.keyboard.press("Enter");
      const drawer = page.getByRole("dialog", { name: "Menü" });
      await expect(drawer).toBeVisible();
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press("Tab");
        const current = await focused(page);
        // A panel nyitva: a fókusz nem kerülhet ki mögé az oldalra.
        if (current) expect(current.inDialog, `a fókusz a panelen belül: ${current.name}`).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
      await expect(opener).toBeFocused();
    });
  });
});
