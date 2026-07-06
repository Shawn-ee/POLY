import type { OrderbookBook, OrderbookAvailability } from "../types";

const availabilityStatuses = ["ready", "stale", "suspended", "delayed", "unavailable"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown) => value === null || typeof value === "string";

const isFiniteNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function assertAvailabilityShape(
  availability: unknown,
  requestedMarketId: string,
): asserts availability is OrderbookAvailability | undefined {
  if (availability === undefined) return;
  if (!isRecord(availability)) {
    throw new Error(`Orderbook route returned malformed availability for market ${requestedMarketId}.`);
  }
  if (typeof availability.source !== "string" || !availability.source.trim()) {
    throw new Error(`Orderbook route returned availability without source for market ${requestedMarketId}.`);
  }
  if (!availabilityStatuses.includes(availability.status as OrderbookAvailability["status"])) {
    throw new Error(`Orderbook route returned malformed availability status for market ${requestedMarketId}.`);
  }
  if (typeof availability.marketStatus !== "string" || !availability.marketStatus.trim()) {
    throw new Error(`Orderbook route returned availability without marketStatus for market ${requestedMarketId}.`);
  }
  if (!isNullableString(availability.lastUpdated)) {
    throw new Error(`Orderbook route returned malformed availability lastUpdated for market ${requestedMarketId}.`);
  }
  if (availability.stalenessSeconds !== null && !isFiniteNonNegativeNumber(availability.stalenessSeconds)) {
    throw new Error(`Orderbook route returned malformed availability stalenessSeconds for market ${requestedMarketId}.`);
  }
  if (!isFiniteNonNegativeNumber(availability.staleAfterSeconds)) {
    throw new Error(`Orderbook route returned malformed availability staleAfterSeconds for market ${requestedMarketId}.`);
  }
  for (const field of ["isStale", "isSuspended", "isDelayed"] as const) {
    if (typeof availability[field] !== "boolean") {
      throw new Error(`Orderbook route returned malformed availability ${field} for market ${requestedMarketId}.`);
    }
  }
  if (typeof availability.reason !== "string") {
    throw new Error(`Orderbook route returned malformed availability reason for market ${requestedMarketId}.`);
  }
}

const assertBookLevelArray = (
  levels: unknown,
  requestedMarketId: string,
  label: "levels" | "bids" | "asks",
): void => {
  if (!Array.isArray(levels)) {
    throw new Error(`Orderbook route returned malformed ${label} for market ${requestedMarketId}.`);
  }
  for (const level of levels) {
    if (!isRecord(level)) {
      throw new Error(`Orderbook route returned malformed ${label} row for market ${requestedMarketId}.`);
    }
    if (typeof level.outcomeId !== "string" || !level.outcomeId.trim()) {
      throw new Error(`Orderbook route returned ${label} row without outcomeId for market ${requestedMarketId}.`);
    }
    if (level.side !== "bid" && level.side !== "ask" && label === "levels") {
      throw new Error(`Orderbook route returned malformed level side for market ${requestedMarketId}.`);
    }
    if (!isFiniteNonNegativeNumber(level.price)) {
      throw new Error(`Orderbook route returned malformed ${label} price for market ${requestedMarketId}.`);
    }
    const sizeField = label === "levels" ? "shares" : "size";
    if (!isFiniteNonNegativeNumber(level[sizeField])) {
      throw new Error(`Orderbook route returned malformed ${label} ${sizeField} for market ${requestedMarketId}.`);
    }
    if (label === "levels" && !isFiniteNonNegativeNumber(level.total)) {
      throw new Error(`Orderbook route returned malformed level total for market ${requestedMarketId}.`);
    }
  }
};

export function assertOrderbookRoutePayloadShape(
  payload: unknown,
  requestedMarketId: string,
): asserts payload is OrderbookBook {
  if (!isRecord(payload)) {
    throw new Error(`Orderbook route returned malformed payload for market ${requestedMarketId}.`);
  }
  if (payload.marketId !== requestedMarketId) {
    throw new Error(`Orderbook route returned marketId ${String(payload.marketId)} for requested market ${requestedMarketId}.`);
  }
  if (!isNullableString(payload.outcomeId)) {
    throw new Error(`Orderbook route returned malformed outcomeId for market ${requestedMarketId}.`);
  }
  if (typeof payload.generatedAt !== "string" || !payload.generatedAt.trim()) {
    throw new Error(`Orderbook route returned malformed generatedAt for market ${requestedMarketId}.`);
  }
  if (payload.emptyState !== null && payload.emptyState !== "no-depth") {
    throw new Error(`Orderbook route returned malformed emptyState for market ${requestedMarketId}.`);
  }
  assertAvailabilityShape(payload.availability, requestedMarketId);
  assertBookLevelArray(payload.levels, requestedMarketId, "levels");
  assertBookLevelArray(payload.bids, requestedMarketId, "bids");
  assertBookLevelArray(payload.asks, requestedMarketId, "asks");
}
