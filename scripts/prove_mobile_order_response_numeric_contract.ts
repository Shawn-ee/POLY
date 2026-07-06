import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { submitTicketOrder } from "../mobile/src/services/orderService";

const CYCLE = "cycle-LP-order-response-numeric-contract";
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

const main = async () => {
const idOnly = await submitWithPayload({ order: { id: "server-id-only" } });
const partial = await submitWithPayload({
  order: { id: "server-partial", status: "PARTIAL", size: "100", remaining: "75" },
  fills: [{ size: "25" }],
});

const badSize = await Promise.allSettled([
  submitWithPayload({ order: { id: "server-bad-size", size: "bad", remaining: "10" } }),
]);
const badFill = await Promise.allSettled([
  submitWithPayload({
    order: { id: "server-bad-fill", size: "100", remaining: "75" },
    fills: [{ size: "bad-fill" }],
  }),
]);

const assertions = {
  idOnlyOrderRemainsAcceptedForLegacyRoute: idOnly.id === "server-id-only" && idOnly.size === undefined,
  validNumericLifecycleFieldsAreApplied:
    partial.id === "server-partial" &&
    partial.status === "PARTIAL" &&
    partial.size === 100 &&
    partial.remainingSize === 75 &&
    partial.filledSize === 25,
  malformedOrderSizeRejects:
    badSize[0].status === "rejected" &&
    String(badSize[0].reason?.message ?? badSize[0].reason).includes("invalid order.size"),
  malformedFillSizeRejects:
    badFill[0].status === "rejected" &&
    String(badFill[0].reason?.message ?? badFill[0].reason).includes("invalid fills[].size"),
};

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const proof = {
  cycle: "Cycle LP",
  feature: "Order response numeric lifecycle contract",
  generatedAt: new Date().toISOString(),
  route: "/api/orders",
  contract: {
    legacyConfirmation: "server responses that only confirm order id remain accepted",
    lifecycleFields: "when size, remaining, or fills are present they must be finite numeric values",
    malformedLifecycle: "malformed numeric lifecycle fields reject before visible order state is applied",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

if (failed.length) {
  console.error(`Cycle LP proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
