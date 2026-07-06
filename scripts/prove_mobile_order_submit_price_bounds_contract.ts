import fs from "node:fs";
import path from "node:path";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import type { PolyApi } from "../mobile/src/api";

const CYCLE = "cycle-NB-order-submit-price-bounds-contract";
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

const apiWithRecorder = () => {
  const calls: unknown[] = [];
  const api = {
    placeLimitOrder: async (input: unknown) => {
      calls.push(input);
      return { order: { id: `server-order-${calls.length}` } };
    },
  } as unknown as PolyApi;
  return { api, calls };
};

const rejectedWithNoCall = async (probability: number, contractSide: "yes" | "no" = "yes") => {
  const { api, calls } = apiWithRecorder();
  const result = await Promise.allSettled([
    submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome: { ...outcome, probability },
      selection: { marketType: "future", displayLabel: "France", contractSide },
      contractSide,
      side: "buy",
      amount: 25,
    }),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes("Order price must be between 1 and 100 cents.") &&
    calls.length === 0;
};

const main = async () => {
  const valid = apiWithRecorder();
  const validResult = await submitTicketOrder({
    mode: "server",
    api: valid.api,
    market,
    outcome,
    side: "buy",
    amount: 100,
  });

  const validNo = apiWithRecorder();
  const validNoResult = await submitTicketOrder({
    mode: "server",
    api: validNo.api,
    market,
    outcome: { ...outcome, probability: 99 },
    selection: { marketType: "future", displayLabel: "France", contractSide: "no" },
    contractSide: "no",
    side: "buy",
    amount: 25,
  });

  const validOrderInput = valid.calls[0] as { price?: string; size?: string } | undefined;
  const validNoOrderInput = validNo.calls[0] as { price?: string; size?: string; contractSide?: string } | undefined;

  const assertions = {
    validYesPriceAccepted:
      validResult.probability === 34 &&
      validOrderInput?.price === "0.34" &&
      validOrderInput?.size === "294.12",
    validNoInversePriceAccepted:
      validNoResult.probability === 1 &&
      validNoOrderInput?.contractSide === "NO" &&
      validNoOrderInput?.price === "0.01" &&
      validNoOrderInput?.size === "2500.00",
    zeroYesPriceRejectsBeforeApi: await rejectedWithNoCall(0),
    aboveOneYesPriceRejectsBeforeApi: await rejectedWithNoCall(101),
    zeroNoPriceRejectsBeforeApi: await rejectedWithNoCall(100, "no"),
  };

  const proof = {
    cycle: "Cycle NB",
    feature: "Trade Ticket order submit price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "Trade Ticket submit derives canonical order price from a finite contract probability in 1..100 cents.",
      malformedPayload: "zero, negative, and above-100 computed probabilities reject before calling /api/orders.",
      sizePayload: "share size is derived from the same validated contract probability used for request price.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NB proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
