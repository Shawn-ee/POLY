import fs from "node:fs";
import path from "node:path";
import { assertPositionCloseOrderResponseShape } from "../mobile/src/services/positionCloseRouteShapeService";

const CYCLE = "cycle-MR-cashout-fill-remaining-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const rejectsWith = (payload: unknown, message: string) => {
  try {
    assertPositionCloseOrderResponseShape(payload, 500);
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const main = () => {
  assertPositionCloseOrderResponseShape({
    order: { id: "close-order-partial", size: "500.00", remaining: "250.00" },
    fills: [{ size: "125.00" }, { size: "125.00" }],
  }, 500);
  assertPositionCloseOrderResponseShape({
    order: { id: "close-order-complete", size: "500.00", remaining: "0.00" },
    fills: [{ size: "300.00" }, { size: "200.00" }],
  }, 500);

  const assertions = {
    partialFillPlusRemainingAccepted: true,
    fullFillPlusZeroRemainingAccepted: true,
    nestedFillPlusRemainingAboveSizeRejects: rejectsWith({
      order: { id: "close-order-over-accounted", size: "500.00", remaining: "250.00" },
      fills: [{ size: "150.00" }, { size: "125.00" }],
    }, "filled plus remaining size above order size"),
    topLevelFillPlusRemainingAboveSizeRejects: rejectsWith({
      id: "close-order-over-accounted-top-level",
      size: 500,
      remaining: 250,
      fills: [{ size: 251 }],
    }, "filled plus remaining size above order size"),
  };

  const proof = {
    cycle: "Cycle MR",
    feature: "Cashout fill plus remaining consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders via server-mode cashout",
    contract: {
      validPayload: "Cashout confirmation fill total plus remaining size must be less than or equal to order size when all are returned",
      malformedPayload: "fill total plus remaining above order size rejects before Portfolio refresh treats cashout as accepted",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MR proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
