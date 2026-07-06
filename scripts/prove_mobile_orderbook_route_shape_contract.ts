import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { worldCupEvents } from "../mobile/src/mocks/worldCup";
import { loadMarketDepthState } from "../mobile/src/services/marketDepthService";

const CYCLE = "cycle-LU-orderbook-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const orderbookPayload = (marketId: string) => ({
  marketId,
  outcomeId: null,
  generatedAt: "2026-07-06T08:00:00.000Z",
  availability: {
    source: "market-source-updated-at",
    status: "ready",
    marketStatus: "LIVE",
    lastUpdated: "2026-07-06T07:59:00.000Z",
    stalenessSeconds: 30,
    staleAfterSeconds: 90,
    isStale: false,
    isSuspended: false,
    isDelayed: false,
    reason: "Selected market is live and fresh.",
  },
  emptyState: null,
  levels: [
    { outcomeId: "home", side: "bid", price: 0.42, shares: 120, total: 50.4 },
    { outcomeId: "away", side: "ask", price: 0.6, shares: 100, total: 60 },
  ],
  bids: [{ outcomeId: "home", price: 0.42, size: 120 }],
  asks: [{ outcomeId: "away", price: 0.6, size: 100 }],
});

const apiForPayload = (payload: unknown) =>
  ({
    getOrderbook: async () => payload,
  }) as unknown as PolyApi;

const main = async () => {
  const event = worldCupEvents.find((item) => item.status === "live");
  if (!event) throw new Error("Live fixture event is required for orderbook proof.");
  const marketId = "france-argentina-live";

  const validDepth = await loadMarketDepthState(apiForPayload(orderbookPayload(marketId)), event);

  const wrongMarket = await Promise.allSettled([
    loadMarketDepthState(apiForPayload(orderbookPayload("other-market")), event),
  ]);

  const badLevelPayload = orderbookPayload(marketId);
  badLevelPayload.levels[0].price = Number.NaN;
  const badLevel = await Promise.allSettled([
    loadMarketDepthState(apiForPayload(badLevelPayload), event),
  ]);

  const badAvailabilityPayload = orderbookPayload(marketId);
  badAvailabilityPayload.availability.staleAfterSeconds = -1;
  const badAvailability = await Promise.allSettled([
    loadMarketDepthState(apiForPayload(badAvailabilityPayload), event),
  ]);

  const assertions = {
    validDepthApplies:
      validDepth.status === "ready" &&
      validDepth.marketId === marketId &&
      validDepth.levels.length === 2 &&
      validDepth.availability?.status === "ready",
    wrongMarketRejects:
      wrongMarket[0].status === "rejected" &&
      String(wrongMarket[0].reason?.message ?? wrongMarket[0].reason).includes(`requested market ${marketId}`),
    malformedLevelRejects:
      badLevel[0].status === "rejected" &&
      String(badLevel[0].reason?.message ?? badLevel[0].reason).includes("malformed levels price"),
    malformedAvailabilityRejects:
      badAvailability[0].status === "rejected" &&
      String(badAvailability[0].reason?.message ?? badAvailability[0].reason).includes("staleAfterSeconds"),
  };

  const proof = {
    cycle: "Cycle LU",
    feature: "Orderbook route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orderbook/:marketId/book",
    contract: {
      validPayload: "valid selected-market orderbook payloads apply visible route-backed depth",
      malformedPayload: "wrong market, malformed levels, and malformed availability reject before visible depth applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LU proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
