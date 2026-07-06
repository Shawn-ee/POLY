import { describe, expect, test } from "vitest";
import { resolveLineTicketTarget, ticketSelectionFromBackendMarket } from "../services/eventDetailLineTicketService";
import type { Market, Outcome } from "../mocks/worldCup";

const outcome = (id: string, label = id): Outcome => ({
  id,
  label,
  zhLabel: label,
  probability: 54,
  color: "#22c55e",
});

const market = (id: string, marketType: Market["marketType"], outcomes: Outcome[], overrides: Partial<Market> = {}): Market => ({
  id,
  title: id,
  zhTitle: id,
  type: "live",
  marketType,
  period: "regulation",
  line: marketType === "spread" ? "-0.5" : "2.5",
  referenceSource: "polymarket",
  externalMarketId: `gamma-${id}`,
  conditionId: `condition-${id}`,
  outcomes,
  ...overrides,
});

describe("event detail line ticket resolver", () => {
  test("prefers backend-shaped line market and outcome for selected spread tickets", () => {
    const backendOutcome = outcome("token-yes", "Yes");
    const backendMarket = market("aus-egy-live-spread", "spread", [backendOutcome]);
    const syntheticOutcome = outcome("display-spread-yes", "AUS -0.5 RT");
    const syntheticMarket = market("display-spread-market", "spread", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "spread", line: "0.5", period: "Reg. Time", displayLabel: "AUS -0.5 RT" },
      backendMarket,
      backendOutcome,
      syntheticOutcome,
      syntheticMarkets: { spread: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "backend-line-market",
      market: {
        id: "aus-egy-live-spread",
        referenceSource: "polymarket",
        externalMarketId: "gamma-aus-egy-live-spread",
        conditionId: "condition-aus-egy-live-spread",
      },
      outcome: { id: "token-yes" },
    });
  });

  test("falls back to deterministic synthetic line fixture when backend line data is unavailable", () => {
    const syntheticOutcome = outcome("display-totals-over", "Over 3.5 2H");
    const syntheticMarket = market("display-totals-market", "totals", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "deterministic-line-fixture",
      market: { id: "display-totals-market" },
      outcome: { id: "display-totals-over" },
    });
  });

  test("does not carry a same-type backend market when the selected line differs", () => {
    const backendOutcome = outcome("backend-over", "Over 2.5");
    const backendMarket = market("backend-totals-25", "totals", [backendOutcome]);
    const syntheticOutcome = outcome("display-over-35", "Over 3.5 2H");
    const syntheticMarket = market("display-totals-35", "totals", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
      backendMarket,
      backendOutcome,
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "deterministic-line-fixture",
      market: { id: "display-totals-35" },
      outcome: { id: "display-over-35" },
    });
  });

  test("does not invent a synthetic line ticket for route-backed mismatched backend lines", () => {
    const backendOutcome = outcome("backend-over", "Over 2.5");
    const backendMarket = market("backend-totals-25", "totals", [backendOutcome]);
    const syntheticOutcome = outcome("display-over-35", "Over 3.5 2H");
    const syntheticMarket = market("display-totals-35", "totals", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
      backendMarket,
      backendOutcome,
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
      routeBacked: true,
    });

    expect(target).toBeNull();
  });

  test("does not use a route-backed backend outcome that is missing from the backend market", () => {
    const actualOutcome = outcome("backend-over-25", "Over 2.5");
    const staleOutcome = outcome("stale-over-35", "Over 3.5");
    const backendMarket = market("backend-totals-25", "totals", [actualOutcome]);
    const syntheticOutcome = outcome("display-over-25", "Over 2.5 RT");
    const syntheticMarket = market("display-totals-25", "totals", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
      backendMarket,
      backendOutcome: staleOutcome,
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
      routeBacked: true,
    });

    expect(target).toBeNull();
  });

  test("falls back to deterministic fixture when a non-route backend outcome is missing from the backend market", () => {
    const actualOutcome = outcome("backend-over-25", "Over 2.5");
    const staleOutcome = outcome("stale-over-35", "Over 3.5");
    const backendMarket = market("backend-totals-25", "totals", [actualOutcome]);
    const syntheticOutcome = outcome("display-over-25", "Over 2.5 RT");
    const syntheticMarket = market("display-totals-25", "totals", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
      backendMarket,
      backendOutcome: staleOutcome,
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "deterministic-line-fixture",
      market: { id: "display-totals-25" },
      outcome: { id: "display-over-25" },
    });
  });

  test("does not invent a synthetic line ticket for route-backed missing backend lines", () => {
    const syntheticOutcome = outcome("display-team-total-over", "MEX Over 1.5");
    const syntheticMarket = market("display-team-total-market", "team-total", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "team-total", line: "1.5", period: "Reg. Time", displayLabel: "MEX Over 1.5 RT" },
      syntheticOutcome,
      syntheticMarkets: { teamTotal: syntheticMarket },
      routeBacked: true,
    });

    expect(target).toBeNull();
  });

  test("does not carry a same-line backend market when the selected period differs", () => {
    const backendOutcome = outcome("backend-over", "Over 3.5 1H");
    const backendMarket = market("backend-totals-35-1h", "totals", [backendOutcome], { line: "3.5", period: "first-half" });
    const syntheticOutcome = outcome("display-over-35-2h", "Over 3.5 2H");
    const syntheticMarket = market("display-totals-35-2h", "totals", [syntheticOutcome], { line: "3.5", period: "second-half" });

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
      backendMarket,
      backendOutcome,
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "deterministic-line-fixture",
      market: { id: "display-totals-35-2h" },
      outcome: { id: "display-over-35-2h" },
    });
  });

  test("treats full-game backend lines as regulation-time retail selections", () => {
    const backendOutcome = outcome("backend-over", "Over 2.5");
    const backendMarket = market("backend-totals-25-full-game", "totals", [backendOutcome], { line: "2.5", period: "full-game" });
    const syntheticOutcome = outcome("display-over-25", "Over 2.5 RT");
    const syntheticMarket = market("display-totals-25", "totals", [syntheticOutcome], { line: "2.5", period: "regulation" });

    const target = resolveLineTicketTarget({
      selection: { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
      backendMarket,
      backendOutcome,
      syntheticOutcome,
      syntheticMarkets: { totals: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "backend-line-market",
      market: { id: "backend-totals-25-full-game" },
      outcome: { id: "backend-over" },
    });
  });

  test("falls back to deterministic team-total fixture when backend team total is unavailable", () => {
    const syntheticOutcome = outcome("display-team-total-over", "MEX Over 1.5");
    const syntheticMarket = market("display-team-total-market", "team-total", [syntheticOutcome]);

    const target = resolveLineTicketTarget({
      selection: { marketType: "team-total", line: "1.5", period: "Reg. Time", displayLabel: "MEX Over 1.5 RT" },
      syntheticOutcome,
      syntheticMarkets: { teamTotal: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "deterministic-line-fixture",
      market: { id: "display-team-total-market", marketType: "team-total" },
      outcome: { id: "display-team-total-over" },
    });
  });

  test("does not use a second-half backend team total for a regulation-time team total ticket", () => {
    const backendOutcome = outcome("backend-team-over", "MEX Over 1.5 2H");
    const backendMarket = market("backend-team-total-15-2h", "team-total", [backendOutcome], { line: "1.5", period: "second-half" });
    const syntheticOutcome = outcome("display-team-total-over", "MEX Over 1.5 RT");
    const syntheticMarket = market("display-team-total-market", "team-total", [syntheticOutcome], { line: "1.5", period: "regulation" });

    const target = resolveLineTicketTarget({
      selection: { marketType: "team-total", line: "1.5", period: "Reg. Time", displayLabel: "MEX Over 1.5 RT" },
      backendMarket,
      backendOutcome,
      syntheticOutcome,
      syntheticMarkets: { teamTotal: syntheticMarket },
    });

    expect(target).toMatchObject({
      source: "deterministic-line-fixture",
      market: { id: "display-team-total-market" },
      outcome: { id: "display-team-total-over" },
    });
  });

  test("builds ticket selection identity from backend market selection contract", () => {
    const backendOutcome = outcome("backend-over", "Over 2.5");
    const backendMarket = market("total-25-1h", "totals", [backendOutcome], {
      period: "first-half",
      line: "2.5",
      externalMarketId: "gamma-total-25-1h",
      conditionId: "condition-total-25-1h",
      selection: {
        selectorKey: "totals:first-half:2.5",
        marketId: "total-25-1h",
        marketGroupId: "totals",
        marketGroupKey: "totals",
        marketGroupTitle: "Totals",
        marketType: "total_goals",
        marketFamily: "total",
        displayLabel: "Totals first-half 2.5",
        period: "first-half",
        line: "2.5",
        lineValue: 2.5,
        unit: "goals",
        outcomes: [{
          id: "backend-over",
          outcomeId: "backend-over",
          side: "over",
          label: "Over 2.5",
          tokenId: "token-over-25-1h",
          referenceTokenId: "token-over-25-1h",
          referenceOutcomeLabel: "Over 2.5 first half",
          isTradable: true,
        }],
      },
    });

    const selection = ticketSelectionFromBackendMarket(
      { marketType: "totals", line: "2.5", period: "1st Half", displayLabel: "Over 2.5 1H" },
      backendMarket,
      backendOutcome,
    );

    expect(selection).toMatchObject({
      marketType: "totals",
      marketId: "total-25-1h",
      outcomeId: "backend-over",
      marketGroupId: "totals",
      line: "2.5",
      period: "first-half",
      side: "over",
      displayLabel: "Over 2.5 1H",
      externalMarketId: "gamma-total-25-1h",
      conditionId: "condition-total-25-1h",
      referenceTokenId: "token-over-25-1h",
      referenceOutcomeLabel: "Over 2.5 first half",
    });

    const target = resolveLineTicketTarget({
      selection,
      backendMarket,
      backendOutcome,
      syntheticOutcome: outcome("display-over-25-1h", "Over 2.5 1H"),
      syntheticMarkets: { totals: market("display-totals-25-1h", "totals", [], { line: "2.5", period: "first-half" }) },
    });

    expect(target).toMatchObject({
      source: "backend-line-market",
      market: { id: "total-25-1h" },
      outcome: { id: "backend-over" },
    });
  });

  test("does not build backend ticket selection from an outcome outside the backend market", () => {
    const backendOutcome = outcome("backend-over", "Over 2.5");
    const staleOutcome = outcome("stale-under", "Under 2.5");
    const backendMarket = market("total-25-1h", "totals", [backendOutcome], {
      period: "first-half",
      line: "2.5",
      selection: {
        selectorKey: "totals:first-half:2.5",
        marketId: "total-25-1h",
        marketGroupId: "totals",
        marketType: "total_goals",
        marketFamily: "total",
        displayLabel: "Totals first-half 2.5",
        period: "first-half",
        line: "2.5",
        outcomes: [{
          id: "backend-over",
          outcomeId: "backend-over",
          side: "over",
          label: "Over 2.5",
          tokenId: "token-over-25-1h",
          referenceTokenId: "token-over-25-1h",
          isTradable: true,
        }],
      },
    });

    const selection = ticketSelectionFromBackendMarket(
      { marketType: "totals", line: "2.5", period: "1st Half", displayLabel: "Over 2.5 1H" },
      backendMarket,
      staleOutcome,
    );

    expect(selection).toEqual({
      marketType: "totals",
      line: "2.5",
      period: "1st Half",
      displayLabel: "Over 2.5 1H",
    });
  });
});
