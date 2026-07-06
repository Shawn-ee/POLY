import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { submitTicketOrder } from "../mobile/src/services/orderService";

const CYCLE = "cycle-NJ-order-submit-status-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const market = {
  id: "world-cup-winner",
  title: "World Cup winner",
  zhTitle: "World Cup winner",
  type: "future" as const,
  outcomes: [],
};

const outcome = {
  id: "france",
  label: "France",
  zhLabel: "France",
  probability: 34,
  color: "#2563eb",
};

const submitWithResponse = (response: unknown) =>
  submitTicketOrder({
    mode: "server",
    api: { placeLimitOrder: async () => response } as unknown as PolyApi,
    market,
    outcome,
    side: "buy",
    amount: 50,
  });

const rejectsWith = async (response: unknown, text: string) => {
  try {
    await submitWithResponse(response);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const main = async () => {
  const open = await submitWithResponse({ order: { id: "server-order-open", status: "OPEN" } });
  const missingStatus = await submitWithResponse({ order: { id: "server-order-legacy" } });

  const assertions = {
    acceptsOpenStatus: open.id === "server-order-open" && open.status === "OPEN",
    acceptsLegacyMissingStatus: missingStatus.id === "server-order-legacy" && missingStatus.mode === "server",
    rejectsNestedRejectedStatus: await rejectsWith(
      { order: { id: "server-order-rejected", status: "REJECTED" } },
      "status REJECTED",
    ),
    rejectsTopLevelCanceledStatus: await rejectsWith(
      { id: "server-order-canceled", status: "CANCELED" },
      "status CANCELED",
    ),
    rejectsFailedStatus: await rejectsWith(
      { order: { id: "server-order-failed", status: "FAILED" } },
      "status FAILED",
    ),
  };

  const proof = {
    cycle: "Cycle NJ",
    feature: "Trade Ticket order submit status contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "server-mode order submit may apply an order id with active/success status, or legacy missing status.",
      malformedPayload: "server-mode order submit must reject explicit terminal failed statuses even when an id is returned.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NJ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
