export type ReferenceQuoteMarketType =
  | "yes_no"
  | "match_winner_1x2"
  | "total_goals"
  | "both_teams_to_score"
  | "team_to_qualify"
  | "correct_score"
  | "player_props"
  | "parlay"
  | "pick_slip"
  | "unknown";

export type ReferenceQuoteInput = {
  outcomeId: string;
  outcomeName: string;
  referenceBid?: number | null;
  referenceAsk?: number | null;
  referenceMid?: number | null;
  stale?: boolean;
  missing?: boolean;
};

export type ReferenceQuoteEngineOptions = {
  marketType: ReferenceQuoteMarketType;
  outcomes: ReferenceQuoteInput[];
  tickSize?: number;
  edgeTicks?: number;
};

export type ReferenceQuoteDecision = {
  outcomeId: string;
  outcomeName: string;
  shouldQuote: boolean;
  targetBid: number | null;
  targetAsk: number | null;
  reason: string | null;
  referenceMid: number | null;
};

export type ReferenceQuoteEngineResult = {
  marketType: ReferenceQuoteMarketType;
  shouldQuote: boolean;
  reason: string | null;
  tickSize: number;
  edgeTicks: number;
  quotes: ReferenceQuoteDecision[];
};

const SUPPORTED_MARKET_TYPES = new Set<ReferenceQuoteMarketType>([
  "yes_no",
  "match_winner_1x2",
  "total_goals",
  "both_teams_to_score",
  "team_to_qualify",
]);

export function buildReferenceQuotes(options: ReferenceQuoteEngineOptions): ReferenceQuoteEngineResult {
  const tickSize = options.tickSize ?? 0.01;
  const edgeTicks = options.edgeTicks ?? 2;

  if (!SUPPORTED_MARKET_TYPES.has(options.marketType)) {
    return skippedResult(options, tickSize, edgeTicks, "unsupported_market_type");
  }
  if (options.outcomes.length === 0) {
    return skippedResult(options, tickSize, edgeTicks, "missing_reference");
  }
  if (options.outcomes.some((outcome) => outcome.missing || referenceMidFor(outcome) == null)) {
    return skippedResult(options, tickSize, edgeTicks, "missing_reference");
  }
  if (options.outcomes.some((outcome) => outcome.stale)) {
    return skippedResult(options, tickSize, edgeTicks, "reference_stale");
  }
  if (options.marketType === "match_winner_1x2" && options.outcomes.length !== 3) {
    return skippedResult(options, tickSize, edgeTicks, "missing_1x2_outcome");
  }

  const edge = edgeTicks * tickSize;
  const quoteDrafts = options.outcomes.map((outcome) => {
    const referenceMid = referenceMidFor(outcome);
    return {
      outcomeId: outcome.outcomeId,
      outcomeName: outcome.outcomeName,
      shouldQuote: true,
      targetBid: clampPrice(referenceMid! - edge),
      targetAsk: clampPrice(referenceMid! + edge),
      reason: null,
      referenceMid,
    };
  });

  const quotes =
    options.marketType === "match_winner_1x2"
      ? normalizeMutuallyExclusiveQuotes(quoteDrafts, edge)
      : quoteDrafts;

  const invalid = quotes.some((quote) => quote.targetBid == null || quote.targetAsk == null || quote.targetBid >= quote.targetAsk);
  if (invalid) {
    return skippedResult(options, tickSize, edgeTicks, "invalid_quote");
  }

  return {
    marketType: options.marketType,
    shouldQuote: true,
    reason: null,
    tickSize,
    edgeTicks,
    quotes,
  };
}

function skippedResult(
  options: ReferenceQuoteEngineOptions,
  tickSize: number,
  edgeTicks: number,
  reason: string,
): ReferenceQuoteEngineResult {
  return {
    marketType: options.marketType,
    shouldQuote: false,
    reason,
    tickSize,
    edgeTicks,
    quotes: options.outcomes.map((outcome) => ({
      outcomeId: outcome.outcomeId,
      outcomeName: outcome.outcomeName,
      shouldQuote: false,
      targetBid: null,
      targetAsk: null,
      reason,
      referenceMid: referenceMidFor(outcome),
    })),
  };
}

function normalizeMutuallyExclusiveQuotes(quotes: ReferenceQuoteDecision[], edge: number) {
  const totalMid = quotes.reduce((sum, quote) => sum + (quote.referenceMid ?? 0), 0);
  const midNormalized =
    totalMid > 0
      ? quotes.map((quote) => ({
          ...quote,
          referenceMid: Number(((quote.referenceMid ?? 0) / totalMid).toFixed(6)),
        }))
      : quotes;

  let normalized = midNormalized.map((quote) => ({
    ...quote,
    targetBid: clampPrice((quote.referenceMid ?? 0) - edge),
    targetAsk: clampPrice((quote.referenceMid ?? 0) + edge),
  }));

  const bidSum = sumPrices(normalized, "targetBid");
  if (bidSum > 0.99) {
    const scale = 0.99 / bidSum;
    normalized = normalized.map((quote) => ({
      ...quote,
      targetBid: clampPrice((quote.targetBid ?? 0) * scale),
    }));
  }

  const askSum = sumPrices(normalized, "targetAsk");
  if (askSum < 1.01 && askSum > 0) {
    const scale = 1.01 / askSum;
    normalized = normalized.map((quote) => ({
      ...quote,
      targetAsk: clampPrice((quote.targetAsk ?? 0) * scale),
    }));
  }

  return normalized;
}

function referenceMidFor(outcome: ReferenceQuoteInput) {
  if (outcome.referenceMid != null) return normalizeProbability(outcome.referenceMid);
  if (outcome.referenceBid != null && outcome.referenceAsk != null) {
    return normalizeProbability((outcome.referenceBid + outcome.referenceAsk) / 2);
  }
  return null;
}

function normalizeProbability(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1 ? Number(value.toFixed(6)) : null;
}

function clampPrice(value: number) {
  return Number(Math.max(0.01, Math.min(0.99, value)).toFixed(2));
}

function sumPrices(quotes: ReferenceQuoteDecision[], key: "targetBid" | "targetAsk") {
  return quotes.reduce((sum, quote) => sum + (quote[key] ?? 0), 0);
}
