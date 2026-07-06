import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadMarketQuoteStateById, loadTicketQuotes } from "../mobile/src/services/quoteService";

const CYCLE = "cycle-MW-quote-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const quotePayload = (marketId: string, overrides: Record<string, unknown> = {}) => ({
  marketId,
  quotes: [
    {
      outcomeId: "home",
      outcomeName: "Mexico",
      bestBid: "0.41",
      bestAsk: "0.43",
      bestBidSize: "1200.5",
      bestAskSize: 2400,
      midPrice: "0.42",
      lastPrice: null,
      ...overrides,
    },
  ],
});

const apiForPayload = (payloadByMarketId: Record<string, unknown>) =>
  ({
    getMarketQuote: async (marketId: string) => payloadByMarketId[marketId],
  }) as unknown as PolyApi;

const rejectsWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadTicketQuotes(apiForPayload({ winner: payload }), "winner"),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validQuotes = await loadTicketQuotes(apiForPayload({ winner: quotePayload("winner") }), "winner");
  const priceOneQuotes = await loadTicketQuotes(
    apiForPayload({ winner: quotePayload("winner", { bestAsk: "1", midPrice: 1 }) }),
    "winner",
  );

  const state = await loadMarketQuoteStateById(
    apiForPayload({
      winner: quotePayload("winner"),
      broken: quotePayload("broken", { bestAsk: "1.2" }),
    }),
    ["winner", "broken"],
  );

  const assertions = {
    validProbabilityQuotesAccepted:
      validQuotes[0]?.probability === 42 &&
      validQuotes[0]?.bestBid === 41 &&
      validQuotes[0]?.bestAsk === 43 &&
      validQuotes[0]?.bestBidSize === 1200.5 &&
      validQuotes[0]?.bestAskSize === 2400,
    quotePriceOneAccepted: priceOneQuotes[0]?.probability === 100 && priceOneQuotes[0]?.bestAsk === 100,
    bestAskAboveOneRejects: await rejectsWith(quotePayload("winner", { bestAsk: "1.2" }), "invalid bestAsk"),
    midPriceAboveOneRejects: await rejectsWith(quotePayload("winner", { midPrice: 2 }), "invalid midPrice"),
    lastPriceAboveOneRejects: await rejectsWith(quotePayload("winner", { lastPrice: "1.01" }), "invalid lastPrice"),
    malformedBulkQuoteMarksMarketFailed:
      state.quotesByMarketId.has("winner") &&
      !state.quotesByMarketId.has("broken") &&
      state.failedMarketIds.has("broken"),
  };

  const proof = {
    cycle: "Cycle MW",
    feature: "Quote route price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/markets/:id/quote",
    contract: {
      validPayload: "Quote route price fields must be contract prices from 0 to 1 before visible ticket/card odds apply; depth sizes may exceed 1.",
      malformedPayload: "Above-one quote prices reject directly and enter failedMarketIds in bulk quote refresh.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MW proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
