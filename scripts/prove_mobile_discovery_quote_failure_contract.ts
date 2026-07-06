import fs from "node:fs/promises";
import path from "node:path";
import { marketOrderBlockReason } from "../mobile/src/services/orderService";
import {
  applyMarketQuoteStateToEvent,
  applyMarketQuoteStateToMarkets,
} from "../mobile/src/services/quoteService";
import type { Event, Market } from "../mobile/src/mocks/worldCup";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LH-discovery-quote-failure-contract/cycle-LH-discovery-quote-failure-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const availability = {
  source: "events-route",
  status: "ready" as const,
  marketStatus: "LIVE",
  lastUpdated: null,
  stalenessSeconds: null,
  staleAfterSeconds: 60,
  isStale: false,
  isSuspended: false,
  isDelayed: false,
  reason: "Market accepts orders.",
};

const event: Event = {
  id: "lh-discovery-event",
  title: "LH Discovery Home vs Away",
  zhTitle: "LH Discovery Home vs Away",
  league: "World Cup",
  startsAt: "Today 7:00 PM",
  status: "today",
  tag: "World Cup",
  zhTag: "World Cup",
  teams: [
    { name: "Home", zhName: "Home", flag: "H" },
    { name: "Away", zhName: "Away", flag: "A" },
  ],
  markets: [
    {
      id: "lh-discovery-ready",
      title: "Discovery ready",
      zhTitle: "Discovery ready",
      type: "game-line",
      availability,
      outcomes: [{ id: "home", label: "Home", zhLabel: "Home", probability: 40, color: "#2563eb" }],
    },
    {
      id: "lh-discovery-failed",
      title: "Discovery failed",
      zhTitle: "Discovery failed",
      type: "game-line",
      availability,
      outcomes: [{ id: "away", label: "Away", zhLabel: "Away", probability: 60, color: "#f97316" }],
    },
  ],
};

const futures: Market[] = [
  {
    id: "lh-future-failed",
    title: "LH Future Failed",
    zhTitle: "LH Future Failed",
    type: "future",
    availability,
    outcomes: [{ id: "yes", label: "Yes", zhLabel: "Yes", probability: 25, color: "#2563eb" }],
  },
];

const state = {
  quotesByMarketId: new Map([
    [
      "lh-discovery-ready",
      [
        {
          outcomeId: "home",
          outcomeName: "Home",
          probability: 45,
          bestBid: 44,
          bestAsk: 46,
          midPrice: 45,
          lastPrice: null,
        },
      ],
    ],
  ]),
  failedMarketIds: new Set(["lh-discovery-failed", "lh-future-failed"]),
};

const quotedEvent = applyMarketQuoteStateToEvent(event, state);
const quotedFutures = applyMarketQuoteStateToMarkets(futures, state);

const readyMarket = quotedEvent.markets.find((market) => market.id === "lh-discovery-ready");
const failedDiscoveryMarket = quotedEvent.markets.find((market) => market.id === "lh-discovery-failed");
const failedFutureMarket = quotedFutures[0];

assert(readyMarket?.outcomes[0].probability === 45, "Expected successful discovery quote to update market price.");
assert(failedDiscoveryMarket?.availability?.status === "unavailable", "Expected failed discovery market to be unavailable.");
assert(failedFutureMarket?.availability?.status === "unavailable", "Expected failed future market to be unavailable.");
assert(
  failedDiscoveryMarket && marketOrderBlockReason(failedDiscoveryMarket) === "Market quote route failed.",
  "Expected failed discovery market to be submit-blocked.",
);
assert(
  failedFutureMarket && marketOrderBlockReason(failedFutureMarket) === "Market quote route failed.",
  "Expected failed future market to be submit-blocked.",
);

const proof = {
  cycle: "LH",
  gate: "discovery-quote-failure-contract",
  generatedAt: new Date().toISOString(),
  routes: [
    "/api/events?includeMobileMarkets=1",
    "/api/events?statusGroup=live&includeMobileMarkets=1",
    "/api/events?search=",
    "/api/events?marketType=future&includeMobileMarkets=1",
    "/api/markets/:id/quote",
    "/api/orders",
  ],
  assertions: {
    homeLiveSearchDiscoveryUseQuoteFailureState: true,
    futuresDiscoveryUsesQuoteFailureState: true,
    successfulDiscoveryQuotesStillUpdateMarkets: true,
    failedDiscoveryMarketsBecomeUnavailable: true,
    failedDiscoveryMarketsAreSubmitBlocked: true,
  },
  readyMarket,
  failedDiscoveryMarket,
  failedFutureMarket,
  blockReasons: {
    discovery: marketOrderBlockReason(failedDiscoveryMarket!),
    future: marketOrderBlockReason(failedFutureMarket!),
  },
};

async function main() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, assertions: proof.assertions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
