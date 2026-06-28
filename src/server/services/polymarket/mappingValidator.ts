import { collectPolymarketDuplicateKeys, normalizeDuplicateKey, parsePolymarketMarketCandidate } from "@/server/services/polymarket/parser";
import { PolymarketGammaWire, PolymarketImportCandidate, PolymarketMarketType } from "@/server/services/polymarket/types";
import { prisma } from "@/lib/db";
import { MarketStatus, MarketVisibility, Prisma } from "@prisma/client";

export type MappingValidationStatus =
  | "validated"
  | "admin_review_required"
  | "blocked"
  | "unsupported"
  | "duplicate"
  | "draft_only";

export type MappingValidationResult = {
  candidateId: string;
  externalMarketId: string;
  conditionId: string | null;
  externalSlug: string | null;
  marketType: PolymarketMarketType;
  status: MappingValidationStatus;
  confidence: number;
  reasonCodes: string[];
  missingFields: string[];
  adminReviewRequired: boolean;
  eligibleForAutoPromotion: boolean;
  recommendedLifecycleState: "draft" | "mapped" | "validated";
};

export type ImportedMappingValidationRecord = {
  candidate: {
    id: string;
    status: string;
    importedEventId: string | null;
    importedMarketId: string | null;
    importedOutcomeIds: unknown;
    rawMetadata: unknown;
  };
  market: {
    id: string;
    externalMarketId: string | null;
    conditionId: string | null;
    externalSlug: string | null;
    referenceSource: string | null;
    referenceMetadata: unknown;
    status: string;
    visibility: string;
    isListed: boolean;
    eventId: string | null;
    outcomes: Array<{
      id: string;
      name: string;
      isTradable: boolean;
      referenceTokenId: string | null;
      referenceOutcomeLabel: string | null;
    }>;
  } | null;
};

export type ImportedMappingValidationResult = MappingValidationResult & {
  candidateStatus: string;
  importedEventId: string | null;
  importedMarketId: string | null;
  importedOutcomeIds: string[];
  marketPrivate: boolean;
  outcomesTradable: boolean;
};

const SUPPORTED_MARKET_TYPES = new Set<PolymarketMarketType>([
  "yes_no",
  "match_winner_1x2",
  "total_goals",
  "both_teams_to_score",
  "team_to_qualify",
]);

export function validatePolymarketCandidateMapping(
  candidate: PolymarketImportCandidate,
  existingDuplicateKeys: Set<string> = new Set(),
): MappingValidationResult {
  const market = candidate.market;
  const reasonCodes = new Set(candidate.reasons);
  const missingFields: string[] = [];
  const seen = new Set(Array.from(existingDuplicateKeys).map(normalizeDuplicateKey).filter((key): key is string => key != null));

  if (!market.externalMarketId) {
    missingFields.push("externalMarketId");
    reasonCodes.add("missing_external_market_id");
  }
  if (!market.conditionId) {
    missingFields.push("conditionId");
    reasonCodes.add("missing_condition_id");
  }
  if (!market.slug) {
    missingFields.push("externalSlug");
    reasonCodes.add("missing_external_slug");
  }
  if (market.outcomes.length === 0) {
    missingFields.push("outcomes");
    reasonCodes.add("missing_outcomes");
  }
  if (market.outcomes.some((outcome) => !outcome.tokenId)) {
    missingFields.push("outcomeTokenIds");
    reasonCodes.add("missing_token_mapping");
  }
  if (!SUPPORTED_MARKET_TYPES.has(market.marketType)) {
    reasonCodes.add("unsupported_market_type");
  }
  if (!market.active || market.closed || market.archived || !market.acceptingOrders) {
    reasonCodes.add("inactive_or_closed");
  }
  if (collectPolymarketDuplicateKeys(market).some((key) => seen.has(key))) {
    reasonCodes.add("duplicate_mapping");
  }
  validateOutcomeShape(candidate, reasonCodes);

  const confidence = calculateConfidence(reasonCodes);
  const status = classifyStatus(reasonCodes, confidence);
  const adminReviewRequired = status === "admin_review_required";
  const eligibleForAutoPromotion = status === "validated" && confidence >= 0.95;

  return {
    candidateId: candidate.candidateId,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    externalSlug: market.slug,
    marketType: market.marketType,
    status,
    confidence,
    reasonCodes: Array.from(reasonCodes).sort(),
    missingFields: Array.from(new Set(missingFields)).sort(),
    adminReviewRequired,
    eligibleForAutoPromotion,
    recommendedLifecycleState: status === "validated" ? "validated" : status === "admin_review_required" ? "mapped" : "draft",
  };
}

export function validateImportedPolymarketMappingRecord(
  record: ImportedMappingValidationRecord,
  existingDuplicateKeys: Set<string> = new Set(),
): ImportedMappingValidationResult {
  const reasonCodes = new Set<string>();
  const missingFields: string[] = [];
  const expected = expectedMappingFromRawMetadata(record.candidate.rawMetadata);
  const importedOutcomeIds = stringArray(record.candidate.importedOutcomeIds);
  const market = record.market;

  if (!["imported_draft", "mapping_validated", "admin_review_required"].includes(record.candidate.status)) {
    reasonCodes.add("candidate_not_imported_draft");
  }
  if (!record.candidate.importedEventId) {
    missingFields.push("importedEventId");
    reasonCodes.add("missing_imported_event_id");
  }
  if (!record.candidate.importedMarketId) {
    missingFields.push("importedMarketId");
    reasonCodes.add("missing_imported_market_id");
  }
  if (importedOutcomeIds.length === 0) {
    missingFields.push("importedOutcomeIds");
    reasonCodes.add("missing_imported_outcome_ids");
  }
  if (!market) {
    reasonCodes.add("missing_imported_market");
  }

  const externalMarketId = market?.externalMarketId ?? expected.externalMarketId;
  const conditionId = market?.conditionId ?? expected.conditionId;
  const externalSlug = market?.externalSlug ?? expected.externalSlug;
  const marketType = expected.marketType;
  const outcomeTokenIds = market?.outcomes.map((outcome) => outcome.referenceTokenId) ?? [];
  const outcomeLabels = market?.outcomes.map((outcome) => outcome.referenceOutcomeLabel) ?? [];

  if (!externalMarketId) {
    missingFields.push("externalMarketId");
    reasonCodes.add("missing_external_market_id");
  }
  if (!conditionId) {
    missingFields.push("conditionId");
    reasonCodes.add("missing_condition_id");
  }
  if (!externalSlug) {
    missingFields.push("externalSlug");
    reasonCodes.add("missing_external_slug");
  }
  if (!market?.eventId || market.eventId !== record.candidate.importedEventId) {
    reasonCodes.add("event_mapping_mismatch");
  }
  if (market && market.id !== record.candidate.importedMarketId) {
    reasonCodes.add("market_mapping_mismatch");
  }
  if (market && importedOutcomeIds.some((id) => !market.outcomes.some((outcome) => outcome.id === id))) {
    reasonCodes.add("outcome_mapping_mismatch");
  }
  if (expected.externalMarketId && externalMarketId !== expected.externalMarketId) {
    reasonCodes.add("external_market_id_mismatch");
  }
  if (expected.conditionId && conditionId !== expected.conditionId) {
    reasonCodes.add("condition_id_mismatch");
  }
  if (expected.externalSlug && externalSlug !== expected.externalSlug) {
    reasonCodes.add("external_slug_mismatch");
  }
  if (outcomeTokenIds.some((token) => !token)) {
    missingFields.push("outcomeTokenIds");
    reasonCodes.add("missing_token_mapping");
  }
  if (expected.tokenIds.length > 0 && !sameStringSet(expected.tokenIds, outcomeTokenIds)) {
    reasonCodes.add("outcome_token_mismatch");
  }
  if (expected.outcomeLabels.length > 0 && !sameNormalizedSet(expected.outcomeLabels, outcomeLabels)) {
    reasonCodes.add("outcome_label_mismatch");
  }
  if (!SUPPORTED_MARKET_TYPES.has(marketType)) {
    reasonCodes.add("unsupported_market_type");
  }
  if (expected.closed || expected.archived || expected.active === false || expected.acceptingOrders === false) {
    reasonCodes.add("inactive_or_closed");
  }
  if (expected.tbdTeam) {
    reasonCodes.add("tbd_team");
  }
  if (externalMarketId && existingDuplicateKeys.has(normalizeDuplicateKey(externalMarketId) ?? externalMarketId)) {
    reasonCodes.add("duplicate_mapping");
  }

  const confidence = calculateConfidence(reasonCodes);
  const status = classifyImportedStatus(reasonCodes, confidence);
  const adminReviewRequired = status === "admin_review_required";

  return {
    candidateId: record.candidate.id,
    externalMarketId: externalMarketId ?? "",
    conditionId: conditionId ?? null,
    externalSlug: externalSlug ?? null,
    marketType,
    status,
    confidence,
    reasonCodes: Array.from(reasonCodes).sort(),
    missingFields: Array.from(new Set(missingFields)).sort(),
    adminReviewRequired,
    eligibleForAutoPromotion: status === "validated" && confidence >= 0.95,
    recommendedLifecycleState: status === "validated" ? "validated" : adminReviewRequired ? "mapped" : "draft",
    candidateStatus: record.candidate.status,
    importedEventId: record.candidate.importedEventId,
    importedMarketId: record.candidate.importedMarketId,
    importedOutcomeIds,
    marketPrivate: market?.visibility === MarketVisibility.PRIVATE && market.isListed === false,
    outcomesTradable: market?.outcomes.some((outcome) => outcome.isTradable) ?? false,
  };
}

export async function validateImportedPolymarketMappingsFromDb(params: {
  batchId?: string | null;
  candidateId?: string | null;
  confirmUpdate?: boolean;
} = {}) {
  const candidates = await prisma.polymarketDiscoveryCandidate.findMany({
    where: {
      status: { in: ["imported_draft", "mapping_validated", "admin_review_required"] },
      ...(params.batchId ? { batchId: params.batchId } : {}),
      ...(params.candidateId ? { id: params.candidateId } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
  });
  const results: ImportedMappingValidationResult[] = [];

  for (const candidate of candidates) {
    const market = candidate.importedMarketId
      ? await prisma.market.findUnique({
          where: { id: candidate.importedMarketId },
          select: {
            id: true,
            externalMarketId: true,
            conditionId: true,
            externalSlug: true,
            referenceSource: true,
            referenceMetadata: true,
            status: true,
            visibility: true,
            isListed: true,
            eventId: true,
            outcomes: {
              select: {
                id: true,
                name: true,
                isTradable: true,
                referenceTokenId: true,
                referenceOutcomeLabel: true,
              },
              orderBy: [{ displayOrder: "asc" }],
            },
          },
        })
      : null;
    const result = validateImportedPolymarketMappingRecord({ candidate, market });
    results.push(result);
    if (params.confirmUpdate) {
      await applyImportedMappingValidation(candidate.id, market?.id ?? null, result, candidate.rawMetadata, market?.referenceMetadata ?? null);
    }
  }

  return {
    dryRun: params.confirmUpdate !== true,
    candidateCount: candidates.length,
    validatedCount: results.filter((item) => item.status === "validated").length,
    adminReviewRequiredCount: results.filter((item) => item.status === "admin_review_required").length,
    blockedCount: results.filter((item) => item.status === "blocked" || item.status === "draft_only").length,
    unsupportedCount: results.filter((item) => item.status === "unsupported").length,
    duplicateCount: results.filter((item) => item.status === "duplicate").length,
    validations: results,
  };
}

function validateOutcomeShape(candidate: PolymarketImportCandidate, reasonCodes: Set<string>) {
  const outcomes = candidate.market.outcomes.map((outcome) => outcome.name.trim().toLowerCase());
  switch (candidate.market.marketType) {
    case "yes_no":
    case "both_teams_to_score":
    case "team_to_qualify":
      if (outcomes.length !== 2 || !outcomes.includes("yes") || !outcomes.includes("no")) {
        reasonCodes.add("invalid_yes_no_outcomes");
      }
      break;
    case "match_winner_1x2":
      if (outcomes.length !== 3 || !outcomes.some((outcome) => outcome === "draw" || outcome === "tie")) {
        reasonCodes.add("invalid_1x2_outcomes");
      }
      break;
    case "total_goals":
      if (outcomes.length !== 2) {
        reasonCodes.add("invalid_total_goals_outcomes");
      }
      break;
    default:
      break;
  }
}

function calculateConfidence(reasonCodes: Set<string>) {
  let confidence = 1;
  if (reasonCodes.has("unsupported_market_type")) confidence -= 0.6;
  if (reasonCodes.has("inactive_or_closed")) confidence -= 0.45;
  if (reasonCodes.has("missing_token_mapping")) confidence -= 0.4;
  if (reasonCodes.has("missing_condition_id")) confidence -= 0.2;
  if (reasonCodes.has("missing_external_market_id")) confidence -= 0.25;
  if (reasonCodes.has("missing_external_slug")) confidence -= 0.1;
  if (reasonCodes.has("missing_outcomes")) confidence -= 0.4;
  if (reasonCodes.has("tbd_team")) confidence -= 0.2;
  if (reasonCodes.has("duplicate_mapping")) confidence -= 0.35;
  if (
    reasonCodes.has("invalid_yes_no_outcomes") ||
    reasonCodes.has("invalid_1x2_outcomes") ||
    reasonCodes.has("invalid_total_goals_outcomes")
  ) {
    confidence -= 0.3;
  }
  return Math.max(0, Number(confidence.toFixed(2)));
}

function classifyStatus(reasonCodes: Set<string>, confidence: number): MappingValidationStatus {
  if (reasonCodes.has("unsupported_market_type")) return "unsupported";
  if (reasonCodes.has("duplicate_mapping")) return "duplicate";
  if (
    reasonCodes.has("inactive_or_closed") ||
    reasonCodes.has("missing_token_mapping") ||
    reasonCodes.has("missing_external_market_id") ||
    reasonCodes.has("missing_condition_id") ||
    reasonCodes.has("missing_outcomes") ||
    reasonCodes.has("invalid_yes_no_outcomes") ||
    reasonCodes.has("invalid_1x2_outcomes") ||
    reasonCodes.has("invalid_total_goals_outcomes")
  ) {
    return confidence >= 0.75 ? "draft_only" : "blocked";
  }
  if (reasonCodes.has("tbd_team") || confidence < 0.95) {
    return confidence >= 0.75 ? "admin_review_required" : "blocked";
  }
  return "validated";
}

function classifyImportedStatus(reasonCodes: Set<string>, confidence: number): MappingValidationStatus {
  if (reasonCodes.has("unsupported_market_type")) return "unsupported";
  if (reasonCodes.has("duplicate_mapping")) return "duplicate";
  if (
    reasonCodes.has("missing_imported_market") ||
    reasonCodes.has("missing_imported_event_id") ||
    reasonCodes.has("missing_imported_market_id") ||
    reasonCodes.has("missing_imported_outcome_ids") ||
    reasonCodes.has("event_mapping_mismatch") ||
    reasonCodes.has("market_mapping_mismatch") ||
    reasonCodes.has("outcome_mapping_mismatch") ||
    reasonCodes.has("external_market_id_mismatch") ||
    reasonCodes.has("condition_id_mismatch") ||
    reasonCodes.has("external_slug_mismatch") ||
    reasonCodes.has("outcome_token_mismatch") ||
    reasonCodes.has("outcome_label_mismatch")
  ) {
    return "blocked";
  }
  return classifyStatus(reasonCodes, confidence);
}

async function applyImportedMappingValidation(
  candidateId: string,
  marketId: string | null,
  result: ImportedMappingValidationResult,
  currentCandidateRawMetadata: unknown,
  currentMarketMetadata: unknown,
) {
  const validationMetadata = {
    mappingValidation: {
      status: result.status,
      confidence: result.confidence,
      reasonCodes: result.reasonCodes,
      missingFields: result.missingFields,
      adminReviewRequired: result.adminReviewRequired,
      eligibleForAutoPromotion: result.eligibleForAutoPromotion,
      validatedAt: new Date().toISOString(),
    },
    promotionEligibility: {
      eligible: result.eligibleForAutoPromotion,
      recommendedLifecycleState: result.recommendedLifecycleState,
    },
  } satisfies Prisma.InputJsonObject;

  await prisma.polymarketDiscoveryCandidate.update({
    where: { id: candidateId },
    data: {
      status: result.status === "validated" ? "mapping_validated" : result.adminReviewRequired ? "admin_review_required" : "blocked",
      confidence: result.confidence.toFixed(2),
      reasonCodes: result.reasonCodes,
      rawMetadata: mergeJsonObject(currentCandidateRawMetadata, validationMetadata),
    },
  });

  if (marketId) {
    await prisma.market.update({
      where: { id: marketId },
      data: {
        referenceMetadata: mergeJsonObject(currentMarketMetadata, validationMetadata),
        ...(result.eligibleForAutoPromotion
          ? {}
          : {
              visibility: MarketVisibility.PRIVATE,
              isListed: false,
              status: MarketStatus.PAUSED,
            }),
      },
    });
    if (!result.eligibleForAutoPromotion) {
      await prisma.outcome.updateMany({ where: { marketId }, data: { isTradable: false } });
    }
  }
}

function expectedMappingFromRawMetadata(rawMetadata: unknown) {
  const raw = rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
    ? (rawMetadata as Record<string, unknown>)
    : {};
  const market = raw.market && typeof raw.market === "object" && !Array.isArray(raw.market)
    ? (raw.market as Record<string, unknown>)
    : {};
  const parsed = parsePolymarketMarketCandidate(market as PolymarketGammaWire);
  const outcomes = parsed?.outcomes ?? (Array.isArray(market.outcomes) ? market.outcomes : []);
  const title = stringValue(market.title) ?? stringValue(market.question) ?? "";
  return {
    externalMarketId: parsed?.externalMarketId ?? stringValue(market.externalMarketId) ?? stringValue(market.id),
    conditionId: parsed?.conditionId ?? stringValue(market.conditionId),
    externalSlug: parsed?.slug ?? stringValue(market.slug),
    marketType: parsed?.marketType ?? ((stringValue(market.marketType) ?? "unknown") as PolymarketMarketType),
    active: parsed?.active ?? booleanValue(market.active),
    closed: parsed?.closed ?? booleanValue(market.closed),
    archived: parsed?.archived ?? booleanValue(market.archived),
    acceptingOrders: parsed?.acceptingOrders ?? booleanValue(market.acceptingOrders),
    tbdTeam: /winner of|runner-up|runner up|tbd|to be determined/i.test(parsed?.title ?? title) ||
      outcomes.some((outcome) => {
        if (!outcome || typeof outcome !== "object") return false;
        return /winner of|runner-up|runner up|tbd|to be determined/i.test(stringValue((outcome as Record<string, unknown>).name) ?? "");
      }),
    tokenIds: outcomes
      .map((outcome) => outcome && typeof outcome === "object" ? stringValue((outcome as Record<string, unknown>).tokenId) : null)
      .filter((value): value is string => Boolean(value)),
    outcomeLabels: outcomes
      .map((outcome) => outcome && typeof outcome === "object" ? stringValue((outcome as Record<string, unknown>).name) : null)
      .filter((value): value is string => Boolean(value)),
  };
}

function mergeJsonObject(current: unknown, patch: Prisma.InputJsonObject): Prisma.InputJsonObject {
  const base = current && typeof current === "object" && !Array.isArray(current) ? current as Record<string, unknown> : {};
  return { ...base, ...patch } as Prisma.InputJsonObject;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sameStringSet(expected: string[], actual: Array<string | null>) {
  const actualSet = new Set(actual.filter((value): value is string => Boolean(value)));
  return expected.length === actualSet.size && expected.every((value) => actualSet.has(value));
}

function sameNormalizedSet(expected: string[], actual: Array<string | null>) {
  const actualSet = new Set(actual.map((value) => value?.trim().toLowerCase()).filter((value): value is string => Boolean(value)));
  return expected.length === actualSet.size && expected.every((value) => actualSet.has(value.trim().toLowerCase()));
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}
