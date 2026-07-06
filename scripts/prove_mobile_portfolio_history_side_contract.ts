import fs from "node:fs";
import path from "node:path";
import { canceledOrdersToActivity, recentTradesToActivity } from "../mobile/src/services/portfolioHistoryService";
import type { PortfolioCanceledOrderItem, PortfolioRecentTradeItem } from "../mobile/src/types";

const CYCLE = "cycle-NO-portfolio-history-side-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

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
  shares: 100,
  cost: 50,
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

const rejectsTradeWith = (trade: PortfolioRecentTradeItem, text: string) => {
  try {
    recentTradesToActivity([trade]);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const rejectsCanceledOrderWith = (order: PortfolioCanceledOrderItem, text: string) => {
  try {
    canceledOrdersToActivity([order]);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const buyTrade = recentTradesToActivity([recentTrade({ side: "BUY" })])[0];
const sellTrade = recentTradesToActivity([recentTrade({ side: "SELL" })])[0];
const buyCanceledOrder = canceledOrdersToActivity([canceledOrder({ side: "BUY" })])[0];
const sellCanceledOrder = canceledOrdersToActivity([canceledOrder({ side: "SELL" })])[0];

const assertions = {
  acceptsRecentTradeBuySide: buyTrade?.action === "opened" && buyTrade.side === "buy",
  acceptsRecentTradeSellSide: sellTrade?.action === "sold" && sellTrade.side === "sell",
  rejectsRecentTradeUnknownSide: rejectsTradeWith(
    recentTrade({ side: "HOLD" as never }),
    "invalid recentTrades[].side",
  ),
  acceptsCanceledOrderBuySide: buyCanceledOrder?.action === "canceled" && buyCanceledOrder.side === "buy",
  acceptsCanceledOrderSellSide: sellCanceledOrder?.action === "canceled" && sellCanceledOrder.side === "sell",
  rejectsCanceledOrderUnknownSide: rejectsCanceledOrderWith(
    canceledOrder({ side: "HOLD" as never }),
    "invalid canceledOrders[].side",
  ),
};

const proof = {
  cycle: "Cycle NO",
  feature: "Portfolio history side contract",
  generatedAt: new Date().toISOString(),
  route: "/api/portfolio/history",
  contract: {
    validPayload: "recentTrades and canceledOrders rows must use BUY or SELL before becoming visible Portfolio History activity.",
    malformedPayload: "unknown or missing side values reject before visible Portfolio History state applies.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NO proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
