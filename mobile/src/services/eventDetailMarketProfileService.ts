import type { Event, Market } from "../mocks/worldCup";

const marketKey = (market: Market) =>
  `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase().replace(/_/g, "-");

export const isAdvanceMarket = (market: Market) =>
  /(^|[\s-])(to-?advance|to-?qualify|team-?to-?qualify|qualify)([\s-]|$)/i.test(marketKey(market));

export const isRegulationWinnerMarket = (market: Market) => {
  if (isAdvanceMarket(market)) return false;
  const key = marketKey(market);
  const hasDraw = market.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label));
  const isWinner = ["moneyline", "winner", "match_winner_1x2"].includes(market.marketType ?? "") ||
    key.includes("winner") ||
    key.includes("moneyline") ||
    key.includes("regulation") ||
    key.includes("90");
  const isRegulationPeriod = !market.period || market.period === "regulation" || market.period === "full-game";
  return Boolean(hasDraw && isWinner && isRegulationPeriod);
};

export const selectEventDetailPrimaryMarket = (event: Event, markets: Market[]) => {
  const shouldPreferAdvance =
    event.marketProfile === "to_advance" ||
    event.marketProfile === "full_match_with_overtime" ||
    event.supportedMarketTypes?.includes("to_advance");
  if (shouldPreferAdvance) {
    const advance = markets.find(isAdvanceMarket);
    if (advance) return advance;
  }
  return markets.find(isRegulationWinnerMarket) ?? markets[0];
};

export const selectEventDetailRegulationMarket = (_event: Event, markets: Market[]) =>
  markets.find(isRegulationWinnerMarket);

export const isRouteBackedEventDetail = (event: Pick<Event, "backendSlug">) =>
  Boolean(event.backendSlug);

export const canRenderEventDetailLineFamily = (
  event: Pick<Event, "backendSlug">,
  backendMarket: Market | undefined,
) => !isRouteBackedEventDetail(event) || Boolean(backendMarket);
