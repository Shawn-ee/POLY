import { buildWorldCupEventPageModel, type WorldCupMarketInput } from "@/lib/sports/worldCupEventPageModel";

const event = {
  id: "event-bra-jpn",
  slug: "brazil-vs-japan",
  title: "Brazil vs. Japan",
  description: "World Cup fixture",
  homeTeamName: "Brazil",
  awayTeamName: "Japan",
  startTime: "2026-06-29T17:00:00.000Z",
  venue: "Houston",
  status: "scheduled",
  source: "polymarket",
  externalSlug: "fifwc-bra-jpn-2026-06-29",
};

function matchWinnerMarket(): WorldCupMarketInput {
  return {
    id: "moneyline",
    title: "Match Winner",
    status: "LIVE",
    marketType: "match_winner_1x2",
    marketGroupKey: "match_winner",
    marketGroupTitle: "Match Winner",
    referenceSource: "polymarket",
    importStatus: "approved",
    referenceOnly: true,
    visibility: "PUBLIC",
    isListed: true,
    externalMarketId: "636318:moneyline_3-way",
    externalSlug: "fifwc-bra-jpn-2026-06-29-moneyline-3-way",
    conditionId: "neg-risk-id",
    referenceSummary: {
      source: "polymarket",
      referenceBid: 0.57,
      referenceAsk: 0.58,
      isFresh: true,
      hasSnapshot: true,
      mmEligible: true,
    },
    outcomes: [
      {
        id: "brazil",
        name: "Brazil",
        displayOrder: 0,
        isTradable: true,
        referenceSummary: {
          source: "polymarket",
          outcomePrice: 0.575,
          referenceBid: 0.57,
          referenceAsk: 0.58,
          isFresh: true,
          hasSnapshot: true,
          mmEligible: true,
        },
      },
      {
        id: "draw",
        name: "Draw",
        displayOrder: 1,
        isTradable: true,
        referenceSummary: {
          source: "polymarket",
          outcomePrice: 0.255,
          referenceBid: 0.25,
          referenceAsk: 0.26,
          isFresh: true,
          hasSnapshot: true,
          mmEligible: true,
        },
      },
      {
        id: "japan",
        name: "Japan",
        displayOrder: 2,
        isTradable: true,
        referenceSummary: {
          source: "polymarket",
          outcomePrice: 0.175,
          referenceBid: 0.17,
          referenceAsk: 0.18,
          isFresh: true,
          hasSnapshot: true,
          mmEligible: true,
        },
      },
    ],
  };
}

describe("World Cup per-outcome reference prices", () => {
  test("renders Brazil, Draw, and Japan with distinct real reference prices", () => {
    const model = buildWorldCupEventPageModel({
      event,
      markets: [matchWinnerMarket()],
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
      now: new Date("2026-06-29T12:00:00.000Z"),
    });

    expect(model.groups).toHaveLength(1);
    expect(model.groups[0]).toMatchObject({ title: "Match Winner", displayType: "three_way" });
    expect(model.groups[0].outcomes.map((outcome) => [outcome.label, outcome.price])).toEqual([
      ["Brazil", 0.575],
      ["Draw", 0.255],
      ["Japan", 0.175],
    ]);
    expect(model.groups[0].outcomes.every((outcome) => outcome.source === "reference_price")).toBe(true);
  });
});
