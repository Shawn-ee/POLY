import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import {
  applyChartErrorToEvent,
  applyChartHistoryToEvent,
  applyChartLoadingToEvent,
  applyChartStateToEvent,
  chartMarketForEvent,
  chartRangeForEvent,
  loadMarketChartHistory,
  loadMarketChartState,
} from "../services/marketChartService";
import { worldCupEvents } from "../mocks/worldCup";

describe("market chart service", () => {
  test("selects the live primary market and 1D range", () => {
    const event = worldCupEvents.find((item) => item.status === "live");

    expect(event).toBeDefined();
    expect(chartRangeForEvent(event!)).toBe("1D");
    expect(chartMarketForEvent(event!)?.marketType).toBe("moneyline");
  });

  test("loads backend chart history in EventDetail shape", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const getMarketChart = vi.fn(async () => ({
      marketId: "france-argentina-live",
      source: "polymarket-clob-prices-history",
      range: "1D" as const,
      ranges: ["1D", "1W", "1M", "MAX"] as const,
      generatedAt: "2026-06-15T12:00:00.000Z",
      lastUpdated: "2026-06-15T11:59:00.000Z",
      emptyState: null,
      outcomes: [{ id: "australia", name: "Australia" }],
      history: [
        { outcomeId: "australia", timestamp: "2026-06-15T11:58:00.000Z", price: 0.41, probability: 41 },
        { outcomeId: "egypt", timestamp: "2026-06-15T11:59:00.000Z", price: 0.59, probability: 59 },
      ],
      series: {},
    }));

    const result = await loadMarketChartState({ getMarketChart } as unknown as PolyApi, event);
    const history = await loadMarketChartHistory({ getMarketChart } as unknown as PolyApi, event);

    expect(getMarketChart).toHaveBeenCalledWith("france-argentina-live", "1D");
    expect(result).toMatchObject({
      status: "ready",
      range: "1D",
      lastUpdated: "2026-06-15T11:59:00.000Z",
      emptyState: null,
    });
    expect(history).toEqual([
      { outcomeId: "australia", timestamp: "2026-06-15T11:58:00.000Z", probability: 41 },
      { outcomeId: "egypt", timestamp: "2026-06-15T11:59:00.000Z", probability: 59 },
    ]);
    const hydrated = applyChartStateToEvent(event, result);
    expect(hydrated.chartHistory).toEqual(history);
    expect(hydrated.chartHistorySource).toBe("polymarket-clob-prices-history");
    expect(hydrated.chartHistoryStatus).toBe("ready");
    expect(hydrated.chartHistoryRange).toBe("1D");
    expect(hydrated.chartHistoryLastUpdated).toBe("2026-06-15T11:59:00.000Z");
  });

  test("rejects malformed backend chart history before applying EventDetail chart points", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const getMarketChart = vi.fn(async () => ({
      marketId: "france-argentina-live",
      source: "polymarket-clob-prices-history",
      range: "1D" as const,
      ranges: ["1D", "1W", "1M", "MAX"] as const,
      generatedAt: "2026-06-15T12:00:00.000Z",
      lastUpdated: "2026-06-15T11:59:00.000Z",
      emptyState: null,
      outcomes: [{ id: "australia", name: "Australia" }],
      history: [
        { outcomeId: "australia", timestamp: "2026-06-15T11:58:00.000Z", price: 0.41, probability: Number.NaN },
      ],
      series: {},
    }));

    await expect(loadMarketChartState({ getMarketChart } as unknown as PolyApi, event)).rejects.toThrow(/invalid probability/);
  });

  test("rejects backend chart prices above contract bounds before applying EventDetail chart points", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const getMarketChart = vi.fn(async () => ({
      marketId: "france-argentina-live",
      source: "polymarket-clob-prices-history",
      range: "1D" as const,
      ranges: ["1D", "1W", "1M", "MAX"] as const,
      generatedAt: "2026-06-15T12:00:00.000Z",
      lastUpdated: "2026-06-15T11:59:00.000Z",
      emptyState: null,
      outcomes: [{ id: "australia", name: "Australia" }],
      history: [
        { outcomeId: "australia", timestamp: "2026-06-15T11:58:00.000Z", price: 1.2, probability: 41 },
      ],
      series: {},
    }));

    await expect(loadMarketChartState({ getMarketChart } as unknown as PolyApi, event)).rejects.toThrow(/invalid price/);
  });

  test("preserves backend empty chart state without overwriting fallback history", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const result = {
      status: "empty" as const,
      source: "empty",
      range: "1D" as const,
      lastUpdated: null,
      emptyState: "no-history" as const,
      chartHistory: [],
    };

    const hydrated = applyChartStateToEvent(event, result);

    expect(hydrated.chartHistory).toBe(event.chartHistory);
    expect(hydrated.chartHistoryStatus).toBe("empty");
    expect(hydrated.chartHistoryRange).toBe("1D");
    expect(hydrated.chartHistoryEmptyState).toBe("no-history");
  });

  test("marks loading and error states for route audit", () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;

    expect(applyChartLoadingToEvent(event)).toMatchObject({
      chartHistoryStatus: "loading",
      chartHistoryRange: "1D",
    });
    expect(applyChartErrorToEvent(event)).toMatchObject({
      chartHistoryStatus: "error",
    });
    const hydrated = applyChartHistoryToEvent(event, []);
    expect(hydrated.chartHistoryStatus).toBe("empty");
  });
});
