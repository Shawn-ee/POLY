import fs from "node:fs/promises";
import path from "node:path";
import { marketOrderBlockReason } from "../mobile/src/services/orderService";
import { applyMarketQuoteStateToEvent } from "../mobile/src/services/quoteService";
import type { Event } from "../mobile/src/mocks/worldCup";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LG-event-detail-quote-failure-contract/cycle-LG-event-detail-quote-failure-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const event: Event = {
  id: "lg-quote-failure-event",
  title: "LG Quote Failure Home vs Away",
  zhTitle: "LG Quote Failure Home vs Away",
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
      id: "lg-market-ready",
      title: "Ready market",
      zhTitle: "Ready market",
      type: "game-line",
      availability: {
        source: "live-detail",
        status: "ready",
        marketStatus: "LIVE",
        lastUpdated: null,
        stalenessSeconds: null,
        staleAfterSeconds: 60,
        isStale: false,
        isSuspended: false,
        isDelayed: false,
        reason: "Market accepts orders.",
      },
      outcomes: [{ id: "home", label: "Home", zhLabel: "Home", probability: 40, color: "#2563eb" }],
    },
    {
      id: "lg-market-failed",
      title: "Failed quote market",
      zhTitle: "Failed quote market",
      type: "game-line",
      availability: {
        source: "live-detail",
        status: "ready",
        marketStatus: "LIVE",
        lastUpdated: null,
        stalenessSeconds: null,
        staleAfterSeconds: 60,
        isStale: false,
        isSuspended: false,
        isDelayed: false,
        reason: "Market accepts orders.",
      },
      outcomes: [{ id: "away", label: "Away", zhLabel: "Away", probability: 60, color: "#f97316" }],
    },
  ],
};

const quoted = applyMarketQuoteStateToEvent(event, {
  quotesByMarketId: new Map([
    [
      "lg-market-ready",
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
  failedMarketIds: new Set(["lg-market-failed"]),
});

const readyMarket = quoted.markets.find((market) => market.id === "lg-market-ready");
const failedMarket = quoted.markets.find((market) => market.id === "lg-market-failed");

assert(readyMarket?.outcomes[0].probability === 45, "Expected successful quote to update ready market price.");
assert(failedMarket?.availability?.status === "unavailable", "Expected failed quote market to become unavailable.");
assert(
  failedMarket?.availability?.source === "market-quote-route",
  "Expected failed quote marker to identify quote route source.",
);
assert(
  failedMarket && marketOrderBlockReason(failedMarket) === "Market quote route failed.",
  "Expected submit guard to block failed quote market.",
);

const proof = {
  cycle: "LG",
  gate: "event-detail-quote-failure-contract",
  generatedAt: new Date().toISOString(),
  routes: ["/api/markets/:id/quote", "/api/orders"],
  assertions: {
    successfulQuotesStillUpdateMarkets: true,
    failedQuoteRoutesAreTrackedByMarketId: true,
    failedQuoteMarketsBecomeUnavailable: true,
    failedQuoteMarketsAreSubmitBlocked: true,
  },
  readyMarket,
  failedMarket,
  blockReason: marketOrderBlockReason(failedMarket!),
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
