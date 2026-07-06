import type { Market, Outcome } from "../mocks/worldCup";

const asNumberOrNull = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export type FutureMarketStats = {
  volume: number | null;
  liquidity: number | null;
  source: "backend-market-liquidity" | "unavailable";
};

export const futureMarketStats = (market: Market): FutureMarketStats => {
  const liquidity = asNumberOrNull(market.liquidity);
  return {
    volume: null,
    liquidity,
    source: liquidity == null ? "unavailable" : "backend-market-liquidity",
  };
};

export const futureOutcomeVolume = (_market: Market, _outcome: Outcome): number | null => null;
