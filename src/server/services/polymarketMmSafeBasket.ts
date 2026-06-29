import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";

export type SafeBasketCandidate = {
  marketId: string;
  title: string;
  marketType: string;
  status: string;
  mapped: boolean;
  freshReferenceCount: number;
  outcomeCount: number;
  existingConfig: boolean;
  mappingApproved?: boolean;
  referenceOnly?: boolean;
};

export type SafeBasketSelection = SafeBasketCandidate & {
  eligible: boolean;
  reason: string;
  priority: number;
};

const CORE_MARKET_PRIORITIES = new Map([
  ["match_winner_1x2", 10],
  ["total_goals", 20],
  ["both_teams_to_score", 30],
  ["team_to_qualify", 40],
  ["spread", 50],
]);

export function planSafeBasket(candidates: SafeBasketCandidate[], maxMarkets: number) {
  const selections = candidates
    .map((candidate) => {
      const priority = CORE_MARKET_PRIORITIES.get(candidate.marketType) ?? 999;
      const reason = getCandidateReason(candidate, priority);
      return {
        ...candidate,
        eligible: reason === "eligible",
        reason,
        priority,
      } satisfies SafeBasketSelection;
    })
    .sort((left, right) => {
      if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
      if (left.priority !== right.priority) return left.priority - right.priority;
      return left.title.localeCompare(right.title);
    });

  const selected = selections.filter((selection) => selection.eligible).slice(0, Math.max(0, maxMarkets));
  return {
    selected,
    skipped: selections.filter((selection) => !selected.some((item) => item.marketId === selection.marketId)),
  };
}

export function getSafeBasketBlockers(params: {
  candidateCount: number;
  selectedCount: number;
  maxMarkets: number;
}) {
  const blockers: string[] = [];
  if (params.candidateCount === 0) {
    blockers.push("no_world_cup_polymarket_markets_found");
  }
  if (params.selectedCount < 3) {
    blockers.push(`selected_${params.selectedCount}_markets_less_than_target_3`);
  }
  return blockers;
}

export async function loadWorldCupSafeBasketCandidates() {
  const freshnessCutoff = new Date(Date.now() - 30_000);
  const markets = await prisma.market.findMany({
    where: {
      event: { sportKey: "soccer", leagueKey: "world_cup" },
      referenceSource: "polymarket",
      visibility: "PUBLIC",
      isListed: true,
      status: { in: ["LIVE", "UPCOMING"] },
    },
    include: {
      outcomes: { where: { isActive: true } },
      referenceQuoteSnapshots: { where: { source: "polymarket", fetchedAt: { gte: freshnessCutoff } } },
      botQuoteConfigs: { where: { source: "polymarket" } },
    },
  });

  return markets.map((market) => ({
    marketId: market.id,
    title: market.title,
    marketType: market.marketType,
    status: market.status,
    mapped: isApprovedPolymarketReference(market.referenceMetadata),
    mappingApproved: isApprovedPolymarketReference(market.referenceMetadata),
    referenceOnly: parseReferenceReview(market.referenceMetadata).referenceOnly === true,
    freshReferenceCount: market.referenceQuoteSnapshots.length,
    outcomeCount: market.outcomes.length,
    existingConfig: market.botQuoteConfigs.some((config) => config.enabled),
  }));
}

export async function enableSafeBasketConfigs(selected: SafeBasketSelection[], options: { dryRun: boolean }) {
  return prisma.$transaction(
    selected.map((selection) =>
      prisma.botQuoteConfig.upsert({
        where: {
          id: `safe-basket-${selection.marketId}`,
        },
        create: {
          id: `safe-basket-${selection.marketId}`,
          marketId: selection.marketId,
          outcomeId: null,
          enabled: true,
          dryRun: options.dryRun,
          source: "polymarket",
          edgeTicks: 2,
          tickSize: new Prisma.Decimal("0.01"),
          baseOrderSize: new Prisma.Decimal("1"),
          maxOrderSize: new Prisma.Decimal("1"),
          maxOutcomeExposure: new Prisma.Decimal("5"),
          maxMarketExposure: new Prisma.Decimal("10"),
          maxDailyNotional: new Prisma.Decimal("25"),
          staleAfterSeconds: 45,
          minQuoteLifetimeSeconds: 5,
        },
        update: {
          enabled: true,
          dryRun: options.dryRun,
          edgeTicks: 2,
          tickSize: new Prisma.Decimal("0.01"),
          baseOrderSize: new Prisma.Decimal("1"),
          maxOrderSize: new Prisma.Decimal("1"),
          maxOutcomeExposure: new Prisma.Decimal("5"),
          maxMarketExposure: new Prisma.Decimal("10"),
          maxDailyNotional: new Prisma.Decimal("25"),
          staleAfterSeconds: 45,
          minQuoteLifetimeSeconds: 5,
        },
      }),
    ),
  );
}

export async function enableSafeBasketDryRunConfigs(selected: SafeBasketSelection[]) {
  return enableSafeBasketConfigs(selected, { dryRun: true });
}

function getCandidateReason(candidate: SafeBasketCandidate, priority: number) {
  if (!CORE_MARKET_PRIORITIES.has(candidate.marketType) || priority >= 999) return "unsupported_market_type";
  if (!["LIVE", "ACTIVE", "UPCOMING"].includes(candidate.status)) return "market_not_open";
  if (!candidate.mapped || candidate.mappingApproved === false || candidate.referenceOnly === false) return "mapping_not_validated";
  if (candidate.freshReferenceCount < candidate.outcomeCount) return "missing_fresh_reference";
  if (candidate.existingConfig) return "already_configured";
  return "eligible";
}

function isApprovedPolymarketReference(value: Prisma.JsonValue | null) {
  const review = parseReferenceReview(value);
  return review.importedFrom === "polymarket" && review.importStatus === "approved" && review.referenceOnly === true;
}
