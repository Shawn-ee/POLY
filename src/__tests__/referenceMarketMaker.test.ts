import { planReferenceMarketMakerIntents } from "@/server/services/referenceMarketMaker";

const now = Date.parse("2026-06-28T00:00:00.000Z");

const baseConfig = {
  id: "cfg-1",
  marketId: "market-1",
  outcomeId: null,
  enabled: true,
  dryRun: true,
  source: "polymarket",
  edgeTicks: 2,
  tickSize: 0.01,
  baseOrderSize: 1,
  maxOrderSize: 10,
  maxOutcomeExposure: 25,
  maxMarketExposure: 50,
  maxDailyNotional: 100,
  staleAfterSeconds: 15,
  minQuoteLifetimeSeconds: 5,
};

const baseReference = {
  marketId: "market-1",
  outcomeId: "outcome-yes",
  outcomeName: "YES",
  marketType: "yes_no" as const,
  referenceBid: 0.49,
  referenceAsk: 0.51,
  referenceMid: 0.5,
  fetchedAt: "2026-06-27T23:59:55.000Z",
  mappingEnabled: true,
};

describe("reference market maker dry-run planner", () => {
  test("dry-run writes intents without placing orders", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: true,
      configs: [baseConfig],
      references: [baseReference],
      now,
    });

    expect(plan.intents).toEqual([
      expect.objectContaining({ side: "BUY", price: 0.48, dryRun: true, status: "DRY_RUN" }),
      expect.objectContaining({ side: "SELL", price: 0.52, dryRun: true, status: "DRY_RUN" }),
    ]);
    expect(plan.skipped).toEqual([]);
  });

  test("stale reference is skipped", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: true,
      configs: [baseConfig],
      references: [{ ...baseReference, fetchedAt: "2026-06-27T23:00:00.000Z" }],
      now,
    });

    expect(plan.intents).toHaveLength(0);
    expect(plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "reference_stale" });
  });

  test("unsupported market is skipped", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: true,
      configs: [baseConfig],
      references: [{ ...baseReference, marketType: "correct_score" }],
      now,
    });

    expect(plan.intents).toHaveLength(0);
    expect(plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "unsupported_market_type" });
  });

  test("disabled mapping is skipped", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: true,
      configs: [baseConfig],
      references: [{ ...baseReference, mappingEnabled: false }],
      now,
    });

    expect(plan.intents).toHaveLength(0);
    expect(plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "mapping_disabled" });
  });

  test("exposure limit prevents quoting", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: true,
      configs: [{ ...baseConfig, maxOutcomeExposure: 0.5 }],
      references: [baseReference],
      now,
    });

    expect(plan.intents).toHaveLength(0);
    expect(plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: "outcome-yes", reason: "risk_exceeded" });
  });

  test("live mode plans non-dry-run intents for live-local execution", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: false,
      configs: [{ ...baseConfig, dryRun: false }],
      references: [baseReference],
      now,
    });

    expect(plan.intents).toEqual([
      expect.objectContaining({ side: "BUY", price: 0.48, dryRun: false, status: "PLANNED" }),
      expect.objectContaining({ side: "SELL", price: 0.52, dryRun: false, status: "PLANNED" }),
    ]);
    expect(plan.skipped).toEqual([]);
  });

  test("mode mismatch is skipped", () => {
    const plan = planReferenceMarketMakerIntents({
      dryRun: false,
      configs: [baseConfig],
      references: [baseReference],
      now,
    });

    expect(plan.intents).toHaveLength(0);
    expect(plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "mode_mismatch" });
  });
});
