import fs from "node:fs";
import path from "node:path";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import { loadPortfolioHistoryActivities } from "../mobile/src/services/portfolioHistoryService";
import { portfolioSelectionFromBackend } from "../mobile/src/services/portfolioSelectionService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-NC-selection-limit-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const validSelection = {
  marketId: "mexico-ecuador-spread",
  outcomeId: "spread-yes",
  marketGroupId: "live-game-lines",
  marketType: "spread",
  line: "2.5",
  period: "1st Half",
  side: "home",
  displayLabel: "MEX -2.5 1H",
  contractSide: "yes",
  referenceSource: "polymarket",
  externalSlug: "mexico-ecuador-spread",
  externalMarketId: "gamma-spread",
  conditionId: "condition-spread",
  referenceTokenId: "token-spread-yes",
  referenceOutcomeLabel: "Mexico -2.5",
  limitPrice: 0.31,
  limitSide: "bid",
  limitShares: 80,
} as const;

const snapshotPayload = (selection: unknown): PortfolioSnapshot => ({
  walletAvailableUSDC: 10000,
  walletLockedUSDC: 150,
  walletTotalUSDC: 10150,
  walletBalance: 10150,
  totalValue: 355,
  totalCostBasis: 300,
  totalRealizedPnl: 22,
  totalPnl: 77,
  comboOrders: [],
  positions: [
    {
      market: {
        id: "mexico-ecuador-spread",
        title: "Mexico vs. Ecuador",
        status: "ACTIVE",
        resolveTime: null,
        createdAt: "2026-06-01T12:00:00.000Z",
      },
      outcomeId: "spread-yes",
      outcome: "YES",
      selection: selection as PortfolioSnapshot["positions"][number]["selection"],
      shares: 500,
      avgCost: 0.42,
      currentPrice: 0.51,
      bestBid: 0.47,
      bestAsk: 0.5,
      valueTokens: 255,
      costBasisTokens: 210,
      totalCostBasisTokens: 210,
      pnlTokens: 45,
    },
  ],
  openOrders: [],
});

const historyPayload = (selection: unknown) => ({
  history: [],
  canceledOrders: [
    {
      id: "canceled-line-order",
      market: { id: "mexico-ecuador-spread", title: "Mexico vs. Ecuador", status: "ACTIVE" },
      outcome: { id: "spread-yes", name: "YES" },
      selection,
      side: "BUY",
      status: "CANCELED",
      price: 0.31,
      size: 100,
      remaining: 100,
      canceledAt: "2026-07-02T05:55:00.000Z",
    },
  ],
  recentTrades: [],
});

const rejectedWith = async (operation: () => Promise<unknown> | unknown, message: string) => {
  const result = await Promise.allSettled([Promise.resolve().then(operation)]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validDirect = portfolioSelectionFromBackend({ ...validSelection, limitPrice: 1, limitShares: 2400.5 }, "selection");
  const validSnapshot = await loadPortfolioSnapshot({
    getPortfolio: async () => snapshotPayload({ ...validSelection, limitPrice: 1, limitShares: 2400.5 }),
  } as unknown as PolyApi);

  const validHistory = await loadPortfolioHistoryActivities({
    getPortfolioHistory: async () => historyPayload({ ...validSelection, limitPrice: 1, limitShares: 2400.5 }),
  } as unknown as PolyApi);

  const orderEchoRejected = await rejectedWith(
    () =>
      submitTicketOrder({
        mode: "server",
        api: {
          placeLimitOrder: async () => ({
            order: {
              id: "line-order-bad-limit",
              selection: { ...validSelection, limitPrice: 1.2 },
            },
          }),
        } as unknown as PolyApi,
        event: {
          id: "mexico-ecuador",
          title: "Mexico vs. Ecuador",
          zhTitle: "Mexico vs. Ecuador",
          league: "World Cup",
          startsAt: "Today 8:00 PM",
          status: "today",
          tag: "Group Stage",
          zhTag: "Group Stage",
          teams: [],
          markets: [],
        },
        market: {
          id: "mexico-ecuador-spread",
          title: "Spread MEX -2.5 1H",
          zhTitle: "Spread MEX -2.5 1H",
          type: "game-line",
          outcomes: [],
        },
        outcome: {
          id: "spread-yes",
          label: "MEX -2.5 1H",
          zhLabel: "MEX -2.5 1H",
          probability: 31,
          color: "#0a8f61",
        },
        selection: { marketType: "spread", line: "2.5", period: "1st Half", displayLabel: "MEX -2.5 1H" },
        side: "buy",
        amount: 25,
      }),
    "order.selection.limitPrice",
  );

  const assertions = {
    validLimitPriceOneAccepted:
      validDirect?.limitPrice === 1 &&
      validDirect?.limitShares === 2400.5,
    portfolioSnapshotLimitPriceAccepted:
      validSnapshot.positions[0]?.selection?.limitPrice === 1 &&
      validSnapshot.positions[0]?.selection?.limitShares === 2400.5,
    portfolioHistoryLimitPriceAccepted:
      validHistory[0]?.selection?.limitPrice === 1 &&
      validHistory[0]?.selection?.limitShares === 2400.5,
    directLimitPriceAboveOneRejects: await rejectedWith(
      () => portfolioSelectionFromBackend({ ...validSelection, limitPrice: 1.2 }, "selection"),
      "selection.limitPrice",
    ),
    portfolioSnapshotLimitPriceAboveOneRejects: await rejectedWith(
      () => loadPortfolioSnapshot({ getPortfolio: async () => snapshotPayload({ ...validSelection, limitPrice: 1.2 }) } as unknown as PolyApi),
      "positions[].selection.limitPrice",
    ),
    portfolioHistoryLimitPriceAboveOneRejects: await rejectedWith(
      () => loadPortfolioHistoryActivities({ getPortfolioHistory: async () => historyPayload({ ...validSelection, limitPrice: 1.2 }) } as unknown as PolyApi),
      "canceledOrders[].selection.limitPrice",
    ),
    orderEchoLimitPriceAboveOneRejects: orderEchoRejected,
  };

  const proof = {
    cycle: "Cycle NC",
    feature: "Selection limit price bounds contract",
    generatedAt: new Date().toISOString(),
    routes: ["/api/orders", "/api/portfolio", "/api/portfolio/history"],
    contract: {
      validPayload: "Selected-market limitPrice must be a contract price from 0 to 1.",
      sizePayload: "limitShares remains a share size and may be greater than 1.",
      malformedPayload: "above-one limitPrice rejects before visible Portfolio, History, or submitted-order state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NC proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
