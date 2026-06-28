import { classifyWorldCupMarketVisibility } from "@/lib/sports/worldCupMarketEligibility";
import type { WorldCupMarketInput } from "@/lib/sports/worldCupEventPageModel";

const market = (overrides: Partial<WorldCupMarketInput> = {}): WorldCupMarketInput => ({
  id: "market-1",
  title: "USA vs Mexico: Total Goals",
  status: "LIVE",
  marketType: "total_goals",
  referenceSource: "polymarket",
  importStatus: "approved",
  referenceOnly: true,
  tradable: false,
  mmEnabled: false,
  visibility: "PUBLIC",
  isListed: true,
  referenceSummary: {
    source: "polymarket",
    referenceBid: 0.48,
    referenceAsk: 0.52,
    plannedBotBid: 0.46,
    plannedBotAsk: 0.54,
    isFresh: true,
    hasSnapshot: true,
  },
  outcomes: [
    { id: "over", name: "Over", bestBid: null, bestAsk: null, isTradable: true },
    { id: "under", name: "Under", bestBid: null, bestAsk: null, isTradable: true },
  ],
  ...overrides,
});

describe("World Cup market eligibility", () => {
  test("missing mapping is hidden from user-facing pages", () => {
    const result = classifyWorldCupMarketVisibility({
      market: market({ importStatus: null, referenceOnly: null, referenceSummary: null }),
      eventStatus: "scheduled",
    });

    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("missing_polymarket_mapping");
    expect(result.visibility).toBe("hidden");
    expect(result.tradeable).toBe(false);
  });

  test("mapping that is not approved is hidden", () => {
    const result = classifyWorldCupMarketVisibility({
      market: market({ importStatus: "pending_review" }),
      eventStatus: "scheduled",
    });

    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("draft_only");
  });

  test("fresh reference without local book is visible as reference-only and not tradeable", () => {
    const result = classifyWorldCupMarketVisibility({
      market: market(),
      eventStatus: "scheduled",
      internalTradingEnabled: true,
    });

    expect(result.eligible).toBe(true);
    expect(result.reasonCode).toBe("valid_reference_only");
    expect(result.priceDisplayMode).toBe("reference_only");
    expect(result.tradeable).toBe(false);
  });

  test("fresh reference plus local book is tradeable only under closed-beta safety flags", () => {
    const result = classifyWorldCupMarketVisibility({
      market: market({
        outcomes: [
          { id: "over", name: "Over", bestBid: 0.48, bestAsk: 0.52, price: 0.5, isTradable: true },
          { id: "under", name: "Under", bestBid: 0.46, bestAsk: 0.5, price: 0.48, isTradable: true },
        ],
      }),
      eventStatus: "scheduled",
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
    });

    expect(result.reasonCode).toBe("valid_local_book");
    expect(result.tradeable).toBe(true);

    const unsafe = classifyWorldCupMarketVisibility({
      market: market({ outcomes: [{ id: "over", name: "Over", bestBid: 0.48, bestAsk: 0.52, isTradable: true }] }),
      eventStatus: "scheduled",
      internalTradingEnabled: true,
      realMoneyMode: true,
    });
    expect(unsafe.reasonCode).toBe("unsafe_real_money_state");
    expect(unsafe.tradeable).toBe(false);
  });

  test("stale event and stale reference are hidden from normal users", () => {
    expect(classifyWorldCupMarketVisibility({ market: market(), eventStatus: "stale" }).reasonCode).toBe("stale_event");
    expect(
      classifyWorldCupMarketVisibility({
        market: market({ referenceSummary: { source: "polymarket", referenceBid: 0.48, referenceAsk: 0.52, isFresh: false, hasSnapshot: true } }),
        eventStatus: "scheduled",
      }).reasonCode,
    ).toBe("no_fresh_reference");
  });
});
