import { expect, test } from "@playwright/test";

test("acceptance test 5 of 0.6: fails on purpose, reverted next", async ({
  page,
}) => {
  const response = await page.goto("/api/health");

  expect(response?.status()).toBe(500);
});
