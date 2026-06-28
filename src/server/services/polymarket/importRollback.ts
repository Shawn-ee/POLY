import { MarketStatus, MarketVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PolymarketImportRollbackSelector = {
  batchId?: string | null;
  source?: string | null;
  candidateIds?: string[];
};

export type PolymarketImportRollbackPlanItem = {
  candidateId: string;
  batchId: string;
  source: string;
  marketId: string;
  externalMarketId: string | null;
  conditionId: string | null;
  marketTitle: string;
  currentStatus: string;
  currentVisibility: string;
  isListed: boolean;
  outcomeIds: string[];
  botQuoteConfigIds: string[];
  alreadyRollbackDisabled: boolean;
  actions: string[];
};

export function validateRollbackSelector(selector: PolymarketImportRollbackSelector) {
  if (!selector.batchId && !selector.source && (!selector.candidateIds || selector.candidateIds.length === 0)) {
    throw new Error("Rollback requires --batchId, --source, or --candidateIds.");
  }
}

export async function buildPolymarketImportRollbackPlan(selector: PolymarketImportRollbackSelector) {
  validateRollbackSelector(selector);
  const candidates = await prisma.polymarketDiscoveryCandidate.findMany({
    where: {
      ...(selector.batchId ? { batchId: selector.batchId } : {}),
      ...(selector.source ? { source: selector.source } : {}),
      ...(selector.candidateIds && selector.candidateIds.length > 0 ? { id: { in: selector.candidateIds } } : {}),
      importedMarketId: { not: null },
    },
    orderBy: [{ batchId: "asc" }, { updatedAt: "desc" }],
  });

  const items: PolymarketImportRollbackPlanItem[] = [];
  for (const candidate of candidates) {
    if (!candidate.importedMarketId) continue;
    const market = await prisma.market.findUnique({
      where: { id: candidate.importedMarketId },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        isListed: true,
        externalMarketId: true,
        conditionId: true,
        outcomes: { select: { id: true, isTradable: true }, orderBy: [{ displayOrder: "asc" }] },
        botQuoteConfigs: { select: { id: true, enabled: true } },
      },
    });
    if (!market) continue;
    items.push({
      candidateId: candidate.id,
      batchId: candidate.batchId,
      source: candidate.source,
      marketId: market.id,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      marketTitle: market.title,
      currentStatus: market.status,
      currentVisibility: market.visibility,
      isListed: market.isListed,
      outcomeIds: market.outcomes.map((outcome) => outcome.id),
      botQuoteConfigIds: market.botQuoteConfigs.map((config) => config.id),
      alreadyRollbackDisabled: candidate.status === "rollback_disabled",
      actions: [
        "set_candidate_rollback_disabled",
        "set_market_private_unlisted_paused",
        "set_outcomes_not_tradable",
        "disable_bot_quote_configs",
        "write_rollback_metadata",
      ],
    });
  }
  return items;
}

export async function executePolymarketImportRollback(params: {
  selector: PolymarketImportRollbackSelector;
  confirmRollback?: boolean;
  reason?: string | null;
}) {
  const plan = await buildPolymarketImportRollbackPlan(params.selector);
  if (!params.confirmRollback) {
    return rollbackReport({ dryRun: true, plan, mutatedCount: 0 });
  }

  let mutatedCount = 0;
  const rolledBackAt = new Date().toISOString();
  for (const item of plan) {
    await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({
        where: { id: item.marketId },
        select: { referenceMetadata: true },
      });
      await tx.polymarketDiscoveryCandidate.update({
        where: { id: item.candidateId },
        data: {
          status: "rollback_disabled",
          reviewNotes: params.reason?.trim() || "Rollback disabled by operator.",
          reviewedAt: new Date(),
        },
      });
      await tx.market.update({
        where: { id: item.marketId },
        data: {
          isListed: false,
          visibility: MarketVisibility.PRIVATE,
          status: MarketStatus.PAUSED,
          referenceMetadata: mergeRollbackMetadata(market?.referenceMetadata, rolledBackAt, params.reason),
        },
      });
      await tx.outcome.updateMany({
        where: { marketId: item.marketId },
        data: { isTradable: false },
      });
      await tx.botQuoteConfig.updateMany({
        where: { marketId: item.marketId },
        data: { enabled: false, dryRun: true },
      });
    });
    mutatedCount += 1;
  }

  return rollbackReport({ dryRun: false, plan, mutatedCount });
}

function rollbackReport(params: {
  dryRun: boolean;
  plan: PolymarketImportRollbackPlanItem[];
  mutatedCount: number;
}) {
  return {
    generatedAt: new Date().toISOString(),
    dryRun: params.dryRun,
    candidateCount: params.plan.length,
    mutatedCount: params.mutatedCount,
    plannedMarketIds: params.plan.map((item) => item.marketId),
    items: params.plan,
  };
}

function mergeRollbackMetadata(current: unknown, rolledBackAt: string, reason?: string | null): Prisma.InputJsonObject {
  const base = current && typeof current === "object" && !Array.isArray(current) ? current as Record<string, unknown> : {};
  return {
    ...base,
    tradable: false,
    mmEnabled: false,
    mappingDisabled: true,
    rollbackDisabled: true,
    rollback: {
      disabledAt: rolledBackAt,
      reason: reason?.trim() || "Rollback disabled by operator.",
    },
  } as Prisma.InputJsonObject;
}
