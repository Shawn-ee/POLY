import { getSafeBasketBlockers, planSafeBasket, type SafeBasketCandidate } from "@/server/services/polymarketMmSafeBasket";

const candidate = (overrides: Partial<SafeBasketCandidate>): SafeBasketCandidate => ({
  marketId: overrides.marketId ?? "market-1",
  title: overrides.title ?? "USA vs Mexico Match Winner",
  marketType: overrides.marketType ?? "match_winner_1x2",
  status: overrides.status ?? "LIVE",
  mapped: overrides.mapped ?? true,
  freshReferenceCount: overrides.freshReferenceCount ?? 3,
  outcomeCount: overrides.outcomeCount ?? 3,
  existingConfig: overrides.existingConfig ?? false,
});

describe("Polymarket MM safe basket planner", () => {
  test("selects core mapped markets by priority and maxMarkets", () => {
    const plan = planSafeBasket([
      candidate({ marketId: "btts", title: "Both Teams To Score", marketType: "both_teams_to_score", freshReferenceCount: 2, outcomeCount: 2 }),
      candidate({ marketId: "total", title: "Total Goals", marketType: "total_goals", freshReferenceCount: 2, outcomeCount: 2 }),
      candidate({ marketId: "winner", title: "Match Winner", marketType: "match_winner_1x2" }),
    ], 2);

    expect(plan.selected.map((item) => item.marketId)).toEqual(["winner", "total"]);
    expect(plan.skipped.find((item) => item.marketId === "btts")?.reason).toBe("eligible");
  });

  test("skips unsupported, unmapped, stale-reference, and already configured markets", () => {
    const plan = planSafeBasket([
      candidate({ marketId: "player", marketType: "player_prop" }),
      candidate({ marketId: "unmapped", mapped: false }),
      candidate({ marketId: "missing-ref", freshReferenceCount: 1, outcomeCount: 2 }),
      candidate({ marketId: "configured", existingConfig: true }),
    ], 5);

    expect(plan.selected).toHaveLength(0);
    expect(Object.fromEntries(plan.skipped.map((item) => [item.marketId, item.reason]))).toEqual({
      player: "unsupported_market_type",
      unmapped: "not_mapped",
      "missing-ref": "missing_fresh_reference",
      configured: "already_configured",
    });
  });

  test("empty candidate list proves no basket can be selected", () => {
    const plan = planSafeBasket([], 5);

    expect(plan.selected).toEqual([]);
    expect(plan.skipped).toEqual([]);
    expect(getSafeBasketBlockers({ candidateCount: 0, selectedCount: plan.selected.length, maxMarkets: 5 })).toEqual([
      "no_world_cup_polymarket_markets_found",
      "selected_0_markets_less_than_target_3",
    ]);
  });

  test("confirm guard blocks mutation when fewer than three markets are eligible", () => {
    const plan = planSafeBasket([
      candidate({ marketId: "winner", title: "Match Winner", marketType: "match_winner_1x2" }),
      candidate({ marketId: "total", title: "Total Goals", marketType: "total_goals", freshReferenceCount: 2, outcomeCount: 2 }),
    ], 5);

    expect(plan.selected).toHaveLength(2);
    expect(getSafeBasketBlockers({ candidateCount: 2, selectedCount: plan.selected.length, maxMarkets: 5 })).toEqual([
      "selected_2_markets_less_than_target_3",
    ]);
    expect(getSafeBasketBlockers({ candidateCount: 2, selectedCount: plan.selected.length, maxMarkets: 2 })).toEqual([
      "selected_2_markets_less_than_target_3",
    ]);
  });
});
