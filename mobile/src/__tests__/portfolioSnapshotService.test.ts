import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { loadPortfolioSnapshot } from "../services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../types";

const snapshot = (overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot => ({
  walletAvailableUSDC: 10000,
  walletLockedUSDC: 150,
  walletTotalUSDC: 10150,
  walletBalance: 10150,
  totalValue: 355,
  totalCostBasis: 300,
  totalRealizedPnl: 22,
  totalPnl: 77,
  comboOrders: [],
  positions: [
    {
      market: {
        id: "world-cup-winner",
        title: "World Cup winner",
        status: "ACTIVE",
        resolveTime: null,
        createdAt: "2026-06-01T12:00:00.000Z",
        availability: {
          source: "portfolio-market-status",
          status: "ready",
          marketStatus: "ACTIVE",
          lastUpdated: null,
          stalenessSeconds: null,
          staleAfterSeconds: 60,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "Market accepts orders.",
        },
      },
      outcomeId: "france",
      outcome: "France",
      selection: null,
      shares: 500,
      avgCost: 0.42,
      currentPrice: 0.51,
      bestBid: "0.47",
      bestAsk: 0.5,
      bestBidSize: "1000",
      bestAskSize: 2500,
      valueTokens: 255,
      costBasisTokens: 210,
      totalCostBasisTokens: 210,
      pnlTokens: 45,
    },
  ],
  openOrders: [
    {
      id: "buy-order-1",
      market: {
        id: "world-cup-final",
        title: "World Cup final exact matchup",
        status: "ACTIVE",
      },
      outcome: {
        id: "argentina-brazil",
        name: "Argentina vs Brazil",
      },
      selection: null,
      side: "BUY",
      status: "OPEN",
      price: 0.28,
      size: 100,
      remaining: 60,
      reservedNotional: 16.8,
      createdAt: "2026-06-05T14:00:00.000Z",
      updatedAt: "2026-06-05T14:00:00.000Z",
    },
    {
      id: "sell-order-1",
      market: {
        id: "world-cup-group",
        title: "Group A winner",
        status: "ACTIVE",
      },
      outcome: {
        id: "mexico",
        name: "Mexico",
      },
      selection: null,
      side: "SELL",
      status: "OPEN",
      price: 0.47,
      size: 75,
      remaining: 25,
      reservedNotional: 0,
      createdAt: "2026-06-06T14:00:00.000Z",
      updatedAt: "2026-06-06T14:00:00.000Z",
    },
  ],
  ...overrides,
});

describe("portfolio snapshot service", () => {
  test("maps backend portfolio balances, positions, and open orders into mobile screen models", async () => {
    const getPortfolio = vi.fn(async () => snapshot());
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).resolves.toEqual({
      balance: 10000,
      positions: [
        {
          id: "server-world-cup-winner-France",
          mode: "server",
          marketId: "world-cup-winner",
          outcomeId: "france",
          title: "World Cup winner",
          outcome: "France",
          selection: undefined,
          side: "buy",
          amount: 210,
          probability: 42,
          shares: 500,
          currentPrice: 0.51,
          marketAvailability: {
            source: "portfolio-market-status",
            status: "ready",
            marketStatus: "ACTIVE",
            lastUpdated: null,
            stalenessSeconds: null,
            staleAfterSeconds: 60,
            isStale: false,
            isSuspended: false,
            isDelayed: false,
            reason: "Market accepts orders.",
          },
          bestBid: 47,
          bestAsk: 50,
          bestBidSize: 1000,
          bestAskSize: 2500,
          currentValue: 255,
          pnl: 45,
        },
      ],
      openOrders: [
        {
          id: "buy-order-1",
          title: "World Cup final exact matchup",
          outcome: "Argentina vs Brazil",
          selection: undefined,
          side: "buy",
          status: "OPEN",
          price: 0.28,
          remaining: 60,
          originalShares: 100,
          remainingShares: 60,
          orderValue: 16.8,
          placedAt: "Jun 5, 9:00 AM",
        },
        {
          id: "sell-order-1",
          title: "Group A winner",
          outcome: "Mexico",
          selection: undefined,
          side: "sell",
          status: "OPEN",
          price: 0.47,
          remaining: 25,
          originalShares: 75,
          remainingShares: 25,
          orderValue: 11.75,
          placedAt: "Jun 6, 9:00 AM",
        },
      ],
    });
    expect(getPortfolio).toHaveBeenCalledTimes(1);
  });

  test("keeps empty server portfolios renderable for a new Holiwyn account", async () => {
    const getPortfolio = vi.fn(async () => snapshot({ walletAvailableUSDC: 10000, positions: [], openOrders: [] }));
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).resolves.toEqual({
      balance: 10000,
      positions: [],
      openOrders: [],
    });
  });

  test("rejects malformed snapshot route arrays before applying Portfolio state", async () => {
    const getPortfolio = vi.fn(async () => ({
      ...snapshot(),
      positions: undefined,
    }));
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).rejects.toThrow("Portfolio snapshot response had invalid positions.");
  });

  test("rejects malformed snapshot numeric fields before applying Portfolio state", async () => {
    const getPortfolio = vi.fn(async () =>
      snapshot({
        openOrders: [
          {
            ...snapshot().openOrders[0],
            remaining: Number.NaN,
          },
        ],
      }),
    );
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).rejects.toThrow("Portfolio snapshot response had invalid openOrders[].remaining.");
  });

  test("preserves backend line selection labels for positions and open orders", async () => {
    const getPortfolio = vi.fn(async () =>
      snapshot({
        positions: [
          {
            market: {
              id: "mexico-ecuador-spread",
              title: "Mexico vs. Ecuador",
              status: "ACTIVE",
              resolveTime: null,
              createdAt: "2026-06-01T12:00:00.000Z",
            },
            outcomeId: "spread-yes",
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
            shares: 1000,
            avgCost: 0.03,
            currentPrice: 0.03,
            valueTokens: 30,
            costBasisTokens: 30,
            totalCostBasisTokens: 30,
            pnlTokens: 0,
          },
        ],
        openOrders: [
          {
            id: "line-open-order",
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
            status: "OPEN",
            price: 0.22,
            size: 100,
            remaining: 100,
            reservedNotional: 22,
            createdAt: "2026-06-05T14:00:00.000Z",
            updatedAt: "2026-06-05T14:00:00.000Z",
          },
        ],
      }),
    );
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).resolves.toMatchObject({
      positions: [
        {
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
        },
      ],
      openOrders: [
        {
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
        },
      ],
    });
  });

  test("rejects malformed backend selection identity before applying Portfolio state", async () => {
    const getPortfolio = vi.fn(async () =>
      snapshot({
        positions: [
          {
            ...snapshot().positions[0],
            selection: {
              marketType: "mystery",
              displayLabel: "Unknown line",
            },
          },
        ],
      }),
    );
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).rejects.toThrow("Portfolio selection response had invalid positions[].selection.marketType.");
  });

  test("rejects malformed backend open-order selection limits before applying Portfolio state", async () => {
    const getPortfolio = vi.fn(async () =>
      snapshot({
        openOrders: [
          {
            ...snapshot().openOrders[0],
            selection: {
              marketType: "totals",
              displayLabel: "Over 3.5 RT",
              limitSide: "middle",
            } as unknown as NonNullable<PortfolioSnapshot["openOrders"][number]["selection"]>,
          },
        ],
      }),
    );
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).rejects.toThrow("Portfolio selection response had invalid openOrders[].selection.limitSide.");
  });
});
