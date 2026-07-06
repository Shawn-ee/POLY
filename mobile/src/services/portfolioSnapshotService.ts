import type { PolyApi } from "../api";
import type { OpenOrder, Position } from "../components/Portfolio";
import type { PortfolioOpenOrderItem, PortfolioPositionItem } from "../types";
import { portfolioSelectionFromBackend } from "./portfolioSelectionService";

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

const requireNonNegativeNumber = (value: unknown, field: string) => {
  const parsed = requireFiniteNumber(value, field);
  if (parsed < 0) {
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

export const loadPortfolioSnapshot = async (api: PolyApi): Promise<PortfolioSnapshotResult> => {
  const snapshot = await api.getPortfolio();
  const positions = requireArray<PortfolioPositionItem>(snapshot.positions, "positions");
  const openOrders = requireArray<PortfolioOpenOrderItem>(snapshot.openOrders, "openOrders");
  return {
    balance: requireNonNegativeNumber(snapshot.walletAvailableUSDC, "walletAvailableUSDC"),
    positions: positions.map((position) => ({
      id: `server-${position.market.id}-${position.outcome}`,
      mode: "server",
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      title: position.market.title,
      outcome: position.outcome,
      selection: portfolioSelectionFromBackend(position.selection, "positions[].selection"),
      side: "buy",
      amount: requireNonNegativeNumber(position.costBasisTokens, "positions[].costBasisTokens"),
      probability: Math.round(requireNonNegativeNumber(position.avgCost, "positions[].avgCost") * 100),
      shares: requireNonNegativeNumber(position.shares, "positions[].shares"),
      currentPrice: requireNonNegativeNumber(position.currentPrice, "positions[].currentPrice"),
      marketAvailability: position.market.availability,
      bestBid: toDepthProbability(position.bestBid),
      bestAsk: toDepthProbability(position.bestAsk),
      bestBidSize: toDepthSize(position.bestBidSize),
      bestAskSize: toDepthSize(position.bestAskSize),
      currentValue: requireNonNegativeNumber(position.valueTokens, "positions[].valueTokens"),
      pnl: requireFiniteNumber(position.pnlTokens, "positions[].pnlTokens"),
    })),
    openOrders: openOrders.map((order) => ({
      id: order.id,
      title: order.market.title,
      outcome: order.outcome.name,
      selection: portfolioSelectionFromBackend(order.selection, "openOrders[].selection"),
      side: order.side === "SELL" ? "sell" : "buy",
      status: order.status,
      price: requireNonNegativeNumber(order.price, "openOrders[].price"),
      remaining: requireNonNegativeNumber(order.remaining, "openOrders[].remaining"),
      originalShares: requireNonNegativeNumber(order.size, "openOrders[].size"),
      remainingShares: requireNonNegativeNumber(order.remaining, "openOrders[].remaining"),
      orderValue: requireNonNegativeNumber(order.remaining, "openOrders[].remaining") * requireNonNegativeNumber(order.price, "openOrders[].price"),
      placedAt: formatOpenOrderTimestamp(order.createdAt),
    })),
  };
};
