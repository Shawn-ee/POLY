import type { PolyApi } from "../api";
import type { PortfolioActivity } from "../components/Portfolio";
import type { PortfolioCanceledOrderItem, PortfolioHistoryItem, PortfolioRecentTradeItem } from "../types";
import { portfolioSelectionFromBackend } from "./portfolioSelectionService";

const formatHistoryTimestamp = (value: string | null) => {
  if (!value) return undefined;
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

const requireArray = <T,>(value: T[] | unknown, field: string): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Portfolio history response had invalid ${field}.`);
  }
  return value as T[];
};

const requireFiniteNumber = (value: unknown, field: string) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Portfolio history response had invalid ${field}.`);
  }
  return parsed;
};

export const portfolioHistoryToActivity = (history: Awaited<ReturnType<PolyApi["getPortfolioHistory"]>>["history"]): PortfolioActivity[] =>
  history.map((item) => {
    const payout = requireFiniteNumber(item.winningsTokens, "history[].winningsTokens") + requireFiniteNumber(item.refundsTokens, "history[].refundsTokens");
    const netInvested = requireFiniteNumber(item.netInvestedTokens, "history[].netInvestedTokens");
    return {
      id: `history-${item.market.id}`,
      action: "closed",
      title: item.market.title,
      outcome: item.resolvedOutcomeName ?? "Resolved",
      amount: payout > 0 ? payout : netInvested,
      entryAmount: netInvested,
      timestamp: formatHistoryTimestamp(item.market.resolveTime ?? item.market.createdAt),
    };
  });

export const canceledOrdersToActivity = (orders: PortfolioCanceledOrderItem[] = []): PortfolioActivity[] =>
  orders.map((order) => ({
    id: `canceled-order-${order.id}`,
    action: "canceled",
    title: order.market.title,
    outcome: order.outcome.name,
    selection: portfolioSelectionFromBackend(order.selection, "canceledOrders[].selection"),
    amount: requireFiniteNumber(order.remaining, "canceledOrders[].remaining") * requireFiniteNumber(order.price, "canceledOrders[].price"),
    shares: requireFiniteNumber(order.remaining, "canceledOrders[].remaining"),
    side: order.side === "SELL" ? "sell" : "buy",
    probability: Math.round(requireFiniteNumber(order.price, "canceledOrders[].price") * 100),
    timestamp: formatHistoryTimestamp(order.canceledAt),
  }));

export const recentTradesToActivity = (trades: PortfolioRecentTradeItem[] = []): PortfolioActivity[] =>
  trades.map((trade) => {
    const shares = requireFiniteNumber(trade.shares, "recentTrades[].shares");
    const cost = requireFiniteNumber(trade.cost, "recentTrades[].cost");
    const executionPrice = shares > 0 ? cost / shares : 0;
    return {
      id: `trade-${trade.id}`,
      action: trade.side === "SELL" ? "sold" : "opened",
      title: trade.market.title,
      outcome: trade.outcome.name,
      selection: portfolioSelectionFromBackend(trade.selection, "recentTrades[].selection"),
      amount: cost,
      shares,
      side: trade.side === "SELL" ? "sell" : "buy",
      probability: Math.round(executionPrice * 100),
      timestamp: formatHistoryTimestamp(trade.createdAt),
    };
  });

export const loadPortfolioHistoryActivities = async (api: PolyApi): Promise<PortfolioActivity[]> => {
  const payload = await api.getPortfolioHistory();
  const history = requireArray<PortfolioHistoryItem>(payload.history, "history");
  const recentTrades = requireArray<PortfolioRecentTradeItem>(payload.recentTrades ?? [], "recentTrades");
  const canceledOrders = requireArray<PortfolioCanceledOrderItem>(payload.canceledOrders ?? [], "canceledOrders");
  return [
    ...recentTradesToActivity(recentTrades),
    ...canceledOrdersToActivity(canceledOrders),
    ...portfolioHistoryToActivity(history),
  ];
};
