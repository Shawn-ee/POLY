import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluatePromotionGuardrails, PromotionGuardrailDecision } from "@/server/services/polymarket/promotionGuardrails";
import { buildImportedReferenceMetadata } from "@/server/services/polymarketReferenceImport";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

export type LifecyclePromotionPlan = {
  candidateId: string;
  externalMarketId: string;
  eligible: boolean;
  dryRun: boolean;
  reasonCodes: string[];
  decision: PromotionGuardrailDecision;
  update: {
    visibility: "PUBLIC";
    isListed: true;
    status: "LIVE";
    outcomesTradable: false;
    referenceMetadata: Prisma.InputJsonValue;
  } | null;
};

type DbClient = {
  market: {
    findFirst: (args: unknown) => Promise<{ id: string; referenceMetadata: Prisma.JsonValue | null } | null>;
    update: (args: unknown) => Promise<unknown>;
  };
  outcome: {
    updateMany: (args: unknown) => Promise<unknown>;
  };
};

export function planDbBackedLifecyclePromotion(
  candidate: PolymarketImportCandidate,
  actorUserId = "system",
): LifecyclePromotionPlan {
  const decision = evaluatePromotionGuardrails(candidate);
  const reasonCodes = new Set(decision.reasonCodes);

  if (!decision.eligible) {
    return {
      candidateId: candidate.candidateId,
      externalMarketId: candidate.market.externalMarketId,
      eligible: false,
      dryRun: true,
      reasonCodes: Array.from(reasonCodes).sort(),
      decision,
      update: null,
    };
  }

  const referenceMetadata = buildImportedReferenceMetadata(null, {
    importStatus: "approved",
    referenceOnly: true,
    tradable: false,
    mmEnabled: false,
    mappingDisabled: false,
    lifecycleState: "enabled",
    enabledAt: new Date().toISOString(),
    enabledBy: actorUserId,
    promotionChecks: decision.checks,
    promotionReasonCodes: decision.reasonCodes,
    reviewedAt: new Date().toISOString(),
    reviewedBy: actorUserId,
    reviewNotes: "Auto-promoted by validated World Cup discovery/import guardrails.",
  } satisfies Prisma.InputJsonObject);

  return {
    candidateId: candidate.candidateId,
    externalMarketId: candidate.market.externalMarketId,
    eligible: true,
    dryRun: true,
    reasonCodes: [],
    decision,
    update: {
      visibility: "PUBLIC",
      isListed: true,
      status: "LIVE",
      outcomesTradable: false,
      referenceMetadata,
    },
  };
}

export async function applyDbBackedLifecyclePromotion(params: {
  candidate: PolymarketImportCandidate;
  actorUserId: string;
  db?: DbClient;
}) {
  assertSafeLocalDbPromotionAllowed();
  const db = params.db ?? prisma;
  const plan = planDbBackedLifecyclePromotion(params.candidate, params.actorUserId);
  if (!plan.eligible || !plan.update) {
    return {
      ...plan,
      applied: false,
      marketId: null,
      skippedReason: plan.reasonCodes[0] ?? "not_eligible",
    };
  }

  const market = await db.market.findFirst({
    where: {
      referenceSource: "polymarket",
      OR: [
        { conditionId: params.candidate.market.conditionId },
        { externalMarketId: params.candidate.market.externalMarketId },
        { externalSlug: params.candidate.market.slug },
      ].filter((item) => Object.values(item)[0] != null),
    },
    select: { id: true, referenceMetadata: true },
  });

  if (!market) {
    return {
      ...plan,
      applied: false,
      marketId: null,
      skippedReason: "market_not_found",
    };
  }

  const referenceMetadata = buildImportedReferenceMetadata(market.referenceMetadata, plan.update.referenceMetadata);
  await db.market.update({
    where: { id: market.id },
    data: {
      visibility: plan.update.visibility,
      isListed: plan.update.isListed,
      status: plan.update.status,
      referenceMetadata,
    },
  });
  await db.outcome.updateMany({
    where: { marketId: market.id },
    data: { isTradable: plan.update.outcomesTradable },
  });

  return {
    ...plan,
    applied: true,
    marketId: market.id,
    skippedReason: null,
  };
}

export function assertSafeLocalDbPromotionAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DB-backed lifecycle promotion is disabled in production.");
  }
  if (process.env.REAL_MONEY_MODE !== "false") {
    throw new Error("DB-backed lifecycle promotion requires REAL_MONEY_MODE=false.");
  }
  if (process.env.POLYMARKET_LOCAL_DB_PROMOTION !== "true") {
    throw new Error("DB-backed lifecycle promotion requires POLYMARKET_LOCAL_DB_PROMOTION=true.");
  }
  if (process.env.POLYMARKET_AUTO_PROMOTE_ENABLED !== "true") {
    throw new Error("DB-backed lifecycle promotion requires POLYMARKET_AUTO_PROMOTE_ENABLED=true.");
  }
}
