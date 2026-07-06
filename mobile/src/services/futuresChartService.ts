import type { PolyApi } from "../api";
import type { EventChartPoint, MarketChartRange } from "../types";
import type { Market } from "../mocks/worldCup";

export const futureChartRanges: MarketChartRange[] = ["1H", "1D", "1W", "1M", "MAX"];

export type FutureChartLoadResult = {
  status: "ready" | "empty";
  source: string;
  range: MarketChartRange;
  lastUpdated: string | null;
  emptyState: "no-history" | null;
  chartHistory: EventChartPoint[];
};

export const futureChartHistoryFromMarketChart = (
  chart: Awaited<ReturnType<PolyApi["getMarketChart"]>>,
): EventChartPoint[] =>
  chart.history.map((point) => ({
    outcomeId: point.outcomeId,
    timestamp: point.timestamp,
    probability: point.probability,
  }));

export const loadFutureChartState = async (
  api: PolyApi,
  market: Market,
  range: MarketChartRange,
): Promise<FutureChartLoadResult> => {
  const chart = await api.getMarketChart(market.id, range);
  const chartHistory = futureChartHistoryFromMarketChart(chart);
  return {
    status: chartHistory.length > 0 ? "ready" : "empty",
    source: chart.source ?? "market-chart-route",
    range: chart.range,
    lastUpdated: chart.lastUpdated,
    emptyState: chart.emptyState,
    chartHistory,
  };
};

export const applyFutureChartLoadingToMarket = (market: Market, range: MarketChartRange): Market => ({
  ...market,
  chartHistoryStatus: "loading",
  chartHistoryRange: range,
});

export const applyFutureChartErrorToMarket = (market: Market, range: MarketChartRange): Market => ({
  ...market,
  chartHistoryStatus: "error",
  chartHistoryRange: range,
  chartHistorySource: market.chartHistorySource ?? "embedded",
});

export const applyFutureChartStateToMarket = (market: Market, result: FutureChartLoadResult): Market => {
  if (result.status === "empty") {
    return {
      ...market,
      chartHistoryStatus: "empty",
      chartHistorySource: result.source === "empty" ? "empty" : "market-chart-route",
      chartHistoryRange: result.range,
      chartHistoryLastUpdated: result.lastUpdated,
      chartHistoryEmptyState: result.emptyState,
    };
  }

  return {
    ...market,
    chartHistory: result.chartHistory,
    chartHistorySource: result.source === "polymarket-clob-prices-history" ? "polymarket-clob-prices-history" : "market-chart-route",
    chartHistoryStatus: "ready",
    chartHistoryRange: result.range,
    chartHistoryLastUpdated: result.lastUpdated,
    chartHistoryEmptyState: null,
  };
};
