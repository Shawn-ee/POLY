import { expect, test } from "@playwright/test";

const pages = [
  { path: "/admin/polymarket", heading: /polymarket/i },
  { path: "/admin/polymarket/imports", heading: /imports/i },
  { path: "/admin/polymarket/mappings", heading: /mappings/i },
  { path: "/admin/reference-prices", heading: /reference prices/i },
  { path: "/admin/market-maker", heading: /market maker/i },
  { path: "/admin/bot-risk", heading: /bot risk/i },
  { path: "/admin/ops", heading: /ops/i },
];

test("local admin can inspect Polymarket reference MM ops pages", async ({ page }) => {
  for (const item of pages) {
    await page.goto(item.path, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
    await expect(page.getByText(/local\/staging only/i)).toBeVisible();
    await expect(page.getByText(/log in to access admin tools/i)).toHaveCount(0);
    await expect(page.getByText(/you are not an admin/i)).toHaveCount(0);
  }

  const mm = await page.request.get("/api/admin/market-maker");
  expect(mm.ok()).toBeTruthy();
  const risk = await page.request.get("/api/admin/bot-risk");
  expect(risk.ok()).toBeTruthy();
  const ops = await page.request.get("/api/admin/ops");
  expect(ops.ok()).toBeTruthy();
});
