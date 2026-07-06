import { describe, expect, test } from "vitest";
import type { Event } from "../mocks/worldCup";
import { eventCardStats } from "../services/eventCardMetricsService";

const event: Event = {
  id: "mexico-ecuador",
  title: "Mexico vs Ecuador",
  zhTitle: "Mexico vs Ecuador",
  league: "World Cup",
  startsAt: "Today 8:00 PM",
  status: "today",
  tag: "Group",
  zhTag: "Group",
  teams: [],
  markets: [],
};

describe("event card metrics service", () => {
  test("uses backend event metrics for Home game cards", () => {
    expect(eventCardStats({
      ...event,
      metrics: {
        source: "event-route-mobile-markets",
        marketCount: 4,
        activeMarketCount: 3,
        liquidity: 2250.75,
        volume24h: 9400,
        commentCount: null,
      },
    })).toEqual({
      volume: 9400,
      liquidity: 2250.75,
      source: "event-route-mobile-markets",
    });
  });

  test("keeps unavailable Home card metrics unknown instead of deriving from local markets", () => {
    expect(eventCardStats({
      ...event,
      markets: [
        {
          id: "local-market",
          title: "Winner",
          zhTitle: "Winner",
          type: "game-line",
          outcomes: [
            { id: "home", label: "Home", zhLabel: "Home", probability: 51, color: "#2563eb" },
            { id: "away", label: "Away", zhLabel: "Away", probability: 49, color: "#ef4444" },
          ],
        },
      ],
    })).toEqual({
      volume: null,
      liquidity: null,
      source: "unavailable",
    });
  });
});
