import fs from "node:fs/promises";
import path from "node:path";
import { normalizeMarket } from "../mobile/src/adapters/worldCupAdapter";
import { marketOrderBlockReason, submitTicketOrder } from "../mobile/src/services/orderService";
import type { PolyApi } from "../mobile/src/api";
import type { Market as BackendMarket } from "../mobile/src/types";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LC-trade-ticket-availability-submit-contract/cycle-LC-trade-ticket-availability-submit-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const backendMarket = (status: "ready" | "suspended" | "unavailable"): BackendMarket => ({
  id: `lc-ticket-${status}`,
  title: `LC Ticket ${status}`,
  status: status === "ready" ? "LIVE" : status.toUpperCase(),
  marketType: "moneyline",
  marketGroupId: "moneyline",
  marketGroupTitle: "Winner",
  referenceSource: "polymarket",
  externalMarketId: `gamma-lc-${status}`,
  conditionId: `condition-lc-${status}`,
  availability: {
    source: "provider-lifecycle",
    status,
    marketStatus: status === "ready" ? "LIVE" : status.toUpperCase(),
    lastUpdated: status === "ready" ? "2026-07-06T08:00:00.000Z" : null,
    stalenessSeconds: status === "ready" ? 0 : null,
    staleAfterSeconds: 90,
    isStale: false,
    isSuspended: status === "suspended",
    isDelayed: false,
    reason:
      status === "ready"
        ? "Provider quote is ready."
        : status === "suspended"
          ? "Market status is suspended."
          : "Provider quote is unavailable.",
  },
  outcomes: [
    {
      id: `lc-ticket-${status}-home`,
      name: "Home",
      label: "Home",
      side: "home",
      price: 0.55,
      referenceTokenId: `token-lc-${status}-home`,
      referenceOutcomeLabel: "Home",
      isTradable: true,
    },
    {
      id: `lc-ticket-${status}-away`,
      name: "Away",
      label: "Away",
      side: "away",
      price: 0.45,
      referenceTokenId: `token-lc-${status}-away`,
      referenceOutcomeLabel: "Away",
      isTradable: true,
    },
  ],
});

async function submitProbe(status: "ready" | "suspended" | "unavailable") {
  const mobileMarket = normalizeMarket(backendMarket(status));
  const outcome = mobileMarket.outcomes[0];
  assert(outcome, `Expected ${status} proof outcome.`);
  assert(mobileMarket.availability?.status === status, `Expected normalized ${status} availability.`);

  const routeCalls: unknown[] = [];
  const api = {
    placeLimitOrder: async (input: unknown) => {
      routeCalls.push(input);
      return { order: { id: `server-lc-${status}`, selection: input && typeof input === "object" ? (input as any).selection : undefined } };
    },
  } as unknown as PolyApi;

  let error: string | null = null;
  let orderId: string | null = null;
  try {
    const result = await submitTicketOrder({
      mode: "server",
      api,
      market: mobileMarket,
      outcome,
      side: "buy",
      amount: 25,
    });
    orderId = result.id;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  return {
    status,
    normalizedAvailability: mobileMarket.availability,
    blockReason: marketOrderBlockReason(mobileMarket),
    routeCallCount: routeCalls.length,
    orderId,
    error,
  };
}

async function main() {
  const unavailable = await submitProbe("unavailable");
  const suspended = await submitProbe("suspended");
  const ready = await submitProbe("ready");

  assert(unavailable.routeCallCount === 0, "Unavailable market must not call order route.");
  assert(unavailable.error?.includes("Provider quote is unavailable."), "Unavailable market must return clear error.");
  assert(suspended.routeCallCount === 0, "Suspended market must not call order route.");
  assert(suspended.error?.includes("Market status is suspended."), "Suspended market must return clear error.");
  assert(ready.routeCallCount === 1, "Ready market should submit to order route.");
  assert(ready.orderId === "server-lc-ready", "Ready market should return confirmed server order id.");

  const proof = {
    cycle: "LC",
    gate: "trade-ticket-availability-submit-contract",
    generatedAt: new Date().toISOString(),
    assertions: {
      backendAvailabilityPreservedByMobileNormalization: true,
      unavailableMarketBlockedBeforeApi: true,
      suspendedMarketBlockedBeforeApi: true,
      readyMarketStillSubmits: true,
    },
    probes: {
      unavailable,
      suspended,
      ready,
    },
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, assertions: proof.assertions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
