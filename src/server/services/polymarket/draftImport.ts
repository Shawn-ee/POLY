import { Prisma } from "@prisma/client";
import { collectPolymarketDuplicateKeys, normalizeDuplicateKey } from "@/server/services/polymarket/parser";
import { PolymarketImportRequest } from "@/server/services/polymarketReferenceImport";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

export type DraftImportPlan = {
  planned: Array<{
    candidate: PolymarketImportCandidate;
    request: PolymarketImportRequest;
    duplicateKeys: string[];
  }>;
  skippedDuplicates: Array<{
    candidateId: string;
    externalMarketId: string;
    duplicateKey: string;
    reason: "duplicate_candidate";
  }>;
};

export function buildDraftImportPlanFromCandidates(
  candidates: PolymarketImportCandidate[],
  existingDuplicateKeys: Set<string> = new Set(),
): DraftImportPlan {
  const seen = new Set(Array.from(existingDuplicateKeys).map(normalizeDuplicateKey).filter((key): key is string => key != null));
  const planned: DraftImportPlan["planned"] = [];
  const skippedDuplicates: DraftImportPlan["skippedDuplicates"] = [];

  for (const candidate of candidates) {
    const duplicateKeys = collectPolymarketDuplicateKeys(candidate.market);
    const duplicateKey = duplicateKeys.find((key) => seen.has(key));
    if (duplicateKey) {
      skippedDuplicates.push({
        candidateId: candidate.candidateId,
        externalMarketId: candidate.market.externalMarketId,
        duplicateKey,
        reason: "duplicate_candidate",
      });
      continue;
    }

    for (const key of duplicateKeys) seen.add(key);
    planned.push({
      candidate,
      request: buildDraftImportRequestFromCandidate(candidate),
      duplicateKeys,
    });
  }

  return { planned, skippedDuplicates };
}

export function buildDraftImportRequestFromCandidate(candidate: PolymarketImportCandidate): PolymarketImportRequest {
  const market = candidate.market;
  const eventTitle = candidate.event?.title ?? deriveEventTitle(market.title);
  const eventSlug = candidate.event?.slug ?? slugify(eventTitle);

  return {
    createEvents: true,
    event: {
      title: eventTitle,
      slug: eventSlug,
      description: candidate.event?.description ?? market.description,
      category: "sports",
      status: "draft",
      source: "polymarket",
      externalEventId: candidate.event?.externalEventId ?? null,
      externalSlug: candidate.event?.slug ?? market.slug,
      image: candidate.event?.image ?? null,
      icon: candidate.event?.icon ?? null,
      metadata: {
        lifecycleState: "draft",
        sportKey: "soccer",
        leagueKey: "world_cup",
        discoveryCandidateId: candidate.candidateId,
        source: "polymarket",
        rawEvent: candidate.event?.raw ?? null,
      } satisfies Prisma.InputJsonObject,
    },
    market: {
      title: market.title,
      description: market.description ?? market.title,
      category: market.category ?? "Sports / Soccer",
      resolveTime: market.endDate,
      type: market.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
      desiredStatus: "draft",
      visibility: "PRIVATE",
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      externalSlug: market.slug,
      referenceSource: "polymarket",
      referenceMetadata: {
        importedFrom: "polymarket",
        importStatus: "pending_review",
        lifecycleState: "draft",
        discoveryStatus: "discovered",
        mappedStatus: candidate.reasons.length === 0 ? "mapped" : "needs_review",
        referenceOnly: true,
        tradable: false,
        mmEnabled: false,
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
        discoveryCandidateId: candidate.candidateId,
        discoveryConfidence: candidate.confidence,
        discoveryReasons: candidate.reasons,
        marketType: market.marketType,
        active: market.active,
        closed: market.closed,
        archived: market.archived,
        acceptingOrders: market.acceptingOrders,
        startDate: market.startDate,
        endDate: market.endDate,
        bestBid: market.bestBid,
        bestAsk: market.bestAsk,
        mid: market.mid,
        last: market.last,
        liquidity: market.liquidity,
        volume: market.volume,
        fixtureReferencePrice: buildFixtureReferencePrice(candidate),
        tags: market.tags,
        rawMarket: toJsonValue(market.raw),
      } satisfies Prisma.InputJsonObject,
      outcomes: market.outcomes.map((outcome) => ({
        name: outcome.name,
        displayOrder: outcome.displayOrder,
        isTradable: false,
        referenceTokenId: outcome.tokenId,
        referenceOutcomeLabel: outcome.name,
        referenceMetadata: {
          lifecycleState: "draft",
          discoveryCandidateId: candidate.candidateId,
          externalOutcomeId: outcome.externalOutcomeId,
          tokenId: outcome.tokenId,
          outcomePrice: outcome.price,
          rawOutcome: toJsonValue(outcome.raw),
        } satisfies Prisma.InputJsonObject,
      })),
    },
  };
}

function buildFixtureReferencePrice(candidate: PolymarketImportCandidate): Prisma.InputJsonObject {
  const market = candidate.market;
  const spread = market.bestBid != null && market.bestAsk != null ? Number((market.bestAsk - market.bestBid).toFixed(6)) : null;
  return {
    bestBid: market.bestBid,
    bestAsk: market.bestAsk,
    spread,
    lastTradePrice: market.last,
    volume: market.volume,
    volume24hr: null,
    liquidity: market.liquidity,
    liquidityClob: market.liquidity,
    acceptingOrders: market.acceptingOrders,
    outcomes: market.outcomes.map((outcome) => ({
      label: outcome.name,
      tokenId: outcome.tokenId,
      outcomePrice: outcome.price,
    })),
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function deriveEventTitle(marketTitle: string) {
  if (/world cup/i.test(marketTitle)) {
    return "2026 FIFA World Cup";
  }
  return `World Cup: ${marketTitle}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
