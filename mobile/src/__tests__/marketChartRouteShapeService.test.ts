import { describe, expect, test } from "vitest";
import { assertMarketChartRoutePayloadShape } from "../services/marketChartRouteShapeService";

const chartPayload = () => ({
  marketId: "world-cup-winner",
  source: "market-outcome-snapshot",
  range: "1H" as const,
  ranges: ["1H", "1D", "1W", "1M", "MAX"] as const,
  generatedAt: "2026-07-06T08:00:00.000Z",
  lastUpdated: "2026-07-06T07:59:00.000Z",
  emptyState: null,
  outcomes: [{ id: "france", name: "France" }],
  history: [
    { outcomeId: "france", timestamp: "2026-07-06T07:58:00.000Z", price: 0.39, probability: 39 },
  ],
  series: {},
});

describe("market chart route shape service", () => {
  test("accepts valid market chart route payloads", () => {
    expect(() => assertMarketChartRoutePayloadShape(chartPayload(), "world-cup-winner", "1H")).not.toThrow();
  });

  test("rejects chart payloads for the wrong market", () => {
    const payload = chartPayload();
    payload.marketId = "other-market";

    expect(() => assertMarketChartRoutePayloadShape(payload, "world-cup-winner", "1H")).toThrow(/requested market world-cup-winner/);
  });

  test("rejects chart payloads for the wrong range", () => {
    const payload = chartPayload();
    (payload as { range: unknown }).range = "1D";

    expect(() => assertMarketChartRoutePayloadShape(payload, "world-cup-winner", "1H")).toThrow(/malformed range/);
  });

  test("rejects malformed chart probability before visible chart apply", () => {
    const payload = chartPayload();
    (payload.history[0] as { probability: unknown }).probability = 120;

    expect(() => assertMarketChartRoutePayloadShape(payload, "world-cup-winner", "1H")).toThrow(/invalid probability/);
  });

  test("rejects chart prices above contract bounds before visible chart apply", () => {
    const payload = chartPayload();
    (payload.history[0] as { price: unknown }).price = 1.2;

    expect(() => assertMarketChartRoutePayloadShape(payload, "world-cup-winner", "1H")).toThrow(/invalid price/);
  });
});
