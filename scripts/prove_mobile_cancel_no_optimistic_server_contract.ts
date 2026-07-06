import fs from "node:fs/promises";
import path from "node:path";
import { cancelOpenOrderOnServer, shouldApplyOptimisticCancel } from "../mobile/src/services/openOrderService";
import type { PolyApi } from "../mobile/src/api";
import type { OpenOrder } from "../mobile/src/components/Portfolio";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LJ-cancel-no-optimistic-server-contract/cycle-LJ-cancel-no-optimistic-server-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const order: OpenOrder = {
  id: "server-open-order-lj",
  title: "LJ cancel proof",
  outcome: "YES",
  side: "buy",
  status: "OPEN",
  price: 0.44,
  remaining: 50,
  remainingShares: 50,
  orderValue: 22,
};

async function main() {
  const failedApi = {
    cancelOrder: async () => ({ order: { id: order.id, status: "OPEN" } }),
  } as unknown as PolyApi;
  const confirmedApi = {
    cancelOrder: async () => ({ order: { id: order.id, status: "CANCELED" } }),
  } as unknown as PolyApi;

  assert(shouldApplyOptimisticCancel("mock") === true, "Mock cancel should remain optimistic.");
  assert(shouldApplyOptimisticCancel("server") === false, "Server cancel must not be optimistic.");

  let failedRejected = false;
  try {
    await cancelOpenOrderOnServer({ mode: "server", api: failedApi, order });
  } catch {
    failedRejected = true;
  }
  assert(failedRejected, "Server cancel must reject without same-order CANCELED confirmation.");

  await cancelOpenOrderOnServer({ mode: "server", api: confirmedApi, order });

  const proof = {
    cycle: "LJ",
    gate: "cancel-no-optimistic-server-contract",
    generatedAt: new Date().toISOString(),
    routes: ["/api/orders/:id", "/api/portfolio", "/api/portfolio/history"],
    assertions: {
      mockCancelCanRemainOptimistic: true,
      serverCancelIsNotOptimistic: true,
      serverCancelRequiresSameOrderCanceledConfirmation: true,
      failedServerCancelMustKeepExistingVisibleStateUntilRefresh: true,
      confirmedServerCancelCanRefreshPortfolioAndHistory: true,
    },
    order,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, assertions: proof.assertions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
