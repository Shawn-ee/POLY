import { prisma } from "@/lib/db";
import { isPolymarketMappingEnabled } from "@/server/services/polymarket/mappings";
import { referenceSnapshotConfig, upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

type GammaWire = Record<string, unknown>;

export type RefreshReferenceSnapshotsOptions = {
  slug?: string | null;
  marketId?: string | null;
  eventSlug?: string | null;
  onlyMmEnabled?: boolean;
  includePendingReview?: boolean;
};

export type NormalizedPolymarketReferenceMarket = Awaited<ReturnType<typeof fetchGammaMarketBySlug>>;

export type SyncablePolymarketReferenceMarket = {
  id: string;
  title: string;
  externalSlug: string | null;
  externalMarketId: string | null;
  conditionId: string | null;
  referenceMetadata: unknown;
  outcomes: Array<{
    id: string;
    name: string;
    referenceTokenId: string | null;
    referenceOutcomeLabel: string | null;
    referenceMetadata?: unknown;
  }>;
};

export async function refreshPolymarketReferenceSnapshots(options: RefreshReferenceSnapshotsOptions = {}) {
  const statusFilters = options.includePendingReview ? ["approved", "pending_review"] : ["approved"];
  const andFilters = [
    ...(options.onlyMmEnabled ? [{ referenceMetadata: { path: ["mmEnabled"], equals: true } }] : []),
    { OR: statusFilters.map((status) => ({ referenceMetadata: { path: ["importStatus"], equals: status } })) },
  ];
  const markets = await prisma.market.findMany({
    where: {
      referenceSource: "polymarket",
      ...(options.marketId ? { id: options.marketId } : {}),
      externalSlug: options.slug ?? { not: null },
      ...(options.slug ? { externalSlug: options.slug } : {}),
      ...(options.eventSlug ? { event: { slug: options.eventSlug } } : {}),
      AND: andFilters,
    },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { title: "asc" },
  });

  const refreshed: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];

  for (const market of markets) {
    if (!isPolymarketMappingEnabled(market.referenceMetadata)) {
      skipped.push({ marketId: market.id, title: market.title, reason: "mapping_not_verified_or_disabled" });
      continue;
    }
    if (!market.externalSlug) {
      skipped.push({ marketId: market.id, title: market.title, reason: "missing_external_slug" });
      continue;
    }

    const fetchedAt = new Date().toISOString();
    const inputs = await buildReferenceSnapshotInputsForSyncableMarket(market, fetchedAt).catch((error) => {
      skipped.push({
        marketId: market.id,
        title: market.title,
        slug: market.externalSlug,
        reason: error instanceof Error ? error.message : String(error),
      });
      return null;
    });
    if (!inputs) continue;

    await upsertReferenceQuoteSnapshots(inputs);
    await appendMarketOutcomeSnapshotHistory(inputs);
    refreshed.push({
      marketId: market.id,
      title: market.title,
      slug: market.externalSlug,
      outcomes: inputs.map((input) => ({
        outcomeId: input.outcomeId,
        tokenId: input.tokenId,
        bestBid: input.bestBid,
        bestAsk: input.bestAsk,
        spread: input.spread,
        lastTradePrice: input.lastTradePrice,
        outcomePrice: input.outcomePrice,
        qualityStatus: input.qualityStatus,
        mmEligible: input.mmEligible,
        reason: input.reason,
      })),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    liveOrdersEnabled: false,
    pollMs: referenceSnapshotConfig.pollMs,
    refreshedCount: refreshed.length,
    skippedCount: skipped.length,
    refreshed,
    skipped,
  };
}

export function buildReferenceSnapshotInputsForMarket(
  market: SyncablePolymarketReferenceMarket,
  gamma: NormalizedPolymarketReferenceMarket,
  fetchedAt: string,
) {
  const quality = evaluateSnapshotQuality({
    acceptingOrders: gamma.acceptingOrders,
    bestBid: gamma.bestBid,
    bestAsk: gamma.bestAsk,
    spread: gamma.spread,
  });

  return market.outcomes.map((outcome) => {
    const matchedOutcome =
      gamma.outcomes.find((entry) => outcome.referenceTokenId && entry.tokenId === outcome.referenceTokenId) ??
      gamma.outcomes.find(
        (entry) =>
          typeof outcome.referenceOutcomeLabel === "string" &&
          entry.label.toLowerCase() === outcome.referenceOutcomeLabel.toLowerCase(),
      ) ??
      gamma.outcomes.find((entry) => entry.label.toLowerCase() === outcome.name.toLowerCase()) ??
      null;

    return {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
      outcomePrice: matchedOutcome?.outcomePrice ?? null,
      bestBid: gamma.bestBid,
      bestAsk: gamma.bestAsk,
      spread: gamma.spread,
      lastTradePrice: gamma.lastTradePrice,
      volume: gamma.volume,
      volume24hr: gamma.volume24hr,
      liquidity: gamma.liquidity,
      liquidityClob: gamma.liquidityClob,
      acceptingOrders: gamma.acceptingOrders,
      qualityStatus: quality.qualityStatus,
      mmEligible: quality.mmEligible,
      reason: quality.reason,
      fetchedAt,
    };
  });
}

async function buildReferenceSnapshotInputsForSyncableMarket(
  market: SyncablePolymarketReferenceMarket,
  fetchedAt: string,
) {
  const hasPerOutcomeExternalMappings = market.outcomes.some(
    (outcome) => readOutcomeReferenceLink(outcome.referenceMetadata).externalSlug,
  );

  if (!hasPerOutcomeExternalMappings) {
    const gamma = await fetchReferenceMarketForSync(market);
    return buildReferenceSnapshotInputsForMarket(market, gamma, fetchedAt);
  }

  const inputs = [];
  for (const outcome of market.outcomes) {
    const link = readOutcomeReferenceLink(outcome.referenceMetadata);
    const externalSlug = link.externalSlug ?? market.externalSlug;
    if (!externalSlug) {
      throw new Error(`Missing external slug for outcome ${outcome.name}.`);
    }
    const gamma = await fetchReferenceMarketForSync({
      externalSlug,
      referenceMetadata: market.referenceMetadata,
    });
    inputs.push(buildReferenceSnapshotInputForOutcome({
      market,
      outcome,
      gamma,
      fetchedAt,
      externalSlug,
      externalMarketId: link.externalMarketId ?? market.externalMarketId,
      conditionId: link.conditionId ?? market.conditionId,
    }));
  }
  return inputs;
}

function buildReferenceSnapshotInputForOutcome(params: {
  market: SyncablePolymarketReferenceMarket;
  outcome: SyncablePolymarketReferenceMarket["outcomes"][number];
  gamma: NormalizedPolymarketReferenceMarket;
  fetchedAt: string;
  externalSlug: string | null;
  externalMarketId: string | null;
  conditionId: string | null;
}) {
  const quality = evaluateSnapshotQuality({
    acceptingOrders: params.gamma.acceptingOrders,
    bestBid: params.gamma.bestBid,
    bestAsk: params.gamma.bestAsk,
    spread: params.gamma.spread,
  });
  const matchedOutcome =
    params.gamma.outcomes.find((entry) => params.outcome.referenceTokenId && entry.tokenId === params.outcome.referenceTokenId) ??
    params.gamma.outcomes.find(
      (entry) =>
        typeof params.outcome.referenceOutcomeLabel === "string" &&
        entry.label.toLowerCase() === params.outcome.referenceOutcomeLabel.toLowerCase(),
    ) ??
    params.gamma.outcomes.find((entry) => entry.label.toLowerCase() === params.outcome.name.toLowerCase()) ??
    null;

  return {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    source: "polymarket",
    externalSlug: params.externalSlug,
    externalMarketId: params.externalMarketId,
    conditionId: params.conditionId,
    tokenId: params.outcome.referenceTokenId,
    outcomeLabel: params.outcome.referenceOutcomeLabel ?? params.outcome.name,
    outcomePrice: matchedOutcome?.outcomePrice ?? null,
    bestBid: params.gamma.bestBid,
    bestAsk: params.gamma.bestAsk,
    spread: params.gamma.spread,
    lastTradePrice: params.gamma.lastTradePrice,
    volume: params.gamma.volume,
    volume24hr: params.gamma.volume24hr,
    liquidity: params.gamma.liquidity,
    liquidityClob: params.gamma.liquidityClob,
    acceptingOrders: params.gamma.acceptingOrders,
    qualityStatus: quality.qualityStatus,
    mmEligible: quality.mmEligible,
    reason: quality.reason,
    fetchedAt: params.fetchedAt,
  };
}

async function appendMarketOutcomeSnapshotHistory(inputs: ReturnType<typeof buildReferenceSnapshotInputsForMarket>) {
  const rows = inputs
    .map((input) => {
      const price =
        input.outcomePrice ??
        (input.bestBid != null && input.bestAsk != null ? Number(((input.bestBid + input.bestAsk) / 2).toFixed(6)) : null);
      if (price == null) return null;
      return {
        marketId: input.marketId,
        outcomeId: input.outcomeId,
        ts: new Date(input.fetchedAt),
        price,
        volumeDelta: input.volume24hr ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  if (rows.length === 0) return;
  await prisma.marketOutcomeSnapshot.createMany({ data: rows });
}

async function fetchReferenceMarketForSync(market: {
  externalSlug: string | null;
  referenceMetadata: unknown;
}) {
  const fixture = readFixtureGammaMarketFromMetadata(market.referenceMetadata);
  if (process.env.POLYMARKET_REFERENCE_FIXTURE_MODE === "true" && fixture) {
    return fixture;
  }
  if (!market.externalSlug) {
    throw new Error("Missing external slug.");
  }
  return fetchGammaMarketBySlug(market.externalSlug);
}

export function readFixtureGammaMarketFromMetadata(metadata: unknown): Awaited<ReturnType<typeof fetchGammaMarketBySlug>> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const fixture = (metadata as Record<string, unknown>).fixtureReferencePrice;
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) {
    return null;
  }
  const data = fixture as Record<string, unknown>;
  const bestBid = asNumber(data.bestBid);
  const bestAsk = asNumber(data.bestAsk);
  return {
    bestBid,
    bestAsk,
    spread: asNumber(data.spread) ?? computeSpread(bestBid, bestAsk),
    lastTradePrice: asNumber(data.lastTradePrice),
    volume: asNumber(data.volume),
    volume24hr: asNumber(data.volume24hr),
    liquidity: asNumber(data.liquidity),
    liquidityClob: asNumber(data.liquidityClob),
    acceptingOrders: data.acceptingOrders !== false,
    outcomes: Array.isArray(data.outcomes)
      ? data.outcomes
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
          .map((item) => ({
            label: asString(item.label) ?? "Unknown",
            tokenId: asString(item.tokenId) ?? "",
            outcomePrice: asNumber(item.outcomePrice) ?? 0,
          }))
      : [],
  };
}

function readOutcomeReferenceLink(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { externalSlug: null, externalMarketId: null, conditionId: null };
  }
  const data = metadata as Record<string, unknown>;
  return {
    externalSlug: asString(data.externalSlug),
    externalMarketId: asString(data.externalMarketId),
    conditionId: asString(data.conditionId),
  };
}

function evaluateSnapshotQuality(input: {
  acceptingOrders: boolean;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
}) {
  if (input.bestBid == null || input.bestAsk == null) {
    return {
      qualityStatus: "missing_book",
      mmEligible: false,
      reason: "reference_missing_book",
    };
  }
  if (input.bestBid < 0.01 || input.bestAsk > 0.99 || input.bestBid > input.bestAsk) {
    return {
      qualityStatus: "invalid_price",
      mmEligible: false,
      reason: "reference_invalid_price",
    };
  }
  if (input.spread == null || input.spread > referenceSnapshotConfig.maxReferenceSpread) {
    return {
      qualityStatus: "wide",
      mmEligible: false,
      reason: "reference_spread_too_wide",
    };
  }
  if (!input.acceptingOrders) {
    return {
      qualityStatus: "available",
      mmEligible: false,
      reason: "reference_missing_book",
    };
  }
  return {
    qualityStatus: "high_quality",
    mmEligible: true,
    reason: null,
  };
}

async function fetchGammaMarketBySlug(slug: string) {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("slug", slug);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Gamma API request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0 || !payload[0] || typeof payload[0] !== "object") {
    throw new Error("Gamma API returned unexpected payload.");
  }
  return normalizeGammaMarket(payload[0] as GammaWire);
}

function normalizeGammaMarket(input: GammaWire) {
  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);
  return {
    bestBid,
    bestAsk,
    spread: asNumber(input.spread) ?? computeSpread(bestBid, bestAsk),
    lastTradePrice: asNumber(input.lastTradePrice),
    volume: asNumber(input.volume ?? input.volumeNum),
    volume24hr: asNumber(input.volume24hr ?? input.volume24Hour ?? input.volume24h),
    liquidity: asNumber(input.liquidity ?? input.liquidityNum),
    liquidityClob: asNumber(input.liquidityClob),
    acceptingOrders: asBoolean(input.acceptingOrders),
    outcomes: parseOutcomes(input),
  };
}

function parseOutcomes(input: GammaWire) {
  const labels = parseStringArray(input.outcomes);
  const tokenIds = parseStringArray(input.clobTokenIds);
  const prices = parseNumberArray(input.outcomePrices);
  return labels.map((label, index) => ({
    label,
    tokenId: tokenIds[index] ?? null,
    outcomePrice: prices[index] ?? null,
  }));
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => asNumber(item)).filter((item): item is number => item != null);
  }
  if (typeof value === "string") {
    try {
      return parseNumberArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => asNumber(part.trim())).filter((item): item is number => item != null);
    }
  }
  return [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) return null;
  return Number((bestAsk - bestBid).toFixed(6));
}
