import type { PortfolioValueHistory, PortfolioValueHistoryRange } from "../types";

const ranges: PortfolioValueHistoryRange[] = ["1D", "1W", "1M", "All"];

const isRange = (value: unknown): value is PortfolioValueHistoryRange =>
  typeof value === "string" && ranges.includes(value as PortfolioValueHistoryRange);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export async function loadPortfolioValueHistory({
  getPortfolioValueHistory,
  range = "1D",
}: {
  getPortfolioValueHistory: (range: PortfolioValueHistoryRange) => Promise<PortfolioValueHistory>;
  range?: PortfolioValueHistoryRange;
}) {
  const history = await getPortfolioValueHistory(range);
  if (!isRange(history.range)) throw new Error("Malformed portfolio value history: invalid range.");
  if (!Array.isArray(history.ranges) || !history.ranges.every(isRange)) {
    throw new Error("Malformed portfolio value history: invalid ranges.");
  }
  if (typeof history.source !== "string" || !history.source) {
    throw new Error("Malformed portfolio value history: missing source.");
  }
  if (history.status !== "ready" && history.status !== "empty") {
    throw new Error("Malformed portfolio value history: invalid status.");
  }
  if (!Array.isArray(history.points)) {
    throw new Error("Malformed portfolio value history: missing points.");
  }
  for (const point of history.points) {
    if (
      typeof point.timestamp !== "string" ||
      !isNumber(point.value) ||
      !isNumber(point.cash) ||
      !isNumber(point.positionsValue) ||
      !isNumber(point.pnl)
    ) {
      throw new Error("Malformed portfolio value history: invalid point.");
    }
  }
  return history;
}
