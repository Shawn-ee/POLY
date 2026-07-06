import { describe, expect, test } from "vitest";
import { assertPositionCloseOrderResponseShape } from "../services/positionCloseRouteShapeService";

describe("position close route shape service", () => {
  test("accepts canonical nested order id confirmation", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "500.00",
        remaining: "500.00",
      },
      fills: [{ size: "0" }],
    }, 500)).not.toThrow();
  });

  test("accepts legacy top-level order id confirmation", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      id: "close-order-top-level",
      size: 500,
      remaining: 500,
    })).not.toThrow();
  });

  test("rejects missing order confirmation", () => {
    expect(() => assertPositionCloseOrderResponseShape({ order: { status: "OPEN" } })).toThrow(
      "Cash out order was not confirmed by the server.",
    );
  });

  test("rejects close confirmations with failed terminal status", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-rejected",
        status: "REJECTED",
        size: "500.00",
      },
    }, 500)).toThrow("Cash out order was rejected by the server with status REJECTED.");
    expect(() => assertPositionCloseOrderResponseShape({
      id: "close-order-canceled",
      status: "CANCELED",
      size: "500.00",
    }, 500)).toThrow("Cash out order was rejected by the server with status CANCELED.");
  });

  test("rejects malformed close confirmation status", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-bad-status",
        status: 12,
      },
    })).toThrow("invalid order.status");
  });

  test("rejects malformed optional numeric lifecycle fields", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "not-a-number",
      },
    })).toThrow("invalid order.size");
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
      },
      fills: [{ size: -1 }],
    })).toThrow("invalid fills[0].size");
  });

  test("rejects close confirmations with mismatched full-position size", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "250.00",
      },
    }, 500)).toThrow("did not match the requested full position size");
  });

  test("rejects close confirmations with remaining above order size", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "500.00",
        remaining: "501.00",
      },
    }, 500)).toThrow("remaining size above order size");
  });

  test("rejects close confirmations with filled size above order size", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "500.00",
      },
      fills: [{ size: "250.50" }, { size: "250.00" }],
    }, 500)).toThrow("filled size above order size");
  });

  test("accepts close confirmations with filled plus remaining equal to order size", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "500.00",
        remaining: "125.00",
      },
      fills: [{ size: "250.00" }, { size: "125.00" }],
    }, 500)).not.toThrow();
  });

  test("rejects close confirmations with filled plus remaining above order size", () => {
    expect(() => assertPositionCloseOrderResponseShape({
      order: {
        id: "close-order-1",
        size: "500.00",
        remaining: "250.00",
      },
      fills: [{ size: "150.00" }, { size: "125.00" }],
    }, 500)).toThrow("filled plus remaining size above order size");
  });
});
