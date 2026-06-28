import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildWorldCupDiscoveryReport,
  planImportedCandidateMarketMakerDryRun,
} from "@/server/services/polymarket";
import { PolymarketGammaWire, PolymarketImportCandidate } from "@/server/services/polymarket/types";

describe("imported market MM dry-run planning", () => {
  const now = Date.parse("2026-06-28T00:00:00.000Z");
  const report = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets as PolymarketGammaWire[],
    source: "fixture",
    fixtureMode: true,
    now: "2026-06-28T00:00:00.000Z",
  });

  function candidate(externalMarketId: string): PolymarketImportCandidate {
    const found = report.candidates.find((item) => item.market.externalMarketId === externalMarketId);
    if (!found) throw new Error(`Missing fixture candidate ${externalMarketId}`);
    return found;
  }

  test("valid imported market creates dry-run bot order intents using two-tick worse prices", () => {
    const result = planImportedCandidateMarketMakerDryRun(candidate("pm-worldcup-france-win"), {
      now,
      fetchedAt: "2026-06-27T23:59:55.000Z",
    });

    expect(result.referenceSync).toBe(true);
    expect(result.skippedReason).toBeNull();
    expect(result.plan.intents).toEqual([
      expect.objectContaining({ side: "BUY", price: 0.29, dryRun: true, status: "DRY_RUN" }),
      expect.objectContaining({ side: "SELL", price: 0.33, dryRun: true, status: "DRY_RUN" }),
      expect.objectContaining({ side: "BUY", price: 0.67, dryRun: true, status: "DRY_RUN" }),
      expect.objectContaining({ side: "SELL", price: 0.71, dryRun: true, status: "DRY_RUN" }),
    ]);
    expect(result.plan.skipped).toEqual([]);
  });

  test("stale reference blocks imported market MM dry-run", () => {
    const result = planImportedCandidateMarketMakerDryRun(candidate("pm-worldcup-france-win"), {
      now,
      fetchedAt: "2026-06-27T23:00:00.000Z",
    });

    expect(result.plan.intents).toHaveLength(0);
    expect(result.plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "reference_stale" });
  });

  test("closed, disabled mapping, and risk-limited candidates are skipped", () => {
    const closed = planImportedCandidateMarketMakerDryRun(candidate("pm-worldcup-closed"), { now });
    const disabled = planImportedCandidateMarketMakerDryRun(candidate("pm-worldcup-france-win"), {
      now,
      fetchedAt: "2026-06-27T23:59:55.000Z",
      mappingEnabled: false,
    });
    const riskLimited = planImportedCandidateMarketMakerDryRun(candidate("pm-worldcup-france-win"), {
      now,
      fetchedAt: "2026-06-27T23:59:55.000Z",
      maxOutcomeExposure: 0.5,
    });

    expect(closed.plan.intents).toHaveLength(0);
    expect(closed.plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "inactive_or_closed" });
    expect(disabled.plan.intents).toHaveLength(0);
    expect(disabled.plan.skipped).toContainEqual({ marketId: "market-1", outcomeId: null, reason: "mapping_disabled" });
    expect(riskLimited.plan.intents).toHaveLength(0);
    expect(riskLimited.plan.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ marketId: "market-1", reason: "risk_exceeded" }),
      ]),
    );
  });
});
