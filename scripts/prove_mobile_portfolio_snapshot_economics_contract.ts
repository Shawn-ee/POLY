import fs from "node:fs";
import path from "node:path";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-ME-portfolio-snapshot-economics-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const snapshotPayload = (overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot => ({
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
        createdAt: "2026-07-06T08:00:00.000Z",
      },
      outcomeId: "france",
      outcome: "France",
      selection: null,
      shares: 500,
      avgCost: 0.42,
      currentPrice: 0.51,
      bestBid: 0.47,
      bestAsk: 0.5,
      bestBidSize: 1000,
      bestAskSize: 2500,
      valueTokens: 255,
      costBasisTokens: 210,
      totalCostBasisTokens: 210,
      pnlTokens: 45,
    },
  ],
  openOrders: [
    {
      id: "buy-order-1",
      market: {
        id: "world-cup-final",
        title: "World Cup final exact matchup",
        status: "ACTIVE",
      },
      outcome: {
        id: "argentina-brazil",
        name: "Argentina vs Brazil",
      },
      selection: null,
      side: "BUY",
      status: "OPEN",
      price: 0.28,
      size: 100,
      remaining: 60,
      reservedNotional: 16.8,
      createdAt: "2026-07-06T08:00:00.000Z",
      updatedAt: "2026-07-06T08:00:00.000Z",
    },
  ],
  ...overrides,
});

const apiForPayload = (payload: PortfolioSnapshot) => ({
  getPortfolio: async () => payload,
});

const rejectedWith = async (payload: PortfolioSnapshot, message: string) => {
  const result = await Promise.allSettled([
    loadPortfolioSnapshot(apiForPayload(payload) as Parameters<typeof loadPortfolioSnapshot>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validSnapshot = await loadPortfolioSnapshot(apiForPayload(snapshotPayload()));
  const lossSnapshot = await loadPortfolioSnapshot(apiForPayload(snapshotPayload({
    positions: [
      {
        ...snapshotPayload().positions[0],
        pnlTokens: -12.5,
      },
    ],
  })));

  const negativeWallet = snapshotPayload({ walletAvailableUSDC: -1 });
  const negativeShares = snapshotPayload({
    positions: [
      {
        ...snapshotPayload().positions[0],
        shares: -1,
      },
    ],
  });
  const negativeOrderPrice = snapshotPayload({
    openOrders: [
      {
        ...snapshotPayload().openOrders[0],
        price: -0.01,
      },
    ],
  });
  const negativeCurrentValue = snapshotPayload({
    positions: [
      {
        ...snapshotPayload().positions[0],
        valueTokens: -1,
      },
    ],
  });

  const assertions = {
    validNonNegativeSnapshotApplies:
      validSnapshot.balance === 10000 &&
      validSnapshot.positions[0]?.shares === 500 &&
      validSnapshot.openOrders[0]?.orderValue === 16.8,
    negativePnlRemainsAllowed: lossSnapshot.positions[0]?.pnl === -12.5,
    negativeWalletRejects: await rejectedWith(negativeWallet, "walletAvailableUSDC"),
    negativeSharesRejects: await rejectedWith(negativeShares, "positions[].shares"),
    negativeCurrentValueRejects: await rejectedWith(negativeCurrentValue, "positions[].valueTokens"),
    negativeOpenOrderPriceRejects: await rejectedWith(negativeOrderPrice, "openOrders[].price"),
  };

  const proof = {
    cycle: "Cycle ME",
    feature: "Portfolio snapshot economics contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "visible Portfolio wallet, position, and open-order economics must be finite non-negative values before state applies",
      malformedPayload: "negative wallet values, shares, position values, or open-order economics reject before visible Portfolio state applies",
      allowedLoss: "position pnl remains allowed to be negative",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle ME proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
