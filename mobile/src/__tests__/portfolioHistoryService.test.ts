import { describe, expect, test } from "vitest";
import { canceledOrdersToActivity, loadPortfolioHistoryActivities, portfolioHistoryToActivity, recentTradesToActivity } from "../services/portfolioHistoryService";
import type { PolyApi } from "../api";
import type { PortfolioHistoryItem } from "../types";

const historyItem = (overrides: Partial<PortfolioHistoryItem> = {}): PortfolioHistoryItem => ({
  market: {
    id: "world-cup-final",
    title: "World Cup final winner",
    status: "RESOLVED",
    resolveTime: "2026-07-19T22:30:00.000Z",
    resolvedOutcomeId: "france",
    createdAt: "2026-07-01T14:00:00.000Z",
  },
  resolvedOutcomeName: "France",
  totalBuyCostTokens: 100,
  totalSellProceedsTokens: 0,
  netInvestedTokens: 100,
  winningsTokens: 172.5,
  refundsTokens: 0,
  realizedPnLTokens: 72.5,
  ...overrides,
});

describe("portfolio history activity mapping", () => {
  test("maps resolved backend history into timestamped closed activity", () => {
    expect(portfolioHistoryToActivity([historyItem()])).toEqual([
      expect.objectContaining({
        id: "history-world-cup-final",
        action: "closed",
        title: "World Cup final winner",
        outcome: "France",
        amount: 172.5,
        entryAmount: 100,
        timestamp: "Jul 19, 5:30 PM",
      }),
    ]);
  });

  test("falls back to market creation time when resolve time is unavailable", () => {
    expect(
      portfolioHistoryToActivity([
        historyItem({
          market: {
            id: "world-cup-group",
            title: "World Cup group winner",
            status: "RESOLVED",
            resolveTime: null,
            resolvedOutcomeId: "brazil",
            createdAt: "2026-06-12T18:05:00.000Z",
          },
          resolvedOutcomeName: null,
          winningsTokens: 0,
          refundsTokens: 0,
          netInvestedTokens: 64,
        }),
      ]),
    ).toEqual([
      expect.objectContaining({
        id: "history-world-cup-group",
        outcome: "Resolved",
        amount: 64,
        entryAmount: 64,
        timestamp: "Jun 12, 1:05 PM",
      }),
    ]);
  });

  test("maps backend canceled orders into durable canceled activity rows", () => {
    expect(
      canceledOrdersToActivity([
        {
          id: "order-canceled-1",
          market: {
            id: "world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "BUY",
          status: "CANCELED",
          price: 0.5,
          size: 200,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: "canceled-order-order-canceled-1",
        action: "canceled",
        title: "Will France win the 2026 FIFA World Cup?",
        outcome: "YES",
        amount: 50,
        shares: 100,
        side: "buy",
        probability: 50,
        timestamp: "Jul 2, 12:55 AM",
      }),
    ]);
  });

  test("maps backend recent trades into pre-resolution activity rows", () => {
    expect(
      recentTradesToActivity([
        {
          id: "trade-1",
          market: {
            id: "world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "BUY",
          shares: 200,
          cost: 100,
          fee: 0,
          createdAt: "2026-07-02T06:10:00.000Z",
        },
        {
          id: "trade-2",
          market: {
            id: "world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "SELL",
          shares: 50,
          cost: 30,
          fee: 0,
          createdAt: "2026-07-02T06:12:00.000Z",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: "trade-trade-1",
        action: "opened",
        title: "Will France win the 2026 FIFA World Cup?",
        outcome: "YES",
        amount: 100,
        shares: 200,
        side: "buy",
        probability: 50,
        timestamp: "Jul 2, 1:10 AM",
      }),
      expect.objectContaining({
        id: "trade-trade-2",
        action: "sold",
        amount: 30,
        shares: 50,
        side: "sell",
        probability: 60,
        timestamp: "Jul 2, 1:12 AM",
      }),
    ]);
  });

  test("rejects malformed history arrays before applying Portfolio activity", async () => {
    const getPortfolioHistory = async () => ({
      history: undefined,
      canceledOrders: [],
      recentTrades: [],
    });
    const api = { getPortfolioHistory } as unknown as PolyApi;

    await expect(loadPortfolioHistoryActivities(api)).rejects.toThrow("Portfolio history response had invalid history.");
  });

  test("rejects malformed history numeric fields before applying Portfolio activity", async () => {
    const getPortfolioHistory = async () => ({
      history: [],
      canceledOrders: [
        {
          id: "bad-cancel",
          market: {
            id: "world-cup-winner",
            title: "World Cup winner",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "BUY",
          status: "CANCELED",
          price: Number.NaN,
          size: 200,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ],
      recentTrades: [],
    });
    const api = { getPortfolioHistory } as unknown as PolyApi;

    await expect(loadPortfolioHistoryActivities(api)).rejects.toThrow("Portfolio history response had invalid canceledOrders[].price.");
  });

  test("rejects negative resolved history payouts before applying Portfolio activity", () => {
    expect(() =>
      portfolioHistoryToActivity([
        historyItem({
          winningsTokens: -1,
          refundsTokens: 0,
          netInvestedTokens: 100,
          realizedPnLTokens: -12,
        }),
      ]),
    ).toThrow("Portfolio history response had invalid history[].winningsTokens.");
  });

  test("rejects negative recent trade economics before applying Portfolio activity", () => {
    expect(() =>
      recentTradesToActivity([
        {
          id: "bad-trade",
          market: {
            id: "world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "BUY",
          shares: -1,
          cost: 100,
          fee: 0,
          createdAt: "2026-07-02T06:10:00.000Z",
        },
      ]),
    ).toThrow("Portfolio history response had invalid recentTrades[].shares.");
  });

  test("rejects negative canceled order economics before applying Portfolio activity", () => {
    expect(() =>
      canceledOrdersToActivity([
        {
          id: "bad-cancel",
          market: {
            id: "world-cup-winner",
            title: "World Cup winner",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "BUY",
          status: "CANCELED",
          price: -0.01,
          size: 200,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ]),
    ).toThrow("Portfolio history response had invalid canceledOrders[].price.");
  });

  test("preserves line selection labels in backend order activity", () => {
    expect(
      recentTradesToActivity([
        {
          id: "line-trade-1",
          market: {
            id: "mexico-ecuador-spread",
            title: "Mexico vs. Ecuador",
            status: "ACTIVE",
          },
          outcome: {
            id: "spread-yes",
            name: "YES",
          },
          selection: {
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
          },
          side: "BUY",
          shares: 1000,
          cost: 30,
          fee: 0,
          createdAt: "2026-07-02T06:10:00.000Z",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        title: "Mexico vs. Ecuador",
        outcome: "YES",
        selection: {
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
          },
      }),
    ]);

    expect(
      canceledOrdersToActivity([
        {
          id: "line-order-canceled",
          market: {
            id: "mexico-ecuador-total",
            title: "Mexico vs. Ecuador",
            status: "ACTIVE",
          },
          outcome: {
            id: "over",
            name: "YES",
          },
          selection: {
            marketId: "mexico-ecuador-total",
            outcomeId: "over",
            marketGroupId: "live-game-lines",
            marketType: "totals",
            line: "3.5",
            period: "2nd Half",
            side: "over",
            displayLabel: "Over 3.5 2H",
            contractSide: "no",
            referenceSource: "polymarket",
            externalSlug: "mexico-ecuador-total",
            externalMarketId: "gamma-total",
            conditionId: "condition-total",
            referenceTokenId: "token-total-over",
            referenceOutcomeLabel: "Over 3.5",
            limitPrice: 0.44,
            limitSide: "ask",
            limitShares: 125.5,
          },
          side: "BUY",
          status: "CANCELED",
          price: 0.22,
          size: 100,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        title: "Mexico vs. Ecuador",
        outcome: "YES",
        selection: {
          marketId: "mexico-ecuador-total",
          outcomeId: "over",
          marketGroupId: "live-game-lines",
          marketType: "totals",
          line: "3.5",
          period: "2nd Half",
          side: "over",
          displayLabel: "Over 3.5 2H",
          contractSide: "no",
          referenceSource: "polymarket",
          externalSlug: "mexico-ecuador-total",
          externalMarketId: "gamma-total",
          conditionId: "condition-total",
          referenceTokenId: "token-total-over",
          referenceOutcomeLabel: "Over 3.5",
          limitPrice: 0.44,
          limitSide: "ask",
          limitShares: 125.5,
          },
      }),
    ]);
  });

  test("rejects malformed recent trade selection identity before applying activity", () => {
    expect(() =>
      recentTradesToActivity([
        {
          id: "bad-line-trade",
          market: {
            id: "mexico-ecuador-spread",
            title: "Mexico vs. Ecuador",
            status: "ACTIVE",
          },
          outcome: {
            id: "spread-yes",
            name: "YES",
          },
          selection: {
            marketType: "mystery",
            displayLabel: "Unknown line",
          },
          side: "BUY",
          shares: 1000,
          cost: 30,
          fee: 0,
          createdAt: "2026-07-02T06:10:00.000Z",
        },
      ]),
    ).toThrow("Portfolio selection response had invalid recentTrades[].selection.marketType.");
  });

  test("rejects malformed canceled order selection limits before applying activity", () => {
    expect(() =>
      canceledOrdersToActivity([
        {
          id: "bad-line-order",
          market: {
            id: "mexico-ecuador-total",
            title: "Mexico vs. Ecuador",
            status: "ACTIVE",
          },
          outcome: {
            id: "over",
            name: "YES",
          },
          selection: {
            marketType: "totals",
            displayLabel: "Over 3.5 RT",
            limitPrice: -0.01,
          },
          side: "BUY",
          status: "CANCELED",
          price: 0.22,
          size: 100,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ]),
    ).toThrow("Portfolio selection response had invalid canceledOrders[].selection.limitPrice.");
  });
});
