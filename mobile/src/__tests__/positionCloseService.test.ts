import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";
import { canCashOutPosition, cashOutEstimate, closePositionOnServer } from "../services/positionCloseService";

const position: Position = {
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
  currentPrice: 0.51,
  currentValue: 255,
  pnl: 45,
};

describe("position close service", () => {
  test("reports cashout availability from server position shares", () => {
    expect(canCashOutPosition(position)).toBe(true);
    expect(canCashOutPosition({ ...position, shares: 0 })).toBe(false);
    expect(canCashOutPosition({ ...position, shares: undefined })).toBe(false);
    expect(canCashOutPosition({ ...position, currentPrice: undefined })).toBe(false);
    expect(canCashOutPosition({ ...position, currentPrice: 1.01 })).toBe(false);
    expect(canCashOutPosition({ ...position, mode: "mock", shares: undefined })).toBe(true);
  });

  test("estimates cashout all from current value before falling back to shares and current price", () => {
    expect(cashOutEstimate(position)).toBe(255);
    expect(cashOutEstimate({ ...position, currentValue: undefined, shares: 500, currentPrice: 0.49 })).toBe(245);
    expect(cashOutEstimate({ ...position, currentValue: undefined, currentPrice: undefined })).toBe(0);
  });

  test("does not call the backend for mock-mode closes", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({ mode: "mock", api, position });

    expect(placeLimitOrder).not.toHaveBeenCalled();
  });

  test("submits server-mode closes as canonical SELL limit orders", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-1", size: "500.00", remaining: "500.00" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({ mode: "server", api, position });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "SELL",
      price: "0.51",
      size: "500.00",
    });
  });

  test("rejects server cashout when current price is unavailable", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position: {
          ...position,
          currentPrice: undefined,
        },
      }),
    ).rejects.toThrow("Cash out requires a valid current market price.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });

  test("rejects server cashout when current price is above contract bounds", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position: {
          ...position,
          currentPrice: 1.01,
        },
      }),
    ).rejects.toThrow("Cash out requires a valid current market price.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });

  test("rejects server closes without market, outcome, and share identity", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position: {
          ...position,
          outcomeId: undefined,
        },
      }),
    ).rejects.toThrow("Server position close requires market, outcome, and share identity.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });

  test("rejects server cashout without positive shares before calling the API", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position: {
          ...position,
          shares: 0,
        },
      }),
    ).rejects.toThrow("Cash out requires an open position with available shares.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });

  test("rejects server cashout when backend omits order confirmation", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { status: "OPEN" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position,
      }),
    ).rejects.toThrow("Cash out order was not confirmed by the server.");
  });

  test("rejects server cashout when backend returns malformed lifecycle numbers", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-bad", remaining: "bad" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position,
      }),
    ).rejects.toThrow("Cash out order response had invalid order.remaining.");
  });

  test("rejects server cashout when backend confirms a different size than the full position", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-mismatch", size: "250.00" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position,
      }),
    ).rejects.toThrow("did not match the requested full position size");
  });

  test("rejects server cashout when backend returns a failed terminal status", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-rejected", status: "REJECTED", size: "500.00" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position,
      }),
    ).rejects.toThrow("Cash out order was rejected by the server with status REJECTED.");
  });
});
