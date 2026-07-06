import fs from "node:fs";
import path from "node:path";
import { canceledOrdersToActivity, recentTradesToActivity } from "../mobile/src/services/portfolioHistoryService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import { portfolioSelectionFromBackend } from "../mobile/src/services/portfolioSelectionService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-MB-portfolio-selection-identity-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const validSelection = {
  marketId: "mexico-ecuador-spread",
  outcomeId: "spread-yes",
  marketGroupId: "live-game-lines",
  marketType: "spread",
  line: "2.5",
  period: "Reg. Time",
  side: "home",
  displayLabel: "MEX -2.5 RT",
  contractSide: "no",
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
  walletLockedUSDC: 0,
  walletTotalUSDC: 10000,
  walletBalance: 10000,
  totalValue: 31,
  totalCostBasis: 31,
  totalRealizedPnl: 0,
  totalPnl: 0,
  comboOrders: [],
  positions: [
    {
      market: {
        id: "mexico-ecuador-spread",
        title: "Mexico vs. Ecuador",
        status: "ACTIVE",
        resolveTime: null,
        createdAt: "2026-07-06T08:00:00.000Z",
      },
      outcomeId: "spread-yes",
      outcome: "YES",
      selection: selection as PortfolioSnapshot["positions"][number]["selection"],
      shares: 100,
      avgCost: 0.31,
      currentPrice: 0.31,
      bestBid: 0.3,
      bestAsk: 0.32,
      valueTokens: 31,
      costBasisTokens: 31,
      totalCostBasisTokens: 31,
      pnlTokens: 0,
    },
  ],
  openOrders: [
    {
      id: "line-open-order",
      market: {
        id: "mexico-ecuador-spread",
        title: "Mexico vs. Ecuador",
        status: "ACTIVE",
      },
      outcome: {
        id: "spread-yes",
        name: "YES",
      },
      selection: selection as PortfolioSnapshot["openOrders"][number]["selection"],
      side: "BUY",
      status: "OPEN",
      price: 0.31,
      size: 100,
      remaining: 80,
      reservedNotional: 24.8,
      createdAt: "2026-07-06T08:00:00.000Z",
      updatedAt: "2026-07-06T08:00:00.000Z",
    },
  ],
});

const apiForSnapshot = (payload: PortfolioSnapshot) => ({
  getPortfolio: async () => payload,
});

const rejectedWith = async (work: () => unknown | Promise<unknown>, message: string) => {
  const result = await Promise.allSettled([Promise.resolve().then(work)]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const snapshot = await loadPortfolioSnapshot(apiForSnapshot(snapshotPayload(validSelection)) as Parameters<typeof loadPortfolioSnapshot>[0]);
  const recentTrade = recentTradesToActivity([
    {
      id: "line-trade",
      market: { id: "mexico-ecuador-spread", title: "Mexico vs. Ecuador", status: "ACTIVE" },
      outcome: { id: "spread-yes", name: "YES" },
      selection: validSelection,
      side: "BUY",
      shares: 100,
      cost: 31,
      fee: 0,
      createdAt: "2026-07-06T08:00:00.000Z",
    },
  ]);
  const canceledOrder = canceledOrdersToActivity([
    {
      id: "line-canceled",
      market: { id: "mexico-ecuador-spread", title: "Mexico vs. Ecuador", status: "ACTIVE" },
      outcome: { id: "spread-yes", name: "YES" },
      selection: validSelection,
      side: "BUY",
      status: "CANCELED",
      price: 0.31,
      size: 100,
      remaining: 80,
      canceledAt: "2026-07-06T08:05:00.000Z",
    },
  ]);

  const assertions = {
    validSnapshotSelectionPreserved:
      snapshot.positions[0]?.selection?.marketType === "spread" &&
      snapshot.positions[0]?.selection?.displayLabel === "MEX -2.5 RT" &&
      snapshot.openOrders[0]?.selection?.limitSide === "bid",
    validHistorySelectionPreserved:
      recentTrade[0]?.selection?.marketType === "spread" &&
      canceledOrder[0]?.selection?.displayLabel === "MEX -2.5 RT",
    unknownMarketTypeRejects: await rejectedWith(
      () => loadPortfolioSnapshot(apiForSnapshot(snapshotPayload({ ...validSelection, marketType: "mystery" })) as Parameters<typeof loadPortfolioSnapshot>[0]),
      "positions[].selection.marketType",
    ),
    missingDisplayLabelRejects: await rejectedWith(
      () => portfolioSelectionFromBackend({ ...validSelection, displayLabel: "" }, "recentTrades[].selection"),
      "recentTrades[].selection.displayLabel",
    ),
    invalidLimitFieldsReject: await rejectedWith(
      () => portfolioSelectionFromBackend({ ...validSelection, limitPrice: -0.01 }, "openOrders[].selection"),
      "openOrders[].selection.limitPrice",
    ),
  };

  const proof = {
    cycle: "Cycle MB",
    feature: "Portfolio selection identity contract",
    generatedAt: new Date().toISOString(),
    routes: ["/api/portfolio", "/api/portfolio/history"],
    contract: {
      validPayload: "backend selection identity for positions, open orders, recent trades, and canceled orders is preserved for visible Portfolio rows",
      malformedPayload: "unknown market types, missing display labels, and invalid limit fields reject before visible Portfolio state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MB proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
