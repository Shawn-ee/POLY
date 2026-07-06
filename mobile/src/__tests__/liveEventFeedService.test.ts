import { describe, expect, test, vi } from "vitest";
import { loadLiveEventFeed } from "../services/liveEventFeedService";

describe("live event feed service", () => {
  test("loads Live tab events from backend statusGroup=live route", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [
        {
          id: "live-event-id",
          slug: "live-mexico-ecuador",
          title: "Mexico vs Ecuador",
          description: "Live match",
          category: "Sports / Soccer",
          sportKey: "soccer",
          leagueKey: "world_cup",
          homeTeamName: "Mexico",
          awayTeamName: "Ecuador",
          startTime: new Date().toISOString(),
          status: "live",
          liveStatus: "in_progress",
          period: "2H",
          clock: "67:10",
          homeScore: 1,
          awayScore: 1,
          marketCount: 1,
          activeMarketCount: 1,
          metrics: {
            source: "event-route-mobile-markets",
            marketCount: 1,
            activeMarketCount: 1,
            liquidity: null,
            volume24h: null,
            commentCount: null,
          },
          markets: [
            {
              id: "winner-market",
              title: "Match Winner",
              description: null,
              status: "LIVE",
              marketGroupTitle: "Match Winner",
              marketType: "winner",
              propCategory: null,
              outcomes: [
                { id: "mexico", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
                { id: "draw", name: "Draw", label: "Draw", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
                { id: "ecuador", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
              ],
              event: null,
              rulesText: null,
            },
          ],
        },
      ],
      nextCursor: "live-event-id",
      page: { limit: 10, nextCursor: "live-event-id", hasMore: true },
    }));

    const feed = await loadLiveEventFeed({ listWorldCupEvents }, 10);

    expect(listWorldCupEvents).toHaveBeenCalledWith({ limit: 10, cursor: null, statusGroup: "live" });
    expect(feed.source).toBe("events-route-statusGroup-live");
    expect(feed.nextCursor).toBe("live-event-id");
    expect(feed.events).toHaveLength(1);
    expect(feed.events[0]).toMatchObject({
      id: "live-mexico-ecuador",
      status: "live",
      liveDataStatus: undefined,
    });
    expect(feed.events[0].markets[0].outcomes).toHaveLength(3);
  });

  test("passes backend cursor when loading another Live tab page", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [],
      nextCursor: null,
      page: { limit: 10, nextCursor: null, hasMore: false },
    }));

    await loadLiveEventFeed({ listWorldCupEvents }, 10, "live-cursor-2");

    expect(listWorldCupEvents).toHaveBeenCalledWith({ limit: 10, cursor: "live-cursor-2", statusGroup: "live" });
  });
});
