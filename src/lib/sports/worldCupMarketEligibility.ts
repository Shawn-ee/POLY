import type {
  WorldCupEventPageStatus,
  WorldCupMarketInput,
  WorldCupOutcomeInput,
} from "@/lib/sports/worldCupEventPageModel";

export type WorldCupMarketVisibility = "user_facing" | "admin_only" | "hidden";

export type WorldCupEligibilityReasonCode =
  | "valid_local_book"
  | "valid_reference_only"
  | "missing_polymarket_mapping"
  | "mapping_not_validated"
  | "draft_only"
  | "admin_review_only"
  | "stale_event"
  | "closed_event"
  | "no_fresh_reference"
  | "no_local_book"
  | "trading_disabled"
  | "unsafe_real_money_state";

export type WorldCupPriceDisplayMode = "local_book" | "reference_only" | "hidden" | "admin_debug";

export type WorldCupEligibilityResult = {
  eligible: boolean;
  visibility: WorldCupMarketVisibility;
  reasonCode: WorldCupEligibilityReasonCode;
  userFacingLabel: string;
  adminDebugLabel: string;
  tradeable: boolean;
  priceDisplayMode: WorldCupPriceDisplayMode;
};

export type WorldCupMarketEligibilityInput = {
  market: WorldCupMarketInput;
  eventStatus: WorldCupEventPageStatus;
  internalTradingEnabled?: boolean;
  tradingKillSwitch?: boolean;
  realMoneyMode?: boolean;
};

export function classifyWorldCupMarketVisibility(input: WorldCupMarketEligibilityInput): WorldCupEligibilityResult {
  const eventBlocked = classifyEventBlock(input.eventStatus);
  if (eventBlocked) return eventBlocked;

  const marketStatus = input.market.status.toUpperCase();
  if (["CLOSED", "RESOLVED", "CANCELED", "CANCELLED", "SETTLED"].includes(marketStatus)) {
    return hidden("closed_event", "Closed", "Market is closed or resolved.");
  }

  if (isDraftOnly(input.market)) {
    return hidden("draft_only", "Hidden", "Market is draft/private/admin-only.");
  }

  if (!hasPolymarketMapping(input.market)) {
    return hidden("missing_polymarket_mapping", "Hidden", "Missing approved Polymarket mapping.");
  }

  if (!hasValidatedMapping(input.market)) {
    return hidden("mapping_not_validated", "Hidden", "Polymarket mapping has not been approved.");
  }

  if (!hasFreshReference(input.market)) {
    const label = input.market.referenceSummary?.hasSnapshot ? "Stale reference" : "No reference price";
    return hidden("no_fresh_reference", label, "No fresh Polymarket reference snapshot.");
  }

  const hasLocalBook = marketHasLocalBook(input.market);
  if (!hasLocalBook) {
    return {
      eligible: true,
      visibility: "user_facing",
      reasonCode: "valid_reference_only",
      userFacingLabel: "Reference only",
      adminDebugLabel: "Fresh Polymarket reference exists but there is no local bot book.",
      tradeable: false,
      priceDisplayMode: "reference_only",
    };
  }

  if (input.realMoneyMode) {
    return visibleNonTradeable("unsafe_real_money_state", "Local book", "REAL_MONEY_MODE=true blocks closed beta trading.");
  }

  if (!input.internalTradingEnabled || input.tradingKillSwitch) {
    return visibleNonTradeable("trading_disabled", "Local book", "Closed beta internal trading is disabled.");
  }

  const hasTradeableOutcome = input.market.outcomes.some(isOutcomeTradeableWithLocalBook);
  if (!["LIVE", "ACTIVE", "OPEN"].includes(marketStatus) || !hasTradeableOutcome) {
    return visibleNonTradeable("trading_disabled", "Local book", "Local book exists but the market/outcomes are not tradeable.");
  }

  return {
    eligible: true,
    visibility: "user_facing",
    reasonCode: "valid_local_book",
    userFacingLabel: "Local book",
    adminDebugLabel: "Fresh Polymarket reference and local internal book are available.",
    tradeable: true,
    priceDisplayMode: "local_book",
  };
}

export function isWorldCupUserFacingMarketEligible(input: WorldCupMarketEligibilityInput) {
  return classifyWorldCupMarketVisibility(input).eligible;
}

export function isWorldCupUserFacingEventEligible(results: WorldCupEligibilityResult[]) {
  return results.some((result) => result.eligible && result.visibility === "user_facing");
}

export function hasPolymarketMapping(market: WorldCupMarketInput) {
  return market.referenceSource === "polymarket" && market.referenceOnly === true && market.referenceSummary?.source === "polymarket";
}

export function hasValidatedMapping(market: WorldCupMarketInput) {
  return market.importStatus === "approved" && hasPolymarketMapping(market);
}

export function hasFreshReference(market: WorldCupMarketInput) {
  const outcomeSummaries = market.outcomes
    .map((outcome) => outcome.referenceSummary)
    .filter((summary): summary is NonNullable<WorldCupOutcomeInput["referenceSummary"]> => summary != null);
  if (outcomeSummaries.length > 0) {
    return outcomeSummaries.every(hasFreshReferenceSummary);
  }

  const summary = market.referenceSummary;
  return hasFreshReferenceSummary(summary);
}

export function marketHasLocalBook(market: WorldCupMarketInput) {
  return market.outcomes.some((outcome) => outcome.bestBid != null || outcome.bestAsk != null);
}

function isDraftOnly(market: WorldCupMarketInput) {
  if (market.visibility && market.visibility !== "PUBLIC") return true;
  if (market.isListed === false) return true;
  if (market.importStatus === "pending_review" || market.importStatus === "rejected") return true;
  return false;
}

function isOutcomeTradeableWithLocalBook(outcome: WorldCupOutcomeInput) {
  const hasLocalBook = outcome.bestBid != null || outcome.bestAsk != null;
  return hasLocalBook && outcome.isTradable !== false && (!outcome.status || outcome.status.toLowerCase() === "active");
}

function hasFreshReferenceSummary(summary: WorldCupMarketInput["referenceSummary"] | null | undefined) {
  return Boolean(
    summary?.hasSnapshot &&
      summary.isFresh &&
      (summary.outcomePrice != null ||
        summary.referenceBid != null ||
        summary.referenceAsk != null ||
        summary.plannedBotBid != null ||
        summary.plannedBotAsk != null),
  );
}

function classifyEventBlock(status: WorldCupEventPageStatus): WorldCupEligibilityResult | null {
  if (status === "stale") return hidden("stale_event", "Hidden", "Event is stale.");
  if (status === "closed" || status === "settled") return hidden("closed_event", "Closed", "Event is closed or settled.");
  return null;
}

function hidden(
  reasonCode: WorldCupEligibilityReasonCode,
  userFacingLabel: string,
  adminDebugLabel: string,
): WorldCupEligibilityResult {
  return {
    eligible: false,
    visibility: "hidden",
    reasonCode,
    userFacingLabel,
    adminDebugLabel,
    tradeable: false,
    priceDisplayMode: "hidden",
  };
}

function visibleNonTradeable(
  reasonCode: WorldCupEligibilityReasonCode,
  userFacingLabel: string,
  adminDebugLabel: string,
): WorldCupEligibilityResult {
  return {
    eligible: true,
    visibility: "user_facing",
    reasonCode,
    userFacingLabel,
    adminDebugLabel,
    tradeable: false,
    priceDisplayMode: "local_book",
  };
}
