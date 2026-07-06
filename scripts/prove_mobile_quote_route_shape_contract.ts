import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadMarketQuoteStateById, loadTicketQuotes } from "../mobile/src/services/quoteService";

const CYCLE = "cycle-LS-quote-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const validQuotePayload = (marketId: string) => ({
  marketId,
  quotes: [
    {
      outcomeId: "home",
      outcomeName: "Mexico",
      bestBid: "0.41",
      bestAsk: "0.43",
      bestBidSize: "250",
      bestAskSize: "300",
      midPrice: "0.42",
      lastPrice: null,
    },
  ],
});

const apiForPayload = (payloadByMarketId: Record<string, unknown>) =>
  ({
    getMarketQuote: async (marketId: string) => payloadByMarketId[marketId],
  }) as unknown as PolyApi;

const main = async () => {
  const validQuotes = await loadTicketQuotes(apiForPayload({ winner: validQuotePayload("winner") }), "winner");

  const malformedNumeric = await Promise.allSettled([
    loadTicketQuotes(
      apiForPayload({
        winner: {
          marketId: "winner",
          quotes: [{ outcomeId: "home", outcomeName: "Mexico", bestBid: "bad-bid", bestAsk: "0.43", midPrice: "0.42", lastPrice: null }],
        },
      }),
      "winner",
    ),
  ]);

  const wrongMarket = await Promise.allSettled([
    loadTicketQuotes(apiForPayload({ winner: { marketId: "other-market", quotes: [] } }), "winner"),
  ]);

  const state = await loadMarketQuoteStateById(
    apiForPayload({
      winner: validQuotePayload("winner"),
      broken: {
        marketId: "broken",
        quotes: [{ outcomeId: "away", outcomeName: "Ecuador", bestBid: "0.31", bestAsk: "-0.33", midPrice: "0.32", lastPrice: null }],
      },
    }),
    ["winner", "broken"],
  );

  const assertions = {
    validQuoteRouteAppliesOdds:
      validQuotes.length === 1 &&
      validQuotes[0].probability === 42 &&
      validQuotes[0].bestBid === 41 &&
      validQuotes[0].bestAsk === 43,
    malformedNumericRejects:
      malformedNumeric[0].status === "rejected" &&
      String(malformedNumeric[0].reason?.message ?? malformedNumeric[0].reason).includes("invalid bestBid"),
    wrongMarketRejects:
      wrongMarket[0].status === "rejected" &&
      String(wrongMarket[0].reason?.message ?? wrongMarket[0].reason).includes("requested market winner"),
    malformedBulkQuoteMarksMarketFailed:
      state.quotesByMarketId.has("winner") &&
      !state.quotesByMarketId.has("broken") &&
      state.failedMarketIds.has("broken"),
  };

  const proof = {
    cycle: "Cycle LS",
    feature: "Quote route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/markets/:id/quote",
    contract: {
      validPayload: "valid quote route responses normalize into visible ticket/card odds",
      malformedPayload: "malformed quote identity or numeric fields reject before odds are applied",
      failedState: "malformed bulk quote payloads enter failedMarketIds so existing availability guards block submit",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LS proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
