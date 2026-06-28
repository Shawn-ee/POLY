import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildPolymarketImportCandidates,
  isWorldCupSoccerCandidate,
  parsePolymarketMarketCandidate,
} from "@/server/services/polymarket";

type FixtureMarket = Record<string, unknown>;

const parsedMarkets = () =>
  (fixture.markets as FixtureMarket[])
    .map(parsePolymarketMarketCandidate)
    .filter((market): market is NonNullable<typeof market> => market != null);

describe("World Cup discovery fixture", () => {
  test("parses supported World Cup known-team and 1X2 markets", () => {
    const markets = parsedMarkets();
    const knownTeam = markets.find((market) => market.externalMarketId === "pm-worldcup-france-win");
    const oneXtwo = markets.find((market) => market.externalMarketId === "pm-worldcup-usa-mexico-1x2");

    expect(knownTeam).toMatchObject({
      conditionId: "cond-worldcup-france-win",
      slug: "will-france-win-2026-fifa-world-cup",
      marketType: "yes_no",
      active: true,
      closed: false,
      outcomes: [
        { name: "Yes", tokenId: "tok-france-yes" },
        { name: "No", tokenId: "tok-france-no" },
      ],
    });
    expect(knownTeam && isWorldCupSoccerCandidate(knownTeam)).toBe(true);

    expect(oneXtwo).toMatchObject({
      marketType: "match_winner_1x2",
      outcomes: [
        { name: "USA", tokenId: "tok-usa" },
        { name: "Draw", tokenId: "tok-draw" },
        { name: "Mexico", tokenId: "tok-mexico" },
      ],
    });
    expect(oneXtwo && isWorldCupSoccerCandidate(oneXtwo)).toBe(true);
  });

  test("deduplicates duplicate external markets and classifies unsafe fixture cases", () => {
    const candidates = buildPolymarketImportCandidates({ event: null, markets: parsedMarkets() });
    const byMarketId = new Map(candidates.map((candidate) => [candidate.market.externalMarketId, candidate]));

    expect(candidates.filter((candidate) => candidate.duplicateKey === "cond-worldcup-france-win")).toHaveLength(1);
    expect(byMarketId.get("pm-worldcup-france-win")).toMatchObject({ confidence: "high", status: "draft", reasons: [] });
    expect(byMarketId.get("pm-worldcup-usa-mexico-1x2")).toMatchObject({ confidence: "high", status: "draft", reasons: [] });
    expect(byMarketId.get("pm-worldcup-tbd-quarterfinal")?.reasons).toContain("tbd_team");
    expect(byMarketId.get("pm-worldcup-player-prop")?.reasons).toContain("unsupported_market_type");
    expect(byMarketId.get("pm-non-worldcup-cricket")?.reasons).toContain("not_world_cup_soccer");
    expect(byMarketId.get("pm-worldcup-closed")?.reasons).toContain("inactive_or_closed");
    expect(byMarketId.get("pm-worldcup-missing-token")?.reasons).toContain("missing_token_mapping");
  });

  test("malformed fixture entries are ignored by the parser", () => {
    const malformedEntries = (fixture.markets as FixtureMarket[]).filter((entry) => !entry.id && !entry.question);
    expect(malformedEntries).toHaveLength(1);
    expect(parsePolymarketMarketCandidate(malformedEntries[0])).toBeNull();
  });
});
