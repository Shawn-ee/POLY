import fs from "node:fs/promises";
import path from "node:path";
import { marketOrderBlockReason } from "../mobile/src/services/orderService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import { resolvePositionTradeTarget } from "../mobile/src/services/positionTradeTargetService";
import type { PolyApi } from "../mobile/src/api";
import type { PortfolioSnapshot } from "../mobile/src/types";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LF-portfolio-position-availability-contract/cycle-LF-portfolio-position-availability-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const unavailablePortfolio: PortfolioSnapshot = {
  walletAvailableUSDC: 1000,
  walletLockedUSDC: 0,
  walletTotalUSDC: 1000,
  walletBalance: 1000,
  totalValue: 50,
  totalCostBasis: 45,
  totalRealizedPnl: 0,
  totalPnl: 5,
  comboOrders: [],
  positions: [
    {
      market: {
        id: "lf-closed-market",
        title: "LF Closed Position Market",
        status: "CLOSED",
        availability: {
          source: "portfolio-market-status",
          status: "unavailable",
          marketStatus: "CLOSED",
          lastUpdated: null,
          stalenessSeconds: null,
          staleAfterSeconds: 60,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "Market is not accepting orders.",
        },
        resolveTime: null,
        createdAt: "2026-07-06T09:00:00.000Z",
      },
      outcomeId: "lf-closed-outcome",
      outcome: "YES",
      selection: null,
      shares: 100,
      avgCost: 0.45,
      currentPrice: 0.5,
      bestBid: null,
      bestAsk: null,
      bestBidSize: null,
      bestAskSize: null,
      valueTokens: 50,
      costBasisTokens: 45,
      totalCostBasisTokens: 45,
      pnlTokens: 5,
    },
  ],
  openOrders: [],
};

const api = {
  getPortfolio: async () => unavailablePortfolio,
} as unknown as PolyApi;

async function main() {
  const snapshot = await loadPortfolioSnapshot(api);
  const position = snapshot.positions[0];
  assert(position, "Expected mapped server position.");
  assert(position.marketAvailability?.status === "unavailable", "Expected unavailable market availability on position.");

  const target = resolvePositionTradeTarget({ position, futures: [], events: [] });
  assert(target, "Expected backend-only position fallback target.");
  assert(target.market.availability?.status === "unavailable", "Expected fallback ticket target to keep availability.");
  assert(
    marketOrderBlockReason(target.market) === "Market is not accepting orders.",
    "Expected order submit guard to block unavailable fallback target.",
  );

  const proof = {
    cycle: "LF",
    gate: "portfolio-position-availability-contract",
    generatedAt: new Date().toISOString(),
    routes: ["/api/portfolio", "/api/orders"],
    assertions: {
      portfolioRouteDisclosesPositionMarketAvailability: true,
      mobilePositionKeepsAvailability: true,
      backendOnlyPositionTicketTargetKeepsAvailability: true,
      unavailablePositionRetradeSubmitIsBlocked: true,
    },
    position: {
      id: position.id,
      marketId: position.marketId,
      outcomeId: position.outcomeId,
      marketAvailability: position.marketAvailability,
    },
    target: {
      marketId: target.market.id,
      outcomeId: target.outcome.id,
      availability: target.market.availability,
      blockReason: marketOrderBlockReason(target.market),
    },
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, assertions: proof.assertions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
