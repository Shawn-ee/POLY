import type { PolyApi } from "../api";
import type { AvailabilityState } from "../mocks/worldCup";
import type { Quote } from "../types";

export type TicketQuote = {
  outcomeId: string;
  outcomeName: string;
  probability: number;
  bestBid: number | null;
  bestAsk: number | null;
  bestBidSize?: number;
  bestAskSize?: number;
  midPrice: number | null;
  lastPrice: number | null;
};

type QuoteableOutcome = {
  id: string;
  label: string;
  probability: number;
  bestBid?: number | null;
  bestAsk?: number | null;
  bestBidSize?: number | null;
  bestAskSize?: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableFiniteNonNegativeNumberLike = (value: unknown, optional = false) => {
  if (value === null || (optional && typeof value === "undefined")) return true;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  }
  return false;
};

const isNullableProbabilityNumberLike = (value: unknown) => {
  if (value === null) return true;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 && value <= 1;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1;
  }
  return false;
};

function assertQuoteRoutePayloadShape(
  payload: unknown,
  requestedMarketId: string,
): asserts payload is { marketId: string; quotes: Quote[] } {
  if (!isRecord(payload)) {
    throw new Error(`Quote route returned malformed payload for market ${requestedMarketId}.`);
  }
  if (typeof payload.marketId !== "string" || !payload.marketId.trim()) {
    throw new Error(`Quote route returned payload without marketId for market ${requestedMarketId}.`);
  }
  if (payload.marketId !== requestedMarketId) {
    throw new Error(`Quote route returned marketId ${payload.marketId} for requested market ${requestedMarketId}.`);
  }
  if (!Array.isArray(payload.quotes)) {
    throw new Error(`Quote route returned payload without quotes array for market ${requestedMarketId}.`);
  }
  for (const quote of payload.quotes) {
    if (!isRecord(quote)) {
      throw new Error(`Quote route returned malformed quote for market ${requestedMarketId}.`);
    }
    if (typeof quote.outcomeId !== "string" || !quote.outcomeId.trim()) {
      throw new Error(`Quote route returned quote without outcomeId for market ${requestedMarketId}.`);
    }
    if (typeof quote.outcomeName !== "string") {
      throw new Error(`Quote route returned quote ${quote.outcomeId} without outcomeName.`);
    }
    for (const field of ["bestBid", "bestAsk", "midPrice", "lastPrice"] as const) {
      if (!isNullableProbabilityNumberLike(quote[field])) {
        throw new Error(`Quote route returned invalid ${field} for outcome ${quote.outcomeId}.`);
      }
    }
    for (const field of ["bestBidSize", "bestAskSize"] as const) {
      if (!isNullableFiniteNonNegativeNumberLike(quote[field], true)) {
        throw new Error(`Quote route returned invalid ${field} for outcome ${quote.outcomeId}.`);
      }
    }
  }
}

const toDecimal = (value: string | number | null): number | null => {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  return parsed > 1 ? parsed / 100 : parsed;
};

const toProbability = (value: number | null) => {
  if (value === null) return null;
  const bounded = Math.max(0, Math.min(1, value));
  if (bounded > 0 && bounded < 0.01) return 1;
  return Math.round(bounded * 100);
};

const toSize = (value: string | number | null | undefined): number | null => {
  if (value === null || typeof value === "undefined") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

export const quoteToTicketQuote = (quote: Quote): TicketQuote => {
  const bestBid = toDecimal(quote.bestBid);
  const bestAsk = toDecimal(quote.bestAsk);
  const bestBidSize = toSize(quote.bestBidSize);
  const bestAskSize = toSize(quote.bestAskSize);
  const midPrice = toDecimal(quote.midPrice);
  const lastPrice = toDecimal(quote.lastPrice);
  const fallbackMid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;
  const preferredPrice =
    (midPrice && midPrice > 0 ? midPrice : null) ??
    (lastPrice && lastPrice > 0 ? lastPrice : null) ??
    fallbackMid ??
    bestAsk ??
    bestBid;
  const probability = toProbability(preferredPrice) ?? 0;
  return {
    outcomeId: quote.outcomeId,
    outcomeName: quote.outcomeName,
    probability,
    bestBid: toProbability(bestBid),
    bestAsk: toProbability(bestAsk),
    ...(bestBidSize !== null ? { bestBidSize } : {}),
    ...(bestAskSize !== null ? { bestAskSize } : {}),
    midPrice: toProbability(midPrice),
    lastPrice: toProbability(lastPrice),
  };
};

export const loadTicketQuotes = async (api: PolyApi, marketId: string, outcomeId?: string): Promise<TicketQuote[]> => {
  const payload = await api.getMarketQuote(marketId, outcomeId);
  assertQuoteRoutePayloadShape(payload, marketId);
  return payload.quotes.map(quoteToTicketQuote);
};

export const loadMarketQuotesById = async (
  api: PolyApi,
  marketIds: string[],
): Promise<Map<string, TicketQuote[]>> => {
  const state = await loadMarketQuoteStateById(api, marketIds);
  return state.quotesByMarketId;
};

export type MarketQuoteState = {
  quotesByMarketId: Map<string, TicketQuote[]>;
  failedMarketIds: Set<string>;
};

export const loadMarketQuoteStateById = async (
  api: PolyApi,
  marketIds: string[],
): Promise<MarketQuoteState> => {
  const uniqueMarketIds = [...new Set(marketIds)];
  const results = await Promise.all(
    uniqueMarketIds.map(async (marketId) => {
      try {
        return { marketId, quotes: await loadTicketQuotes(api, marketId) };
      } catch {
        return { marketId, quotes: null };
      }
    }),
  );

  return {
    quotesByMarketId: new Map(
      results
        .filter((result): result is { marketId: string; quotes: TicketQuote[] } => result.quotes !== null)
        .map((result) => [result.marketId, result.quotes]),
    ),
    failedMarketIds: new Set(
      results
        .filter((result) => result.quotes === null)
        .map((result) => result.marketId),
    ),
  };
};

export const applyTicketQuoteToOutcome = <TOutcome extends QuoteableOutcome>(
  outcome: TOutcome,
  quotes: TicketQuote[],
): TOutcome => {
  const normalizedLabel = outcome.label.trim().toLowerCase();
  const quote = quotes.find(
    (item) =>
      item.outcomeId === outcome.id ||
      item.outcomeName.trim().toLowerCase() === normalizedLabel,
  );

  if (!quote) return outcome;
  if (
    quote.probability <= 0 &&
    quote.bestBid === null &&
    quote.bestAsk === null &&
    quote.midPrice === null &&
    quote.lastPrice === null
  ) {
    return outcome;
  }
  return {
    ...outcome,
    probability: quote.probability,
    bestBid: quote.bestBid,
    bestAsk: quote.bestAsk,
    bestBidSize: quote.bestBidSize ?? null,
    bestAskSize: quote.bestAskSize ?? null,
  };
};

export const applyTicketQuotesToMarket = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { outcomes: TOutcome[] },
>(
  market: TMarket,
  quotes: TicketQuote[],
): TMarket => {
  let changed = false;
  const outcomes = market.outcomes.map((outcome) => {
    const quotedOutcome = applyTicketQuoteToOutcome(outcome, quotes);
    if (quotedOutcome !== outcome) changed = true;
    return quotedOutcome;
  });

  if (!changed) return market;
  return {
    ...market,
    outcomes,
  };
};

const quoteFailureAvailability = (current?: AvailabilityState): AvailabilityState => ({
  source: "market-quote-route",
  status: "unavailable",
  marketStatus: current?.marketStatus ?? current?.status ?? "unknown",
  lastUpdated: current?.lastUpdated ?? null,
  stalenessSeconds: current?.stalenessSeconds ?? null,
  staleAfterSeconds: current?.staleAfterSeconds ?? 60,
  isStale: false,
  isSuspended: false,
  isDelayed: false,
  reason: "Market quote route failed.",
});

export const applyMarketQuoteStateToMarket = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { id: string; outcomes: TOutcome[]; availability?: AvailabilityState },
>(
  market: TMarket,
  state: MarketQuoteState,
): TMarket => {
  if (state.failedMarketIds.has(market.id)) {
    return {
      ...market,
      availability: quoteFailureAvailability(market.availability),
    };
  }
  const quotes = state.quotesByMarketId.get(market.id);
  return quotes ? applyTicketQuotesToMarket(market, quotes) : market;
};

export const applyTicketQuotesToEvent = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { id: string; outcomes: TOutcome[] },
  TEvent extends { markets: TMarket[] },
>(
  event: TEvent,
  quotesByMarketId: Map<string, TicketQuote[]>,
): TEvent => {
  let changed = false;
  const markets = event.markets.map((market) => {
    const quotes = quotesByMarketId.get(market.id);
    if (!quotes) return market;
    const quotedMarket = applyTicketQuotesToMarket(market, quotes);
    if (quotedMarket !== market) changed = true;
    return quotedMarket;
  });

  if (!changed) return event;
  return {
    ...event,
    markets,
  };
};

export const applyMarketQuoteStateToEvent = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { id: string; outcomes: TOutcome[]; availability?: AvailabilityState },
  TEvent extends { markets: TMarket[] },
>(
  event: TEvent,
  state: MarketQuoteState,
): TEvent => {
  let changed = false;
  const markets = event.markets.map((market) => {
    const quotedMarket = applyMarketQuoteStateToMarket(market, state);
    if (quotedMarket !== market) changed = true;
    return quotedMarket;
  });

  if (!changed) return event;
  return {
    ...event,
    markets,
  };
};

export const applyTicketQuotesToMarkets = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { id: string; outcomes: TOutcome[] },
>(
  markets: TMarket[],
  quotesByMarketId: Map<string, TicketQuote[]>,
): TMarket[] => {
  let changed = false;
  const quotedMarkets = markets.map((market) => {
    const quotes = quotesByMarketId.get(market.id);
    if (!quotes) return market;
    const quotedMarket = applyTicketQuotesToMarket(market, quotes);
    if (quotedMarket !== market) changed = true;
    return quotedMarket;
  });

  return changed ? quotedMarkets : markets;
};

export const applyMarketQuoteStateToMarkets = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { id: string; outcomes: TOutcome[]; availability?: AvailabilityState },
>(
  markets: TMarket[],
  state: MarketQuoteState,
): TMarket[] => {
  let changed = false;
  const quotedMarkets = markets.map((market) => {
    const quotedMarket = applyMarketQuoteStateToMarket(market, state);
    if (quotedMarket !== market) changed = true;
    return quotedMarket;
  });

  return changed ? quotedMarkets : markets;
};
