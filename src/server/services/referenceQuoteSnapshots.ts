import { Prisma, ReferenceQuoteSnapshot } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_REFERENCE_POLL_MS = intFromEnv("REFERENCE_POLL_MS", 5000);
const DEFAULT_REFERENCE_STALE_MS = intFromEnv("REFERENCE_STALE_MS", 45000);
const DEFAULT_QUOTE_OFFSET_TICKS = intFromEnv("QUOTE_OFFSET_TICKS", 2);
const DEFAULT_TICK_SIZE = process.env.TICK_SIZE?.trim() || "0.01";
const DEFAULT_MAX_REFERENCE_SPREAD = numberFromEnv("MAX_REFERENCE_SPREAD", 0.1);

export type ReferenceSnapshotUpsertInput = {
  marketId: string;
  outcomeId: string;
  source: string;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
  tokenId?: string | null;
  outcomeLabel?: string | null;
  outcomePrice?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  spread?: number | null;
  lastTradePrice?: number | null;
  volume?: number | null;
  volume24hr?: number | null;
  liquidity?: number | null;
  liquidityClob?: number | null;
  acceptingOrders?: boolean;
  qualityStatus?: string | null;
  mmEligible?: boolean;
  reason?: string | null;
  fetchedAt: string | Date;
};

export type ReferenceOutcomeQuotePlan = {
  localMarketId: string;
  localOutcomeId: string;
  outcomeName: string;
  referenceSource: string;
  polymarketSlug: string | null;
  polymarketMarketId: string | null;
  conditionId: string | null;
  polymarketTokenId: string | null;
  gammaOutcomePrice: number | null;
  gammaBestBid: number | null;
  gammaBestAsk: number | null;
  gammaSpread: number | null;
  lastTradePrice: number | null;
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  acceptingOrders: boolean;
  fetchedAt: string | null;
  ageMs: number | null;
  isFresh: boolean;
  hasSnapshot: boolean;
  qualityStatus: string | null;
  mmEligible: boolean;
  mmEnabled: boolean;
  reason: string | null;
  tickSize: string;
  quoteOffsetTicks: number;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  referenceBid: number | null;
  referenceAsk: number | null;
  dryRun: boolean;
  liveOrdersEnabled: boolean;
  quotePlanEnabled: boolean;
  quotePreviewAvailable: boolean;
};

export type ReferenceMarketSummary = {
  source: string;
  referenceBid: number | null;
  referenceAsk: number | null;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  qualityStatus: string | null;
  isFresh: boolean;
  mmEligible: boolean;
  dryRun: boolean;
  quotePlanEnabled: boolean;
  hasSnapshot: boolean;
};

export async function upsertReferenceQuoteSnapshots(inputs: ReferenceSnapshotUpsertInput[]) {
  return prisma.$transaction(
    inputs.map((input) =>
      prisma.referenceQuoteSnapshot.upsert({
        where: {
          marketId_outcomeId_source: {
            marketId: input.marketId,
            outcomeId: input.outcomeId,
            source: input.source,
          },
        },
        create: snapshotData(input),
        update: snapshotData(input),
      }),
    ),
  );
}

export async function getLatestReferenceQuotePlansForMarket(marketId: string): Promise<ReferenceOutcomeQuotePlan[]> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      referenceQuoteSnapshots: {
        where: { source: "polymarket" },
      },
    },
  });

  if (!market) {
    return [];
  }

  const review = parseReviewMetadata(market.referenceMetadata);
  const snapshotByOutcome = new Map<string, ReferenceQuoteSnapshot>(
    market.referenceQuoteSnapshots.map((snapshot) => [snapshot.outcomeId, snapshot]),
  );

  return market.outcomes.map((outcome) =>
    buildQuotePlan({
      marketId: market.id,
      outcomeId: outcome.id,
      outcomeName: outcome.name,
      snapshot: snapshotByOutcome.get(outcome.id) ?? null,
      review,
    }),
  );
}

export async function getReferenceSummaryForMarket(marketId: string): Promise<ReferenceMarketSummary | null> {
  const plans = await getLatestReferenceQuotePlansForMarket(marketId);
  const primary =
    plans.find((plan) => plan.outcomeName.trim().toUpperCase() === "YES") ??
    plans[0] ??
    null;
  if (!primary) {
    return null;
  }
  return {
    source: primary.referenceSource,
    referenceBid: primary.referenceBid,
    referenceAsk: primary.referenceAsk,
    plannedBotBid: primary.plannedBotBid,
    plannedBotAsk: primary.plannedBotAsk,
    qualityStatus: primary.qualityStatus,
    isFresh: primary.isFresh,
    mmEligible: primary.mmEligible,
    dryRun: primary.dryRun,
    quotePlanEnabled: primary.quotePlanEnabled,
    hasSnapshot: primary.hasSnapshot,
  };
}

function snapshotData(input: ReferenceSnapshotUpsertInput): Prisma.ReferenceQuoteSnapshotUncheckedCreateInput {
  return {
    marketId: input.marketId,
    outcomeId: input.outcomeId,
    source: input.source,
    externalSlug: input.externalSlug ?? null,
    externalMarketId: input.externalMarketId ?? null,
    conditionId: input.conditionId ?? null,
    tokenId: input.tokenId ?? null,
    outcomeLabel: input.outcomeLabel ?? null,
    outcomePrice: toDecimal(input.outcomePrice),
    bestBid: toDecimal(input.bestBid),
    bestAsk: toDecimal(input.bestAsk),
    spread: toDecimal(input.spread),
    lastTradePrice: toDecimal(input.lastTradePrice),
    volume: toDecimal(input.volume),
    volume24hr: toDecimal(input.volume24hr),
    liquidity: toDecimal(input.liquidity),
    liquidityClob: toDecimal(input.liquidityClob),
    acceptingOrders: input.acceptingOrders ?? false,
    qualityStatus: input.qualityStatus ?? null,
    mmEligible: input.mmEligible ?? false,
    reason: input.reason ?? null,
    fetchedAt: input.fetchedAt instanceof Date ? input.fetchedAt : new Date(input.fetchedAt),
  };
}

function buildQuotePlan(params: {
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  snapshot: ReferenceQuoteSnapshot | null;
  review: { referenceOnly: boolean; tradable: boolean; mmEnabled: boolean; importStatus: string | null };
}): ReferenceOutcomeQuotePlan {
  const snapshot = params.snapshot;
  const hasSnapshot = snapshot != null;
  const fetchedAt = snapshot?.fetchedAt?.toISOString() ?? null;
  const ageMs = snapshot ? Math.max(0, Date.now() - snapshot.fetchedAt.getTime()) : null;
  const isFresh = snapshot ? ageMs != null && ageMs <= DEFAULT_REFERENCE_STALE_MS : false;
  const referenceBid = decimalToNumber(snapshot?.bestBid);
  const referenceAsk = decimalToNumber(snapshot?.bestAsk);
  const spread = decimalToNumber(snapshot?.spread);
  const hasBook = referenceBid != null && referenceAsk != null;
  const hasValidPrices =
    referenceBid != null &&
    referenceAsk != null &&
    referenceBid >= 0.01 &&
    referenceAsk <= 0.99 &&
    referenceBid <= referenceAsk;
  const hasTightSpread = spread != null && spread <= DEFAULT_MAX_REFERENCE_SPREAD;
  const approvedReference = params.review.importStatus === "approved" && params.review.referenceOnly;
  const quotePreviewAvailable = hasBook && hasValidPrices;
  const quotePlanEnabled = quotePreviewAvailable && isFresh && hasTightSpread;

  let reason: string | null = snapshot?.reason ?? null;
  if (!hasSnapshot) {
    reason = "no_reference_snapshot";
  } else if (!isFresh) {
    reason = "reference_stale";
  } else if (!hasBook) {
    reason = "reference_missing_book";
  } else if (!hasValidPrices) {
    reason = "reference_invalid_price";
  } else if (!hasTightSpread) {
    reason = "reference_spread_too_wide";
  } else if (!approvedReference) {
    reason = "reference_not_approved";
  } else if (!params.review.mmEnabled) {
    reason = "reference_not_mm_enabled";
  } else {
    reason = null;
  }

  const qualityStatus = hasSnapshot ? snapshot?.qualityStatus ?? "available" : "no_snapshot";
  const mmEligible =
    approvedReference &&
    params.review.mmEnabled &&
    quotePlanEnabled;

  return {
    localMarketId: params.marketId,
    localOutcomeId: params.outcomeId,
    outcomeName: params.outcomeName,
    referenceSource: snapshot?.source ?? "polymarket",
    polymarketSlug: snapshot?.externalSlug ?? null,
    polymarketMarketId: snapshot?.externalMarketId ?? null,
    conditionId: snapshot?.conditionId ?? null,
    polymarketTokenId: snapshot?.tokenId ?? null,
    gammaOutcomePrice: decimalToNumber(snapshot?.outcomePrice),
    gammaBestBid: referenceBid,
    gammaBestAsk: referenceAsk,
    gammaSpread: spread,
    lastTradePrice: decimalToNumber(snapshot?.lastTradePrice),
    volume: decimalToNumber(snapshot?.volume),
    volume24hr: decimalToNumber(snapshot?.volume24hr),
    liquidity: decimalToNumber(snapshot?.liquidity),
    acceptingOrders: snapshot?.acceptingOrders ?? false,
    fetchedAt,
    ageMs,
    isFresh,
    hasSnapshot,
    qualityStatus,
    mmEligible,
    mmEnabled: params.review.mmEnabled,
    reason,
    tickSize: DEFAULT_TICK_SIZE,
    quoteOffsetTicks: DEFAULT_QUOTE_OFFSET_TICKS,
    plannedBotBid: quotePreviewAvailable ? shiftNumericByTicks(referenceBid, -DEFAULT_QUOTE_OFFSET_TICKS) : null,
    plannedBotAsk: quotePreviewAvailable ? shiftNumericByTicks(referenceAsk, DEFAULT_QUOTE_OFFSET_TICKS) : null,
    referenceBid,
    referenceAsk,
    dryRun: process.env.SYSTEM_LIQUIDITY_DRY_RUN !== "false",
    liveOrdersEnabled: process.env.LIVE_SYSTEM_LIQUIDITY_ENABLED === "true",
    quotePlanEnabled,
    quotePreviewAvailable,
  };
}

function parseReviewMetadata(value: Prisma.JsonValue | null) {
  const object =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    referenceOnly: object.referenceOnly === true,
    tradable: object.tradable === true,
    mmEnabled: object.mmEnabled === true,
    importStatus:
      object.importStatus === "pending_review" ||
      object.importStatus === "approved" ||
      object.importStatus === "rejected"
        ? object.importStatus
        : null,
  };
}

function shiftNumericByTicks(value: number | null, ticks: number) {
  if (value == null) {
    return null;
  }
  const shifted = value + ticks * Number(DEFAULT_TICK_SIZE);
  return Number(Math.max(0.01, Math.min(0.99, shifted)).toFixed(2));
}

function toDecimal(value: number | null | undefined) {
  return value == null ? null : new Prisma.Decimal(value);
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}

function intFromEnv(key: string, fallback: number) {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numberFromEnv(key: string, fallback: number) {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const referenceSnapshotConfig = {
  pollMs: DEFAULT_REFERENCE_POLL_MS,
  staleMs: DEFAULT_REFERENCE_STALE_MS,
  quoteOffsetTicks: DEFAULT_QUOTE_OFFSET_TICKS,
  tickSize: DEFAULT_TICK_SIZE,
  maxReferenceSpread: DEFAULT_MAX_REFERENCE_SPREAD,
};
