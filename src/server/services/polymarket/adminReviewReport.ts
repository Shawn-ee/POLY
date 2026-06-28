import { buildDraftImportRequestFromCandidate } from "@/server/services/polymarket/draftImport";
import { validatePolymarketCandidateMapping } from "@/server/services/polymarket/mappingValidator";
import { evaluatePromotionGuardrails } from "@/server/services/polymarket/promotionGuardrails";
import { readFixtureGammaMarketFromMetadata } from "@/server/services/polymarketReferenceSnapshots";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

export type AdminReviewAction = "approve" | "hold" | "reject" | "needs_manual_mapping" | "unsupported";

export type WorldCupAdminReviewItem = {
  candidateId: string;
  recommendedAction: AdminReviewAction;
  external: {
    title: string;
    eventTitle: string | null;
    externalMarketId: string;
    conditionId: string | null;
    externalSlug: string | null;
    marketType: string;
    active: boolean;
    closed: boolean;
    acceptingOrders: boolean;
  };
  internalDraft: {
    eventTitle: string | null;
    marketTitle: string;
    visibility: string | null | undefined;
    desiredStatus: string | null | undefined;
    tradable: false;
    mmEnabled: false;
  };
  outcomes: Array<{
    internalName: string;
    referenceOutcomeLabel: string | null | undefined;
    tokenId: string | null | undefined;
  }>;
  validation: {
    status: string;
    confidence: number;
    reasonCodes: string[];
    missingFields: string[];
    adminReviewRequired: boolean;
  };
  reference: {
    bestBid: number | null;
    bestAsk: number | null;
    spread: number | null;
    stale: boolean;
    acceptingOrders: boolean | null;
  };
  promotion: {
    eligible: boolean;
    recommendedLifecycleState: string;
    reasonCodes: string[];
    checks: Record<string, boolean>;
  };
};

export function buildWorldCupAdminReviewReport(candidates: PolymarketImportCandidate[]) {
  const items = candidates.map(buildWorldCupAdminReviewItem);
  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    candidateCount: candidates.length,
    approveCount: items.filter((item) => item.recommendedAction === "approve").length,
    holdCount: items.filter((item) => item.recommendedAction === "hold").length,
    rejectCount: items.filter((item) => item.recommendedAction === "reject").length,
    needsManualMappingCount: items.filter((item) => item.recommendedAction === "needs_manual_mapping").length,
    unsupportedCount: items.filter((item) => item.recommendedAction === "unsupported").length,
    items,
  };
}

function buildWorldCupAdminReviewItem(candidate: PolymarketImportCandidate): WorldCupAdminReviewItem {
  const request = buildDraftImportRequestFromCandidate(candidate);
  const validation = validatePolymarketCandidateMapping(candidate);
  const promotion = evaluatePromotionGuardrails(candidate);
  const fixtureReference = readFixtureGammaMarketFromMetadata(request.market.referenceMetadata);

  return {
    candidateId: candidate.candidateId,
    recommendedAction: recommendedAction(validation.status, promotion.eligible),
    external: {
      title: candidate.market.title,
      eventTitle: candidate.event?.title ?? null,
      externalMarketId: candidate.market.externalMarketId,
      conditionId: candidate.market.conditionId,
      externalSlug: candidate.market.slug,
      marketType: candidate.market.marketType,
      active: candidate.market.active,
      closed: candidate.market.closed,
      acceptingOrders: candidate.market.acceptingOrders,
    },
    internalDraft: {
      eventTitle: request.event?.title ?? null,
      marketTitle: request.market.title,
      visibility: request.market.visibility,
      desiredStatus: request.market.desiredStatus,
      tradable: false,
      mmEnabled: false,
    },
    outcomes: request.market.outcomes.map((outcome) => ({
      internalName: outcome.name,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
      tokenId: outcome.referenceTokenId,
    })),
    validation: {
      status: validation.status,
      confidence: validation.confidence,
      reasonCodes: validation.reasonCodes,
      missingFields: validation.missingFields,
      adminReviewRequired: validation.adminReviewRequired,
    },
    reference: {
      bestBid: fixtureReference?.bestBid ?? null,
      bestAsk: fixtureReference?.bestAsk ?? null,
      spread: fixtureReference?.spread ?? null,
      stale: false,
      acceptingOrders: fixtureReference?.acceptingOrders ?? null,
    },
    promotion: {
      eligible: promotion.eligible,
      recommendedLifecycleState: promotion.recommendedLifecycleState,
      reasonCodes: promotion.reasonCodes,
      checks: promotion.checks,
    },
  };
}

function recommendedAction(status: string, promotionEligible: boolean): AdminReviewAction {
  if (promotionEligible) return "approve";
  if (status === "admin_review_required") return "hold";
  if (status === "unsupported") return "unsupported";
  if (status === "duplicate" || status === "blocked") return "reject";
  return "needs_manual_mapping";
}
