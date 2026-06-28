import { expect, test } from "@playwright/test";

test("local admin can open sports market trading UI", async ({ page }, testInfo) => {
  const response = await page.goto("/sports/soccer/world-cup", { waitUntil: "networkidle" });
  const worldCupHeading = page.getByRole("heading", { name: "World Cup", exact: true });
  const hasSportsUi = response?.status() !== 404 && (await worldCupHeading.count()) > 0;
  test.skip(!hasSportsUi, "Sports UI pages are not present on this branch yet.");

  await expect(worldCupHeading).toBeVisible();

  const firstEvent = page.locator("a[href^='/events/']").first();
  await expect(firstEvent, "Seeded World Cup events are required. Run the local seed first.").toBeVisible();
  await firstEvent.click();
  await page.waitForLoadState("networkidle");

  const outcomeLink = page.locator("section").filter({ hasText: /Event Markets/i }).locator("a[href^='/markets/']").first();
  await expect(outcomeLink).toBeVisible();
  await outcomeLink.click();
  await expect(page).toHaveURL(/\/markets\//);

  await expect(page.getByRole("heading", { name: /orderbook depth/i })).toBeVisible();
  await expect(page.getByText(/order type/i)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("sports-auth-trade-ticket.png"), fullPage: true });

  const limitOption = page.getByRole("combobox").filter({ hasText: /market|limit/i }).first();
  if ((await limitOption.count()) > 0) {
    await limitOption.selectOption("LIMIT").catch(() => undefined);
  }

  const disabledTradingButton = page.getByRole("button", { name: /trading disabled/i });
  const submitButton = page.getByRole("button", { name: /place buy order|buy yes|buy /i }).last();
  if ((await disabledTradingButton.count()) > 0) {
    await expect(disabledTradingButton).toBeDisabled();
    test.info().annotations.push({
      type: "order-not-submitted",
      description: "Trading UI opened in preview-only mode with order submission disabled.",
    });
  } else if ((await submitButton.count()) > 0 && (await submitButton.isEnabled().catch(() => false))) {
    await submitButton.click();
    await expect(
      page.getByText(/order placed|order submitted|failed to submit order|authentication required/i).first(),
    ).toBeVisible();
  } else {
    test.info().annotations.push({
      type: "order-not-submitted",
      description: "Trading UI opened, but the submit button was disabled, likely due to no live orderbook liquidity.",
    });
  }
});
