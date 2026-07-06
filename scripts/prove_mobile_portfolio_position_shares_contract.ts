import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-NR-portfolio-position-shares-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const snapshot = (shares: number): PortfolioSnapshot => ({
  walletAvailableUSDC: 10000,
  walletLockedUSDC: 150,
  walletTotalUSDC: 10150,
  walletBalance: 10150,
  totalValue: 255,
  totalCostBasis: 210,
  totalRealizedPnl: 0,
  totalPnl: 45,
  comboOrders: [],
  positions: [
    {
      market: {
        id: "world-cup-winner",
        title: "World Cup winner",
        status: "ACTIVE",
        resolveTime: null,
        createdAt: "2026-06-01T12:00:00.000Z",
      },
      outcomeId: "france",
      outcome: "France",
      selection: null,
      shares,
      avgCost: 0.42,
      currentPrice: 0.51,
      valueTokens: 255,
      costBasisTokens: 210,
      totalCostBasisTokens: 210,
      pnlTokens: 45,
    },
  ],
  openOrders: [],
});

const emptySnapshot = (): PortfolioSnapshot => ({
  ...snapshot(1),
  totalValue: 0,
  totalCostBasis: 0,
  totalPnl: 0,
  positions: [],
});

const load = (payload: PortfolioSnapshot) =>
  loadPortfolioSnapshot({ getPortfolio: async () => payload } as unknown as PolyApi);

const rejectsWith = async (payload: PortfolioSnapshot, text: string) => {
  try {
    await load(payload);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const main = async () => {
  const positive = await load(snapshot(500));
  const empty = await load(emptySnapshot());

  const assertions = {
    acceptsPositiveShares:
      positive.positions[0]?.shares === 500 &&
      positive.positions[0]?.id === "server-world-cup-winner-France",
    keepsEmptyPositionsRenderable: empty.positions.length === 0,
    rejectsZeroShares: await rejectsWith(snapshot(0), "invalid positions[].shares"),
    rejectsNegativeShares: await rejectsWith(snapshot(-1), "invalid positions[].shares"),
  };

  const proof = {
    cycle: "Cycle NR",
    feature: "Portfolio position shares contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "server-mode Portfolio positions must have positive shares before becoming visible position rows; empty position arrays remain valid.",
      malformedPayload: "zero-share or negative-share position rows reject before visible Portfolio state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NR proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
