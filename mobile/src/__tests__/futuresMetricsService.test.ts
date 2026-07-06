import { describe, expect, test } from "vitest";
import type { Market, Outcome } from "../mocks/worldCup";
import { futureMarketStats, futureOutcomeVolume } from "../services/futuresMetricsService";

const outcome: Outcome = {
  id: "france",
  label: "France",
  zhLabel: "France",
  probability: 37,
  color: "#2563eb",
};

const market: Market = {
  id: "world-cup-winner",
  title: "World Cup Winner",
  zhTitle: "World Cup Winner",
  type: "future",
  marketType: "future",
  liquidity: 1250.5,
  outcomes: [outcome],
};

describe("futures metrics service", () => {
  test("uses backend market liquidity and does not invent futures volume", () => {
    expect(futureMarketStats(market)).toEqual({
      volume: null,
      liquidity: 1250.5,
      source: "backend-market-liquidity",
    });
  });

  test("keeps unavailable futures metrics unknown instead of deriving from probability", () => {
    const noBackendMetrics = { ...market, liquidity: undefined };

    expect(futureMarketStats(noBackendMetrics)).toEqual({
      volume: null,
      liquidity: null,
      source: "unavailable",
    });
    expect(futureOutcomeVolume(noBackendMetrics, outcome)).toBeNull();
  });
});
