import fs from "node:fs";
import path from "node:path";
import { assertEventListRoutePayloadShape } from "../mobile/src/services/eventListRouteShapeService";

const CYCLE = "cycle-MS-event-list-quote-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const eventListPayload = () => ({
  events: [
    {
      id: "event-id",
      slug: "mexico-vs-ecuador",
      title: "Mexico vs Ecuador",
      description: "World Cup match",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      startTime: "2026-07-10T20:00:00.000Z",
      status: "scheduled",
      liveStatus: null,
      period: null,
      clock: null,
      homeScore: null,
      awayScore: null,
      marketCount: 1,
      activeMarketCount: 1,
      markets: [
        {
          id: "winner-market",
          title: "Regulation Time Winner",
          description: null,
          status: "OPEN",
          marketGroupTitle: "Regulation Time Winner",
          marketType: "winner",
          propCategory: null,
          outcomes: [
            {
              id: "home",
              name: "Mexico",
              label: "Mexico",
              side: "home",
              price: "0.42",
              bestBid: "0.41",
              bestAsk: "0.43",
              bestBidSize: "1200.5",
              bestAskSize: "2400",
              isTradable: true,
            },
          ],
          event: null,
          rulesText: null,
        },
      ],
    },
  ],
  nextCursor: "event-id",
  page: { limit: 10, nextCursor: "event-id", hasMore: true },
});

const rejectedWith = (payload: unknown, message: string) => {
  try {
    assertEventListRoutePayloadShape(payload);
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const withOutcomeField = (field: "price" | "bestBid" | "bestAsk" | "bestBidSize" | "bestAskSize", value: unknown) => {
  const payload = eventListPayload() as any;
  payload.events[0].markets[0].outcomes[0][field] = value;
  return payload;
};

const main = () => {
  assertEventListRoutePayloadShape(eventListPayload());
  assertEventListRoutePayloadShape(withOutcomeField("bestAskSize", "5000.25"));

  const assertions = {
    validProbabilityQuotesAccepted: true,
    largeDepthSizeAccepted: true,
    priceAboveOneRejects: rejectedWith(withOutcomeField("price", "1.2"), "invalid price"),
    bidAboveOneRejects: rejectedWith(withOutcomeField("bestBid", 1.01), "invalid bestBid"),
    askAboveOneRejects: rejectedWith(withOutcomeField("bestAsk", "2"), "invalid bestAsk"),
    malformedQuoteRejects: rejectedWith(withOutcomeField("price", "not-a-price"), "invalid price"),
    negativeDepthSizeRejects: rejectedWith(withOutcomeField("bestBidSize", -1), "invalid bestBidSize"),
  };

  const proof = {
    cycle: "Cycle MS",
    feature: "Event list outcome quote price bounds contract",
    generatedAt: new Date().toISOString(),
    routes: [
      "/api/events?includeMobileMarkets=1",
      "/api/events?statusGroup=live&includeMobileMarkets=1",
    ],
    contract: {
      validPayload: "Home, Search, Live, and Futures event-list outcome price, bestBid, and bestAsk must be probability values from 0 to 1.",
      malformedPayload: "Above-one or malformed quote prices reject before frontend card normalization; depth sizes remain allowed above one.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MS proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
