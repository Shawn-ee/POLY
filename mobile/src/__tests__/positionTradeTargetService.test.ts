import { describe, expect, test } from "vitest";
import type { Position } from "../components/Portfolio";
import { worldCupEvents, worldCupFutures } from "../mocks/worldCup";
import { marketOrderBlockReason } from "../services/orderService";
import { resolvePositionTradeTarget } from "../services/positionTradeTargetService";

const futurePosition: Position = {
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares: 500,
};

describe("position trade target service", () => {
  test("resolves a futures position by market and outcome id", () => {
    const target = resolvePositionTradeTarget({
      position: futurePosition,
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target).toMatchObject({
      market: { id: "world-cup-winner" },
      outcome: { id: "france", label: "France" },
    });
    expect(target?.event).toBeUndefined();
  });

  test("carries server position quote depth into the trade target", () => {
    const target = resolvePositionTradeTarget({
      position: {
        ...futurePosition,
        currentPrice: 0.51,
        bestBid: 47,
        bestAsk: 50,
        bestBidSize: 1000,
        bestAskSize: 2500,
      },
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target?.outcome).toMatchObject({
      probability: 51,
      bestBid: 47,
      bestAsk: 50,
      bestBidSize: 1000,
      bestAskSize: 2500,
    });
  });

  test("resolves an event-market position by title and outcome label fallback", () => {
    const target = resolvePositionTradeTarget({
      position: {
        ...futurePosition,
        marketId: undefined,
        outcomeId: undefined,
        title: "Match winner",
        outcome: "Mexico",
      },
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target).toMatchObject({
      event: { id: "mexico-ecuador" },
      market: { id: "mexico-ecuador-winner" },
      outcome: { id: "mexico" },
    });
  });

  test("builds a fallback server ticket target when the backend market is not loaded locally", () => {
    const target = resolvePositionTradeTarget({
      position: {
        ...futurePosition,
        marketId: "backend-proof-market",
        outcomeId: "backend-proof-yes",
        title: "World Cup backend proof",
        outcome: "YES",
        currentPrice: 0.485,
        bestBid: 47,
        bestAsk: 50,
        bestBidSize: 1000,
        bestAskSize: 2500,
      },
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target).toMatchObject({
      market: {
        id: "backend-proof-market",
        title: "World Cup backend proof",
        type: "future",
      },
      outcome: {
        id: "backend-proof-yes",
        label: "YES",
        probability: 49,
        bestBid: 47,
        bestAsk: 50,
        bestBidSize: 1000,
        bestAskSize: 2500,
      },
    });
  });

  test("carries backend market availability into fallback server ticket targets", () => {
    const target = resolvePositionTradeTarget({
      position: {
        ...futurePosition,
        marketId: "closed-backend-market",
        outcomeId: "closed-backend-outcome",
        title: "Closed backend proof",
        outcome: "YES",
        marketAvailability: {
          source: "portfolio-market-status",
          status: "unavailable",
          marketStatus: "CLOSED",
          lastUpdated: null,
          stalenessSeconds: null,
          staleAfterSeconds: 60,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "Market is not accepting orders.",
        },
      },
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target?.market.availability).toMatchObject({
      source: "portfolio-market-status",
      status: "unavailable",
      marketStatus: "CLOSED",
    });
    expect(marketOrderBlockReason(target!.market)).toBe("Market is not accepting orders.");
  });

  test("returns undefined when no matching market exists and backend identifiers are missing", () => {
    expect(
      resolvePositionTradeTarget({
        position: { ...futurePosition, marketId: undefined, outcomeId: undefined, title: "Missing", outcome: "Nobody" },
        futures: worldCupFutures,
        events: worldCupEvents,
      }),
    ).toBeUndefined();
  });
});
