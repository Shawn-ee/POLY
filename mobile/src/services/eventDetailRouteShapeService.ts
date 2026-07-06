import type { EventDetail, EventSummary, Market, Outcome } from "../types";

const marketProfiles = ["to_advance", "regulation_90", "full_match_with_overtime"] as const;
const resultModes = ["can_draw", "no_draw"] as const;
const supportedMarketTypes = [
  "to_advance",
  "regulation_90",
  "full_match_with_overtime",
  "spread",
  "totals",
  "team-total",
  "first-half",
  "second-half",
  "player-props",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown) => value === null || typeof value === "string";

const isFiniteNumberLike = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0;
  }
  return false;
};

const isOptionalFiniteNonNegativeNumber = (value: unknown) =>
  value === undefined || value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isFiniteNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;

const isOptionalFiniteNumberLike = (value: unknown) =>
  value === undefined || isFiniteNumberLike(value);

const isMarketProfile = (value: unknown) =>
  typeof value === "string" && marketProfiles.includes(value as (typeof marketProfiles)[number]);

const isResultMode = (value: unknown) =>
  typeof value === "string" && resultModes.includes(value as (typeof resultModes)[number]);

const isSupportedMarketType = (value: unknown) =>
  typeof value === "string" && supportedMarketTypes.includes(value as (typeof supportedMarketTypes)[number]);

function assertEventDetailOutcomeShape(outcome: unknown, marketId: string): asserts outcome is Outcome {
  if (!isRecord(outcome)) {
    throw new Error(`Event detail route returned malformed outcome for market ${marketId}.`);
  }
  if (typeof outcome.id !== "string" || !outcome.id.trim()) {
    throw new Error(`Event detail route returned an outcome without id for market ${marketId}.`);
  }
  if (typeof outcome.name !== "string" || typeof outcome.label !== "string") {
    throw new Error(`Event detail route returned outcome ${outcome.id} without visible labels.`);
  }
  if (typeof outcome.isTradable !== "boolean") {
    throw new Error(`Event detail route returned outcome ${outcome.id} without tradability state.`);
  }
  if (!isNullableString(outcome.side) && outcome.side !== undefined) {
    throw new Error(`Event detail route returned malformed side for outcome ${outcome.id}.`);
  }
  for (const field of ["price", "bestBid", "bestAsk", "bestBidSize", "bestAskSize"] as const) {
    if (!isFiniteNumberLike(outcome[field])) {
      throw new Error(`Event detail route returned non-numeric ${field} for outcome ${outcome.id}.`);
    }
  }
}

function assertEventDetailMarketShape(market: unknown): asserts market is Market {
  if (!isRecord(market)) {
    throw new Error("Event detail route returned malformed market.");
  }
  if (typeof market.id !== "string" || !market.id.trim()) {
    throw new Error("Event detail route returned a market without id.");
  }
  const marketId = market.id;
  if (typeof market.title !== "string" || !market.title.trim()) {
    throw new Error(`Event detail route returned market ${marketId} without title.`);
  }
  if (typeof market.status !== "string" || !market.status.trim()) {
    throw new Error(`Event detail route returned market ${marketId} without status.`);
  }
  if (!isNullableString(market.marketGroupTitle)) {
    throw new Error(`Event detail route returned market ${marketId} with malformed group title.`);
  }
  if (!isNullableString(market.marketType) && market.marketType !== undefined) {
    throw new Error(`Event detail route returned market ${marketId} with malformed market type.`);
  }
  if (!isNullableString(market.period) && market.period !== undefined) {
    throw new Error(`Event detail route returned market ${marketId} with malformed period.`);
  }
  if (!isNullableString(market.line) && market.line !== undefined) {
    throw new Error(`Event detail route returned market ${marketId} with malformed line.`);
  }
  if (!isOptionalFiniteNumberLike(market.liquidity)) {
    throw new Error(`Event detail route returned market ${marketId} with malformed liquidity.`);
  }
  if (!Array.isArray(market.outcomes) || market.outcomes.length === 0) {
    throw new Error(`Event detail route returned market ${marketId} without outcomes array.`);
  }
  market.outcomes.forEach((outcome) => assertEventDetailOutcomeShape(outcome, marketId));
}

function assertEventRulesShape(event: Record<string, unknown>, eventId: string) {
  if (event.marketProfile !== undefined && !isMarketProfile(event.marketProfile)) {
    throw new Error(`Event detail route returned event ${eventId} with malformed marketProfile.`);
  }
  if (event.resultMode !== undefined && !isResultMode(event.resultMode)) {
    throw new Error(`Event detail route returned event ${eventId} with malformed resultMode.`);
  }
  if (event.gameRules !== undefined) {
    if (!isRecord(event.gameRules)) {
      throw new Error(`Event detail route returned event ${eventId} with malformed gameRules.`);
    }
    if (typeof event.gameRules.allowDraw !== "boolean" || typeof event.gameRules.includesOvertime !== "boolean") {
      throw new Error(`Event detail route returned event ${eventId} with malformed game rule booleans.`);
    }
    if (typeof event.gameRules.description !== "string" || !event.gameRules.description.trim()) {
      throw new Error(`Event detail route returned event ${eventId} without game rule description.`);
    }
    if (event.resultMode === "can_draw" && event.gameRules.allowDraw !== true) {
      throw new Error(`Event detail route returned event ${eventId} with inconsistent draw rules.`);
    }
    if (event.resultMode === "no_draw" && event.gameRules.allowDraw !== false) {
      throw new Error(`Event detail route returned event ${eventId} with inconsistent draw rules.`);
    }
  }
  if (event.supportedMarketTypes !== undefined) {
    if (!Array.isArray(event.supportedMarketTypes) || event.supportedMarketTypes.some((item) => !isSupportedMarketType(item))) {
      throw new Error(`Event detail route returned event ${eventId} with malformed supportedMarketTypes.`);
    }
    if (event.marketProfile !== undefined && !event.supportedMarketTypes.includes(event.marketProfile)) {
      throw new Error(`Event detail route returned event ${eventId} with unsupported marketProfile.`);
    }
  }
}

function assertEventDetailEventShape(event: unknown): asserts event is EventSummary {
  if (!isRecord(event)) {
    throw new Error("Event detail route returned malformed event.");
  }
  if (typeof event.id !== "string" || !event.id.trim()) {
    throw new Error("Event detail route returned an event without id.");
  }
  const eventId = event.id;
  if (typeof event.slug !== "string" || !event.slug.trim()) {
    throw new Error(`Event detail route returned event ${eventId} without slug.`);
  }
  if (typeof event.title !== "string" || !event.title.trim()) {
    throw new Error(`Event detail route returned event ${eventId} without title.`);
  }
  if (typeof event.status !== "string" || !event.status.trim()) {
    throw new Error(`Event detail route returned event ${eventId} without status.`);
  }
  if (!isNullableString(event.liveStatus) || !isNullableString(event.startTime)) {
    throw new Error(`Event detail route returned event ${eventId} with malformed timing status.`);
  }
  if (!isOptionalFiniteNonNegativeNumber(event.homeScore) || !isOptionalFiniteNonNegativeNumber(event.awayScore)) {
    throw new Error(`Event detail route returned event ${eventId} with malformed score.`);
  }
  const marketCount = event.marketCount;
  const activeMarketCount = event.activeMarketCount;
  if (!isFiniteNonNegativeInteger(marketCount) || !isFiniteNonNegativeInteger(activeMarketCount)) {
    throw new Error(`Event detail route returned event ${eventId} with malformed market counts.`);
  }
  if (activeMarketCount > marketCount) {
    throw new Error(`Event detail route returned event ${eventId} with inconsistent market counts.`);
  }
  assertEventRulesShape(event, eventId);
}

export function assertEventDetailRoutePayloadShape(payload: unknown): asserts payload is EventDetail {
  if (!isRecord(payload)) {
    throw new Error("Event detail route returned malformed payload.");
  }
  assertEventDetailEventShape(payload.event);
  if (!Array.isArray(payload.markets)) {
    throw new Error(`Event detail route returned event ${payload.event.id} without markets array.`);
  }
  payload.markets.forEach(assertEventDetailMarketShape);
}
