import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildDraftImportPlanFromCandidates,
  buildDraftImportRequestFromCandidate,
  buildWorldCupDiscoveryReport,
} from "@/server/services/polymarket";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("buildDraftImportRequestFromCandidate", () => {
  test("creates hidden disabled draft import requests with mapping fields", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      now: "2026-06-28T00:00:00.000Z",
    });
    const request = buildDraftImportRequestFromCandidate(report.candidates[0]);

    expect(request.createEvents).toBe(true);
    expect(request.event).toMatchObject({
      title: "2026 FIFA World Cup",
      category: "sports",
      status: "draft",
      source: "polymarket",
    });
    expect(request.market).toMatchObject({
      desiredStatus: "draft",
      visibility: "PRIVATE",
      referenceSource: "polymarket",
      externalMarketId: "pm-worldcup-france-win",
      conditionId: "cond-worldcup-france-win",
      externalSlug: "will-france-win-2026-fifa-world-cup",
    });
    expect(request.market.referenceMetadata).toMatchObject({
      importStatus: "pending_review",
      lifecycleState: "draft",
      referenceOnly: true,
      tradable: false,
      mmEnabled: false,
      discoveryCandidateId: "polymarket:cond-worldcup-france-win",
    });
    expect(request.market.outcomes).toEqual([
      expect.objectContaining({ name: "Yes", isTradable: false, referenceTokenId: "tok-france-yes", referenceOutcomeLabel: "Yes" }),
      expect.objectContaining({ name: "No", isTradable: false, referenceTokenId: "tok-france-no", referenceOutcomeLabel: "No" }),
    ]);
  });

  test("keeps TBD and missing-token markets as non-tradable draft review imports", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
    });
    const tbd = report.candidates.find((candidate) => candidate.reasons.includes("tbd_team"));
    const missingToken = report.candidates.find((candidate) => candidate.reasons.includes("missing_token_mapping"));

    expect(tbd && buildDraftImportRequestFromCandidate(tbd).market.referenceMetadata).toMatchObject({
      lifecycleState: "draft",
      tradable: false,
      mmEnabled: false,
      discoveryReasons: ["tbd_team"],
    });
    expect(missingToken && buildDraftImportRequestFromCandidate(missingToken).market.outcomes.some((outcome) => !outcome.referenceTokenId)).toBe(true);
    expect(missingToken && buildDraftImportRequestFromCandidate(missingToken).market.outcomes.every((outcome) => outcome.isTradable === false)).toBe(true);
  });

  test("skips duplicate draft imports by external keys and outcome tokens", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
    });
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    expect(candidate).toBeDefined();

    const existingTokenPlan = buildDraftImportPlanFromCandidates([candidate!], new Set(["tok-france-yes"]));
    const repeatedCandidatePlan = buildDraftImportPlanFromCandidates([candidate!, candidate!]);

    expect(existingTokenPlan.planned).toHaveLength(0);
    expect(existingTokenPlan.skippedDuplicates).toEqual([
      expect.objectContaining({
        externalMarketId: "pm-worldcup-france-win",
        duplicateKey: "tok-france-yes",
        reason: "duplicate_candidate",
      }),
    ]);
    expect(repeatedCandidatePlan.planned).toHaveLength(1);
    expect(repeatedCandidatePlan.skippedDuplicates).toEqual([
      expect.objectContaining({
        externalMarketId: "pm-worldcup-france-win",
        duplicateKey: "cond-worldcup-france-win",
      }),
    ]);
  });
});
