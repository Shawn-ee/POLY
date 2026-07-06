import fs from "node:fs";
import path from "node:path";
import { canceledOrdersToActivity } from "../mobile/src/services/portfolioHistoryService";
import type { PortfolioCanceledOrderItem } from "../mobile/src/types";

const CYCLE = "cycle-NN-portfolio-canceled-order-history-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const canceledOrder = (overrides: Partial<PortfolioCanceledOrderItem> = {}): PortfolioCanceledOrderItem => ({
  id: "order-canceled-1",
  market: {
    id: "world-cup-winner",
    title: "Will France win the 2026 FIFA World Cup?",
    status: "LIVE",
  },
  outcome: {
    id: "yes",
    name: "YES",
  },
  side: "BUY",
  status: "CANCELED",
  price: 0.5,
  size: 200,
  remaining: 100,
  canceledAt: "2026-07-02T05:55:00.000Z",
  ...overrides,
});

const rejectsWith = (order: PortfolioCanceledOrderItem, text: string) => {
  try {
    canceledOrdersToActivity([order]);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const activity = canceledOrdersToActivity([canceledOrder()])[0];

const assertions = {
  acceptsCanceledStatus:
    activity?.id === "canceled-order-order-canceled-1" &&
    activity.action === "canceled" &&
    activity.shares === 100,
  rejectsOpenStatus: rejectsWith(canceledOrder({ status: "OPEN" }), "invalid canceledOrders[].status"),
  rejectsFilledStatus: rejectsWith(canceledOrder({ status: "FILLED" }), "invalid canceledOrders[].status"),
  rejectsRemainingAboveSize: rejectsWith(
    canceledOrder({ size: 100, remaining: 101 }),
    "remaining above canceledOrders[].size",
  ),
  rejectsNegativeSize: rejectsWith(canceledOrder({ size: -1 }), "invalid canceledOrders[].size"),
};

const proof = {
  cycle: "Cycle NN",
  feature: "Portfolio canceled-order history contract",
  generatedAt: new Date().toISOString(),
  route: "/api/portfolio/history",
  contract: {
    validPayload: "canceledOrders rows must have CANCELED status and coherent remaining/size quantities before becoming visible history activity.",
    malformedPayload: "non-canceled statuses or remaining above size reject before visible Portfolio History state applies.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NN proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
