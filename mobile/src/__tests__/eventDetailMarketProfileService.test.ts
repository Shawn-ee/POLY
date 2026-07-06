import { describe, expect, test } from "vitest";
import type { Event, Market, Outcome } from "../mocks/worldCup";
import { canRenderEventDetailLineFamily, selectEventDetailPrimaryMarket, selectEventDetailRegulationMarket } from "../services/eventDetailMarketProfileService";

const outcome = (id: string, side: Outcome["side"], label = id): Outcome => ({
  id,
  label,
  zhLabel: label,
  probability: side === "draw" ? 28 : 36,
  side,
  color: side === "away" ? "#ef4444" : side === "draw" ? "#38bdf8" : "#22c55e",
});

const market = (input: Partial<Market> & Pick<Market, "id" | "title" | "outcomes">): Market => ({
  zhTitle: input.title,
  type: "game-line",
  ...input,
});

const baseEvent: Event = {
  id: "mixed-event",
  backendSlug: "mixed-event",
  title: "Mixed Home vs Away",
  zhTitle: "Mixed Home vs Away",
  league: "World Cup",
  startsAt: "Live",
  status: "live",
  tag: "Live",
  zhTag: "Live",
  teams: [],
  markets: [],
};

describe("event detail market profile service", () => {
  test("uses advance market for mixed knockout primary and regulation market for Game Lines", () => {
    const regulation = market({
      id: "regulation-market",
      title: "Regulation Time Winner",
      marketType: "moneyline",
      marketGroupId: "regulation_90",
      period: "regulation",
      outcomes: [outcome("home", "home", "Home"), outcome("draw", "draw", "Tie"), outcome("away", "away", "Away")],
    });
    const advance = market({
      id: "advance-market",
      title: "Who Advances",
      marketType: "to_advance",
      marketGroupId: "to_advance",
      outcomes: [outcome("home-advance", "home", "Home advances"), outcome("away-advance", "away", "Away advances")],
    });
    const event: Event = {
      ...baseEvent,
      marketProfile: "full_match_with_overtime",
      resultMode: "can_draw",
      gameRules: { allowDraw: true, includesOvertime: true, description: "Advance plus regulation." },
      supportedMarketTypes: ["full_match_with_overtime", "to_advance", "regulation_90"],
      markets: [regulation, advance],
    };

    expect(selectEventDetailPrimaryMarket(event, event.markets)?.id).toBe("advance-market");
    expect(selectEventDetailRegulationMarket(event, event.markets)?.id).toBe("regulation-market");
  });

  test("does not treat pure advance market as a regulation Game Lines row", () => {
    const advance = market({
      id: "advance-market",
      title: "Who Advances",
      marketType: "to_advance",
      marketGroupId: "to_advance",
      outcomes: [outcome("home-advance", "home", "Home advances"), outcome("away-advance", "away", "Away advances")],
    });
    const event: Event = {
      ...baseEvent,
      marketProfile: "to_advance",
      resultMode: "no_draw",
      gameRules: { allowDraw: false, includesOvertime: true, description: "Advance only." },
      supportedMarketTypes: ["to_advance"],
      markets: [advance],
    };

    expect(selectEventDetailPrimaryMarket(event, event.markets)?.id).toBe("advance-market");
    expect(selectEventDetailRegulationMarket(event, event.markets)).toBeUndefined();
  });

  test("requires backend market before rendering route-backed line families", () => {
    const spread = market({
      id: "spread-market",
      title: "Spread",
      marketType: "spread",
      marketGroupId: "spread",
      line: "1.5",
      period: "regulation",
      outcomes: [outcome("yes", "yes", "Yes"), outcome("no", "no", "No")],
    });

    expect(canRenderEventDetailLineFamily({ backendSlug: "route-event" }, undefined)).toBe(false);
    expect(canRenderEventDetailLineFamily({ backendSlug: "route-event" }, spread)).toBe(true);
    expect(canRenderEventDetailLineFamily({}, undefined)).toBe(true);
  });
});
