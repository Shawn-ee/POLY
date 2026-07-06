import { describe, expect, test, vi } from "vitest";
import { eventDetailRouteKey, loadEventDetailForCard } from "../services/eventDetailHydrationService";

const detailPayload = {
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
    supportedMarketTypes: ["regulation_90" as const],
  },
  markets: [{
    id: "moneyline-market",
    title: "Regulation Time Winner",
    description: null,
    status: "LIVE",
    marketGroupTitle: "Regulation Time Winner",
    marketType: "moneyline",
    propCategory: null,
    outcomes: [
      { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
      { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
    ],
    event: null,
    rulesText: null,
  }],
};

describe("event detail hydration service", () => {
  test("prefers backend slug over normalized event id for detail route hydration", () => {
    expect(eventDetailRouteKey({ id: "db-event-id", backendSlug: "backend-event-slug" })).toBe("backend-event-slug");
    expect(eventDetailRouteKey({ id: "local-fixture-id" })).toBe("local-fixture-id");
  });

  test("loads route detail with backend slug and preserves event rules", async () => {
    const getEvent = vi.fn(async () => detailPayload);

    const event = await loadEventDetailForCard({ getEvent }, { id: "db-event-id", backendSlug: "backend-event-slug" });

    expect(getEvent).toHaveBeenCalledWith("backend-event-slug");
    expect(event).toMatchObject({
      id: "backend-event-slug",
      backendSlug: "backend-event-slug",
      marketProfile: "regulation_90",
      resultMode: "can_draw",
      gameRules: {
        allowDraw: true,
        includesOvertime: false,
      },
      supportedMarketTypes: ["regulation_90"],
    });
  });
});
