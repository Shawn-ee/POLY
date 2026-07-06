import fs from "node:fs";
import path from "node:path";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-MU-portfolio-open-order-lifecycle-contract";
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

const withOpenOrder = (size: number, remaining: number) =>
  snapshotPayload({
    openOrders: [
      {
        ...snapshotPayload().openOrders[0],
        size,
        remaining,
      },
    ],
  });

const closeTo = (left: number | undefined, right: number) =>
  left !== undefined && Math.abs(left - right) < 0.000001;

const main = async () => {
  const partial = await loadPortfolioSnapshot(apiForPayload(withOpenOrder(100, 60)));
  const equal = await loadPortfolioSnapshot(apiForPayload(withOpenOrder(100, 100)));

  const assertions = {
    partialOpenOrderAccepted:
      partial.openOrders[0]?.originalShares === 100 &&
      partial.openOrders[0]?.remainingShares === 60 &&
      closeTo(partial.openOrders[0]?.orderValue, 16.8),
    equalRemainingOpenOrderAccepted:
      equal.openOrders[0]?.originalShares === 100 &&
      equal.openOrders[0]?.remainingShares === 100 &&
      closeTo(equal.openOrders[0]?.orderValue, 28),
    remainingAboveSizeRejects: await rejectedWith(
      withOpenOrder(100, 101),
      "openOrders[].remaining above openOrders[].size",
    ),
  };

  const proof = {
    cycle: "Cycle MU",
    feature: "Portfolio open-order lifecycle consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "Portfolio open order remaining shares must be less than or equal to original order size before visible Orders state applies.",
      malformedPayload: "remaining above original size rejects before Portfolio state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MU proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
