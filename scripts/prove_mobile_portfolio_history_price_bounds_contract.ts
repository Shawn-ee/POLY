import fs from "node:fs";
import path from "node:path";
import { loadPortfolioHistoryActivities } from "../mobile/src/services/portfolioHistoryService";
import type { PortfolioCanceledOrderItem, PortfolioHistoryItem, PortfolioRecentTradeItem } from "../mobile/src/types";

const CYCLE = "cycle-MZ-portfolio-history-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const resolvedHistory: PortfolioHistoryItem = {
  market: {
    id: "world-cup-final",
    title: "World Cup final winner",
    status: "RESOLVED",
    resolveTime: "2026-07-19T22:30:00.000Z",
    resolvedOutcomeId: "france",
    createdAt: "2026-07-01T14:00:00.000Z",
  },
  resolvedOutcomeName: "France",
  totalBuyCostTokens: 100,
  totalSellProceedsTokens: 0,
  netInvestedTokens: 100,
  winningsTokens: 172.5,
  refundsTokens: 0,
  realizedPnLTokens: -12.5,
};

const canceledOrder = (overrides: Partial<PortfolioCanceledOrderItem> = {}): PortfolioCanceledOrderItem => ({
  id: "order-canceled-1",
  market: {
    id: "world-cup-winner",
    title: "Will France win the 2026 FIFA World Cup?",
    status: "LIVE",
  },
  outcome: {
    id: "yes",
    name: "YES",
  },
  side: "BUY",
  status: "CANCELED",
  price: 0.5,
  size: 200,
  remaining: 100,
  canceledAt: "2026-07-02T05:55:00.000Z",
  ...overrides,
});

const recentTrade = (overrides: Partial<PortfolioRecentTradeItem> = {}): PortfolioRecentTradeItem => ({
  id: "trade-1",
  market: {
    id: "world-cup-winner",
    title: "Will France win the 2026 FIFA World Cup?",
    status: "LIVE",
  },
  outcome: {
    id: "yes",
    name: "YES",
  },
  side: "BUY",
  shares: 200,
  cost: 100,
  fee: 0,
  createdAt: "2026-07-02T06:10:00.000Z",
  ...overrides,
});

const historyPayload = (overrides: {
  canceledOrders?: PortfolioCanceledOrderItem[];
  recentTrades?: PortfolioRecentTradeItem[];
  history?: PortfolioHistoryItem[];
} = {}) => ({
  history: overrides.history ?? [resolvedHistory],
  canceledOrders: overrides.canceledOrders ?? [canceledOrder()],
  recentTrades: overrides.recentTrades ?? [recentTrade()],
});

const apiForPayload = (payload: unknown) => ({
  getPortfolioHistory: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadPortfolioHistoryActivities(apiForPayload(payload) as Parameters<typeof loadPortfolioHistoryActivities>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const valid = await loadPortfolioHistoryActivities(apiForPayload(historyPayload()));
  const priceOne = await loadPortfolioHistoryActivities(apiForPayload(historyPayload({
    canceledOrders: [canceledOrder({ price: 1 })],
    recentTrades: [recentTrade({ shares: 100, cost: 100 })],
  })));

  const assertions = {
    validHistoryPricesAccepted:
      valid.some((activity) => activity.id === "canceled-order-order-canceled-1" && activity.probability === 50 && activity.amount === 50) &&
      valid.some((activity) => activity.id === "trade-trade-1" && activity.probability === 50 && activity.amount === 100),
    priceOneAccepted:
      priceOne.some((activity) => activity.id === "canceled-order-order-canceled-1" && activity.probability === 100) &&
      priceOne.some((activity) => activity.id === "trade-trade-1" && activity.probability === 100),
    canceledOrderPriceAboveOneRejects: await rejectedWith(historyPayload({ canceledOrders: [canceledOrder({ price: 1.2 })] }), "canceledOrders[].price"),
    recentTradeExecutionPriceAboveOneRejects: await rejectedWith(historyPayload({ recentTrades: [recentTrade({ shares: 100, cost: 120 })] }), "recentTrades[].cost"),
    nonzeroCostWithoutSharesRejects: await rejectedWith(historyPayload({ recentTrades: [recentTrade({ shares: 0, cost: 1 })] }), "recentTrades[].cost"),
    negativeResolvedPnlRemainsAllowed: valid.some((activity) => activity.id === "history-world-cup-final" && activity.entryAmount === 100),
  };

  const proof = {
    cycle: "Cycle MZ",
    feature: "Portfolio history price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio/history",
    contract: {
      validPayload: "Canceled order price and recent trade execution price must be probability prices from 0 to 1.",
      malformedPayload: "above-one history activity prices reject before visible Portfolio history state applies.",
      allowedLoss: "resolved realized P/L remains allowed to be negative.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MZ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
