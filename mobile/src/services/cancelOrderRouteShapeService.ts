import type { CancelOrderResponse } from "../api";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function assertCancelOrderRoutePayloadShape(
  payload: unknown,
  expectedOrderId: string,
): asserts payload is CancelOrderResponse {
  if (!isRecord(payload)) {
    throw new Error(`Order cancel route returned malformed payload for order ${expectedOrderId}.`);
  }
  if (!isRecord(payload.order)) {
    throw new Error(`Order cancel route did not confirm order ${expectedOrderId}.`);
  }
  if (payload.order.id !== expectedOrderId) {
    throw new Error(`Order cancel route confirmed the wrong order for ${expectedOrderId}.`);
  }
  if (payload.order.status !== "CANCELED") {
    throw new Error(`Order cancel route did not return CANCELED for order ${expectedOrderId}.`);
  }
}
