import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import type { OpenOrder } from "../mobile/src/components/Portfolio";
import { cancelOpenOrderOnServer } from "../mobile/src/services/openOrderService";

const CYCLE = "cycle-LW-cancel-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const order: OpenOrder = {
  id: "server-open-order-lw",
  title: "LW cancel proof",
  outcome: "YES",
  side: "buy",
  status: "OPEN",
  price: 0.44,
  remaining: 50,
  remainingShares: 50,
  orderValue: 22,
};

const apiForPayload = (payload: unknown) =>
  ({
    cancelOrder: async () => payload,
  }) as unknown as PolyApi;

const rejectedWithConfirmationError = async (payload: unknown) => {
  const result = await Promise.allSettled([
    cancelOpenOrderOnServer({ mode: "server", api: apiForPayload(payload), order }),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes("Order cancel was not confirmed");
};

const main = async () => {
  await cancelOpenOrderOnServer({
    mode: "server",
    api: apiForPayload({ order: { id: order.id, status: "CANCELED" } }),
    order,
  });

  const assertions = {
    sameOrderCanceledConfirmationAccepted: true,
    wrongOrderRejected: await rejectedWithConfirmationError({ order: { id: "other-order", status: "CANCELED" } }),
    nonCanceledStatusRejected: await rejectedWithConfirmationError({ order: { id: order.id, status: "OPEN" } }),
    malformedPayloadRejected: await rejectedWithConfirmationError({ order: null }),
  };

  const proof = {
    cycle: "Cycle LW",
    feature: "Cancel route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders/:id",
    contract: {
      validPayload: "server cancel is confirmed only by the same order id with status CANCELED",
      malformedPayload: "wrong order, non-canceled status, or malformed payload rejects before Portfolio treats cancel as confirmed",
    },
    assertions,
    order,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LW proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
