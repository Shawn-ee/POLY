import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import { buildWorldCupAdminReviewReport, buildWorldCupDiscoveryReport } from "@/server/services/polymarket";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("buildWorldCupAdminReviewReport", () => {
  test("summarizes imported candidate review data and recommended actions", () => {
    const discovery = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      now: "2026-06-28T00:00:00.000Z",
    });

    const report = buildWorldCupAdminReviewReport(discovery.candidates);

    expect(report).toMatchObject({
      dryRun: true,
      candidateCount: 5,
      approveCount: 2,
      holdCount: 1,
      rejectCount: 2,
    });
    expect(report.items.find((item) => item.external.externalMarketId === "pm-worldcup-france-win")).toMatchObject({
      recommendedAction: "approve",
      external: {
        conditionId: "cond-worldcup-france-win",
        externalSlug: "will-france-win-2026-fifa-world-cup",
      },
      internalDraft: {
        visibility: "PRIVATE",
        desiredStatus: "draft",
        tradable: false,
        mmEnabled: false,
      },
      outcomes: [
        { internalName: "Yes", tokenId: "tok-france-yes" },
        { internalName: "No", tokenId: "tok-france-no" },
      ],
      validation: {
        status: "validated",
        confidence: 1,
      },
      reference: {
        bestBid: 0.3,
        bestAsk: 0.32,
        stale: false,
      },
      promotion: {
        eligible: true,
        recommendedLifecycleState: "enabled",
      },
    });
    expect(report.items.find((item) => item.external.externalMarketId === "pm-worldcup-tbd-quarterfinal")).toMatchObject({
      recommendedAction: "hold",
      validation: {
        status: "admin_review_required",
        adminReviewRequired: true,
        reasonCodes: expect.arrayContaining(["tbd_team"]),
      },
    });
    expect(report.items.find((item) => item.external.externalMarketId === "pm-worldcup-missing-token")).toMatchObject({
      recommendedAction: "reject",
      validation: {
        status: "blocked",
        missingFields: ["outcomeTokenIds"],
      },
    });
  });
});
