import type { MarketChart, MarketChartRange } from "../types";

const chartRanges: MarketChartRange[] = ["1H", "1D", "1W", "1M", "MAX"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown) => value === null || typeof value === "string";

const isChartRange = (value: unknown): value is MarketChartRange =>
  typeof value === "string" && chartRanges.includes(value as MarketChartRange);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function assertMarketChartRoutePayloadShape(
  payload: unknown,
  requestedMarketId: string,
  requestedRange: MarketChartRange,
): asserts payload is MarketChart {
  if (!isRecord(payload)) {
    throw new Error(`Market chart route returned malformed payload for market ${requestedMarketId}.`);
  }
  if (payload.marketId !== requestedMarketId) {
    throw new Error(`Market chart route returned marketId ${String(payload.marketId)} for requested market ${requestedMarketId}.`);
  }
  if (!isChartRange(payload.range) || payload.range !== requestedRange) {
    throw new Error(`Market chart route returned malformed range for market ${requestedMarketId}.`);
  }
  if (!Array.isArray(payload.ranges) || payload.ranges.some((range) => !isChartRange(range))) {
    throw new Error(`Market chart route returned malformed ranges for market ${requestedMarketId}.`);
  }
  if (typeof payload.generatedAt !== "string" || !payload.generatedAt.trim()) {
    throw new Error(`Market chart route returned malformed generatedAt for market ${requestedMarketId}.`);
  }
  if (!isNullableString(payload.lastUpdated)) {
    throw new Error(`Market chart route returned malformed lastUpdated for market ${requestedMarketId}.`);
  }
  if (payload.emptyState !== null && payload.emptyState !== "no-history") {
    throw new Error(`Market chart route returned malformed emptyState for market ${requestedMarketId}.`);
  }
  if (!Array.isArray(payload.outcomes)) {
    throw new Error(`Market chart route returned malformed outcomes for market ${requestedMarketId}.`);
  }
  for (const outcome of payload.outcomes) {
    if (!isRecord(outcome) || typeof outcome.id !== "string" || typeof outcome.name !== "string") {
      throw new Error(`Market chart route returned malformed outcome identity for market ${requestedMarketId}.`);
    }
  }
  if (!Array.isArray(payload.history)) {
    throw new Error(`Market chart route returned malformed history for market ${requestedMarketId}.`);
  }
  for (const point of payload.history) {
    if (!isRecord(point)) {
      throw new Error(`Market chart route returned malformed history point for market ${requestedMarketId}.`);
    }
    if (typeof point.outcomeId !== "string" || !point.outcomeId.trim()) {
      throw new Error(`Market chart route returned history point without outcomeId for market ${requestedMarketId}.`);
    }
    if (typeof point.timestamp !== "string" || !point.timestamp.trim()) {
      throw new Error(`Market chart route returned history point without timestamp for market ${requestedMarketId}.`);
    }
    const price = point.price;
    if (!isFiniteNumber(price) || price < 0 || price > 1) {
      throw new Error(`Market chart route returned invalid price for market ${requestedMarketId}.`);
    }
    const probability = point.probability;
    if (!isFiniteNumber(probability) || probability < 0 || probability > 100) {
      throw new Error(`Market chart route returned invalid probability for market ${requestedMarketId}.`);
    }
  }
}
