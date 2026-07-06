import { describe, expect, test } from "vitest";
import { assertEventDetailRoutePayloadShape } from "../services/eventDetailRouteShapeService";

const detailPayload = () => ({
  event: {
    id: "db-event-id",
    slug: "backend-event-slug",
    title: "Mexico vs Ecuador",
    description: "Backend detail rules.",
    category: "Sports / Soccer",
    sportKey: "soccer",
    leagueKey: "world_cup",
    homeTeamName: "Mexico",
    awayTeamName: "Ecuador",
    startTime: "2026-07-10T20:00:00.000Z",
    status: "live",
    liveStatus: "in_progress",
    period: "2H",
    clock: "67:10",
    homeScore: 1,
    awayScore: 1,
    imageUrl: null,
    marketCount: 1,
    activeMarketCount: 1,
    marketProfile: "regulation_90" as const,
    resultMode: "can_draw" as const,
    gameRules: {
      allowDraw: true,
      includesOvertime: false,
      description: "Regulation market can settle as draw.",
    },
    supportedMarketTypes: ["regulation_90" as const, "spread" as const],
  },
  markets: [{
    id: "moneyline-market",
    title: "Regulation Time Winner",
    description: null,
    status: "LIVE",
    marketGroupTitle: "Regulation Time Winner",
    marketType: "regulation_90",
    period: "regulation",
    line: null,
    propCategory: null,
    liquidity: "1000.50",
    outcomes: [
      { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
      { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
    ],
    event: null,
    rulesText: null,
  }],
});

describe("event detail route shape service", () => {
  test("accepts backend-driven regulation detail with draw and numeric-string liquidity", () => {
    expect(() => assertEventDetailRoutePayloadShape(detailPayload())).not.toThrow();
  });

  test("accepts backend-driven advance/no-draw detail", () => {
    const payload = detailPayload() as any;
    payload.event.marketProfile = "to_advance";
    payload.event.resultMode = "no_draw";
    payload.event.gameRules = {
      allowDraw: false,
      includesOvertime: true,
      description: "One team advances; no draw outcome.",
    };
    payload.event.supportedMarketTypes = ["to_advance"];
    payload.markets[0].id = "advance-market";
    payload.markets[0].title = "Who Advances";
    payload.markets[0].marketType = "to_advance";
    payload.markets[0].outcomes = [
      { id: "home", name: "Home advances", label: "Home advances", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Away advances", label: "Away advances", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
    ];

    expect(() => assertEventDetailRoutePayloadShape(payload)).not.toThrow();
  });

  test("rejects malformed backend game rules before Event Detail applies", () => {
    const payload = detailPayload() as any;
    payload.event.marketProfile = "shootout";

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed marketProfile");
  });

  test("rejects negative live scores before Event Detail applies", () => {
    const payload = detailPayload();
    payload.event.homeScore = -1;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed score");
  });

  test("rejects missing detail markets array", () => {
    const payload = detailPayload() as unknown as { markets?: unknown };
    delete payload.markets;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("without markets array");
  });

  test("rejects malformed outcome quote fields", () => {
    const payload = detailPayload() as any;
    payload.markets[0].outcomes[0].bestAsk = "not-a-number";

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("non-numeric bestAsk");
  });
});
