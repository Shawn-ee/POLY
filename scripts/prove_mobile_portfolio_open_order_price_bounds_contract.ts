import fs from "node:fs";
import path from "node:path";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-NA-portfolio-open-order-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const snapshotPayload = (orderOverrides: Partial<PortfolioSnapshot["openOrders"][number]> = {}): PortfolioSnapshot => ({
  walletAvailableUSDC: 10000,
  walletLockedUSDC: 150,
  walletTotalUSDC: 10150,
  walletBalance: 10150,
  totalValue: 355,
  totalCostBasis: 300,
  totalRealizedPnl: 22,
  totalPnl: 77,
  comboOrders: [],
  positions: [],
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
      size: 1250,
      remaining: 625,
      reservedNotional: 175,
      createdAt: "2026-06-05T14:00:00.000Z",
      updatedAt: "2026-06-05T14:00:00.000Z",
      ...orderOverrides,
    },
  ],
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

const closeTo = (actual: number | undefined, expected: number) => (
  typeof actual === "number" && Math.abs(actual - expected) < 0.000001
);

const main = async () => {
  const valid = await loadPortfolioSnapshot(apiForPayload(snapshotPayload()));
  const priceOne = await loadPortfolioSnapshot(apiForPayload(snapshotPayload({ price: 1 })));

  const validOrder = valid.openOrders[0];
  const priceOneOrder = priceOne.openOrders[0];

  const assertions = {
    validOpenOrderPriceAccepted:
      validOrder?.price === 0.28 &&
      validOrder?.remaining === 625 &&
      validOrder?.originalShares === 1250 &&
      closeTo(validOrder?.orderValue, 175),
    priceOneAccepted:
      priceOneOrder?.price === 1 &&
      priceOneOrder?.remaining === 625 &&
      priceOneOrder?.originalShares === 1250 &&
      priceOneOrder?.orderValue === 625,
    openOrderPriceAboveOneRejects: await rejectedWith(snapshotPayload({ price: 1.2 }), "openOrders[].price"),
    negativeOpenOrderPriceRejects: await rejectedWith(snapshotPayload({ price: -0.01 }), "openOrders[].price"),
    remainingAboveSizeStillRejects: await rejectedWith(snapshotPayload({ size: 100, remaining: 101 }), "openOrders[].remaining above openOrders[].size"),
  };

  const proof = {
    cycle: "Cycle NA",
    feature: "Portfolio open-order price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "Portfolio open-order price must be a probability price from 0 to 1.",
      sizePayload: "size and remaining remain share counts and may be greater than 1.",
      malformedPayload: "above-one open-order prices reject before visible Portfolio Orders or cancel activity state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NA proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
