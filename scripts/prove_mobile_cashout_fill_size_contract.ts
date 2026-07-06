import fs from "node:fs";
import path from "node:path";
import { assertPositionCloseOrderResponseShape } from "../mobile/src/services/positionCloseRouteShapeService";

const CYCLE = "cycle-MP-cashout-fill-size-contract";
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
    order: { id: "close-order-partial-fill", size: "500.00", remaining: "250.00" },
    fills: [{ size: "125.00" }, { size: "125.00" }],
  }, 500);
  assertPositionCloseOrderResponseShape({
    order: { id: "close-order-full-fill", size: "500.00", remaining: "0.00" },
    fills: [{ size: "500.00" }],
  }, 500);

  const assertions = {
    partialFillTotalAccepted: true,
    fullFillTotalAccepted: true,
    nestedFillTotalAboveSizeRejects: rejectsWith({
      order: { id: "close-order-overfill", size: "500.00" },
      fills: [{ size: "250.50" }, { size: "250.00" }],
    }, "filled size above order size"),
    topLevelFillTotalAboveSizeRejects: rejectsWith({
      id: "close-order-overfill-top-level",
      size: 500,
      fills: [{ size: 501 }],
    }, "filled size above order size"),
  };

  const proof = {
    cycle: "Cycle MP",
    feature: "Cashout fill size contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders via server-mode cashout",
    contract: {
      validPayload: "Cashout confirmation total fill size must be less than or equal to order size when both are returned",
      malformedPayload: "fill total above order size rejects before Portfolio refresh treats cashout as accepted",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MP proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
