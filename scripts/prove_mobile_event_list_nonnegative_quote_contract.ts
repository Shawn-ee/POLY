import fs from "node:fs";
import path from "node:path";
import { assertEventListRoutePayloadShape } from "../mobile/src/services/eventListRouteShapeService";

const CYCLE = "cycle-MG-event-list-nonnegative-quote-contract";
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
              bestBidSize: "100",
              bestAskSize: "120",
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

const main = () => {
  const validPayload = eventListPayload();
  assertEventListRoutePayloadShape(validPayload);

  const negativePrice = eventListPayload();
  negativePrice.events[0].markets[0].outcomes[0].price = "-0.01";

  const negativeBid = eventListPayload();
  negativeBid.events[0].markets[0].outcomes[0].bestBid = "-0.01";

  const negativeAskSize = eventListPayload();
  negativeAskSize.events[0].markets[0].outcomes[0].bestAskSize = "-1";

  const malformedPrice = eventListPayload();
  malformedPrice.events[0].markets[0].outcomes[0].price = "not-a-price";

  const assertions = {
    validNonNegativeQuoteFieldsAccepted: true,
    negativePriceRejects: rejectedWith(negativePrice, "invalid price"),
    negativeBidRejects: rejectedWith(negativeBid, "invalid bestBid"),
    negativeAskSizeRejects: rejectedWith(negativeAskSize, "invalid bestAskSize"),
    malformedPriceRejects: rejectedWith(malformedPrice, "invalid price"),
  };

  const proof = {
    cycle: "Cycle MG",
    feature: "Event list non-negative quote contract",
    generatedAt: new Date().toISOString(),
    routes: [
      "/api/events?includeMobileMarkets=1",
      "/api/events?statusGroup=live&includeMobileMarkets=1",
    ],
    contract: {
      validPayload: "Home, Search, Live, and Futures event-list quote/depth fields must be finite non-negative when present",
      malformedPayload: "negative or malformed outcome quote/depth values reject before frontend probability fallback or visible card state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MG proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
