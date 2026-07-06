import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import type { Position } from "../mobile/src/components/Portfolio";
import { closePositionOnServer } from "../mobile/src/services/positionCloseService";
import { assertPositionCloseOrderResponseShape } from "../mobile/src/services/positionCloseRouteShapeService";

const CYCLE = "cycle-NK-cashout-status-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const position: Position = {
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares: 500,
  currentPrice: 0.51,
  currentValue: 255,
  pnl: 45,
};

const closeWithResponse = (response: unknown) =>
  closePositionOnServer({
    mode: "server",
    api: { placeLimitOrder: async () => response } as unknown as PolyApi,
    position,
  });

const rejectsWith = async (response: unknown, text: string) => {
  try {
    await closeWithResponse(response);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const main = async () => {
  const assertions = {
    acceptsOpenStatus: (() => {
      try {
        assertPositionCloseOrderResponseShape({ order: { id: "close-order-open", status: "OPEN", size: "500.00" } }, 500);
        return true;
      } catch {
        return false;
      }
    })(),
    acceptsLegacyMissingStatus: (() => {
      try {
        assertPositionCloseOrderResponseShape({ order: { id: "close-order-legacy", size: "500.00" } }, 500);
        return true;
      } catch {
        return false;
      }
    })(),
    rejectsNestedRejectedStatus: await rejectsWith(
      { order: { id: "close-order-rejected", status: "REJECTED", size: "500.00" } },
      "status REJECTED",
    ),
    rejectsTopLevelCanceledStatus: await rejectsWith(
      { id: "close-order-canceled", status: "CANCELED", size: "500.00" },
      "status CANCELED",
    ),
    rejectsFailedStatus: await rejectsWith(
      { order: { id: "close-order-failed", status: "FAILED", size: "500.00" } },
      "status FAILED",
    ),
  };

  const proof = {
    cycle: "Cycle NK",
    feature: "Cashout status contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "server-mode cashout may apply an order id with active/success status, or legacy missing status.",
      malformedPayload: "server-mode cashout must reject explicit terminal failed statuses even when an id and full close size are returned.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NK proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
