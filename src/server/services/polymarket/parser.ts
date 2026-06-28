import {
  PolymarketEventCandidate,
  PolymarketGammaWire,
  PolymarketImportCandidate,
  PolymarketMarketCandidate,
  PolymarketMarketType,
  PolymarketOutcomeCandidate,
} from "@/server/services/polymarket/types";

const WORLD_CUP_TERMS = ["world cup", "fifa", "2026 world cup"];
const SOCCER_TERMS = ["soccer", "football", "fifa"];
const NON_SOCCER_WORLD_CUP_TERMS = ["cricket", "rugby", "icc", "t20"];

export function parsePolymarketMarketCandidate(input: PolymarketGammaWire): PolymarketMarketCandidate | null {
  const externalMarketId = asString(input.id) ?? asString(input.marketId) ?? asString(input.questionID);
  const title = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  if (!externalMarketId || !title) {
    return null;
  }

  const tokenIds = parseStringArray(input.clobTokenIds);
  const outcomeLabels = parseStringArray(input.outcomes);
  const outcomePrices = parseNumberArray(input.outcomePrices);
  const outcomes = buildOutcomes(outcomeLabels, tokenIds, outcomePrices);
  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);

  return {
    externalMarketId,
    conditionId: asString(input.conditionId),
    slug: asString(input.slug),
    title,
    description: asString(input.description),
    category: asString(input.category),
    marketType: classifyPolymarketMarketType({
      title,
      outcomes: outcomes.map((outcome) => outcome.name),
    }),
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    acceptingOrders: asBoolean(input.acceptingOrders),
    startDate: asIsoString(input.startDate),
    endDate: asIsoString(input.endDate ?? input.endDateIso ?? input.resolveBy),
    bestBid,
    bestAsk,
    mid: bestBid != null && bestAsk != null ? roundPrice((bestBid + bestAsk) / 2) : asNumber(input.oneDayPriceChange) ?? null,
    last: asNumber(input.lastTradePrice),
    liquidity: asNumber(input.liquidity ?? input.liquidityNum ?? input.liquidityClob),
    volume: asNumber(input.volume ?? input.volumeNum),
    tags: parseTags(input.tags),
    outcomes,
    raw: input,
  };
}

export function parsePolymarketEventCandidate(input: PolymarketGammaWire): PolymarketEventCandidate | null {
  const title = asString(input.title) ?? asString(input.name) ?? asString(input.slug);
  if (!title) {
    return null;
  }

  const markets = Array.isArray(input.markets)
    ? input.markets
        .filter((market): market is PolymarketGammaWire => Boolean(market && typeof market === "object"))
        .map(parsePolymarketMarketCandidate)
        .filter((market): market is PolymarketMarketCandidate => market != null)
    : [];

  return {
    externalEventId: asString(input.id),
    slug: asString(input.slug),
    title,
    description: asString(input.description),
    category: asString(input.category),
    status: asString(input.status),
    image: asString(input.image),
    icon: asString(input.icon),
    markets,
    raw: input,
  };
}

export function classifyPolymarketMarketType(input: { title: string; outcomes: string[] }): PolymarketMarketType {
  const title = input.title.toLowerCase();
  const outcomes = input.outcomes.map((outcome) => outcome.trim().toLowerCase());

  if (title.includes("correct score")) {
    return "correct_score_unsupported";
  }
  if (outcomes.length === 2 && outcomes.includes("yes") && outcomes.includes("no")) {
    if (/both teams.*score|btts/.test(title)) {
      return "both_teams_to_score";
    }
    if (/qualify|advance/.test(title)) {
      return "team_to_qualify";
    }
    return "yes_no";
  }
  if (outcomes.length === 3 && hasAny(outcomes, ["draw", "tie"])) {
    return "match_winner_1x2";
  }
  if (/total goals|over\/under|over \d|under \d/.test(title)) {
    return "total_goals";
  }
  return "unknown";
}

export function isWorldCupSoccerCandidate(candidate: PolymarketMarketCandidate) {
  const haystack = [
    candidate.title,
    candidate.description ?? "",
    candidate.slug ?? "",
    candidate.category ?? "",
    ...candidate.tags,
  ].join(" ").toLowerCase();

  const worldCup = WORLD_CUP_TERMS.some((term) => haystack.includes(term));
  const soccer = SOCCER_TERMS.some((term) => haystack.includes(term));
  const unrelatedWorldCup = NON_SOCCER_WORLD_CUP_TERMS.some((term) => haystack.includes(term));
  return worldCup && (soccer || !unrelatedWorldCup);
}

export function buildPolymarketImportCandidates(params: {
  event: PolymarketEventCandidate | null;
  markets: PolymarketMarketCandidate[];
  existingDuplicateKeys?: Set<string>;
}): PolymarketImportCandidate[] {
  const seen = new Set(params.existingDuplicateKeys ?? []);
  const candidates: PolymarketImportCandidate[] = [];

  for (const market of params.markets) {
    const duplicateKey = market.conditionId ?? market.externalMarketId ?? market.slug ?? market.title;
    if (seen.has(duplicateKey)) {
      continue;
    }
    seen.add(duplicateKey);

    const reasons: string[] = [];
    if (!market.active || market.closed || market.archived) reasons.push("inactive_or_closed");
    if (market.outcomes.length === 0 || market.outcomes.some((outcome) => !outcome.tokenId)) reasons.push("missing_token_mapping");
    if (!isWorldCupSoccerCandidate(market)) reasons.push("not_world_cup_soccer");
    if (market.marketType === "correct_score_unsupported" || market.marketType === "unknown") reasons.push("unsupported_market_type");

    const notWorldCupSoccer = reasons.includes("not_world_cup_soccer");
    const highConfidence =
      reasons.length === 0 &&
      market.acceptingOrders &&
      market.bestBid != null &&
      market.bestAsk != null &&
      market.bestBid <= market.bestAsk;

    candidates.push({
      candidateId: stableCandidateId(market),
      source: "polymarket",
      event: params.event,
      market,
      confidence: highConfidence ? "high" : notWorldCupSoccer || reasons.length > 1 ? "low" : "medium",
      status: highConfidence ? "draft" : "needs_review",
      duplicateKey,
      reasons,
    });
  }

  return candidates;
}

function buildOutcomes(labels: string[], tokenIds: string[], prices: number[]): PolymarketOutcomeCandidate[] {
  const names = labels.length > 0 ? labels : tokenIds.map((_tokenId, index) => (index === 0 ? "Yes" : index === 1 ? "No" : `Outcome ${index + 1}`));
  return names.map((name, index) => ({
    externalOutcomeId: tokenIds[index] ?? null,
    tokenId: tokenIds[index] ?? null,
    name,
    price: prices[index] ?? null,
    displayOrder: index,
    raw: { name, tokenId: tokenIds[index] ?? null, price: prices[index] ?? null },
  }));
}

function stableCandidateId(market: PolymarketMarketCandidate) {
  return `polymarket:${market.conditionId ?? market.externalMarketId ?? market.slug ?? slugify(market.title)}`;
}

function hasAny(values: string[], expected: string[]) {
  return expected.some((value) => values.includes(value));
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(asNumber).filter((item): item is number => item != null);
  if (typeof value === "string") {
    try {
      return parseNumberArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((item) => asNumber(item.trim())).filter((item): item is number => item != null);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const wire = item as PolymarketGammaWire;
        return asString(wire.label) ?? asString(wire.name);
      }
      return null;
    })
    .filter((item): item is string => item != null);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asIsoString(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function roundPrice(value: number) {
  return Number(value.toFixed(6));
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}
