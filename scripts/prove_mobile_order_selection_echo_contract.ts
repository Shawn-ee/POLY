import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { submitTicketOrder } from "../mobile/src/services/orderService";

const CYCLE = "cycle-MC-order-selection-echo-contract";
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

const lineMarket = {
  id: "mexico-ecuador-total-2.5-1H",
  title: "Total 2.5 1H",
  zhTitle: "Total 2.5 1H",
  type: "game-line" as const,
  outcomes: [],
};

const lineOutcome = {
  id: "mexico-ecuador-total-2.5-1H-over",
  label: "Over 2.5 1H",
  zhLabel: "Over 2.5 1H",
  probability: 52,
  color: "#0a8f61",
};

const submitFutureWithPayload = (payload: unknown) =>
  submitTicketOrder({
    mode: "server",
    api: { placeLimitOrder: async () => payload } as unknown as PolyApi,
    market,
    outcome,
    side: "buy",
    amount: 100,
  });

const submitLineWithPayload = (payload: unknown) =>
  submitTicketOrder({
    mode: "server",
    api: { placeLimitOrder: async () => payload } as unknown as PolyApi,
    market: lineMarket,
    outcome: lineOutcome,
    selection: {
      marketType: "totals",
      line: "2.5",
      period: "1st Half",
      displayLabel: "Over 2.5 1H",
    },
    side: "buy",
    amount: 25,
  });

const rejectedWith = async (work: () => unknown | Promise<unknown>, message: string) => {
  const result = await Promise.allSettled([Promise.resolve().then(work)]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const idOnly = await submitFutureWithPayload({ order: { id: "server-id-only" } });
  const validFutureEcho = await submitFutureWithPayload({
    order: {
      id: "server-future-selection",
      selection: {
        marketType: "future",
        marketId: "world-cup-winner",
        outcomeId: "france",
        displayLabel: "France",
        contractSide: "yes",
      },
    },
  });
  const validLineEcho = await submitLineWithPayload({
    order: {
      id: "server-line-selection",
      selection: {
        marketType: "totals",
        marketId: "mexico-ecuador-total-2.5-1H",
        outcomeId: "mexico-ecuador-total-2.5-1H-over",
        line: "2.5",
        period: "1st Half",
        displayLabel: "Over 2.5 1H",
        contractSide: "yes",
      },
    },
  });

  const assertions = {
    idOnlyLegacySubmitRemainsAccepted: idOnly.id === "server-id-only" && idOnly.selection?.displayLabel === "France",
    validFutureSelectionEchoPreserved:
      validFutureEcho.id === "server-future-selection" &&
      validFutureEcho.selection?.marketType === "future" &&
      validFutureEcho.selection.displayLabel === "France",
    validLineSelectionEchoPreserved:
      validLineEcho.id === "server-line-selection" &&
      validLineEcho.selection?.marketType === "totals" &&
      validLineEcho.selection.line === "2.5",
    malformedFutureEchoRejects: await rejectedWith(
      () => submitFutureWithPayload({
        order: {
          id: "server-bad-future-selection",
          selection: {
            marketType: "future",
            marketId: "world-cup-winner",
            outcomeId: "france",
            displayLabel: "",
            contractSide: "yes",
          },
        },
      }),
      "order.selection.displayLabel",
    ),
    malformedLineEchoRejects: await rejectedWith(
      () => submitLineWithPayload({
        order: {
          id: "server-bad-line-selection",
          selection: {
            marketType: "totals",
            marketId: "mexico-ecuador-total-2.5-1H",
            outcomeId: "mexico-ecuador-total-2.5-1H-over",
            line: "2.5",
            period: "1st Half",
            displayLabel: "Over 2.5 1H",
            contractSide: "yes",
            limitPrice: -0.01,
          },
        },
      }),
      "order.selection.limitPrice",
    ),
  };

  const proof = {
    cycle: "Cycle MC",
    feature: "Order submit selection echo contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      legacyConfirmation: "server responses that only confirm order id remain accepted and use the mobile request selection",
      validSelectionEcho: "valid backend selection echoes are preserved for visible order state",
      malformedSelectionEcho: "malformed echoed selection fields reject before visible order state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MC proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
