import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// Szándékosan a legutolsó tesztfájl (zz-): egy saját „IP-címről” próbálkozik,
// hogy a többi teszt belépését ne tiltsa le.
test("5 hibás próbálkozás után 15 percre letiltja a belépést", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.77" } });
  const page = await context.newPage();
  const alert = page.getByTestId("login-dialog").getByRole("alert");

  for (let attempt = 1; attempt <= 5; attempt++) {
    await login(page, "valaki", `rossz-jelszo-${attempt}`);
    await expect(alert).toHaveText("Hibás felhasználónév vagy jelszó.");
  }

  await login(page, "valaki", "rossz-jelszo-6");
  await expect(alert).toContainText("Túl sok sikertelen próbálkozás");
  await context.close();
});
