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

  test("rejects regulation winner markets without draw outcome before Event Detail applies", () => {
    const payload = detailPayload() as any;
    payload.markets[0].outcomes = [
      { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
    ];

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("without draw outcome");
  });

  test("rejects advance/no-draw markets with draw outcome before Event Detail applies", () => {
    const payload = detailPayload() as any;
    payload.event.marketProfile = "to_advance";
    payload.event.resultMode = "no_draw";
    payload.event.gameRules = {
      allowDraw: false,
      includesOvertime: true,
      description: "One team advances; no draw outcome.",
    };
    payload.event.supportedMarketTypes = ["to_advance"];
    payload.markets[0].marketType = "to_advance";
    payload.markets[0].outcomes = [
      { id: "home", name: "Home advances", label: "Home advances", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
      { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.16, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Away advances", label: "Away advances", side: "away", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
    ];

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("with draw outcome");
  });

  test("accepts full-match overtime winner markets with two no-draw outcomes", () => {
    const payload = detailPayload() as any;
    payload.event.marketProfile = "full_match_with_overtime";
    payload.event.resultMode = "no_draw";
    payload.event.gameRules = {
      allowDraw: false,
      includesOvertime: true,
      description: "Full match includes overtime; one team wins.",
    };
    payload.event.supportedMarketTypes = ["full_match_with_overtime"];
    payload.markets[0].id = "full-match-market";
    payload.markets[0].title = "Full Match Winner";
    payload.markets[0].marketType = "full_match_with_overtime";
    payload.markets[0].outcomes = [
      { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.51, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.49, bestBid: null, bestAsk: null, isTradable: true },
    ];

    expect(() => assertEventDetailRoutePayloadShape(payload)).not.toThrow();
  });

  test("rejects malformed backend game rules before Event Detail applies", () => {
    const payload = detailPayload() as any;
    payload.event.marketProfile = "shootout";

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed marketProfile");
  });

  test("rejects missing backend game rules before Event Detail applies", () => {
    const payload = detailPayload() as any;
    delete payload.event.gameRules;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed gameRules");
  });

  test("rejects missing market profile before Event Detail applies", () => {
    const payload = detailPayload() as any;
    delete payload.event.marketProfile;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed marketProfile");
  });

  test("rejects missing result mode before Event Detail applies", () => {
    const payload = detailPayload() as any;
    delete payload.event.resultMode;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed resultMode");
  });

  test("rejects missing supported market types before Event Detail applies", () => {
    const payload = detailPayload() as any;
    delete payload.event.supportedMarketTypes;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed supportedMarketTypes");
  });

  test("rejects inconsistent draw rules before Event Detail applies", () => {
    const payload = detailPayload() as any;
    payload.event.resultMode = "no_draw";
    payload.event.gameRules.allowDraw = true;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("inconsistent draw rules");
  });

  test("rejects market profile missing from supported market types before Event Detail applies", () => {
    const payload = detailPayload();
    payload.event.supportedMarketTypes = ["spread"];

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("unsupported marketProfile");
  });

  test("rejects route-backed line markets missing from supported market types", () => {
    const payload = detailPayload() as any;
    payload.event.supportedMarketTypes = ["regulation_90"];
    payload.markets.push({
      id: "spread-market",
      title: "Spread Mexico -1.5",
      description: null,
      status: "LIVE",
      marketGroupTitle: "Spread",
      marketType: "spread",
      period: "regulation",
      line: "1.5",
      propCategory: null,
      liquidity: "1000.50",
      outcomes: [
        { id: "yes", name: "Yes", label: "Yes", side: "yes", price: 0.45, bestBid: null, bestAsk: null, isTradable: true },
        { id: "no", name: "No", label: "No", side: "no", price: 0.55, bestBid: null, bestAsk: null, isTradable: true },
      ],
      event: null,
      rulesText: null,
    });

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("unsupported line family spread");
  });

  test("accepts supported line markets declared by selection family aliases", () => {
    const payload = detailPayload() as any;
    payload.event.supportedMarketTypes = ["regulation_90", "team-total"];
    payload.markets.push({
      id: "team-total-market",
      title: "Home Team Total Goals",
      description: null,
      status: "LIVE",
      marketGroupTitle: "Team Totals",
      marketType: null,
      period: "regulation",
      line: "1.5",
      selection: {
        marketType: "team_total_goals",
        marketFamily: "team_total",
        line: "1.5",
        period: "regulation",
      },
      propCategory: null,
      liquidity: "1000.50",
      outcomes: [
        { id: "over", name: "Over", label: "Over", side: "over", price: 0.45, bestBid: null, bestAsk: null, isTradable: true },
        { id: "under", name: "Under", label: "Under", side: "under", price: 0.55, bestBid: null, bestAsk: null, isTradable: true },
      ],
      event: null,
      rulesText: null,
    });

    expect(() => assertEventDetailRoutePayloadShape(payload)).not.toThrow();
  });

  test("rejects route-backed period winner markets missing from supported market types", () => {
    const payload = detailPayload() as any;
    payload.event.supportedMarketTypes = ["regulation_90"];
    payload.markets.push({
      id: "first-half-winner",
      title: "1st Half Winner",
      description: null,
      status: "LIVE",
      marketGroupTitle: "1st Half Winner",
      marketType: "moneyline",
      period: "first-half",
      line: null,
      propCategory: null,
      liquidity: "1000.50",
      outcomes: [
        { id: "home", name: "Home", label: "Home", side: "home", price: 0.36, bestBid: null, bestAsk: null, isTradable: true },
        { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
        { id: "away", name: "Away", label: "Away", side: "away", price: 0.33, bestBid: null, bestAsk: null, isTradable: true },
      ],
      event: null,
      rulesText: null,
    });

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("unsupported period market first-half");
  });

  test("accepts route-backed period winner markets declared by supported market types", () => {
    const payload = detailPayload() as any;
    payload.event.supportedMarketTypes = ["regulation_90", "second-half"];
    payload.markets.push({
      id: "second-half-winner",
      title: "2nd Half Winner",
      description: null,
      status: "LIVE",
      marketGroupTitle: "2nd Half Winner",
      marketType: "match_winner_1x2",
      period: "second-half",
      line: null,
      propCategory: null,
      liquidity: "1000.50",
      outcomes: [
        { id: "home", name: "Home", label: "Home", side: "home", price: 0.36, bestBid: null, bestAsk: null, isTradable: true },
        { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
        { id: "away", name: "Away", label: "Away", side: "away", price: 0.33, bestBid: null, bestAsk: null, isTradable: true },
      ],
      event: null,
      rulesText: null,
    });

    expect(() => assertEventDetailRoutePayloadShape(payload)).not.toThrow();
  });

  test("rejects negative live scores before Event Detail applies", () => {
    const payload = detailPayload();
    payload.event.homeScore = -1;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed score");
  });

  test("rejects malformed market counts before Event Detail applies", () => {
    const payload = detailPayload() as any;
    payload.event.marketCount = "1";

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed market counts");
  });

  test("rejects negative market counts before Event Detail applies", () => {
    const payload = detailPayload();
    payload.event.activeMarketCount = -1;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("malformed market counts");
  });

  test("rejects active market counts above total before Event Detail applies", () => {
    const payload = detailPayload();
    payload.event.marketCount = 1;
    payload.event.activeMarketCount = 2;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("inconsistent market counts");
  });

  test("rejects missing detail markets array", () => {
    const payload = detailPayload() as unknown as { markets?: unknown };
    delete payload.markets;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("without markets array");
  });

  test("rejects malformed outcome quote fields", () => {
    const payload = detailPayload() as any;
    payload.markets[0].outcomes[0].bestAsk = "not-a-number";

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("invalid bestAsk");
  });

  test("rejects outcome quote prices above probability bounds", () => {
    const payload = detailPayload() as any;
    payload.markets[0].outcomes[0].price = 1.2;

    expect(() => assertEventDetailRoutePayloadShape(payload)).toThrow("invalid price");
  });

  test("allows large backend depth sizes on outcome quotes", () => {
    const payload = detailPayload() as any;
    payload.markets[0].outcomes[0].bestBid = "0.4";
    payload.markets[0].outcomes[0].bestAsk = "0.45";
    payload.markets[0].outcomes[0].bestBidSize = "1000.5";
    payload.markets[0].outcomes[0].bestAskSize = 2500;

    expect(() => assertEventDetailRoutePayloadShape(payload)).not.toThrow();
  });
});
