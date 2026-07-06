import type { PolyApi } from "../api";
import { normalizeEventSummary } from "../adapters/worldCupAdapter";
import type { EventSummary, Market, Outcome } from "../types";
import type { Event } from "../mocks/worldCup";

export type LiveEventFeedLoader = Pick<PolyApi, "listWorldCupEvents">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown) => value === null || typeof value === "string";

const isFiniteNumberLike = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return Number.isFinite(Number(value));
  return false;
};

const assertLiveOutcomeShape = (outcome: unknown, marketId: string): asserts outcome is Outcome => {
  if (!isRecord(outcome)) {
    throw new Error(`Live event feed route returned malformed outcome for market ${marketId}.`);
  }
  if (typeof outcome.id !== "string" || !outcome.id.trim()) {
    throw new Error(`Live event feed route returned an outcome without id for market ${marketId}.`);
  }
  if (typeof outcome.name !== "string" || typeof outcome.label !== "string") {
    throw new Error(`Live event feed route returned outcome ${outcome.id} without visible labels.`);
  }
  if (typeof outcome.isTradable !== "boolean") {
    throw new Error(`Live event feed route returned outcome ${outcome.id} without tradability state.`);
  }
  for (const field of ["price", "bestBid", "bestAsk", "bestBidSize", "bestAskSize"] as const) {
    if (!isFiniteNumberLike(outcome[field])) {
      throw new Error(`Live event feed route returned non-numeric ${field} for outcome ${outcome.id}.`);
    }
  }
};

const assertLiveMarketShape = (market: unknown): asserts market is Market => {
  if (!isRecord(market)) {
    throw new Error("Live event feed route returned malformed market.");
  }
  if (typeof market.id !== "string" || !market.id.trim()) {
    throw new Error("Live event feed route returned a market without id.");
  }
  const marketId = market.id;
  if (typeof market.title !== "string" || !market.title.trim()) {
    throw new Error(`Live event feed route returned market ${marketId} without title.`);
  }
  if (typeof market.status !== "string" || !market.status.trim()) {
    throw new Error(`Live event feed route returned market ${marketId} without status.`);
  }
  if (!Array.isArray(market.outcomes)) {
    throw new Error(`Live event feed route returned market ${marketId} without outcomes array.`);
  }
  market.outcomes.forEach((outcome) => assertLiveOutcomeShape(outcome, marketId));
};

const assertLiveEventShape = (event: unknown): asserts event is EventSummary => {
  if (!isRecord(event)) {
    throw new Error("Live event feed route returned malformed event.");
  }
  if (typeof event.id !== "string" || !event.id.trim()) {
    throw new Error("Live event feed route returned an event without id.");
  }
  if (typeof event.slug !== "string" || !event.slug.trim()) {
    throw new Error(`Live event feed route returned event ${event.id} without slug.`);
  }
  if (typeof event.title !== "string" || !event.title.trim()) {
    throw new Error(`Live event feed route returned event ${event.id} without title.`);
  }
  if (typeof event.status !== "string" || !event.status.trim()) {
    throw new Error(`Live event feed route returned event ${event.id} without status.`);
  }
  if (!isNullableString(event.liveStatus) || !isNullableString(event.startTime)) {
    throw new Error(`Live event feed route returned event ${event.id} with malformed timing status.`);
  }
  if (!Array.isArray(event.markets)) {
    throw new Error(`Live event feed route returned event ${event.id} without markets array.`);
  }
  event.markets.forEach(assertLiveMarketShape);
};

function assertLiveFeedPayloadShape(payload: unknown): asserts payload is {
  events: EventSummary[];
  nextCursor?: string | null;
  page?: { limit: number; nextCursor: string | null; hasMore: boolean };
} {
  if (!isRecord(payload) || !Array.isArray(payload.events)) {
    throw new Error("Live event feed route returned payload without events array.");
  }
  payload.events.forEach(assertLiveEventShape);
  if (!isNullableString(payload.nextCursor) && payload.nextCursor !== undefined) {
    throw new Error("Live event feed route returned malformed nextCursor.");
  }
  if (payload.page !== undefined) {
    if (!isRecord(payload.page)) {
      throw new Error("Live event feed route returned malformed page metadata.");
    }
    if (typeof payload.page.limit !== "number" || !Number.isFinite(payload.page.limit)) {
      throw new Error("Live event feed route returned malformed page limit.");
    }
    if (!isNullableString(payload.page.nextCursor)) {
      throw new Error("Live event feed route returned malformed page nextCursor.");
    }
    if (typeof payload.page.hasMore !== "boolean") {
      throw new Error("Live event feed route returned malformed page hasMore.");
    }
  }
}

export const loadLiveEventFeed = async (
  api: LiveEventFeedLoader,
  limit = 10,
  cursor: string | null = null,
): Promise<{ events: Event[]; nextCursor: string | null; source: "events-route-statusGroup-live" }> => {
  const payload = await api.listWorldCupEvents({ limit, cursor, statusGroup: "live" });
  assertLiveFeedPayloadShape(payload);
  return {
    events: payload.events
      .map((event) => normalizeEventSummary(event, event.markets ?? []))
      .filter((event) => event.markets.length > 0),
    nextCursor: payload.nextCursor ?? payload.page?.nextCursor ?? null,
    source: "events-route-statusGroup-live",
  };
};
