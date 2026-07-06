import type { PolyApi } from "../api";
import type { OpenOrder, Position } from "../components/Portfolio";
import type { TicketSelection } from "../components/TradeTicket";

export type PortfolioSnapshotResult = {
  balance: number;
  positions: Position[];
  openOrders: OpenOrder[];
};

const formatOpenOrderTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsed);
};

const toDepthProbability = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed <= 1 ? Math.round(parsed * 100) : Math.round(parsed);
};

const toDepthSize = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const knownMarketTypes: TicketSelection["marketType"][] = ["spread", "totals", "team-total", "winner", "prop", "future", "live"];

const selectionFromBackend = (
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
    contractSide?: "yes" | "no";
    referenceSource?: string;
    externalSlug?: string;
    externalMarketId?: string;
    conditionId?: string;
    referenceTokenId?: string;
    referenceOutcomeLabel?: string;
    limitPrice?: number;
    limitSide?: "bid" | "ask";
    limitShares?: number;
  } | null,
): TicketSelection | undefined => {
  if (!selection?.displayLabel) return undefined;
  const marketType = knownMarketTypes.includes(selection.marketType as TicketSelection["marketType"])
    ? (selection.marketType as TicketSelection["marketType"])
    : "prop";
  return {
    marketType,
    marketId: selection.marketId,
    outcomeId: selection.outcomeId,
    marketGroupId: selection.marketGroupId,
    line: selection.line,
    period: selection.period,
    side: selection.side,
    displayLabel: selection.displayLabel,
    contractSide: selection.contractSide,
    referenceSource: selection.referenceSource,
    externalSlug: selection.externalSlug,
    externalMarketId: selection.externalMarketId,
    conditionId: selection.conditionId,
    referenceTokenId: selection.referenceTokenId,
    referenceOutcomeLabel: selection.referenceOutcomeLabel,
    limitPrice: selection.limitPrice,
    limitSide: selection.limitSide,
    limitShares: selection.limitShares,
  };
};

export const loadPortfolioSnapshot = async (api: PolyApi): Promise<PortfolioSnapshotResult> => {
  const snapshot = await api.getPortfolio();
  return {
    balance: snapshot.walletAvailableUSDC,
    positions: snapshot.positions.map((position) => ({
      id: `server-${position.market.id}-${position.outcome}`,
      mode: "server",
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      title: position.market.title,
      outcome: position.outcome,
      selection: selectionFromBackend(position.selection),
      side: "buy",
      amount: position.costBasisTokens,
      probability: Math.round(position.avgCost * 100),
      shares: position.shares,
      currentPrice: position.currentPrice,
      marketAvailability: position.market.availability,
      bestBid: toDepthProbability(position.bestBid),
      bestAsk: toDepthProbability(position.bestAsk),
      bestBidSize: toDepthSize(position.bestBidSize),
      bestAskSize: toDepthSize(position.bestAskSize),
      currentValue: position.valueTokens,
      pnl: position.pnlTokens,
    })),
    openOrders: snapshot.openOrders.map((order) => ({
      id: order.id,
      title: order.market.title,
      outcome: order.outcome.name,
      selection: selectionFromBackend(order.selection),
      side: order.side === "SELL" ? "sell" : "buy",
      status: order.status,
      price: order.price,
      remaining: order.remaining,
      originalShares: order.size,
      remainingShares: order.remaining,
      orderValue: order.remaining * order.price,
      placedAt: formatOpenOrderTimestamp(order.createdAt),
    })),
  };
};
