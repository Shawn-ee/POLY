import { describe, expect, test } from "vitest";
import type { Market, Outcome } from "../mocks/worldCup";
import { lineMarketsForFamily, resolveLineSelectionAvailability } from "../services/eventDetailLineAvailabilityService";

const outcome = (id: string): Outcome => ({
  id,
  label: id,
  zhLabel: id,
  probability: 50,
  color: "#22c55e",
});

const market = (id: string, marketType: Market["marketType"], line: string, period: Market["period"]): Market => ({
  id,
  title: id,
  zhTitle: id,
  type: "live",
  marketType,
  line,
  period,
  outcomes: [outcome(`${id}-yes`), outcome(`${id}-no`)],
});

describe("event detail line availability service", () => {
  test("derives route-backed line options from backend markets instead of static defaults", () => {
    const markets = [
      market("spread-25-2h", "spread", "-2.5", "second-half"),
      market("spread-35-2h", "spread", "-3.5", "second-half"),
    ];

    const availability = resolveLineSelectionAvailability({
      markets,
      family: "spread",
      selectedLine: "1.5",
      selectedPeriod: "Reg. Time",
      fallbackLineOptions: ["0.5", "1.5", "2.5"],
      fallbackPeriodOptions: ["Reg. Time", "1st Half", "2nd Half"],
      routeBacked: true,
    });

    expect(availability).toMatchObject({
      backendMarket: { id: "spread-25-2h" },
      lineOptions: ["2.5", "3.5"],
      periodOptions: ["2nd Half"],
      selectedLine: "2.5",
      selectedPeriod: "2nd Half",
    });
  });

  test("narrows periods to those available for the selected line", () => {
    const markets = [
      market("totals-25-rt", "totals", "2.5", "regulation"),
      market("totals-25-1h", "totals", "2.5", "first-half"),
      market("totals-35-2h", "totals", "3.5", "second-half"),
    ];

    const availability = resolveLineSelectionAvailability({
      markets,
      family: "totals",
      selectedLine: "3.5",
      selectedPeriod: "Reg. Time",
      fallbackLineOptions: ["1.5", "2.5", "3.5"],
      fallbackPeriodOptions: ["Reg. Time", "1st Half", "2nd Half"],
      routeBacked: true,
    });

    expect(availability.backendMarket?.id).toBe("totals-35-2h");
    expect(availability.lineOptions).toEqual(["2.5", "3.5"]);
    expect(availability.periodOptions).toEqual(["2nd Half"]);
    expect(availability.selectedPeriod).toBe("2nd Half");
  });

  test("keeps local fallback options for non route-backed Event Detail", () => {
    const availability = resolveLineSelectionAvailability({
      markets: [],
      family: "team-total",
      selectedLine: "1.5",
      selectedPeriod: "Reg. Time",
      fallbackLineOptions: ["1.5"],
      fallbackPeriodOptions: ["Reg. Time"],
      routeBacked: false,
    });

    expect(availability).toMatchObject({
      backendMarket: undefined,
      lineOptions: ["1.5"],
      periodOptions: ["Reg. Time"],
      selectedLine: "1.5",
      selectedPeriod: "Reg. Time",
    });
  });

  test("recognizes backend market family aliases from selection metadata", () => {
    const markets = [
      {
        ...market("team-total-selection", undefined, "1.5", "second-half"),
        selection: {
          marketType: "team_total_goals",
          marketFamily: "team_total",
          displayLabel: "Home team total second-half 1.5",
          line: "1.5",
          period: "second-half",
        },
      },
    ];

    expect(lineMarketsForFamily(markets, "team-total").map((item) => item.id)).toEqual(["team-total-selection"]);
  });
});
