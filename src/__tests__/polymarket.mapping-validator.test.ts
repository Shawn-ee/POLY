import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildPolymarketImportCandidates,
  buildWorldCupDiscoveryReport,
  parsePolymarketMarketCandidate,
  validatePolymarketCandidateMapping,
} from "@/server/services/polymarket";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("validatePolymarketCandidateMapping", () => {
  const report = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets as PolymarketGammaWire[],
    source: "fixture",
    fixtureMode: true,
    now: "2026-06-28T00:00:00.000Z",
  });

  test("validates a known two-outcome World Cup market", () => {
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    expect(candidate).toBeDefined();

    expect(validatePolymarketCandidateMapping(candidate!)).toMatchObject({
      status: "validated",
      confidence: 1,
      adminReviewRequired: false,
      eligibleForAutoPromotion: true,
      recommendedLifecycleState: "validated",
    });
  });

  test("validates a supported three-outcome 1X2 market", () => {
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-usa-mexico-1x2");
    expect(candidate).toBeDefined();

    expect(validatePolymarketCandidateMapping(candidate!)).toMatchObject({
      status: "validated",
      confidence: 1,
      marketType: "match_winner_1x2",
    });
  });

  test("requires admin review for TBD teams", () => {
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-tbd-quarterfinal");
    expect(candidate).toBeDefined();

    expect(validatePolymarketCandidateMapping(candidate!)).toMatchObject({
      status: "admin_review_required",
      confidence: 0.8,
      adminReviewRequired: true,
      eligibleForAutoPromotion: false,
      recommendedLifecycleState: "mapped",
    });
  });

  test("blocks missing tokens and closed markets", () => {
    const missingToken = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-missing-token");
    const closed = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-closed");
    expect(missingToken).toBeDefined();
    expect(closed).toBeDefined();

    expect(validatePolymarketCandidateMapping(missingToken!)).toMatchObject({
      status: "blocked",
      missingFields: ["outcomeTokenIds"],
      eligibleForAutoPromotion: false,
    });
    expect(validatePolymarketCandidateMapping(closed!)).toMatchObject({
      status: "blocked",
      reasonCodes: expect.arrayContaining(["inactive_or_closed"]),
      eligibleForAutoPromotion: false,
    });
  });

  test("marks unsupported player props as unsupported", () => {
    const rawMarket = (fixture.markets as PolymarketGammaWire[]).find((item) => item.id === "pm-worldcup-player-prop");
    const parsed = rawMarket ? parsePolymarketMarketCandidate(rawMarket) : null;
    expect(parsed).toBeDefined();
    const candidate = buildPolymarketImportCandidates({ event: null, markets: [parsed!] })[0];

    expect(validatePolymarketCandidateMapping(candidate)).toMatchObject({
      status: "unsupported",
      confidence: 0.4,
      reasonCodes: expect.arrayContaining(["unsupported_market_type"]),
      eligibleForAutoPromotion: false,
    });
  });

  test("marks existing duplicate mappings as duplicate", () => {
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    expect(candidate).toBeDefined();

    expect(validatePolymarketCandidateMapping(candidate!, new Set(["tok-france-yes"]))).toMatchObject({
      status: "duplicate",
      reasonCodes: expect.arrayContaining(["duplicate_mapping"]),
      eligibleForAutoPromotion: false,
    });
  });
});
