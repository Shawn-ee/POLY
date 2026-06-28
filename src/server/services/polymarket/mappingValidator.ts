import { collectPolymarketDuplicateKeys, normalizeDuplicateKey } from "@/server/services/polymarket/parser";
import { PolymarketImportCandidate, PolymarketMarketType } from "@/server/services/polymarket/types";

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
