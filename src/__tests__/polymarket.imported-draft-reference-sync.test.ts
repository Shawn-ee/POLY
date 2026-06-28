import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildDraftImportRequestFromCandidate,
  buildWorldCupDiscoveryReport,
} from "@/server/services/polymarket";
import {
  buildReferenceSnapshotInputsForMarket,
  readFixtureGammaMarketFromMetadata,
} from "@/server/services/polymarketReferenceSnapshots";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("imported draft reference sync fixture path", () => {
  test("draft imports carry fixture reference data for deterministic sync", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      now: "2026-06-28T00:00:00.000Z",
    });
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    expect(candidate).toBeDefined();
    const request = buildDraftImportRequestFromCandidate(candidate!);

    expect(readFixtureGammaMarketFromMetadata(request.market.referenceMetadata)).toMatchObject({
      bestBid: 0.3,
      bestAsk: 0.32,
      spread: 0.02,
      acceptingOrders: true,
      outcomes: [
        { label: "Yes", tokenId: "tok-france-yes", outcomePrice: 0.31 },
        { label: "No", tokenId: "tok-france-no", outcomePrice: 0.69 },
      ],
    });
  });

  test("builds ReferenceQuoteSnapshot inputs for an imported draft mapping", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
    });
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    expect(candidate).toBeDefined();
    const request = buildDraftImportRequestFromCandidate(candidate!);
    const gamma = readFixtureGammaMarketFromMetadata(request.market.referenceMetadata);
    expect(gamma).toBeDefined();

    const inputs = buildReferenceSnapshotInputsForMarket(
      {
        id: "market-local-1",
        title: request.market.title,
        externalSlug: request.market.externalSlug ?? null,
        externalMarketId: request.market.externalMarketId ?? null,
        conditionId: request.market.conditionId ?? null,
        referenceMetadata: request.market.referenceMetadata,
        outcomes: request.market.outcomes.map((outcome, index) => ({
          id: `outcome-local-${index + 1}`,
          name: outcome.name,
          referenceTokenId: outcome.referenceTokenId ?? null,
          referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
        })),
      },
      gamma!,
      "2026-06-28T00:00:00.000Z",
    );

    expect(inputs).toEqual([
      expect.objectContaining({
        marketId: "market-local-1",
        outcomeId: "outcome-local-1",
        source: "polymarket",
        externalMarketId: "pm-worldcup-france-win",
        conditionId: "cond-worldcup-france-win",
        tokenId: "tok-france-yes",
        bestBid: 0.3,
        bestAsk: 0.32,
        spread: 0.02,
        qualityStatus: "high_quality",
        mmEligible: true,
      }),
      expect.objectContaining({
        outcomeId: "outcome-local-2",
        tokenId: "tok-france-no",
        outcomePrice: 0.69,
      }),
    ]);
  });
});
