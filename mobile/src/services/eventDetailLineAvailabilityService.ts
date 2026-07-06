import type { Market } from "../mocks/worldCup";

export type LineFamily = "spread" | "totals" | "team-total";
export type LinePeriodLabel = "Reg. Time" | "1st Half" | "2nd Half";

export type LineSelectionAvailability = {
  backendMarket?: Market;
  lineOptions: string[];
  periodOptions: LinePeriodLabel[];
  selectedLine: string;
  selectedPeriod: LinePeriodLabel;
};

const lineFamilyForMarket = (market: Market): LineFamily | null => {
  const value = `${market.selection?.marketFamily ?? market.selection?.marketType ?? market.marketType ?? ""}`.toLowerCase().replace(/_/g, "-");
  if (value === "spread" || value === "handicap" || value === "asian-handicap") return "spread";
  if (value === "totals" || value === "total" || value === "total-goals") return "totals";
  if (value === "team-total" || value === "team-totals" || value === "team-total-goals") return "team-total";
  return null;
};

const lineValue = (market: Market) => {
  const parsed = Number(market.selection?.line ?? market.line);
  if (!Number.isFinite(parsed)) return null;
  return Math.abs(parsed).toString();
};

const periodLabel = (market: Market): LinePeriodLabel => {
  const value = `${market.selection?.period ?? market.period ?? "regulation"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (value === "first-half" || value === "1st-half") return "1st Half";
  if (value === "second-half" || value === "2nd-half") return "2nd Half";
  return "Reg. Time";
};

const sortLines = (values: Iterable<string>) =>
  Array.from(values).sort((left, right) => Number(left) - Number(right));

const sortPeriods = (values: Iterable<LinePeriodLabel>) => {
  const order: Record<LinePeriodLabel, number> = { "Reg. Time": 0, "1st Half": 1, "2nd Half": 2 };
  return Array.from(values).sort((left, right) => order[left] - order[right]);
};

export const lineMarketsForFamily = (markets: Market[], family: LineFamily) =>
  markets.filter((market) => lineFamilyForMarket(market) === family && lineValue(market) !== null && market.outcomes.length > 0);

const findMarket = (markets: Market[], family: LineFamily, line: string, period: LinePeriodLabel) =>
  lineMarketsForFamily(markets, family).find((market) =>
    lineValue(market) === line &&
    periodLabel(market) === period
  );

export const resolveLineSelectionAvailability = ({
  markets,
  family,
  selectedLine,
  selectedPeriod,
  fallbackLineOptions,
  fallbackPeriodOptions,
  routeBacked,
}: {
  markets: Market[];
  family: LineFamily;
  selectedLine: string;
  selectedPeriod: LinePeriodLabel;
  fallbackLineOptions: string[];
  fallbackPeriodOptions: LinePeriodLabel[];
  routeBacked: boolean;
}): LineSelectionAvailability => {
  const familyMarkets = lineMarketsForFamily(markets, family);
  if (!routeBacked || familyMarkets.length === 0) {
    return {
      backendMarket: findMarket(markets, family, selectedLine, selectedPeriod),
      lineOptions: fallbackLineOptions,
      periodOptions: fallbackPeriodOptions,
      selectedLine,
      selectedPeriod,
    };
  }

  const lineOptions = sortLines(new Set(familyMarkets.map(lineValue).filter((value): value is string => Boolean(value))));
  const selectedLineWithFallback = lineOptions.includes(selectedLine) ? selectedLine : lineOptions[0] ?? selectedLine;
  const periodOptions = sortPeriods(new Set(
    familyMarkets
      .filter((market) => lineValue(market) === selectedLineWithFallback)
      .map(periodLabel),
  ));
  const selectedBackendMarket = findMarket(markets, family, selectedLineWithFallback, selectedPeriod);
  const selectedPeriodWithFallback =
    selectedBackendMarket || periodOptions.includes(selectedPeriod)
      ? selectedPeriod
      : periodOptions[0] ?? selectedPeriod;

  return {
    backendMarket: selectedBackendMarket ?? findMarket(markets, family, selectedLineWithFallback, selectedPeriodWithFallback),
    lineOptions,
    periodOptions,
    selectedLine: selectedLineWithFallback,
    selectedPeriod: selectedPeriodWithFallback,
  };
};
