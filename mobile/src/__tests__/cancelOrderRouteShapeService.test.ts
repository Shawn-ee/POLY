import { describe, expect, test } from "vitest";
import { assertCancelOrderRoutePayloadShape } from "../services/cancelOrderRouteShapeService";

describe("cancel order route shape service", () => {
  test("accepts same-order canceled confirmation", () => {
    expect(() => assertCancelOrderRoutePayloadShape({
      order: {
        id: "order-1",
        status: "CANCELED",
      },
    }, "order-1")).not.toThrow();
  });

  test("rejects malformed cancel payloads", () => {
    expect(() => assertCancelOrderRoutePayloadShape(null, "order-1")).toThrow("malformed payload");
    expect(() => assertCancelOrderRoutePayloadShape({}, "order-1")).toThrow("did not confirm");
  });

  test("rejects wrong-order confirmations", () => {
    expect(() => assertCancelOrderRoutePayloadShape({
      order: {
        id: "other-order",
        status: "CANCELED",
      },
    }, "order-1")).toThrow("wrong order");
  });

  test("rejects non-canceled confirmations", () => {
    expect(() => assertCancelOrderRoutePayloadShape({
      order: {
        id: "order-1",
        status: "OPEN",
      },
    }, "order-1")).toThrow("did not return CANCELED");
  });
});
