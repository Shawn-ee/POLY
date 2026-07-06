import { describe, expect, test } from "vitest";
import { assertEventListRoutePayloadShape } from "../services/eventListRouteShapeService";

const eventListPayload = () => ({
  events: [
    {
      id: "event-id",
      slug: "mexico-vs-ecuador",
      title: "Mexico vs Ecuador",
      description: "World Cup match",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      startTime: new Date().toISOString(),
      status: "scheduled",
      liveStatus: null,
      period: null,
      clock: null,
      homeScore: null,
      awayScore: null,
      marketCount: 1,
      activeMarketCount: 1,
      markets: [
        {
          id: "winner-market",
          title: "Regulation Time Winner",
          description: null,
          status: "OPEN",
          marketGroupTitle: "Regulation Time Winner",
          marketType: "winner",
          propCategory: null,
          outcomes: [
            { id: "home", name: "Mexico", label: "Mexico", side: "home", price: "0.42", bestBid: "0.41", bestAsk: "0.43", isTradable: true },
            { id: "draw", name: "Tie", label: "Tie", side: "draw", price: "0.31", bestBid: null, bestAsk: null, isTradable: true },
            { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: "0.27", bestBid: null, bestAsk: null, isTradable: true },
          ],
          event: null,
          rulesText: null,
        },
      ],
    },
  ],
  nextCursor: "event-id",
  page: { limit: 10, nextCursor: "event-id", hasMore: true },
});

describe("event list route shape service", () => {
  test("accepts compact event list payload used by Home Search Live and Futures", () => {
    const payload = eventListPayload();

    expect(() => assertEventListRoutePayloadShape(payload)).not.toThrow();
  });

  test("rejects missing market arrays before frontend detail fallback can invent rows", () => {
    const payload = eventListPayload();
    delete (payload.events[0] as { markets?: unknown }).markets;

    expect(() => assertEventListRoutePayloadShape(payload)).toThrow(/without markets array/);
  });

  test("rejects malformed cursor metadata before pagination state is applied", () => {
    const payload = eventListPayload();
    (payload.page as { nextCursor: unknown }).nextCursor = 123;

    expect(() => assertEventListRoutePayloadShape(payload)).toThrow(/malformed page nextCursor/);
  });

  test("rejects malformed outcome numeric fields before fallback odds", () => {
    const payload = eventListPayload();
    (payload.events[0].markets[0].outcomes[0] as { bestBid: unknown }).bestBid = "bad-bid";

    expect(() => assertEventListRoutePayloadShape(payload)).toThrow(/invalid bestBid/);
  });

  test("rejects negative outcome quote fields before frontend probability fallback", () => {
    const payload = eventListPayload();
    (payload.events[0].markets[0].outcomes[0] as { price: unknown }).price = "-0.01";

    expect(() => assertEventListRoutePayloadShape(payload)).toThrow(/invalid price/);
  });

  test("rejects negative outcome depth sizes before visible card state", () => {
    const payload = eventListPayload();
    (payload.events[0].markets[0].outcomes[0] as unknown as { bestAskSize: unknown }).bestAskSize = -1;

    expect(() => assertEventListRoutePayloadShape(payload)).toThrow(/invalid bestAskSize/);
  });
});
