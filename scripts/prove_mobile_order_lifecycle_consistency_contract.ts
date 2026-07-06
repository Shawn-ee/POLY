import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { submitTicketOrder } from "../mobile/src/services/orderService";

const CYCLE = "cycle-MT-order-lifecycle-consistency-contract";
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

const submitWithPayload = (payload: unknown) =>
  submitTicketOrder({
    mode: "server",
    api: { placeLimitOrder: async () => payload } as unknown as PolyApi,
    market,
    outcome,
    side: "buy",
    amount: 100,
  });

const rejectsWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([submitWithPayload(payload)]);
  return result[0].status === "rejected" && String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const partial = await submitWithPayload({
    order: { id: "server-partial", status: "PARTIAL", size: "100", remaining: "75" },
    fills: [{ size: "10" }, { size: "15" }],
  });
  const open = await submitWithPayload({
    order: { id: "server-open", status: "OPEN", size: "100", remaining: "100" },
  });

  const assertions = {
    validFillPlusRemainingAccepted:
      partial.id === "server-partial" &&
      partial.size === 100 &&
      partial.remainingSize === 75 &&
      partial.filledSize === 25,
    openOrderDerivesZeroFilledSize: open.id === "server-open" && open.remainingSize === 100 && open.filledSize === 0,
    negativeSizeRejects: await rejectsWith(
      { order: { id: "server-negative", size: "-1", remaining: "0" } },
      "invalid order.size",
    ),
    remainingAboveSizeRejects: await rejectsWith(
      { order: { id: "server-bad-remaining", size: "100", remaining: "101" } },
      "remaining size above order size",
    ),
    fillsAboveSizeRejects: await rejectsWith(
      { order: { id: "server-overfilled", size: "100" }, fills: [{ size: "60" }, { size: "41" }] },
      "filled size above order size",
    ),
    fillPlusRemainingAboveSizeRejects: await rejectsWith(
      { order: { id: "server-over-accounted", size: "100", remaining: "60" }, fills: [{ size: "45" }] },
      "filled plus remaining size above order size",
    ),
  };

  const proof = {
    cycle: "Cycle MT",
    feature: "Trade Ticket order lifecycle consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "Order submit confirmation size, remaining, and fills must be non-negative and internally consistent when returned.",
      malformedPayload: "Negative lifecycle numbers, remaining above size, fill total above size, or fill total plus remaining above size reject before visible order state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MT proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
