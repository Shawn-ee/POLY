import type { Event } from "../mocks/worldCup";

const asNumberOrNull = (value: unknown) => {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export type EventCardStats = {
  volume: number | null;
  liquidity: number | null;
  source: string;
};

export const eventCardStats = (event: Event): EventCardStats => ({
  volume: asNumberOrNull(event.metrics?.volume24h),
  liquidity: asNumberOrNull(event.metrics?.liquidity),
  source: event.metrics?.source ?? "unavailable",
});
