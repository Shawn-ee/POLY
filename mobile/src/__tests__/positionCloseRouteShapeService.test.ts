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
});
