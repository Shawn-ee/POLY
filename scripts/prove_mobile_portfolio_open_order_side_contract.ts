import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../mobile/src/types";

const CYCLE = "cycle-NQ-portfolio-open-order-side-contract";
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
  const buy = await load(snapshot({ side: "BUY" }));
  const sell = await load(snapshot({ side: "SELL" }));

  const assertions = {
    acceptsBuySide:
      buy.openOrders[0]?.side === "buy" &&
      buy.openOrders[0]?.id === "open-order-1",
    acceptsSellSide:
      sell.openOrders[0]?.side === "sell" &&
      sell.openOrders[0]?.id === "open-order-1",
    rejectsUnknownSide: await rejectsWith(
      snapshot({ side: "HOLD" as never }),
      "invalid openOrders[].side",
    ),
    rejectsMissingSide: await rejectsWith(
      snapshot({ side: undefined as never }),
      "invalid openOrders[].side",
    ),
  };

  const proof = {
    cycle: "Cycle NQ",
    feature: "Portfolio open-order side contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio",
    contract: {
      validPayload: "server-mode Portfolio openOrders must use BUY or SELL before becoming visible Orders rows.",
      malformedPayload: "unknown or missing side values reject before visible Portfolio Orders state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NQ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
