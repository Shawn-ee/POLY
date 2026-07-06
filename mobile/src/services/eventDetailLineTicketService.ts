import type { Market, Outcome } from "../mocks/worldCup";
import type { TicketSelection } from "../components/TradeTicket";

type SyntheticLineMarkets = {
  spread?: Market;
  totals?: Market;
  teamTotal?: Market;
};

type ResolveLineTicketTargetInput = {
  selection?: TicketSelection;
  backendMarket?: Market;
  backendOutcome?: Outcome;
  syntheticOutcome?: Outcome;
  syntheticMarkets: SyntheticLineMarkets;
  fallbackMarket?: Market;
};

const ticketMarketTypeFromBackendSelection = (market: Market): TicketSelection["marketType"] => {
  const value = `${market.selection?.marketFamily ?? market.selection?.marketType ?? market.marketType ?? ""}`.toLowerCase().replace(/_/g, "-");
  if (value === "spread" || value === "handicap" || value === "asian-handicap") return "spread";
  if (value === "total" || value === "totals" || value === "total-goals") return "totals";
  if (value === "team-total" || value === "team-totals" || value === "team-total-goals") return "team-total";
  if (value === "prop") return "prop";
  if (value === "future" || value === "outright") return "future";
  if (market.type === "live") return "live";
  return "winner";
};

const selectionOutcomeForBackendOutcome = (market: Market, outcome: Outcome | undefined) => {
  if (!outcome) return undefined;
  return market.selection?.outcomes?.find((selectionOutcome) => {
    const ids = [selectionOutcome.id, selectionOutcome.outcomeId, selectionOutcome.referenceTokenId, selectionOutcome.tokenId].filter(Boolean);
    if (ids.includes(outcome.id) || ids.includes(outcome.referenceTokenId ?? "")) return true;
    if (selectionOutcome.referenceOutcomeLabel && selectionOutcome.referenceOutcomeLabel === outcome.referenceOutcomeLabel) return true;
    if (selectionOutcome.side && selectionOutcome.side === outcome.side) return true;
    return Boolean(selectionOutcome.label && selectionOutcome.label === outcome.label);
  });
};

const contractSideForOutcome = (market: Market, outcome: Outcome | undefined) => {
  const index = outcome ? market.outcomes.findIndex((item) => item.id === outcome.id) : -1;
  if (outcome?.side === "no" || outcome?.label.toLowerCase().startsWith("no") || (market.outcomes.length === 2 && index === 1)) return "no" as const;
  return "yes" as const;
};

export const ticketSelectionFromBackendMarket = (
  baseSelection: TicketSelection | undefined,
  backendMarket: Market | undefined,
  backendOutcome: Outcome | undefined,
): TicketSelection | undefined => {
  if (!backendMarket || !backendOutcome || !backendMarket.selection) return baseSelection;
  const selectionOutcome = selectionOutcomeForBackendOutcome(backendMarket, backendOutcome);
  return {
    marketType: ticketMarketTypeFromBackendSelection(backendMarket),
    marketId: backendMarket.selection.marketId ?? backendMarket.id,
    outcomeId: selectionOutcome?.outcomeId ?? selectionOutcome?.id ?? backendOutcome.id,
    marketGroupId: backendMarket.selection.marketGroupId ?? backendMarket.selection.marketGroupKey ?? backendMarket.marketGroupId,
    line: backendMarket.selection.line ?? backendMarket.line ?? baseSelection?.line,
    period: backendMarket.selection.period ?? backendMarket.period ?? baseSelection?.period,
    side: selectionOutcome?.side ?? backendOutcome.side ?? baseSelection?.side,
    displayLabel: baseSelection?.displayLabel ?? backendMarket.selection.displayLabel ?? backendMarket.title,
    contractSide: baseSelection?.contractSide ?? contractSideForOutcome(backendMarket, backendOutcome),
    referenceSource: backendMarket.referenceSource ?? baseSelection?.referenceSource,
    externalSlug: backendMarket.externalSlug ?? baseSelection?.externalSlug,
    externalMarketId: backendMarket.externalMarketId ?? baseSelection?.externalMarketId,
    conditionId: backendMarket.conditionId ?? baseSelection?.conditionId,
    referenceTokenId: selectionOutcome?.referenceTokenId ?? selectionOutcome?.tokenId ?? backendOutcome.referenceTokenId ?? baseSelection?.referenceTokenId,
    referenceOutcomeLabel: selectionOutcome?.referenceOutcomeLabel ?? backendOutcome.referenceOutcomeLabel ?? baseSelection?.referenceOutcomeLabel,
    limitPrice: baseSelection?.limitPrice,
    limitSide: baseSelection?.limitSide,
    limitShares: baseSelection?.limitShares,
  };
};

const syntheticMarketForSelection = (selection: TicketSelection | undefined, markets: SyntheticLineMarkets) => {
  if (selection?.marketType === "spread") return markets.spread;
  if (selection?.marketType === "totals") return markets.totals;
  if (selection?.marketType === "team-total") return markets.teamTotal;
  return undefined;
};

const numberFromLine = (line: string | null | undefined) => {
  const parsed = Number(line);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizedPeriod = (period: string | null | undefined) => {
  if (!period) return null;
  const normalized = period.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (normalized === "reg-time" || normalized === "regulation-time" || normalized === "regulation") return "regulation";
  if (normalized === "1st-half" || normalized === "first-half") return "first-half";
  if (normalized === "2nd-half" || normalized === "second-half") return "second-half";
  if (normalized === "full-game") return "full-game";
  return normalized;
};

const comparablePeriod = (period: string | null) => period === "full-game" ? "regulation" : period;

const backendLineMatchesSelection = (selection: TicketSelection | undefined, market: Market | undefined) => {
  if (!selection || !["spread", "totals", "team-total"].includes(selection.marketType)) return true;
  const selectedLine = numberFromLine(selection.line);
  const marketLine = numberFromLine(market?.line);
  if (selectedLine == null || marketLine == null) return false;
  const selectedPeriod = normalizedPeriod(selection.period);
  const marketPeriod = normalizedPeriod(market?.period);
  if (selectedPeriod && marketPeriod && comparablePeriod(selectedPeriod) !== comparablePeriod(marketPeriod)) return false;
  return Math.abs(Math.abs(marketLine) - Math.abs(selectedLine)) < 0.001;
};

export const resolveLineTicketTarget = ({
  selection,
  backendMarket,
  backendOutcome,
  syntheticOutcome,
  syntheticMarkets,
  fallbackMarket,
}: ResolveLineTicketTargetInput) => {
  const syntheticMarket = syntheticMarketForSelection(selection, syntheticMarkets);
  const isLineSelection = Boolean(syntheticMarket);
  const canUseBackendLineMarket = backendLineMatchesSelection(selection, backendMarket);

  if (isLineSelection && backendMarket && backendOutcome && canUseBackendLineMarket) {
    return { market: backendMarket, outcome: backendOutcome, source: "backend-line-market" as const };
  }

  if (isLineSelection && syntheticMarket && syntheticOutcome) {
    return { market: syntheticMarket, outcome: syntheticOutcome, source: "deterministic-line-fixture" as const };
  }

  if (backendMarket && backendOutcome) {
    return { market: backendMarket, outcome: backendOutcome, source: "backend-market" as const };
  }

  if (fallbackMarket && syntheticOutcome) {
    return { market: fallbackMarket, outcome: syntheticOutcome, source: "fallback-market" as const };
  }

  return null;
};
