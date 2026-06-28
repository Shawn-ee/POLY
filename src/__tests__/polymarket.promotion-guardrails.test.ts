import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import { buildWorldCupDiscoveryReport, evaluatePromotionGuardrails } from "@/server/services/polymarket";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("evaluatePromotionGuardrails", () => {
  const report = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets as PolymarketGammaWire[],
    source: "fixture",
    fixtureMode: true,
    now: "2026-06-28T00:00:00.000Z",
  });

  test("marks valid World Cup markets eligible for enabled lifecycle", () => {
    const decisions = report.candidates
      .filter((candidate) =>
        ["pm-worldcup-france-win", "pm-worldcup-usa-mexico-1x2"].includes(candidate.market.externalMarketId),
      )
      .map(evaluatePromotionGuardrails);

    expect(decisions).toEqual([
      expect.objectContaining({
        externalMarketId: "pm-worldcup-france-win",
        eligible: true,
        recommendedLifecycleState: "enabled",
        checks: {
          mappingValidation: true,
          referenceSync: true,
          twoTickPricing: true,
          publicNoLeak: true,
          marketMakerDryRun: true,
        },
      }),
      expect.objectContaining({
        externalMarketId: "pm-worldcup-usa-mexico-1x2",
        eligible: true,
        recommendedLifecycleState: "enabled",
      }),
    ]);
  });

  test("blocks TBD, missing-token, and closed markets", () => {
    const tbd = report.candidates.find((candidate) => candidate.market.externalMarketId === "pm-worldcup-tbd-quarterfinal");
    const missingToken = report.candidates.find((candidate) => candidate.market.externalMarketId === "pm-worldcup-missing-token");
    const closed = report.candidates.find((candidate) => candidate.market.externalMarketId === "pm-worldcup-closed");
    expect(tbd).toBeDefined();
    expect(missingToken).toBeDefined();
    expect(closed).toBeDefined();

    expect(evaluatePromotionGuardrails(tbd!)).toMatchObject({
      eligible: false,
      recommendedLifecycleState: "mapped",
      reasonCodes: expect.arrayContaining(["mapping_admin_review_required", "tbd_team"]),
    });
    expect(evaluatePromotionGuardrails(missingToken!)).toMatchObject({
      eligible: false,
      recommendedLifecycleState: "draft",
      reasonCodes: expect.arrayContaining(["missing_token_mapping"]),
    });
    expect(evaluatePromotionGuardrails(closed!)).toMatchObject({
      eligible: false,
      recommendedLifecycleState: "draft",
      reasonCodes: expect.arrayContaining(["inactive_or_closed"]),
    });
  });
});
