import fs from "node:fs";
import path from "node:path";
import { canceledOrdersToActivity, portfolioHistoryToActivity, recentTradesToActivity } from "../mobile/src/services/portfolioHistoryService";
import type { PortfolioCanceledOrderItem, PortfolioHistoryItem, PortfolioRecentTradeItem } from "../mobile/src/types";

const CYCLE = "cycle-MF-portfolio-history-economics-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const historyItem = (overrides: Partial<PortfolioHistoryItem> = {}): PortfolioHistoryItem => ({
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

const rejectedWith = (work: () => unknown, message: string) => {
  try {
    work();
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const main = () => {
  const closedActivity = portfolioHistoryToActivity([historyItem()]);
  const tradeActivity = recentTradesToActivity([recentTrade()]);
  const canceledActivity = canceledOrdersToActivity([canceledOrder()]);

  const assertions = {
    validHistoryEconomicsApply:
      closedActivity[0]?.amount === 172.5 &&
      closedActivity[0]?.entryAmount === 100 &&
      tradeActivity[0]?.shares === 200 &&
      canceledActivity[0]?.amount === 50,
    negativeRealizedPnlRemainsAllowed: closedActivity[0]?.amount === 172.5,
    negativeWinningsRejects: rejectedWith(
      () => portfolioHistoryToActivity([historyItem({ winningsTokens: -1 })]),
      "history[].winningsTokens",
    ),
    negativeTradeSharesRejects: rejectedWith(
      () => recentTradesToActivity([recentTrade({ shares: -1 })]),
      "recentTrades[].shares",
    ),
    negativeTradeCostRejects: rejectedWith(
      () => recentTradesToActivity([recentTrade({ cost: -1 })]),
      "recentTrades[].cost",
    ),
    negativeCanceledOrderPriceRejects: rejectedWith(
      () => canceledOrdersToActivity([canceledOrder({ price: -0.01 })]),
      "canceledOrders[].price",
    ),
  };

  const proof = {
    cycle: "Cycle MF",
    feature: "Portfolio history economics contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio/history",
    contract: {
      validPayload: "visible Portfolio history/activity amounts, shares, and probabilities must be derived from finite non-negative economics",
      malformedPayload: "negative payouts, trade shares/costs, or canceled-order economics reject before visible Portfolio activity applies",
      allowedLoss: "realizedPnLTokens may be negative because it is not used as the rendered activity amount",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MF proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
