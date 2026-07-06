import fs from "node:fs";
import path from "node:path";
import { assertPositionCloseOrderResponseShape } from "../mobile/src/services/positionCloseRouteShapeService";

const CYCLE = "cycle-MK-cashout-confirmation-size-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const rejectedWith = (payload: unknown, expectedSize: number, message: string) => {
  try {
    assertPositionCloseOrderResponseShape(payload, expectedSize);
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const main = () => {
  assertPositionCloseOrderResponseShape({
    order: {
      id: "close-order-full",
      size: "500.00",
      remaining: "500.00",
    },
  }, 500);

  assertPositionCloseOrderResponseShape({
    order: {
      id: "close-order-id-only",
    },
  }, 500);

  const assertions = {
    matchingFullPositionSizeAccepted: true,
    legacyIdOnlyConfirmationAccepted: true,
    smallerConfirmedSizeRejects: rejectedWith({
      order: {
        id: "close-order-small",
        size: "250.00",
      },
    }, 500, "did not match the requested full position size"),
    largerConfirmedSizeRejects: rejectedWith({
      order: {
        id: "close-order-large",
        size: "501.00",
      },
    }, 500, "did not match the requested full position size"),
  };

  const proof = {
    cycle: "Cycle MK",
    feature: "Cashout confirmation size contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders via server-mode cashout",
    contract: {
      validPayload: "Cashout confirmation size, when returned, must match the requested sell-all position size",
      malformedPayload: "mismatched confirmed size rejects before Portfolio refresh treats cashout as accepted",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MK proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
