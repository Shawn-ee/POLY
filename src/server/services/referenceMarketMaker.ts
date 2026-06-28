import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildReferenceQuotes, ReferenceQuoteMarketType } from "@/server/services/referenceQuoteEngine";
import { isPolymarketMappingEnabled } from "@/server/services/polymarket";

export type ReferenceMarketMakerConfig = {
  id: string;
  marketId: string;
  outcomeId: string | null;
  enabled: boolean;
  dryRun: boolean;
  source: string;
  edgeTicks: number;
  tickSize: number;
  baseOrderSize: number;
  maxOrderSize: number;
  maxOutcomeExposure: number;
  maxMarketExposure: number;
  maxDailyNotional: number;
  staleAfterSeconds: number;
  minQuoteLifetimeSeconds: number;
};

export type ReferenceMarketMakerReference = {
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  marketType: ReferenceQuoteMarketType;
  referenceBid: number | null;
  referenceAsk: number | null;
  referenceMid: number | null;
  fetchedAt: string | Date | null;
  mappingEnabled: boolean;
};

export type PlannedBotOrderIntent = {
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  reason: string;
  status: "DRY_RUN" | "SKIPPED";
  dryRun: boolean;
};

export type ReferenceMarketMakerPlan = {
  dryRun: boolean;
  intents: PlannedBotOrderIntent[];
  skipped: Array<{ marketId: string; outcomeId?: string | null; reason: string }>;
};

export async function runReferenceMarketMakerOnce(options: { dryRun?: boolean } = {}) {
  const forceDryRun = options.dryRun !== false;
  if (!forceDryRun) {
    throw new Error("Live reference market maker order placement is disabled until Phase 6 guards are enabled.");
  }

  const configs = await prisma.botQuoteConfig.findMany({
    where: { enabled: true, source: "polymarket" },
    orderBy: [{ marketId: "asc" }, { outcomeId: "asc" }],
  });
  const references = await loadReferenceRows(configs.map((config) => config.marketId));
  const plan = planReferenceMarketMakerIntents({
    dryRun: true,
    configs: configs.map(configFromPrisma),
    references,
    now: Date.now(),
  });

  if (plan.intents.length > 0) {
    await prisma.botOrderIntent.createMany({
      data: plan.intents.map((intent) => ({
        marketId: intent.marketId,
        outcomeId: intent.outcomeId,
        side: intent.side,
        price: new Prisma.Decimal(intent.price),
        size: new Prisma.Decimal(intent.size),
        reason: intent.reason,
        status: intent.status,
        dryRun: intent.dryRun,
      })),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    intentsCreated: plan.intents.length,
    skippedCount: plan.skipped.length,
    intents: plan.intents,
    skipped: plan.skipped,
  };
}

export function planReferenceMarketMakerIntents(params: {
  dryRun: boolean;
  configs: ReferenceMarketMakerConfig[];
  references: ReferenceMarketMakerReference[];
  now: number;
}): ReferenceMarketMakerPlan {
  const intents: PlannedBotOrderIntent[] = [];
  const skipped: ReferenceMarketMakerPlan["skipped"] = [];
  const referencesByMarket = groupReferences(params.references);

  for (const config of params.configs) {
    if (!config.enabled) {
      continue;
    }
    if (!params.dryRun || !config.dryRun) {
      skipped.push({ marketId: config.marketId, outcomeId: config.outcomeId, reason: "live_order_placement_disabled" });
      continue;
    }

    const references = (referencesByMarket.get(config.marketId) ?? []).filter(
      (reference) => !config.outcomeId || reference.outcomeId === config.outcomeId,
    );
    if (references.length === 0) {
      skipped.push({ marketId: config.marketId, outcomeId: config.outcomeId, reason: "missing_reference" });
      continue;
    }
    if (references.some((reference) => !reference.mappingEnabled)) {
      skipped.push({ marketId: config.marketId, outcomeId: config.outcomeId, reason: "mapping_disabled" });
      continue;
    }

    const marketType = references[0]?.marketType ?? "unknown";
    const quoteResult = buildReferenceQuotes({
      marketType,
      tickSize: config.tickSize,
      edgeTicks: config.edgeTicks,
      outcomes: references.map((reference) => ({
        outcomeId: reference.outcomeId,
        outcomeName: reference.outcomeName,
        referenceBid: reference.referenceBid,
        referenceAsk: reference.referenceAsk,
        referenceMid: reference.referenceMid,
        stale: isStale(reference.fetchedAt, config.staleAfterSeconds, params.now),
        missing: reference.referenceMid == null && (reference.referenceBid == null || reference.referenceAsk == null),
      })),
    });

    if (!quoteResult.shouldQuote) {
      skipped.push({ marketId: config.marketId, outcomeId: config.outcomeId, reason: quoteResult.reason ?? "quote_skipped" });
      continue;
    }

    const size = Math.min(config.baseOrderSize, config.maxOrderSize);
    if (size <= 0) {
      skipped.push({ marketId: config.marketId, outcomeId: config.outcomeId, reason: "risk_exceeded" });
      continue;
    }

    for (const quote of quoteResult.quotes) {
      if (!quote.shouldQuote || quote.targetBid == null || quote.targetAsk == null) {
        continue;
      }
      const bidNotional = quote.targetBid * size;
      const askNotional = quote.targetAsk * size;
      if (
        bidNotional > config.maxOrderSize ||
        askNotional > config.maxOrderSize ||
        bidNotional + askNotional > config.maxOutcomeExposure ||
        intentsForMarketNotional(intents, config.marketId) + bidNotional + askNotional > config.maxMarketExposure
      ) {
        skipped.push({ marketId: config.marketId, outcomeId: quote.outcomeId, reason: "risk_exceeded" });
        continue;
      }

      intents.push({
        marketId: config.marketId,
        outcomeId: quote.outcomeId,
        side: "BUY",
        price: quote.targetBid,
        size,
        reason: "reference_market_maker_quote",
        status: "DRY_RUN",
        dryRun: true,
      });
      intents.push({
        marketId: config.marketId,
        outcomeId: quote.outcomeId,
        side: "SELL",
        price: quote.targetAsk,
        size,
        reason: "reference_market_maker_quote",
        status: "DRY_RUN",
        dryRun: true,
      });
    }
  }

  return { dryRun: true, intents, skipped };
}

async function loadReferenceRows(marketIds: string[]): Promise<ReferenceMarketMakerReference[]> {
  if (marketIds.length === 0) {
    return [];
  }
  const markets = await prisma.market.findMany({
    where: { id: { in: Array.from(new Set(marketIds)) }, referenceSource: "polymarket" },
    include: {
      outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] },
      referenceQuoteSnapshots: { where: { source: "polymarket" } },
    },
  });

  return markets.flatMap((market) => {
    const snapshots = new Map(market.referenceQuoteSnapshots.map((snapshot) => [snapshot.outcomeId, snapshot]));
    const marketType = deriveMarketType(market.marketType, market.outcomes.length);
    return market.outcomes.map((outcome) => {
      const snapshot = snapshots.get(outcome.id);
      const bid = decimalToNumber(snapshot?.bestBid);
      const ask = decimalToNumber(snapshot?.bestAsk);
      return {
        marketId: market.id,
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        marketType,
        referenceBid: bid,
        referenceAsk: ask,
        referenceMid: bid != null && ask != null ? Number(((bid + ask) / 2).toFixed(6)) : decimalToNumber(snapshot?.outcomePrice),
        fetchedAt: snapshot?.fetchedAt ?? null,
        mappingEnabled: isPolymarketMappingEnabled(market.referenceMetadata),
      };
    });
  });
}

function configFromPrisma(config: {
  id: string;
  marketId: string;
  outcomeId: string | null;
  enabled: boolean;
  dryRun: boolean;
  source: string;
  edgeTicks: number;
  tickSize: Prisma.Decimal;
  baseOrderSize: Prisma.Decimal;
  maxOrderSize: Prisma.Decimal;
  maxOutcomeExposure: Prisma.Decimal;
  maxMarketExposure: Prisma.Decimal;
  maxDailyNotional: Prisma.Decimal;
  staleAfterSeconds: number;
  minQuoteLifetimeSeconds: number;
}): ReferenceMarketMakerConfig {
  return {
    ...config,
    tickSize: Number(config.tickSize),
    baseOrderSize: Number(config.baseOrderSize),
    maxOrderSize: Number(config.maxOrderSize),
    maxOutcomeExposure: Number(config.maxOutcomeExposure),
    maxMarketExposure: Number(config.maxMarketExposure),
    maxDailyNotional: Number(config.maxDailyNotional),
  };
}

function deriveMarketType(marketType: string, outcomeCount: number): ReferenceQuoteMarketType {
  if (marketType === "match_winner_1x2" || outcomeCount === 3) return "match_winner_1x2";
  if (marketType === "total_goals") return "total_goals";
  if (marketType === "both_teams_to_score") return "both_teams_to_score";
  return "yes_no";
}

function groupReferences(references: ReferenceMarketMakerReference[]) {
  const grouped = new Map<string, ReferenceMarketMakerReference[]>();
  for (const reference of references) {
    grouped.set(reference.marketId, [...(grouped.get(reference.marketId) ?? []), reference]);
  }
  return grouped;
}

function isStale(fetchedAt: string | Date | null, staleAfterSeconds: number, now: number) {
  if (!fetchedAt) return true;
  const time = fetchedAt instanceof Date ? fetchedAt.getTime() : Date.parse(fetchedAt);
  return !Number.isFinite(time) || now - time > staleAfterSeconds * 1000;
}

function intentsForMarketNotional(intents: PlannedBotOrderIntent[], marketId: string) {
  return intents
    .filter((intent) => intent.marketId === marketId)
    .reduce((sum, intent) => sum + intent.price * intent.size, 0);
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}
