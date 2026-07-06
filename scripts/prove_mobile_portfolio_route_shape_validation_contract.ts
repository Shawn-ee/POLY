import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadPortfolioHistoryActivities } from "../mobile/src/services/portfolioHistoryService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import { resolvePortfolioSyncResults } from "../mobile/src/services/portfolioSyncService";

const CYCLE = "cycle-LO-portfolio-route-shape-validation-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const malformedSnapshotApi = {
  getPortfolio: async () => ({
    walletAvailableUSDC: 100,
    walletLockedUSDC: 0,
    walletTotalUSDC: 100,
    walletBalance: 100,
    totalValue: 100,
    totalCostBasis: 0,
    totalRealizedPnl: 0,
    totalPnl: 0,
    positions: undefined,
    openOrders: [],
    comboOrders: [],
  }),
} as unknown as PolyApi;

const malformedHistoryApi = {
  getPortfolioHistory: async () => ({
    history: [],
    recentTrades: [
      {
        id: "bad-trade",
        market: { id: "market-1", title: "Market", status: "LIVE" },
        outcome: { id: "yes", name: "YES" },
        side: "BUY",
        shares: Number.NaN,
        cost: 10,
        fee: 0,
        createdAt: "2026-07-06T12:00:00.000Z",
      },
    ],
    canceledOrders: [],
  }),
} as unknown as PolyApi;

const main = async () => {
const snapshotResult = await Promise.allSettled([loadPortfolioSnapshot(malformedSnapshotApi)]);
const historyResult = await Promise.allSettled([loadPortfolioHistoryActivities(malformedHistoryApi)]);
const syncState = resolvePortfolioSyncResults(snapshotResult[0], historyResult[0]);

const assertions = {
  malformedSnapshotRejectsBeforeApply:
    snapshotResult[0].status === "rejected" &&
    String(snapshotResult[0].reason?.message ?? snapshotResult[0].reason).includes("invalid positions"),
  malformedHistoryRejectsBeforeApply:
    historyResult[0].status === "rejected" &&
    String(historyResult[0].reason?.message ?? historyResult[0].reason).includes("invalid recentTrades[].shares"),
  malformedRoutesDoNotReportSynced:
    syncState.syncStatus === "error" &&
    syncState.snapshotStatus === "error" &&
    syncState.historyStatus === "error" &&
    !("snapshot" in syncState) &&
    !("activities" in syncState),
};

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const proof = {
  cycle: "Cycle LO",
  feature: "Portfolio route shape validation contract",
  generatedAt: new Date().toISOString(),
  routes: ["/api/portfolio", "/api/portfolio/history"],
  contract: {
    snapshot: "required arrays and numeric fields must validate before applying Portfolio state",
    history: "required arrays and numeric activity fields must validate before applying Portfolio activity",
    sync: "malformed route payloads surface as Portfolio sync error, not synced state",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

if (failed.length) {
  console.error(`Cycle LO proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
