import fs from "fs";
import path from "path";

describe("World Cup trading-path gates", () => {
  test("orderbook placement calls the shared market visibility gate before trading", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "server", "services", "matching.ts"), "utf8");

    expect(source).toContain("assertMarketVisibleToUser");
    expect(source).toContain("await assertMarketVisibleToUser({ market, userId: params.userId })");
    expect(source.indexOf("await assertMarketVisibleToUser({ market, userId: params.userId })")).toBeLessThan(
      source.indexOf("ensurePublicOrderbookLive(market)"),
    );
  });

  test("combo quote and order validation checks World Cup market eligibility before pricing", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "server", "services", "comboOrders.ts"), "utf8");

    expect(source).toContain("assertComboWorldCupMarketsEligible");
    expect(source).toContain("worldCupEligibleMarketWhere");
    expect(source.indexOf("await assertComboWorldCupMarketsEligible(marketIds)")).toBeLessThan(
      source.indexOf("const outcomes = await prisma.outcome.findMany"),
    );
  });
});
