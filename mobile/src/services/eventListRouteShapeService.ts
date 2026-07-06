import type { EventSummary, Market, Outcome } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown) => value === null || typeof value === "string";

const isFiniteNonNegativeNumberLike = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  }
  return false;
};

const isProbabilityNumberLike = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 && value <= 1;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1;
  }
  return false;
};

const assertEventListOutcomeShape = (outcome: unknown, marketId: string): asserts outcome is Outcome => {
  if (!isRecord(outcome)) {
    throw new Error(`Event list route returned malformed outcome for market ${marketId}.`);
  }
  if (typeof outcome.id !== "string" || !outcome.id.trim()) {
    throw new Error(`Event list route returned an outcome without id for market ${marketId}.`);
  }
  if (typeof outcome.name !== "string" || typeof outcome.label !== "string") {
    throw new Error(`Event list route returned outcome ${outcome.id} without visible labels.`);
  }
  if (typeof outcome.isTradable !== "boolean") {
    throw new Error(`Event list route returned outcome ${outcome.id} without tradability state.`);
  }
  for (const field of ["price", "bestBid", "bestAsk"] as const) {
    if (!isProbabilityNumberLike(outcome[field])) {
      throw new Error(`Event list route returned invalid ${field} for outcome ${outcome.id}.`);
    }
  }
  for (const field of ["bestBidSize", "bestAskSize"] as const) {
    if (!isFiniteNonNegativeNumberLike(outcome[field])) {
      throw new Error(`Event list route returned invalid ${field} for outcome ${outcome.id}.`);
    }
  }
};

const assertEventListMarketShape = (market: unknown): asserts market is Market => {
  if (!isRecord(market)) {
    throw new Error("Event list route returned malformed market.");
  }
  if (typeof market.id !== "string" || !market.id.trim()) {
    throw new Error("Event list route returned a market without id.");
  }
  const marketId = market.id;
  if (typeof market.title !== "string" || !market.title.trim()) {
    throw new Error(`Event list route returned market ${marketId} without title.`);
  }
  if (typeof market.status !== "string" || !market.status.trim()) {
    throw new Error(`Event list route returned market ${marketId} without status.`);
  }
  if (!Array.isArray(market.outcomes)) {
    throw new Error(`Event list route returned market ${marketId} without outcomes array.`);
  }
  market.outcomes.forEach((outcome) => assertEventListOutcomeShape(outcome, marketId));
};

const assertEventListEventShape = (event: unknown): asserts event is EventSummary => {
  if (!isRecord(event)) {
    throw new Error("Event list route returned malformed event.");
  }
  if (typeof event.id !== "string" || !event.id.trim()) {
    throw new Error("Event list route returned an event without id.");
  }
  if (typeof event.slug !== "string" || !event.slug.trim()) {
    throw new Error(`Event list route returned event ${event.id} without slug.`);
  }
  if (typeof event.title !== "string" || !event.title.trim()) {
    throw new Error(`Event list route returned event ${event.id} without title.`);
  }
  if (typeof event.status !== "string" || !event.status.trim()) {
    throw new Error(`Event list route returned event ${event.id} without status.`);
  }
  if (!isNullableString(event.liveStatus) || !isNullableString(event.startTime)) {
    throw new Error(`Event list route returned event ${event.id} with malformed timing status.`);
  }
  if (!Array.isArray(event.markets)) {
    throw new Error(`Event list route returned event ${event.id} without markets array.`);
  }
  event.markets.forEach(assertEventListMarketShape);
};

export function assertEventListRoutePayloadShape(payload: unknown): asserts payload is {
  events: EventSummary[];
  nextCursor?: string | null;
  page?: { limit: number; nextCursor: string | null; hasMore: boolean };
} {
  if (!isRecord(payload) || !Array.isArray(payload.events)) {
    throw new Error("Event list route returned payload without events array.");
  }
  payload.events.forEach(assertEventListEventShape);
  if (!isNullableString(payload.nextCursor) && payload.nextCursor !== undefined) {
    throw new Error("Event list route returned malformed nextCursor.");
  }
  if (payload.page !== undefined) {
    if (!isRecord(payload.page)) {
      throw new Error("Event list route returned malformed page metadata.");
    }
    if (typeof payload.page.limit !== "number" || !Number.isFinite(payload.page.limit)) {
      throw new Error("Event list route returned malformed page limit.");
    }
    if (!isNullableString(payload.page.nextCursor)) {
      throw new Error("Event list route returned malformed page nextCursor.");
    }
    if (typeof payload.page.hasMore !== "boolean") {
      throw new Error("Event list route returned malformed page hasMore.");
    }
  }
}
