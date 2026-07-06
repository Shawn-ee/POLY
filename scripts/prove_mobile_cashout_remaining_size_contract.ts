import fs from "node:fs";
import path from "node:path";
import { assertPositionCloseOrderResponseShape } from "../mobile/src/services/positionCloseRouteShapeService";

const CYCLE = "cycle-MO-cashout-remaining-size-contract";
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
    order: { id: "close-order-open", size: "500.00", remaining: "500.00" },
  }, 500);
  assertPositionCloseOrderResponseShape({
    order: { id: "close-order-partial", size: "500.00", remaining: "125.25" },
  }, 500);

  const assertions = {
    equalRemainingAccepted: true,
    lowerRemainingAccepted: true,
    remainingAboveSizeRejects: rejectsWith({
      order: { id: "close-order-invalid", size: "500.00", remaining: "501.00" },
    }, "remaining size above order size"),
    topLevelRemainingAboveSizeRejects: rejectsWith({
      id: "close-order-invalid-top-level",
      size: 500,
      remaining: 501,
    }, "remaining size above order size"),
  };

  const proof = {
    cycle: "Cycle MO",
    feature: "Cashout remaining size contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders via server-mode cashout",
    contract: {
      validPayload: "Cashout confirmation remaining size must be less than or equal to order size when both are returned",
      malformedPayload: "remaining size above order size rejects before Portfolio refresh treats cashout as accepted",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MO proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
