import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  CanonicalApiError,
  normalizeApiError,
  serializeForApi,
  type ApiErrorResponse,
} from "@/lib/canonicalApi";
import { createApiOrderRequestWithPolicyCheck } from "@/server/services/canonicalGovernance";
import { placeOrderAndMatch } from "@/server/services/matching";

const PROCESSING_WAIT_MS = 100;
const PROCESSING_MAX_ATTEMPTS = 30;

type CanonicalOrderType = "LIMIT" | "MARKET";
type CanonicalOrderSide = "BUY" | "SELL";

type NormalizedOrderRequest = {
  userId: string;
  idempotencyKey: string;
  clientOrderId: string | null;
  fingerprint: string;
  requestBody: Record<string, unknown>;
  marketId: string;
  outcomeId: string;
  side: CanonicalOrderSide;
  type: CanonicalOrderType;
  price: string | null;
  size: string;
  maxSpend: string | null;
};

type StoredOrderResponse = {
  order: {
    id: string;
    marketId: string;
    outcomeId: string;
    side: CanonicalOrderSide;
    type: CanonicalOrderType;
    clientOrderId: string | null;
    apiKeyId: string | null;
    price: string;
    size: string;
    remaining: string;
    reservedNotional: string;
    status: string;
  };
  fills: Array<{
    id: string;
    takerOrderId: string;
    makerOrderId: string;
    price: string;
    size: string;
    notionalUSDC: string;
    feeUSDC: string;
  }>;
  execution: {
    side: CanonicalOrderSide;
    orderType: CanonicalOrderType;
    submittedLimitPrice: string;
    requestedShares: string;
    requestedNotionalUSDC: string;
    maxCostUSDC: string | null;
    filledShares: string;
    averageFillPrice: string | null;
    actualNotionalUSDC: string;
    actualFeesUSDC: string;
    actualProceedsUSDC: string | null;
    priceImprovementUSDC: string;
    remainingUnfilledShares: string;
    status: string;
  };
  balance: {
    availableUSDC: string;
    lockedUSDC: string;
  } | null;
  position: {
    shares: string;
    reservedShares: string;
    avgCost: string;
    realizedPnl: string;
  } | null;
};

type StoredSnapshot = {
  status: number;
  body: StoredOrderResponse | ApiErrorResponse;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isPrismaUniqueConstraintError = (error: unknown) =>
  !!error &&
  typeof error === "object" &&
  "code" in error &&
  (error as { code?: string }).code === "P2002";

const parsePositiveDecimalString = (
  value: unknown,
  fieldName: string,
  maxScale: number
) => {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new CanonicalApiError("INVALID_REQUEST", `${fieldName} is required.`, 400);
  }

  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    throw new CanonicalApiError("INVALID_REQUEST", `Invalid ${fieldName}.`, 400);
  }

  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new CanonicalApiError("INVALID_REQUEST", `${fieldName} must be greater than zero.`, 400);
  }
  if ((decimal.decimalPlaces() ?? 0) > maxScale) {
    throw new CanonicalApiError(
      "INVALID_REQUEST",
      `${fieldName} supports up to ${maxScale} decimals.`,
      400
    );
  }

  return decimal.toString();
};

const parsePriceString = (value: unknown) => {
  if (value === null || value === undefined) {
    throw new CanonicalApiError("INVALID_REQUEST", "price is required for LIMIT orders.", 400);
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new CanonicalApiError("INVALID_REQUEST", "Invalid price.", 400);
  }

  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    throw new CanonicalApiError("INVALID_REQUEST", "Invalid price.", 400);
  }

  if (!decimal.isFinite() || decimal.lt(0) || decimal.gt(1)) {
    throw new CanonicalApiError("INVALID_REQUEST", "price must be between 0 and 1.", 400);
  }
  if ((decimal.decimalPlaces() ?? 0) > 8) {
    throw new CanonicalApiError("INVALID_REQUEST", "price supports up to 8 decimals.", 400);
  }

  return decimal.toString();
};

const buildFingerprint = (body: Record<string, unknown>) =>
  createHash("sha256").update(JSON.stringify(body)).digest("hex");

const parseOptionalPositiveDecimalString = (
  value: unknown,
  fieldName: string,
  maxScale: number
) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return parsePositiveDecimalString(value, fieldName, maxScale);
};

const getPolicyPrice = (order: Pick<NormalizedOrderRequest, "type" | "side" | "price" | "size" | "maxSpend">) => {
  if (order.type === "LIMIT") {
    return order.price ?? "0";
  }

  if (order.side === "BUY" && order.maxSpend) {
    const size = new Prisma.Decimal(order.size);
    const maxSpend = new Prisma.Decimal(order.maxSpend);
    if (size.gt(0)) {
      const impliedPrice = maxSpend.div(size);
      const cappedPrice = impliedPrice.gt(1) ? new Prisma.Decimal(1) : impliedPrice;
      return cappedPrice.toDecimalPlaces(8, Prisma.Decimal.ROUND_DOWN).toString();
    }
  }

  return "1";
};

const getMatchingPrice = (order: Pick<NormalizedOrderRequest, "type" | "side" | "price">) => {
  if (order.type === "LIMIT") {
    return order.price ?? "0";
  }

  return order.side === "BUY" ? "1" : "0";
};

const normalizeOrderRequest = (params: {
  userId: string;
  body: unknown;
  idempotencyKeyHeader: string | null;
}): NormalizedOrderRequest => {
  const body = (params.body ?? {}) as Record<string, unknown>;
  const marketId = typeof body.marketId === "string" ? body.marketId.trim() : "";
  const outcomeId = typeof body.outcomeId === "string" ? body.outcomeId.trim() : "";
  const side =
    body.side === "BUY" || body.side === "SELL"
      ? (body.side as CanonicalOrderSide)
      : null;
  const rawType = typeof body.type === "string" ? body.type.trim().toUpperCase() : null;
  const type =
    rawType === "LIMIT" || rawType === "MARKET"
      ? (rawType as CanonicalOrderType)
      : null;
  const clientOrderId =
    typeof body.clientOrderId === "string" && body.clientOrderId.trim().length > 0
      ? body.clientOrderId.trim()
      : null;
  const headerKey = params.idempotencyKeyHeader?.trim() || null;
  const idempotencyKey = headerKey ?? clientOrderId;

  if (!idempotencyKey) {
    throw new CanonicalApiError(
      "IDEMPOTENCY_KEY_REQUIRED_FOR_RETRYABLE_CLIENTS",
      "POST /api/orders requires Idempotency-Key or clientOrderId.",
      400
    );
  }
  if (!marketId || !outcomeId || !side || !type) {
    if (rawType && !type) {
      throw new CanonicalApiError("INVALID_ORDER_TYPE", "Unsupported order type.", 400);
    }
    throw new CanonicalApiError("INVALID_REQUEST", "Invalid order payload.", 400);
  }

  const size = parsePositiveDecimalString(body.size, "size", 6);
  const price = type === "LIMIT" ? parsePriceString(body.price) : null;
  const maxSpend = type === "MARKET" && side === "BUY"
    ? parseOptionalPositiveDecimalString(body.maxSpend, "maxSpend", 6)
    : null;

  if (type === "MARKET" && body.price !== null && body.price !== undefined) {
    throw new CanonicalApiError("INVALID_REQUEST", "price is not allowed for MARKET orders.", 400);
  }

  return {
    userId: params.userId,
    idempotencyKey,
    clientOrderId,
    marketId,
    outcomeId,
    side,
    type,
    price,
    size,
    requestBody: {
      marketId,
      outcomeId,
      side,
      type,
      price,
      size,
      maxSpend,
      clientOrderId,
    },
    fingerprint: buildFingerprint({
      marketId,
      outcomeId,
      side,
      type,
      price,
      size,
      maxSpend,
      clientOrderId,
    }),
    maxSpend,
  };
};

const loadStoredSnapshot = async (requestId: string): Promise<StoredSnapshot | null> => {
  const row = await prisma.apiOrderRequest.findUnique({
    where: { id: requestId },
    select: {
      status: true,
      responseStatus: true,
      responseBody: true,
      errorCode: true,
      errorMessage: true,
    },
  });

  if (!row || row.status === "PROCESSING") {
    return null;
  }

  if (!row.responseStatus || !row.responseBody) {
    throw new CanonicalApiError("INTERNAL_ERROR", "Stored order response is incomplete.", 500);
  }

  return {
    status: row.responseStatus,
    body: row.responseBody as StoredSnapshot["body"],
  };
};

const waitForStoredSnapshot = async (requestId: string) => {
  for (let attempt = 0; attempt < PROCESSING_MAX_ATTEMPTS; attempt += 1) {
    const snapshot = await loadStoredSnapshot(requestId);
    if (snapshot) {
      return snapshot;
    }
    await sleep(PROCESSING_WAIT_MS);
  }

  throw new CanonicalApiError(
    "IDEMPOTENCY_REQUEST_IN_PROGRESS",
    "Order request with this idempotency key is still processing. Retry shortly.",
    409
  );
};

const findExistingRequestId = async (params: {
  userId: string;
  idempotencyKey: string;
  clientOrderId: string | null;
}) => {
  const byIdempotency = await prisma.apiOrderRequest.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: params.userId,
        idempotencyKey: params.idempotencyKey,
      },
    },
    select: { id: true },
  });

  if (byIdempotency) {
    return byIdempotency.id;
  }

  if (!params.clientOrderId) {
    return null;
  }

  const byClientOrderId = await prisma.apiOrderRequest.findUnique({
    where: {
      userId_clientOrderId: {
        userId: params.userId,
        clientOrderId: params.clientOrderId,
      },
    },
    select: { id: true },
  });

  return byClientOrderId?.id ?? null;
};

const resolveExistingRequest = async (params: {
  userId: string;
  idempotencyKey: string;
  clientOrderId: string | null;
  fingerprint: string;
}) => {
  const byIdempotency = await prisma.apiOrderRequest.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: params.userId,
        idempotencyKey: params.idempotencyKey,
      },
    },
    select: {
      id: true,
      requestFingerprint: true,
      clientOrderId: true,
    },
  });

  if (byIdempotency) {
    if (byIdempotency.requestFingerprint !== params.fingerprint) {
      throw new CanonicalApiError(
        "IDEMPOTENCY_KEY_CONFLICT",
        "Idempotency key was already used with a different order payload.",
        409
      );
    }
    return waitForStoredSnapshot(byIdempotency.id);
  }

  if (params.clientOrderId) {
    const byClientOrderId = await prisma.apiOrderRequest.findUnique({
      where: {
        userId_clientOrderId: {
          userId: params.userId,
          clientOrderId: params.clientOrderId,
        },
      },
      select: {
        id: true,
        requestFingerprint: true,
      },
    });

    if (byClientOrderId) {
      if (byClientOrderId.requestFingerprint !== params.fingerprint) {
        throw new CanonicalApiError(
          "DUPLICATE_CLIENT_ORDER_ID",
          "clientOrderId was already used for a different order payload.",
          409
        );
      }
      return waitForStoredSnapshot(byClientOrderId.id);
    }
  }

  throw new CanonicalApiError("INTERNAL_ERROR", "Failed to resolve idempotent order request.", 500);
};

export const submitCanonicalOrder = async (params: {
  userId: string;
  apiCredentialId: string | null;
  apiKeyId: string | null;
  body: unknown;
  idempotencyKeyHeader: string | null;
}) => {
  const normalized = normalizeOrderRequest(params);

  const existingRequestId = await findExistingRequestId(normalized);
  if (existingRequestId) {
    return resolveExistingRequest(normalized);
  }

  try {
    const policyPrice = getPolicyPrice(normalized);
    await createApiOrderRequestWithPolicyCheck({
      userId: normalized.userId,
      apiCredentialId: params.apiCredentialId,
      idempotencyKey: normalized.idempotencyKey,
      clientOrderId: normalized.clientOrderId,
      requestFingerprint: normalized.fingerprint,
      requestBody: normalized.requestBody as Prisma.InputJsonObject,
      marketId: normalized.marketId,
      size: normalized.size,
      price: policyPrice,
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return resolveExistingRequest(normalized);
    }
    throw error;
  }

  const requestRow = await prisma.apiOrderRequest.findUniqueOrThrow({
    where: {
      userId_idempotencyKey: {
        userId: normalized.userId,
        idempotencyKey: normalized.idempotencyKey,
      },
    },
    select: { id: true },
  });

  try {
    const matchingPrice = getMatchingPrice(normalized);
    const result = await placeOrderAndMatch({
      marketId: normalized.marketId,
      userId: normalized.userId,
      outcomeId: normalized.outcomeId,
      apiCredentialId: params.apiCredentialId,
      side: normalized.side,
      price: matchingPrice,
      size: normalized.size,
      type: normalized.type,
      maxSpend: normalized.maxSpend,
    });

    const responseBody: StoredOrderResponse = {
      order: {
        ...result.order,
        type: normalized.type,
        clientOrderId: normalized.clientOrderId,
        apiKeyId: params.apiKeyId,
      },
      fills: result.fills,
      execution: result.execution,
      balance: result.balance,
      position: result.position,
    };
    const serializedBody = serializeForApi(responseBody) as StoredOrderResponse;

    await prisma.apiOrderRequest.update({
      where: { id: requestRow.id },
      data: {
        status: "SUCCEEDED",
        orderId: responseBody.order.id,
        responseStatus: 200,
        responseBody: serializedBody as Prisma.InputJsonObject,
      },
    });

    return {
      status: 200,
      body: serializedBody,
    } satisfies StoredSnapshot;
  } catch (error) {
    const normalizedError = normalizeApiError(error, "Failed to place order.");
    await prisma.apiOrderRequest.update({
      where: { id: requestRow.id },
      data: {
        status: "FAILED",
        responseStatus: normalizedError.status,
        responseBody: normalizedError.body as Prisma.InputJsonObject,
        errorCode: normalizedError.body.error.code,
        errorMessage: normalizedError.body.error.message,
      },
    });
    return normalizedError as StoredSnapshot;
  }
};
