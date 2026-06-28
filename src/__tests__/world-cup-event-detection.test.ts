import { isWorldCupSoccerEvent } from "@/lib/sports/worldCupEventDetection";

describe("World Cup event detection", () => {
  test("accepts canonical sports soccer World Cup events", () => {
    expect(isWorldCupSoccerEvent({ category: "sports", sportKey: "soccer", leagueKey: "world_cup" })).toBe(true);
  });

  test("accepts imported grouped Polymarket soccer World Cup events", () => {
    expect(isWorldCupSoccerEvent({
      category: "Sports / Soccer",
      title: "2026 FIFA World Cup Winner",
      source: "polymarket",
      hasGroupedMarkets: true,
    })).toBe(true);
  });

  test("does not accept generic grouped soccer events without World Cup context", () => {
    expect(isWorldCupSoccerEvent({
      category: "Sports / Soccer",
      title: "Champions League Winner",
      source: "polymarket",
      hasGroupedMarkets: true,
    })).toBe(false);
  });
});
