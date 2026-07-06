import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-NM-portfolio-open-order-status-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const snapshot = (orderOverrides: Partial<PortfolioSnapshot["openOrders"][number]> = {}): PortfolioSnapshot => ({
  walletAvailableUSDC: 10000,
  walletLockedUSDC: 150,
  walletTotalUSDC: 10150,
  walletBalance: 10150,
  totalValue: 0,
  totalCostBasis: 0,
  totalRealizedPnl: 0,
  totalPnl: 0,
  comboOrders: [],
  positions: [],
  openOrders: [
    {
      id: "open-order-1",
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
      createdAt: "2026-06-05T14:00:00.000Z",
      updatedAt: "2026-06-05T14:00:00.000Z",
      ...orderOverrides,
    },
  ],
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
  const open = await load(snapshot());
  const partial = await load(snapshot({ status: "PARTIAL", remaining: 25 }));

  const assertions = {
    acceptsOpenStatus:
      open.openOrders[0]?.status === "OPEN" &&
      open.openOrders[0]?.remainingShares === 60,
    acceptsPartialWithPositiveRemaining:
      partial.openOrders[0]?.status === "PARTIAL" &&
      partial.openOrders[0]?.remainingShares === 25,
    rejectsTerminalCanceledStatus: await rejectsWith(
      snapshot({ status: "CANCELED" }),
      "terminal openOrders[].status",
    ),
    rejectsTerminalFilledStatus: await rejectsWith(
      snapshot({ status: "FILLED" }),
      "terminal openOrders[].status",
    ),
    rejectsZeroRemainingOpenOrder: await rejectsWith(
      snapshot({ status: "OPEN", remaining: 0 }),
      "non-open openOrders[].remaining",
    ),
  };

  const proof = {
    cycle: "Cycle NM",
    feature: "Portfolio open-order status contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "server-mode Portfolio openOrders must contain active order statuses and positive remaining shares.",
      malformedPayload: "terminal statuses or zero-remaining rows reject before visible Portfolio Orders state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NM proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
