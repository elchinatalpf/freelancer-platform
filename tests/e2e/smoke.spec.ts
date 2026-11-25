import { expect, test } from "@playwright/test";

test("the health check answers 200", async ({ page }) => {
  const response = await page.goto("/api/health");

  expect(response?.status()).toBe(200);
});

test("the home page shows its heading", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Empowered Professional Platform",
    }),
  ).toBeVisible();
});
