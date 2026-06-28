import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import { buildWorldCupDiscoveryReport } from "@/server/services/polymarket";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("buildWorldCupDiscoveryReport", () => {
  test("builds a fixture-first dry-run discovery report without unsupported markets", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      now: "2026-06-28T00:00:00.000Z",
    });

    expect(report).toMatchObject({
      source: "fixture",
      fixtureMode: true,
      dryRun: true,
      autoImportEnabled: false,
      autoPromoteEnabled: false,
    });
    expect(report.candidates.map((candidate) => candidate.market.externalMarketId)).toEqual([
      "pm-worldcup-france-win",
      "pm-worldcup-usa-mexico-1x2",
      "pm-worldcup-tbd-quarterfinal",
      "pm-worldcup-closed",
      "pm-worldcup-missing-token",
    ]);
    expect(report.ignored.map((market) => market.externalMarketId)).toEqual([
      "pm-worldcup-player-prop",
      "pm-non-worldcup-cricket",
    ]);
  });

  test("honors existing duplicate keys from mapped markets", () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      existingDuplicateKeys: new Set(["cond-worldcup-france-win"]),
    });

    expect(report.candidates.some((candidate) => candidate.duplicateKey === "cond-worldcup-france-win")).toBe(false);
  });

  test("honors duplicate keys by slug and outcome token", () => {
    const bySlug = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      existingDuplicateKeys: new Set(["will-france-win-2026-fifa-world-cup"]),
    });
    const byToken = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
      existingDuplicateKeys: new Set(["tok-france-yes"]),
    });

    expect(bySlug.candidates.some((candidate) => candidate.market.externalMarketId === "pm-worldcup-france-win")).toBe(false);
    expect(byToken.candidates.some((candidate) => candidate.market.externalMarketId === "pm-worldcup-france-win")).toBe(false);
  });
});
