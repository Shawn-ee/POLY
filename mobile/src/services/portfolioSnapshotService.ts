import type { PolyApi } from "../api";
import type { OpenOrder, Position } from "../components/Portfolio";
import type { TicketSelection } from "../components/TradeTicket";
import type { PortfolioOpenOrderItem, PortfolioPositionItem } from "../types";

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

const requireFiniteNumber = (value: unknown, field: string) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Portfolio snapshot response had invalid ${field}.`);
  }
  return parsed;
};

const requireArray = <T,>(value: T[] | unknown, field: string): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Portfolio snapshot response had invalid ${field}.`);
  }
  return value as T[];
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
  const positions = requireArray<PortfolioPositionItem>(snapshot.positions, "positions");
  const openOrders = requireArray<PortfolioOpenOrderItem>(snapshot.openOrders, "openOrders");
  return {
    balance: requireFiniteNumber(snapshot.walletAvailableUSDC, "walletAvailableUSDC"),
    positions: positions.map((position) => ({
      id: `server-${position.market.id}-${position.outcome}`,
      mode: "server",
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      title: position.market.title,
      outcome: position.outcome,
      selection: selectionFromBackend(position.selection),
      side: "buy",
      amount: requireFiniteNumber(position.costBasisTokens, "positions[].costBasisTokens"),
      probability: Math.round(requireFiniteNumber(position.avgCost, "positions[].avgCost") * 100),
      shares: requireFiniteNumber(position.shares, "positions[].shares"),
      currentPrice: requireFiniteNumber(position.currentPrice, "positions[].currentPrice"),
      marketAvailability: position.market.availability,
      bestBid: toDepthProbability(position.bestBid),
      bestAsk: toDepthProbability(position.bestAsk),
      bestBidSize: toDepthSize(position.bestBidSize),
      bestAskSize: toDepthSize(position.bestAskSize),
      currentValue: requireFiniteNumber(position.valueTokens, "positions[].valueTokens"),
      pnl: requireFiniteNumber(position.pnlTokens, "positions[].pnlTokens"),
    })),
    openOrders: openOrders.map((order) => ({
      id: order.id,
      title: order.market.title,
      outcome: order.outcome.name,
      selection: selectionFromBackend(order.selection),
      side: order.side === "SELL" ? "sell" : "buy",
      status: order.status,
      price: requireFiniteNumber(order.price, "openOrders[].price"),
      remaining: requireFiniteNumber(order.remaining, "openOrders[].remaining"),
      originalShares: requireFiniteNumber(order.size, "openOrders[].size"),
      remainingShares: requireFiniteNumber(order.remaining, "openOrders[].remaining"),
      orderValue: requireFiniteNumber(order.remaining, "openOrders[].remaining") * requireFiniteNumber(order.price, "openOrders[].price"),
      placedAt: formatOpenOrderTimestamp(order.createdAt),
    })),
  };
};
