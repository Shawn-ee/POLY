import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import type { Market } from "../mocks/worldCup";
import {
  applyFutureChartErrorToMarket,
  applyFutureChartLoadingToMarket,
  applyFutureChartStateToMarket,
  futureChartRanges,
  loadFutureChartState,
} from "../services/futuresChartService";

const market: Market = {
  id: "world-cup-winner",
  title: "World Cup Winner",
  zhTitle: "World Cup Winner",
  type: "future",
  marketType: "future",
  outcomes: [
    { id: "france", label: "France", zhLabel: "France", probability: 41, color: "#2563eb" },
    { id: "brazil", label: "Brazil", zhLabel: "Brazil", probability: 22, color: "#60a5fa" },
  ],
};

describe("futures chart service", () => {
  test("loads backend future market chart state by selected range", async () => {
    const getMarketChart = vi.fn(async () => ({
      marketId: "world-cup-winner",
      source: "market-outcome-snapshot",
      range: "1H" as const,
      ranges: futureChartRanges,
      generatedAt: "2026-07-06T08:00:00.000Z",
      lastUpdated: "2026-07-06T07:59:00.000Z",
      emptyState: null,
      outcomes: [{ id: "france", name: "France" }],
      history: [
        { outcomeId: "france", timestamp: "2026-07-06T07:58:00.000Z", price: 0.39, probability: 39 },
        { outcomeId: "france", timestamp: "2026-07-06T07:59:00.000Z", price: 0.41, probability: 41 },
      ],
      series: {},
    }));

    const result = await loadFutureChartState({ getMarketChart } as unknown as PolyApi, market, "1H");
    const hydrated = applyFutureChartStateToMarket(market, result);

    expect(getMarketChart).toHaveBeenCalledWith("world-cup-winner", "1H");
    expect(result.status).toBe("ready");
    expect(hydrated.chartHistoryStatus).toBe("ready");
    expect(hydrated.chartHistorySource).toBe("market-chart-route");
    expect(hydrated.chartHistoryRange).toBe("1H");
    expect(hydrated.chartHistory).toEqual([
      { outcomeId: "france", timestamp: "2026-07-06T07:58:00.000Z", probability: 39 },
      { outcomeId: "france", timestamp: "2026-07-06T07:59:00.000Z", probability: 41 },
    ]);
  });

  test("marks loading, empty, and error states for visible futures chart proof", () => {
    expect(applyFutureChartLoadingToMarket(market, "MAX")).toMatchObject({
      chartHistoryStatus: "loading",
      chartHistoryRange: "MAX",
    });

    const empty = applyFutureChartStateToMarket(market, {
      status: "empty",
      source: "empty",
      range: "MAX",
      lastUpdated: null,
      emptyState: "no-history",
      chartHistory: [],
    });
    expect(empty.chartHistoryStatus).toBe("empty");
    expect(empty.chartHistorySource).toBe("empty");

    expect(applyFutureChartErrorToMarket(market, "1D")).toMatchObject({
      chartHistoryStatus: "error",
      chartHistoryRange: "1D",
    });
  });
});
