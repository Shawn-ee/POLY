import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { submitTicketOrder } from "../services/orderService";

const market = {
  id: "world-cup-winner",
  title: "World Cup winner",
  zhTitle: "世界杯冠军",
  type: "future" as const,
  outcomes: [],
};

const outcome = {
  id: "france",
  label: "France",
  zhLabel: "法国",
  probability: 34,
  color: "#2563eb",
};

const providerOutcome = {
  ...outcome,
  referenceTokenId: "token-france",
  referenceOutcomeLabel: "France",
};

const event = {
  id: "mexico-ecuador",
  title: "Mexico vs. Ecuador",
  zhTitle: "Mexico vs. Ecuador",
  league: "World Cup",
  startsAt: "Today 8:00 PM",
  status: "today" as const,
  tag: "Group Stage",
  zhTag: "Group Stage",
  teams: [],
  markets: [],
};

const propMarket = {
  id: "mexico-ecuador-both-score",
  title: "Both teams to score",
  zhTitle: "Both teams to score",
  type: "prop" as const,
  outcomes: [],
};

const propOutcome = {
  id: "yes",
  label: "Yes",
  zhLabel: "Yes",
  probability: 51,
  color: "#0a8f61",
};

const providerMarket = {
  ...market,
  referenceSource: "polymarket",
  externalSlug: "world-cup-2026-france-winner",
  externalMarketId: "gamma-market-france",
  conditionId: "condition-france",
};

describe("ticket order service", () => {
  test("uses prop market title for event detail prop orders", async () => {
    const result = await submitTicketOrder({
      mode: "mock",
      api: {} as PolyApi,
      event,
      market: propMarket,
      outcome: propOutcome,
      side: "buy",
      amount: 100,
    });

    expect(result).toMatchObject({
      mode: "mock",
      title: "Both teams to score",
      outcome: "Yes",
      probability: 51,
    });
  });

  test("submits server-mode ticket orders with canonical price, size, side, and identifiers", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "server-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      side: "buy",
      amount: 100,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "BUY",
      contractSide: "YES",
      price: "0.34",
      size: "294.12",
      selection: {
        marketType: "future",
        marketId: "world-cup-winner",
        outcomeId: "france",
        displayLabel: "France",
        contractSide: "yes",
      },
    });
    expect(result).toMatchObject({
      id: "server-order-1",
      mode: "server",
      title: "World Cup winner",
      outcome: "France",
      side: "buy",
      amount: 100,
      probability: 34,
      contractSide: "yes",
    });
  });

  test("carries Polymarket provider identity through the ticket order payload", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "server-provider-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market: providerMarket,
      outcome: providerOutcome,
      side: "buy",
      amount: 100,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        marketId: "world-cup-winner",
        outcomeId: "france",
        selection: expect.objectContaining({
          referenceSource: "polymarket",
          externalSlug: "world-cup-2026-france-winner",
          externalMarketId: "gamma-market-france",
          conditionId: "condition-france",
          referenceTokenId: "token-france",
          referenceOutcomeLabel: "France",
        }),
      }),
    );
    expect(result.selection).toMatchObject({
      referenceSource: "polymarket",
      externalMarketId: "gamma-market-france",
      conditionId: "condition-france",
      referenceTokenId: "token-france",
    });
  });

  test("submits Buy No as a buy order with explicit NO contract side and inverse price", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "server-no-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      selection: { marketType: "future", displayLabel: "France", contractSide: "no" },
      contractSide: "no",
      side: "buy",
      amount: 100,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "BUY",
      contractSide: "NO",
      price: "0.66",
      size: "151.52",
      selection: {
        marketType: "future",
        marketId: "world-cup-winner",
        outcomeId: "france",
        displayLabel: "France",
        contractSide: "no",
      },
    });
    expect(result).toMatchObject({
      id: "server-no-order-1",
      side: "buy",
      contractSide: "no",
      probability: 66,
    });
  });

  test("includes selected line metadata in server-mode line market orders", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "server-line-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const lineMarket = {
      id: "mexico-ecuador-spread-2.5-1H",
      title: "Spread MEX -2.5 1H",
      zhTitle: "Spread MEX -2.5 1H",
      type: "game-line" as const,
      outcomes: [],
    };
    const lineOutcome = {
      id: "mexico-ecuador-spread-2.5-1H-yes",
      label: "MEX -2.5 1H",
      zhLabel: "MEX -2.5 1H",
      probability: 3,
      color: "#0a8f61",
    };
    const selection = {
      marketType: "spread" as const,
      line: "2.5",
      period: "1st Half",
      displayLabel: "MEX -2.5 1H",
    };

    const result = await submitTicketOrder({
      mode: "server",
      api,
      event,
      market: lineMarket,
      outcome: lineOutcome,
      selection,
      side: "buy",
      amount: 30,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "mexico-ecuador-spread-2.5-1H",
      outcomeId: "mexico-ecuador-spread-2.5-1H-yes",
      side: "BUY",
      contractSide: "YES",
      price: "0.03",
      size: "1000.00",
      selection: {
        ...selection,
        marketId: "mexico-ecuador-spread-2.5-1H",
        outcomeId: "mexico-ecuador-spread-2.5-1H-yes",
        contractSide: "yes",
      },
    });
    expect(result.selection).toEqual({
      ...selection,
      marketId: "mexico-ecuador-spread-2.5-1H",
      outcomeId: "mexico-ecuador-spread-2.5-1H-yes",
      contractSide: "yes",
    });
  });

  test("preserves Book-staged limit fields in server-mode order selection", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "server-book-limit-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const selection = {
      marketType: "totals" as const,
      line: "3.5",
      period: "2nd Half",
      side: "over",
      displayLabel: "Over 3.5 2H",
      limitPrice: 0.44,
      limitSide: "ask" as const,
      limitShares: 125.5,
    };

    const result = await submitTicketOrder({
      mode: "server",
      api,
      event,
      market: {
        id: "mexico-ecuador-total-3.5-2H",
        title: "Total 3.5 2H",
        zhTitle: "Total 3.5 2H",
        type: "game-line" as const,
        outcomes: [],
      },
      outcome: {
        id: "mexico-ecuador-total-3.5-2H-over",
        label: "Over 3.5 2H",
        zhLabel: "Over 3.5 2H",
        probability: 44,
        color: "#0a8f61",
      },
      selection,
      side: "buy",
      amount: 55.22,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        selection: expect.objectContaining({
          ...selection,
          marketId: "mexico-ecuador-total-3.5-2H",
          outcomeId: "mexico-ecuador-total-3.5-2H-over",
          contractSide: "yes",
        }),
      }),
    );
    expect(result.selection).toMatchObject({
      ...selection,
      marketId: "mexico-ecuador-total-3.5-2H",
      outcomeId: "mexico-ecuador-total-3.5-2H-over",
      contractSide: "yes",
    });
  });

  test("uses top-level server order id fallback when canonical response omits nested order id", async () => {
    const placeLimitOrder = vi.fn(async () => ({ id: "server-order-top-level" }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      side: "sell",
      amount: 25.5,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "SELL",
      contractSide: "YES",
      price: "0.34",
      size: "75.00",
      selection: {
        marketType: "future",
        marketId: "world-cup-winner",
        outcomeId: "france",
        displayLabel: "France",
        contractSide: "yes",
      },
    });
    expect(result.id).toBe("server-order-top-level");
    expect(result.mode).toBe("server");
  });

  test("preserves server order status and fill details from canonical responses", async () => {
    const placeLimitOrder = vi.fn(async () => ({
      order: {
        id: "server-order-partial",
        status: "PARTIAL",
        size: "100.00",
        remaining: "75.50",
      },
      fills: [{ size: "10.25" }, { size: "14.25" }],
    }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      side: "buy",
      amount: 100,
    });

    expect(result).toMatchObject({
      id: "server-order-partial",
      mode: "server",
      status: "PARTIAL",
      size: 100,
      filledSize: 24.5,
      remainingSize: 75.5,
    });
  });

  test("derives filled size from size minus remaining when fills are omitted", async () => {
    const placeLimitOrder = vi.fn(async () => ({
      order: {
        id: "server-order-open",
        status: "OPEN",
        size: 50,
        remaining: 50,
      },
    }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      side: "sell",
      amount: 50,
    });

    expect(result).toMatchObject({
      id: "server-order-open",
      status: "OPEN",
      size: 50,
      filledSize: 0,
      remainingSize: 50,
    });
  });

  test("rejects server-mode submit when the backend does not confirm an order id", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { status: "OPEN" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      submitTicketOrder({
        mode: "server",
        api,
        market,
        outcome,
        side: "buy",
        amount: 50,
      }),
    ).rejects.toThrow("Order submit was not confirmed by the server.");
  });

  test("rejects non-positive ticket amounts before calling the API", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      submitTicketOrder({
        mode: "server",
        api,
        market,
        outcome,
        side: "buy",
        amount: 0,
      }),
    ).rejects.toThrow("Order amount must be greater than zero.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });
});
