import fs from "node:fs";
import path from "node:path";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-MY-portfolio-position-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const snapshotPayload = (positionOverrides: Partial<PortfolioSnapshot["positions"][number]> = {}): PortfolioSnapshot => ({
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
        id: "world-cup-winner",
        title: "World Cup winner",
        status: "ACTIVE",
        resolveTime: null,
        createdAt: "2026-06-01T12:00:00.000Z",
        availability: {
          source: "portfolio-market-status",
          status: "ready",
          marketStatus: "ACTIVE",
          lastUpdated: null,
          stalenessSeconds: null,
          staleAfterSeconds: 60,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "Market accepts orders.",
        },
      },
      outcomeId: "france",
      outcome: "France",
      selection: null,
      shares: 500,
      avgCost: 0.42,
      currentPrice: 0.51,
      bestBid: "0.47",
      bestAsk: "0.5",
      bestBidSize: "1200.5",
      bestAskSize: 2400,
      valueTokens: 255,
      costBasisTokens: 210,
      totalCostBasisTokens: 210,
      pnlTokens: -12.5,
      ...positionOverrides,
    },
  ],
  openOrders: [],
});

const apiForPayload = (payload: unknown) => ({
  getPortfolio: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadPortfolioSnapshot(apiForPayload(payload) as Parameters<typeof loadPortfolioSnapshot>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const valid = await loadPortfolioSnapshot(apiForPayload(snapshotPayload()));
  const priceOne = await loadPortfolioSnapshot(apiForPayload(snapshotPayload({
    avgCost: 1,
    currentPrice: 1,
    bestBid: 1,
    bestAsk: "1",
  })));

  const validPosition = valid.positions[0];
  const priceOnePosition = priceOne.positions[0];

  const assertions = {
    validPositionPricesAccepted:
      validPosition?.probability === 42 &&
      validPosition?.currentPrice === 0.51 &&
      validPosition?.bestBid === 47 &&
      validPosition?.bestAsk === 50,
    largeDepthSizesAccepted:
      validPosition?.bestBidSize === 1200.5 &&
      validPosition?.bestAskSize === 2400,
    priceOneAccepted:
      priceOnePosition?.probability === 100 &&
      priceOnePosition?.currentPrice === 1 &&
      priceOnePosition?.bestBid === 100 &&
      priceOnePosition?.bestAsk === 100,
    currentPriceAboveOneRejects: await rejectedWith(snapshotPayload({ currentPrice: 1.2 }), "positions[].currentPrice"),
    avgCostAboveOneRejects: await rejectedWith(snapshotPayload({ avgCost: 1.2 }), "positions[].avgCost"),
    bestAskAboveOneRejects: await rejectedWith(snapshotPayload({ bestAsk: "1.2" }), "positions[].bestAsk"),
    negativePnlRemainsAllowed: validPosition?.pnl === -12.5,
  };

  const proof = {
    cycle: "Cycle MY",
    feature: "Portfolio position price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "Portfolio position avgCost/currentPrice and depth quote prices must be probability prices from 0 to 1.",
      depthPayload: "bestBidSize and bestAskSize remain depth sizes and may be greater than 1.",
      malformedPayload: "above-one position prices reject before visible Portfolio position/cashout state applies.",
      allowedLoss: "position pnl remains allowed to be negative.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MY proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
