import type { PolyApi } from "../api";
import type { OrderbookAvailability, OrderbookBookLevel } from "../types";
import type { Event, Market } from "../mocks/worldCup";
import { assertOrderbookRoutePayloadShape } from "./orderbookRouteShapeService";

export type MarketDepthLoadResult = {
  status: "ready" | "empty";
  marketId: string | null;
  lastUpdated: string | null;
  emptyState: "no-depth" | null;
  availability?: OrderbookAvailability;
  levels: OrderbookBookLevel[];
};

export const depthMarketForEvent = (event: Event, marketId?: string | null): Market | undefined =>
  (marketId ? event.markets.find((market) => market.id === marketId) : undefined)
  ?? event.markets.find((market) => market.type !== "prop" && market.type !== "future")
  ?? event.markets[0];

export const loadMarketDepthState = async (api: PolyApi, event: Event, marketId?: string | null): Promise<MarketDepthLoadResult> => {
  const market = depthMarketForEvent(event, marketId);
  if (!market) {
    return { status: "empty", marketId: null, lastUpdated: null, emptyState: "no-depth", levels: [] };
  }
  const book = await api.getOrderbook(market.id, { maxLevels: 24 });
  assertOrderbookRoutePayloadShape(book, market.id);
  return {
    status: book.levels.length > 0 ? "ready" : "empty",
    marketId: book.marketId,
    lastUpdated: book.generatedAt,
    emptyState: book.emptyState,
    availability: book.availability,
    levels: book.levels,
  };
};

export const applyDepthLoadingToEvent = (event: Event): Event => ({
  ...event,
  orderbookDepthStatus: "loading",
});

export const applyMarketDepthLoadingToEvent = (event: Event, marketId?: string | null): Event => ({
  ...event,
  orderbookDepthStatus: "loading",
  orderbookDepthMarketId: marketId ?? depthMarketForEvent(event)?.id ?? null,
});

export const applyDepthErrorToEvent = (event: Event): Event => ({
  ...event,
  orderbookDepthStatus: "error",
  orderbookDepthSource: event.orderbookDepthSource ?? "embedded",
});

export const applyMarketDepthErrorToEvent = (event: Event, marketId?: string | null): Event => ({
  ...event,
  orderbookDepthStatus: "error",
  orderbookDepthSource: event.orderbookDepthSource ?? "embedded",
  orderbookDepthMarketId: marketId ?? event.orderbookDepthMarketId ?? null,
});

export const applyDepthStateToEvent = (event: Event, result: MarketDepthLoadResult): Event => {
  if (result.status === "empty" || !result.marketId) {
    return {
      ...event,
      orderbookDepthStatus: "empty",
    orderbookDepthMarketId: result.marketId,
    orderbookDepthLastUpdated: result.lastUpdated,
    orderbookDepthEmptyState: result.emptyState,
    orderbookAvailability: result.availability,
  };
  }

  return {
    ...event,
    orderbookDepthSource: "orderbook-route",
    orderbookDepthStatus: "ready",
    orderbookDepthMarketId: result.marketId,
    orderbookDepthLastUpdated: result.lastUpdated,
    orderbookDepthEmptyState: null,
    orderbookAvailability: result.availability,
    markets: event.markets.map((market) =>
      market.id === result.marketId
        ? {
            ...market,
            orderbookDepth: result.levels.map((level) => ({
              outcomeId: level.outcomeId,
              side: level.side,
              price: level.price,
              shares: level.shares,
              total: level.total,
            })),
          }
        : market,
    ),
  };
};
