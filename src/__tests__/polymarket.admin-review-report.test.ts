import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildDiscoveryCandidateQueueReviewReport,
  buildWorldCupAdminReviewReport,
  buildWorldCupDiscoveryReport,
} from "@/server/services/polymarket";
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

  test("summarizes persisted discovery candidate queue review data", () => {
    const report = buildDiscoveryCandidateQueueReviewReport([
      {
        id: "candidate-1",
        source: "polymarket",
        externalSlug: "usa-vs-mexico-world-cup-match-winner",
        externalMarketId: "pm-worldcup-usa-mexico-1x2",
        conditionId: "cond-worldcup-usa-mexico-1x2",
        title: "USA vs Mexico World Cup match winner",
        question: "USA vs Mexico World Cup match winner",
        eventTitle: "2026 FIFA World Cup",
        marketType: "match_winner_1x2",
        status: "draft_import_ready",
        confidence: "high",
        reasonCodes: ["duplicate_external_slug"],
        outcomes: [
          { name: "USA", tokenId: "tok-usa", externalOutcomeId: "tok-usa" },
          { name: "Draw", tokenId: "tok-draw", externalOutcomeId: "tok-draw" },
          { name: "Mexico", tokenId: "tok-mexico", externalOutcomeId: "tok-mexico" },
        ],
        tokenIds: ["tok-usa", "tok-draw", "tok-mexico"],
        rawMetadata: {
          candidateId: "polymarket:cond-worldcup-usa-mexico-1x2",
          duplicateKey: "cond-worldcup-usa-mexico-1x2",
          duplicateKeys: ["cond-worldcup-usa-mexico-1x2", "tok-usa"],
          market: { public: true },
        },
        batchId: "batch-1",
        importedEventId: null,
        importedMarketId: null,
        firstSeenAt: "2026-06-28T00:00:00.000Z",
        lastSeenAt: "2026-06-28T00:00:00.000Z",
      },
    ]);

    expect(report).toMatchObject({
      source: "persisted_discovery_candidates",
      candidateCount: 1,
      importReadyCount: 1,
      items: [
        {
          id: "candidate-1",
          recommendedAction: "approve",
          title: "USA vs Mexico World Cup match winner",
          marketType: "match_winner_1x2",
          tokenIds: ["tok-usa", "tok-draw", "tok-mexico"],
          duplicateStatus: "duplicate",
          rawMetadataSummary: {
            candidateId: "polymarket:cond-worldcup-usa-mexico-1x2",
            duplicateKey: "cond-worldcup-usa-mexico-1x2",
            duplicateKeys: ["cond-worldcup-usa-mexico-1x2", "tok-usa"],
          },
          outcomes: [
            { label: "USA", tokenId: "tok-usa" },
            { label: "Draw", tokenId: "tok-draw" },
            { label: "Mexico", tokenId: "tok-mexico" },
          ],
        },
      ],
    });
  });
});
