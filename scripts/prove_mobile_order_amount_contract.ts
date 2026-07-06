import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { submitTicketOrder } from "../mobile/src/services/orderService";

const CYCLE = "cycle-NW-order-amount-contract";
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

const submit = async (amount: number, calls: { count: number }) =>
  submitTicketOrder({
    mode: "server",
    api: {
      placeLimitOrder: async () => {
        calls.count += 1;
        return { order: { id: "server-order-1" } };
      },
    } as unknown as PolyApi,
    market,
    outcome,
    side: "buy",
    amount,
  });

const rejectsAmount = async (amount: number) => {
  const calls = { count: 0 };
  try {
    await submit(amount, calls);
    return false;
  } catch (error) {
    return (
      calls.count === 0 &&
      error instanceof Error &&
      error.message.includes("Order amount must be a finite value greater than zero.")
    );
  }
};

const main = async () => {
  const calls = { count: 0 };
  const accepted = await submit(25, calls);

  const assertions = {
    acceptsPositiveFiniteAmount:
      accepted.id === "server-order-1" &&
      accepted.amount === 25 &&
      calls.count === 1,
    rejectsZeroAmount: await rejectsAmount(0),
    rejectsNegativeAmount: await rejectsAmount(-1),
    rejectsNaNAmount: await rejectsAmount(Number.NaN),
    rejectsInfiniteAmount: await rejectsAmount(Number.POSITIVE_INFINITY),
  };

  const proof = {
    cycle: "Cycle NW",
    feature: "Trade Ticket order amount contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "server-mode Trade Ticket submit requires a finite positive amount before deriving order size.",
      malformedPayload: "zero, negative, NaN, or infinite amounts reject before /api/orders is called.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NW proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
