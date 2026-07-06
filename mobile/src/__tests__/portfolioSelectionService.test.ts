import { describe, expect, test } from "vitest";
import { portfolioSelectionFromBackend } from "../services/portfolioSelectionService";

const validSelection = {
  marketId: "mexico-ecuador-spread",
  outcomeId: "spread-yes",
  marketGroupId: "live-game-lines",
  marketType: "spread",
  line: "2.5",
  period: "1st Half",
  side: "home",
  displayLabel: "MEX -2.5 1H",
  contractSide: "no",
  referenceSource: "polymarket",
  externalSlug: "mexico-ecuador-spread",
  externalMarketId: "gamma-spread",
  conditionId: "condition-spread",
  referenceTokenId: "token-spread-yes",
  referenceOutcomeLabel: "Mexico -2.5",
  limitPrice: 0.31,
  limitSide: "bid",
  limitShares: 80,
};

describe("portfolio selection route shape contract", () => {
  test("preserves valid backend line-market selection identity", () => {
    expect(portfolioSelectionFromBackend(validSelection, "positions[].selection")).toEqual(validSelection);
  });

  test("allows legacy rows without a backend selection object", () => {
    expect(portfolioSelectionFromBackend(null, "positions[].selection")).toBeUndefined();
    expect(portfolioSelectionFromBackend(undefined, "positions[].selection")).toBeUndefined();
  });

  test("rejects selection objects without a display label", () => {
    expect(() => portfolioSelectionFromBackend({ ...validSelection, displayLabel: "" }, "positions[].selection")).toThrow(
      "Portfolio selection response had invalid positions[].selection.displayLabel.",
    );
  });

  test("rejects unknown market types instead of coercing them to prop", () => {
    expect(() => portfolioSelectionFromBackend({ ...validSelection, marketType: "mystery" }, "positions[].selection")).toThrow(
      "Portfolio selection response had invalid positions[].selection.marketType.",
    );
  });

  test("rejects malformed contract side and limit fields", () => {
    expect(() => portfolioSelectionFromBackend({ ...validSelection, contractSide: "maybe" }, "openOrders[].selection")).toThrow(
      "Portfolio selection response had invalid openOrders[].selection.contractSide.",
    );
    expect(() => portfolioSelectionFromBackend({ ...validSelection, limitSide: "middle" }, "openOrders[].selection")).toThrow(
      "Portfolio selection response had invalid openOrders[].selection.limitSide.",
    );
    expect(() => portfolioSelectionFromBackend({ ...validSelection, limitPrice: -0.01 }, "openOrders[].selection")).toThrow(
      "Portfolio selection response had invalid openOrders[].selection.limitPrice.",
    );
    expect(() => portfolioSelectionFromBackend({ ...validSelection, limitShares: Number.NaN }, "openOrders[].selection")).toThrow(
      "Portfolio selection response had invalid openOrders[].selection.limitShares.",
    );
  });

  test("uses a custom route error prefix when provided", () => {
    expect(() => portfolioSelectionFromBackend({ ...validSelection, limitPrice: -0.01 }, "order.selection", "Order submit selection response")).toThrow(
      "Order submit selection response had invalid order.selection.limitPrice.",
    );
  });
});
