import type { PortfolioValueHistory, PortfolioValueHistoryRange } from "../types";

const ranges: PortfolioValueHistoryRange[] = ["1D", "1W", "1M", "All"];

const isRange = (value: unknown): value is PortfolioValueHistoryRange =>
  typeof value === "string" && ranges.includes(value as PortfolioValueHistoryRange);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  isNumber(value) && value >= 0;

const isNullableString = (value: unknown) => value === null || typeof value === "string";

const totalsMatch = (value: number, cash: number, positionsValue: number) =>
  Math.abs(value - (cash + positionsValue)) <= 0.01;

export async function loadPortfolioValueHistory({
  getPortfolioValueHistory,
  range = "1D",
}: {
  getPortfolioValueHistory: (range: PortfolioValueHistoryRange) => Promise<PortfolioValueHistory>;
  range?: PortfolioValueHistoryRange;
}) {
  const history = await getPortfolioValueHistory(range);
  if (!isRange(history.range)) throw new Error("Malformed portfolio value history: invalid range.");
  if (history.range !== range) throw new Error("Malformed portfolio value history: wrong range.");
  if (!Array.isArray(history.ranges) || !history.ranges.every(isRange)) {
    throw new Error("Malformed portfolio value history: invalid ranges.");
  }
  if (typeof history.source !== "string" || !history.source) {
    throw new Error("Malformed portfolio value history: missing source.");
  }
  if (history.status !== "ready" && history.status !== "empty") {
    throw new Error("Malformed portfolio value history: invalid status.");
  }
  if (typeof history.generatedAt !== "string" || !history.generatedAt.trim()) {
    throw new Error("Malformed portfolio value history: missing generatedAt.");
  }
  if (!isNullableString(history.lastUpdated)) {
    throw new Error("Malformed portfolio value history: invalid lastUpdated.");
  }
  if (history.emptyState !== null && history.emptyState !== "no-history") {
    throw new Error("Malformed portfolio value history: invalid emptyState.");
  }
  if (!Array.isArray(history.points)) {
    throw new Error("Malformed portfolio value history: missing points.");
  }
  for (const point of history.points) {
    if (
      typeof point.timestamp !== "string" ||
      !isNonNegativeNumber(point.value) ||
      !isNonNegativeNumber(point.cash) ||
      !isNonNegativeNumber(point.positionsValue) ||
      !isNumber(point.pnl)
    ) {
      throw new Error("Malformed portfolio value history: invalid point.");
    }
    if (!totalsMatch(point.value, point.cash, point.positionsValue)) {
      throw new Error("Malformed portfolio value history: inconsistent point total.");
    }
  }
  return history;
}
