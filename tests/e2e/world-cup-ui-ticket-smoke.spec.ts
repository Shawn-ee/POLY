import { expect, test } from "@playwright/test";

test("World Cup event renders grouped markets and gated ticket estimates", async ({ page }, testInfo) => {
  const worldCupResponse = await page.goto("/sports/soccer/world-cup", { waitUntil: "domcontentloaded" });
  test.skip(worldCupResponse?.status() === 404, "World Cup sports route is not available.");

  await expect(page.getByRole("heading", { name: /world cup/i })).toBeVisible();
  await page
    .waitForResponse((response) => response.url().includes("/api/sports/soccer/world-cup/events") && response.status() === 200, {
      timeout: 30_000,
    })
    .catch(() => null);
  await page.getByText(/France vs Argentina|Mexico vs South Korea|Brazil vs Morocco/i).first().waitFor({ timeout: 30_000 });

  const eventLink = page.locator("a[href^='/events/']").first();
  test.skip((await eventLink.count()) === 0, "No seeded World Cup events available for browser smoke.");
  await expect(eventLink).toBeVisible();
  await eventLink.click();
  await page.waitForLoadState("domcontentloaded");

  await expect(page.getByRole("heading", { name: /trade ticket/i })).toBeVisible();
  await expect(page.getByText(/match|goals|qualify/i).first()).toBeVisible();
  await expect(page.getByText(/trade ticket/i).first()).toBeVisible();
  await expect(page.getByText(/closed internal beta|test balances/i).first()).toBeVisible();

  const outcomeTile = page.locator("button").filter({ hasText: /local book|reference|no live price|not mapped|stale/i }).first();
  await expect(outcomeTile, "At least one World Cup market outcome tile should be rendered.").toBeVisible();
  await outcomeTile.click();

  await expect(page.getByText(/estimated shares/i).first()).toBeVisible();
  await expect(page.getByText(/potential profit/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /trading unavailable/i }).or(page.getByRole("link", { name: /open internal order ticket/i })).first(),
  ).toBeVisible();

  const amountInput = page.getByLabel(/amount/i).first();
  await amountInput.fill("25");
  await expect(page.getByText(/potential profit|estimated shares/i).first()).toBeVisible();

  const lineButtons = page.locator("button").filter({ hasText: /^(0\.5|1\.5|2\.5|3\.5|4\.5|5\.5)$/ });
  if ((await lineButtons.count()) > 1) {
    const ticketBeforeLineChange = await page.locator("aside").innerText();
    await lineButtons.nth(1).click();
    await expect(page.getByText(/trade ticket/i).first()).toBeVisible();
    await expect.poll(async () => page.locator("aside").innerText()).not.toBe(ticketBeforeLineChange);
  } else {
    test.info().annotations.push({
      type: "line-selector-limited",
      description: "Seeded World Cup event did not expose multiple line-selector buttons in this environment.",
    });
  }

  await expect(page.getByText(/local book|reference|no live price|not mapped|stale/i).first()).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath("world-cup-ui-ticket-smoke.png"), fullPage: true });
});
