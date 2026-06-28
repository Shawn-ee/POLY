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

type DiscoveryCandidateQueueReviewInput = {
  id: string;
  source: string;
  externalSlug: string | null;
  externalMarketId: string | null;
  conditionId: string | null;
  title: string;
  question: string | null;
  eventTitle: string | null;
  marketType: string | null;
  status: string;
  confidence: string | null;
  reasonCodes: unknown;
  outcomes: unknown;
  tokenIds: unknown;
  rawMetadata: unknown;
  batchId: string;
  importedEventId: string | null;
  importedMarketId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
};

export function buildDiscoveryCandidateQueueReviewReport(candidates: DiscoveryCandidateQueueReviewInput[]) {
  const items = candidates.map((candidate) => {
    const reasonCodes = stringArray(candidate.reasonCodes);
    const tokenIds = stringArray(candidate.tokenIds);
    const outcomes = outcomeSummary(candidate.outcomes);
    const duplicateStatus = reasonCodes.includes("duplicate") || reasonCodes.some((reason) => reason.includes("duplicate"))
      ? "duplicate"
      : "not_detected";
    return {
      id: candidate.id,
      source: candidate.source,
      batchId: candidate.batchId,
      status: candidate.status,
      recommendedAction: queueRecommendedAction(candidate.status, reasonCodes),
      title: candidate.title,
      question: candidate.question,
      eventTitle: candidate.eventTitle,
      marketType: candidate.marketType,
      confidence: candidate.confidence,
      external: {
        externalSlug: candidate.externalSlug,
        externalMarketId: candidate.externalMarketId,
        conditionId: candidate.conditionId,
      },
      outcomes,
      tokenIds,
      blockers: reasonCodes.filter((reason) => reason !== "duplicate"),
      duplicateStatus,
      rawMetadataSummary: summarizeRawMetadata(candidate.rawMetadata),
      imported: {
        eventId: candidate.importedEventId,
        marketId: candidate.importedMarketId,
      },
      firstSeenAt: candidate.firstSeenAt,
      lastSeenAt: candidate.lastSeenAt,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    source: "persisted_discovery_candidates",
    candidateCount: items.length,
    importReadyCount: items.filter((item) => item.status === "draft_import_ready").length,
    reviewRequiredCount: items.filter((item) => item.status === "admin_review_required").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    ignoredCount: items.filter((item) => item.status === "ignored").length,
    rejectedCount: items.filter((item) => item.status === "rejected").length,
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

function queueRecommendedAction(status: string, reasonCodes: string[]): AdminReviewAction {
  if (status === "draft_import_ready" || status === "mapping_validated") return "approve";
  if (status === "admin_review_required" || status === "discovered") return "hold";
  if (status === "ignored") return "unsupported";
  if (status === "rejected" || status === "blocked" || reasonCodes.includes("missing_token_mapping")) return "reject";
  return "needs_manual_mapping";
}

function outcomeSummary(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((outcome) => {
    if (!outcome || typeof outcome !== "object") return { label: null, tokenId: null };
    const item = outcome as Record<string, unknown>;
    return {
      label: typeof item.name === "string" ? item.name : null,
      referenceOutcomeLabel: typeof item.referenceOutcomeLabel === "string" ? item.referenceOutcomeLabel : null,
      tokenId: typeof item.tokenId === "string" ? item.tokenId : null,
      externalOutcomeId: typeof item.externalOutcomeId === "string" ? item.externalOutcomeId : null,
    };
  });
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function summarizeRawMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { keys: [], duplicateKeys: [] };
  }
  const record = value as Record<string, unknown>;
  return {
    keys: Object.keys(record).sort(),
    candidateId: typeof record.candidateId === "string" ? record.candidateId : null,
    duplicateKey: typeof record.duplicateKey === "string" ? record.duplicateKey : null,
    duplicateKeys: stringArray(record.duplicateKeys).slice(0, 20),
  };
}
