import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import type { OpenOrder, PortfolioActivity } from "../components/Portfolio";
import { appendUniqueActivity, cancelOpenOrderOnServer, openOrderCanceledActivity, shouldApplyOptimisticCancel } from "../services/openOrderService";

const order: OpenOrder = {
  id: "server-open-order-1",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  status: "OPEN",
  price: 0.34,
  remaining: 125,
  remainingShares: 125,
  orderValue: 42.5,
};

describe("open order service", () => {
  test("maps open orders into canceled Portfolio activity rows", () => {
    expect(openOrderCanceledActivity(order, "Just now")).toEqual({
      id: "server-open-order-1-canceled",
      action: "canceled",
      title: "World Cup winner",
      outcome: "France",
      amount: 42.5,
      shares: 125,
      side: "buy",
      probability: 34,
      timestamp: "Just now",
    });
  });

  test("prevents duplicate canceled activity rows after repeated taps or retries", () => {
    const activity = openOrderCanceledActivity(order, "Just now");
    const existing: PortfolioActivity[] = [activity];

    expect(appendUniqueActivity(existing, activity)).toBe(existing);
    expect(appendUniqueActivity([], activity)).toEqual([activity]);
  });

  test("only applies optimistic open-order cancel in mock mode", () => {
    expect(shouldApplyOptimisticCancel("mock")).toBe(true);
    expect(shouldApplyOptimisticCancel("server")).toBe(false);
  });

  test("does not call the backend for mock-mode order cancel", async () => {
    const cancelOrder = vi.fn();
    const api = { cancelOrder } as unknown as PolyApi;

    await cancelOpenOrderOnServer({ mode: "mock", api, order });

    expect(cancelOrder).not.toHaveBeenCalled();
  });

  test("calls the backend cancel endpoint for server-mode order cancel", async () => {
    const cancelOrder = vi.fn(async () => ({ order: { id: order.id, status: "CANCELED" } }));
    const api = { cancelOrder } as unknown as PolyApi;

    await cancelOpenOrderOnServer({ mode: "server", api, order });

    expect(cancelOrder).toHaveBeenCalledWith("server-open-order-1");
  });

  test("rejects server-mode cancel when the backend does not confirm the same canceled order", async () => {
    const cancelOrder = vi.fn(async () => ({ order: { id: order.id, status: "OPEN" } }));
    const api = { cancelOrder } as unknown as PolyApi;

    await expect(cancelOpenOrderOnServer({ mode: "server", api, order })).rejects.toThrow(
      "Order cancel was not confirmed by the server.",
    );
  });

  test("rejects server-mode cancel when the backend returns a malformed payload", async () => {
    const cancelOrder = vi.fn(async () => ({ order: null }));
    const api = { cancelOrder } as unknown as PolyApi;

    await expect(cancelOpenOrderOnServer({ mode: "server", api, order })).rejects.toThrow(
      "Order cancel was not confirmed by the server.",
    );
  });
});
