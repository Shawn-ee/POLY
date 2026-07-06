type CloseOrderResponse = {
  order?: {
    id?: string;
    status?: string;
    size?: string | number | null;
    remaining?: string | number | null;
  };
  id?: string;
  status?: string;
  size?: string | number | null;
  remaining?: string | number | null;
  fills?: Array<{ size?: string | number | null }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalFiniteNumber = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`Cash out order response had invalid ${field}.`);
  }
  return numeric;
};

const failedCloseStatuses = new Set(["CANCELED", "CANCELLED", "REJECTED", "FAILED", "EXPIRED"]);

const assertCloseStatus = (status: unknown) => {
  if (status === undefined || status === null || status === "") return;
  if (typeof status !== "string") {
    throw new Error("Cash out order response had invalid order.status.");
  }
  const normalized = status.trim().toUpperCase();
  if (failedCloseStatuses.has(normalized)) {
    throw new Error(`Cash out order was rejected by the server with status ${normalized}.`);
  }
};

export function assertPositionCloseOrderResponseShape(payload: unknown, expectedSize?: number): asserts payload is CloseOrderResponse {
  if (!isRecord(payload)) {
    throw new Error("Cash out order was not confirmed by the server.");
  }
  const order = isRecord(payload.order) ? payload.order : undefined;
  const orderId = order?.id ?? payload.id;
  if (typeof orderId !== "string" || !orderId.trim()) {
    throw new Error("Cash out order was not confirmed by the server.");
  }
  assertCloseStatus(order?.status ?? payload.status);
  const confirmedSize = optionalFiniteNumber(order?.size ?? payload.size, "order.size");
  if (expectedSize !== undefined && confirmedSize !== undefined && Math.abs(confirmedSize - expectedSize) > 0.000001) {
    throw new Error("Cash out order response did not match the requested full position size.");
  }
  const remaining = optionalFiniteNumber(order?.remaining ?? payload.remaining, "order.remaining");
  if (confirmedSize !== undefined && remaining !== undefined && remaining > confirmedSize) {
    throw new Error("Cash out order response had remaining size above order size.");
  }
  let filledSize: number | undefined;
  if (payload.fills !== undefined) {
    if (!Array.isArray(payload.fills)) {
      throw new Error("Cash out order response had invalid fills.");
    }
    let fillTotal = 0;
    payload.fills.forEach((fill, index) => {
      if (!isRecord(fill)) {
        throw new Error("Cash out order response had invalid fills.");
      }
      fillTotal += optionalFiniteNumber(fill.size, `fills[${index}].size`) ?? 0;
    });
    filledSize = fillTotal;
    if (confirmedSize !== undefined && filledSize > confirmedSize) {
      throw new Error("Cash out order response had filled size above order size.");
    }
  }
  if (
    confirmedSize !== undefined &&
    remaining !== undefined &&
    filledSize !== undefined &&
    filledSize + remaining > confirmedSize + 0.000001
  ) {
    throw new Error("Cash out order response had filled plus remaining size above order size.");
  }
}
