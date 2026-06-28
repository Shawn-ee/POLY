import { buildReferenceQuotes } from "@/server/services/referenceQuoteEngine";
import { ReferenceQuoteMarketType } from "@/server/services/referenceQuoteEngine";
import {
  planReferenceMarketMakerIntents,
  ReferenceMarketMakerPlan,
} from "@/server/services/referenceMarketMaker";
import { buildReferenceSnapshotInputsForMarket, readFixtureGammaMarketFromMetadata } from "@/server/services/polymarketReferenceSnapshots";
import { buildDraftImportRequestFromCandidate } from "@/server/services/polymarket/draftImport";
import { validatePolymarketCandidateMapping } from "@/server/services/polymarket/mappingValidator";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

export type PromotionGuardrailDecision = {
  candidateId: string;
  externalMarketId: string;
  eligible: boolean;
  recommendedLifecycleState: "draft" | "mapped" | "validated" | "enabled";
  reasonCodes: string[];
  checks: {
    mappingValidation: boolean;
    referenceSync: boolean;
    twoTickPricing: boolean;
    publicNoLeak: boolean;
    marketMakerDryRun: boolean;
  };
};

export type ImportedCandidateMarketMakerDryRunOptions = {
  mappingEnabled?: boolean;
  fetchedAt?: string;
  now?: number;
  maxOrderSize?: number;
  maxOutcomeExposure?: number;
  maxMarketExposure?: number;
  staleAfterSeconds?: number;
};

export type ImportedCandidateMarketMakerDryRun = {
  plan: ReferenceMarketMakerPlan;
  skippedReason: string | null;
  referenceSync: boolean;
};

export function evaluatePromotionGuardrails(candidate: PolymarketImportCandidate): PromotionGuardrailDecision {
  const reasonCodes = new Set<string>();
  const validation = validatePolymarketCandidateMapping(candidate);
  const mappingValidation = validation.eligibleForAutoPromotion;
  if (!mappingValidation) {
    reasonCodes.add(`mapping_${validation.status}`);
    for (const reason of validation.reasonCodes) reasonCodes.add(reason);
  }

  const draftRequest = buildDraftImportRequestFromCandidate(candidate);
  const gamma = readFixtureGammaMarketFromMetadata(draftRequest.market.referenceMetadata);
  const outcomes = draftRequest.market.outcomes.map((outcome, index) => ({
    id: `outcome-${index + 1}`,
    name: outcome.name,
    referenceTokenId: outcome.referenceTokenId ?? null,
    referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
  }));
  const referenceInputs = gamma
    ? buildReferenceSnapshotInputsForMarket(
        {
          id: "market-1",
          title: draftRequest.market.title,
          externalSlug: draftRequest.market.externalSlug ?? null,
          externalMarketId: draftRequest.market.externalMarketId ?? null,
          conditionId: draftRequest.market.conditionId ?? null,
          referenceMetadata: draftRequest.market.referenceMetadata,
          outcomes,
        },
        gamma,
        new Date().toISOString(),
      )
    : [];

  const referenceSync =
    referenceInputs.length === outcomes.length &&
    referenceInputs.length > 0 &&
    referenceInputs.every((input) => input.qualityStatus === "high_quality" && input.mmEligible && input.tokenId);
  if (!referenceSync) reasonCodes.add("reference_sync_failed");

  const quoteMarketType = toReferenceQuoteMarketType(candidate.market.marketType);
  const quoteResult = buildReferenceQuotes({
    marketType: quoteMarketType,
    outcomes: referenceInputs.map((input) => ({
      outcomeId: input.outcomeId,
      outcomeName: input.outcomeLabel ?? input.outcomeId,
      referenceBid: input.bestBid,
      referenceAsk: input.bestAsk,
      referenceMid: input.outcomePrice,
      missing: !input.tokenId,
    })),
  });
  const twoTickPricing = quoteResult.shouldQuote;
  if (!twoTickPricing) reasonCodes.add(quoteResult.reason ?? "two_tick_pricing_failed");

  const publicNoLeak =
    draftRequest.market.visibility === "PRIVATE" &&
    draftRequest.market.desiredStatus === "draft" &&
    draftRequest.market.outcomes.every((outcome) => outcome.isTradable === false);
  if (!publicNoLeak) reasonCodes.add("public_no_leak_failed");

  const mmDryRun = planImportedCandidateMarketMakerDryRun(candidate);
  const mmPlan = mmDryRun.plan;
  if (mmDryRun.skippedReason) {
    reasonCodes.add(mmDryRun.skippedReason);
  }
  const marketMakerDryRun = mmPlan.intents.length > 0 && mmPlan.skipped.length === 0;
  if (!marketMakerDryRun) reasonCodes.add(mmPlan.skipped[0]?.reason ?? mmDryRun.skippedReason ?? "market_maker_dry_run_failed");

  const checks = {
    mappingValidation,
    referenceSync,
    twoTickPricing,
    publicNoLeak,
    marketMakerDryRun,
  };
  const eligible = Object.values(checks).every(Boolean);

  return {
    candidateId: candidate.candidateId,
    externalMarketId: candidate.market.externalMarketId,
    eligible,
    recommendedLifecycleState: eligible ? "enabled" : validation.recommendedLifecycleState,
    reasonCodes: Array.from(reasonCodes).sort(),
    checks,
  };
}

export function planImportedCandidateMarketMakerDryRun(
  candidate: PolymarketImportCandidate,
  options: ImportedCandidateMarketMakerDryRunOptions = {},
): ImportedCandidateMarketMakerDryRun {
  const validation = validatePolymarketCandidateMapping(candidate);
  if (!validation.eligibleForAutoPromotion) {
    const skippedReason = validation.reasonCodes.includes("inactive_or_closed")
      ? "inactive_or_closed"
      : validation.reasonCodes.includes("missing_token_mapping")
        ? "missing_token_mapping"
        : `mapping_${validation.status}`;
    return {
      skippedReason,
      referenceSync: false,
      plan: {
        dryRun: true,
        intents: [],
        skipped: [{ marketId: "market-1", outcomeId: null, reason: skippedReason }],
      },
    };
  }

  const draftRequest = buildDraftImportRequestFromCandidate(candidate);
  const gamma = readFixtureGammaMarketFromMetadata(draftRequest.market.referenceMetadata);
  const outcomes = draftRequest.market.outcomes.map((outcome, index) => ({
    id: `outcome-${index + 1}`,
    name: outcome.name,
    referenceTokenId: outcome.referenceTokenId ?? null,
    referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
  }));
  const referenceInputs = gamma
    ? buildReferenceSnapshotInputsForMarket(
        {
          id: "market-1",
          title: draftRequest.market.title,
          externalSlug: draftRequest.market.externalSlug ?? null,
          externalMarketId: draftRequest.market.externalMarketId ?? null,
          conditionId: draftRequest.market.conditionId ?? null,
          referenceMetadata: draftRequest.market.referenceMetadata,
          outcomes,
        },
        gamma,
        options.fetchedAt ?? new Date(options.now ?? Date.now()).toISOString(),
      )
    : [];
  const referenceSync =
    referenceInputs.length === outcomes.length &&
    referenceInputs.length > 0 &&
    referenceInputs.every((input) => input.qualityStatus === "high_quality" && input.mmEligible && input.tokenId);

  if (!referenceSync) {
    return {
      skippedReason: "reference_sync_failed",
      referenceSync,
      plan: {
        dryRun: true,
        intents: [],
        skipped: [{ marketId: "market-1", outcomeId: null, reason: "reference_sync_failed" }],
      },
    };
  }

  const quoteMarketType = toReferenceQuoteMarketType(candidate.market.marketType);
  const plan = planReferenceMarketMakerIntents({
    dryRun: true,
    now: options.now ?? Date.now(),
    configs: [
      {
        id: "fixture-config",
        marketId: "market-1",
        outcomeId: null,
        enabled: true,
        dryRun: true,
        source: "polymarket",
        edgeTicks: 2,
        tickSize: 0.01,
        baseOrderSize: 1,
        maxOrderSize: options.maxOrderSize ?? 1,
        maxOutcomeExposure: options.maxOutcomeExposure ?? 2,
        maxMarketExposure: options.maxMarketExposure ?? 10,
        maxDailyNotional: 10,
        staleAfterSeconds: options.staleAfterSeconds ?? 15,
        minQuoteLifetimeSeconds: 1,
      },
    ],
    references: referenceInputs.map((input) => ({
      marketId: input.marketId,
      outcomeId: input.outcomeId,
      outcomeName: input.outcomeLabel ?? input.outcomeId,
      marketType: quoteMarketType,
      referenceBid: input.bestBid,
      referenceAsk: input.bestAsk,
      referenceMid: input.outcomePrice,
      fetchedAt: input.fetchedAt,
      mappingEnabled: options.mappingEnabled ?? true,
    })),
  });

  return {
    plan,
    referenceSync,
    skippedReason: plan.skipped[0]?.reason ?? null,
  };
}

function toReferenceQuoteMarketType(marketType: string): ReferenceQuoteMarketType {
  switch (marketType) {
    case "yes_no":
    case "match_winner_1x2":
    case "total_goals":
    case "both_teams_to_score":
    case "team_to_qualify":
      return marketType;
    default:
      return "unknown";
  }
}
