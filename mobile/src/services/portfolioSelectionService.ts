import type { TicketSelection } from "../components/TradeTicket";

type BackendPortfolioSelection = {
  marketId?: unknown;
  outcomeId?: unknown;
  marketGroupId?: unknown;
  marketType?: unknown;
  line?: unknown;
  period?: unknown;
  side?: unknown;
  displayLabel?: unknown;
  contractSide?: unknown;
  referenceSource?: unknown;
  externalSlug?: unknown;
  externalMarketId?: unknown;
  conditionId?: unknown;
  referenceTokenId?: unknown;
  referenceOutcomeLabel?: unknown;
  limitPrice?: unknown;
  limitSide?: unknown;
  limitShares?: unknown;
};

const knownMarketTypes: TicketSelection["marketType"][] = ["spread", "totals", "team-total", "winner", "prop", "future", "live"];

const optionalString = (value: unknown, field: string) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`Portfolio selection response had invalid ${field}.`);
  }
  return value;
};

const optionalNonNegativeFiniteNumber = (value: unknown, field: string) => {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Portfolio selection response had invalid ${field}.`);
  }
  return value;
};

const isRecord = (value: unknown): value is BackendPortfolioSelection =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const portfolioSelectionFromBackend = (
  selection: BackendPortfolioSelection | null | undefined,
  fieldPrefix = "selection",
): TicketSelection | undefined => {
  if (selection === null || selection === undefined) return undefined;
  if (!isRecord(selection)) {
    throw new Error(`Portfolio selection response had invalid ${fieldPrefix}.`);
  }
  if (typeof selection.displayLabel !== "string" || selection.displayLabel.trim().length === 0) {
    throw new Error(`Portfolio selection response had invalid ${fieldPrefix}.displayLabel.`);
  }
  if (!knownMarketTypes.includes(selection.marketType as TicketSelection["marketType"])) {
    throw new Error(`Portfolio selection response had invalid ${fieldPrefix}.marketType.`);
  }
  if (selection.contractSide !== undefined && selection.contractSide !== "yes" && selection.contractSide !== "no") {
    throw new Error(`Portfolio selection response had invalid ${fieldPrefix}.contractSide.`);
  }
  if (selection.limitSide !== undefined && selection.limitSide !== "bid" && selection.limitSide !== "ask") {
    throw new Error(`Portfolio selection response had invalid ${fieldPrefix}.limitSide.`);
  }

  return {
    marketType: selection.marketType as TicketSelection["marketType"],
    marketId: optionalString(selection.marketId, `${fieldPrefix}.marketId`),
    outcomeId: optionalString(selection.outcomeId, `${fieldPrefix}.outcomeId`),
    marketGroupId: optionalString(selection.marketGroupId, `${fieldPrefix}.marketGroupId`),
    line: optionalString(selection.line, `${fieldPrefix}.line`),
    period: optionalString(selection.period, `${fieldPrefix}.period`),
    side: optionalString(selection.side, `${fieldPrefix}.side`),
    displayLabel: selection.displayLabel,
    contractSide: selection.contractSide as TicketSelection["contractSide"],
    referenceSource: optionalString(selection.referenceSource, `${fieldPrefix}.referenceSource`),
    externalSlug: optionalString(selection.externalSlug, `${fieldPrefix}.externalSlug`),
    externalMarketId: optionalString(selection.externalMarketId, `${fieldPrefix}.externalMarketId`),
    conditionId: optionalString(selection.conditionId, `${fieldPrefix}.conditionId`),
    referenceTokenId: optionalString(selection.referenceTokenId, `${fieldPrefix}.referenceTokenId`),
    referenceOutcomeLabel: optionalString(selection.referenceOutcomeLabel, `${fieldPrefix}.referenceOutcomeLabel`),
    limitPrice: optionalNonNegativeFiniteNumber(selection.limitPrice, `${fieldPrefix}.limitPrice`),
    limitSide: selection.limitSide as TicketSelection["limitSide"],
    limitShares: optionalNonNegativeFiniteNumber(selection.limitShares, `${fieldPrefix}.limitShares`),
  };
};
