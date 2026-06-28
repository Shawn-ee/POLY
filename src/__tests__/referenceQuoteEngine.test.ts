import { buildReferenceQuotes } from "@/server/services/referenceQuoteEngine";

describe("reference quote engine", () => {
  test("shifts quotes two ticks away from reference mid", () => {
    const result = buildReferenceQuotes({
      marketType: "yes_no",
      outcomes: [{ outcomeId: "yes", outcomeName: "YES", referenceMid: 0.5 }],
    });

    expect(result.shouldQuote).toBe(true);
    expect(result.quotes[0]).toMatchObject({
      targetBid: 0.48,
      targetAsk: 0.52,
    });
  });

  test("clamps low and high prices", () => {
    const result = buildReferenceQuotes({
      marketType: "yes_no",
      outcomes: [
        { outcomeId: "low", outcomeName: "LOW", referenceMid: 0.01 },
        { outcomeId: "high", outcomeName: "HIGH", referenceMid: 0.99 },
      ],
    });

    expect(result.quotes.map((quote) => [quote.targetBid, quote.targetAsk])).toEqual([
      [0.01, 0.03],
      [0.97, 0.99],
    ]);
  });

  test("stale reference disables quote", () => {
    const result = buildReferenceQuotes({
      marketType: "both_teams_to_score",
      outcomes: [{ outcomeId: "yes", outcomeName: "YES", referenceMid: 0.55, stale: true }],
    });

    expect(result).toMatchObject({ shouldQuote: false, reason: "reference_stale" });
    expect(result.quotes[0]?.shouldQuote).toBe(false);
  });

  test("missing reference disables quote", () => {
    const result = buildReferenceQuotes({
      marketType: "total_goals",
      outcomes: [{ outcomeId: "over", outcomeName: "Over 2.5", referenceMid: null }],
    });

    expect(result).toMatchObject({ shouldQuote: false, reason: "missing_reference" });
  });

  test("unsupported market type is skipped", () => {
    const result = buildReferenceQuotes({
      marketType: "correct_score",
      outcomes: [{ outcomeId: "score", outcomeName: "2-1", referenceMid: 0.1 }],
    });

    expect(result).toMatchObject({ shouldQuote: false, reason: "unsupported_market_type" });
  });

  test("1X2 quotes are normalized and no-arbitrage sane", () => {
    const result = buildReferenceQuotes({
      marketType: "match_winner_1x2",
      outcomes: [
        { outcomeId: "home", outcomeName: "Home", referenceMid: 0.55 },
        { outcomeId: "draw", outcomeName: "Draw", referenceMid: 0.3 },
        { outcomeId: "away", outcomeName: "Away", referenceMid: 0.25 },
      ],
    });

    expect(result.shouldQuote).toBe(true);
    const bidSum = result.quotes.reduce((sum, quote) => sum + (quote.targetBid ?? 0), 0);
    const askSum = result.quotes.reduce((sum, quote) => sum + (quote.targetAsk ?? 0), 0);
    expect(bidSum).toBeLessThanOrEqual(0.99);
    expect(askSum).toBeGreaterThanOrEqual(1.01);
  });

  test("quote is worse than reference mid", () => {
    const result = buildReferenceQuotes({
      marketType: "team_to_qualify",
      outcomes: [{ outcomeId: "team", outcomeName: "France", referenceBid: 0.62, referenceAsk: 0.66 }],
    });

    expect(result.quotes[0]?.referenceMid).toBe(0.64);
    expect(result.quotes[0]?.targetBid).toBeLessThan(0.64);
    expect(result.quotes[0]?.targetAsk).toBeGreaterThan(0.64);
  });
});
