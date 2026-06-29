import { Prisma, type OrderStatus, type TradeSide } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { MarketGuardError } from "@/lib/marketGuards";
import { assertPublicOrderbookCollateralInvariant } from "@/server/services/orderbookCollateral";

const ZERO = new Prisma.Decimal(0);
const ONE_HUNDRED = new Prisma.Decimal(100);
const FEE_BPS = new Prisma.Decimal(1);
const DECIMAL_SCALE = new Prisma.Decimal("0.000001");
const PRICE_MIN = new Prisma.Decimal("0");
const PRICE_MAX = new Prisma.Decimal("1");
const PLATFORM_USERNAME = "__platform_fees__";
const ONE = new Prisma.Decimal(1);
const BINARY_INVARIANT_TOLERANCE = new Prisma.Decimal("0.000001");

type Tx = Prisma.TransactionClient;

type LockedOrderRow = {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  side: TradeSide;
  price: Prisma.Decimal;
  amount: Prisma.Decimal;
  remaining: Prisma.Decimal;
  reservedNotional: Prisma.Decimal;
  status: OrderStatus;
  createdAt: Date;
};

type LockedBalanceRow = {
  userId: string;
  availableUSDC: Prisma.Decimal;
  lockedUSDC: Prisma.Decimal;
};

type LockedPositionRow = {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  shares: Prisma.Decimal;
  avgCost: Prisma.Decimal;
  reservedShares: Prisma.Decimal;
  realizedPnl: Prisma.Decimal;
};

const toDec = (value: string | number | Prisma.Decimal) => new Prisma.Decimal(value);
const normalizeSize = (value: Prisma.Decimal) => value.div(DECIMAL_SCALE).floor().mul(DECIMAL_SCALE);
const toUsdcDown = (value: Prisma.Decimal) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);
const toUsdcUp = (value: Prisma.Decimal) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_UP);
const notionalFor = (qty: Prisma.Decimal, price: Prisma.Decimal) => qty.mul(price);
const sumDecimalStrings = (values: string[], fallback = ZERO) =>
  values.reduce((sum, value) => sum.add(value), fallback);

const clampPrice = (value: Prisma.Decimal) => {
  if (value.lt(PRICE_MIN) || value.gt(PRICE_MAX)) {
    throw new MarketGuardError("Price must be between 0 and 1", 400);
  }
  return value;
};

const ensureNonNegative = (value: Prisma.Decimal, message: string) => {
  if (value.lt(ZERO)) {
    throw new MarketGuardError(message, 409);
  }
};

const ensurePublicOrderbookLive = (market: {
  mechanism: string;
  visibility: string;
  status: string;
  isCanceled: boolean;
}) => {
  if (market.mechanism !== "ORDERBOOK") {
    throw new MarketGuardError("Orderbook endpoint only supports ORDERBOOK markets", 400);
  }
  if (market.visibility !== "PUBLIC") {
    throw new MarketGuardError("Only PUBLIC markets allow orderbook trading", 403);
  }
  if (market.isCanceled) {
    throw new MarketGuardError("Market is canceled", 400);
  }
  if (market.status !== "LIVE") {
    throw new MarketGuardError("Market is not open for trading", 400);
  }
};

const enforceBinaryPriceSumInvariant = async (tx: Tx, marketId: string) => {
  const outcomes = await tx.outcome.findMany({
    where: { marketId, isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (outcomes.length !== 2) {
    return;
  }

  const [o1, o2] = outcomes;
  const [bestBid1, bestBid2, bestAsk1, bestAsk2] = await Promise.all([
    tx.order.findFirst({
      where: {
        marketId,
        outcomeId: o1.id,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "desc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
    tx.order.findFirst({
      where: {
        marketId,
        outcomeId: o2.id,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "desc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
    tx.order.findFirst({
      where: {
        marketId,
        outcomeId: o1.id,
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
    tx.order.findFirst({
      where: {
        marketId,
        outcomeId: o2.id,
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
  ]);

  if (bestBid1?.price && bestBid2?.price) {
    const sumBids = toDec(bestBid1.price).add(bestBid2.price);
    if (sumBids.gt(ONE.add(BINARY_INVARIANT_TOLERANCE))) {
      throw new MarketGuardError(
        "Binary invariant violation: best_bid_yes + best_bid_no must be <= 1",
        409
      );
    }
  }

  if (bestAsk1?.price && bestAsk2?.price) {
    const sumAsks = toDec(bestAsk1.price).add(bestAsk2.price);
    if (sumAsks.lt(ONE.sub(BINARY_INVARIANT_TOLERANCE))) {
      throw new MarketGuardError(
        "Binary invariant violation: best_ask_yes + best_ask_no must be >= 1",
        409
      );
    }
  }
};

const maxDecimal = (a: Prisma.Decimal | null, b: Prisma.Decimal | null) => {
  if (!a) return b;
  if (!b) return a;
  return a.gte(b) ? a : b;
};

const minDecimal = (a: Prisma.Decimal | null, b: Prisma.Decimal | null) => {
  if (!a) return b;
  if (!b) return a;
  return a.lte(b) ? a : b;
};

const ensureRestingBinaryInvariant = async (
  tx: Tx,
  params: {
    marketId: string;
    orderId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
    price: Prisma.Decimal;
    remaining: Prisma.Decimal;
  }
) => {
  if (params.remaining.lte(0)) {
    return;
  }

  const outcomes = await tx.outcome.findMany({
    where: { marketId: params.marketId, isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (outcomes.length !== 2) {
    return;
  }

  const sibling = outcomes.find((outcome) => outcome.id !== params.outcomeId);
  if (!sibling) {
    return;
  }

  const [sameBestBid, sameBestAsk, siblingBestBid, siblingBestAsk] = await Promise.all([
    tx.order.findFirst({
      where: {
        marketId: params.marketId,
        outcomeId: params.outcomeId,
        id: { not: params.orderId },
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "desc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
    tx.order.findFirst({
      where: {
        marketId: params.marketId,
        outcomeId: params.outcomeId,
        id: { not: params.orderId },
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
    tx.order.findFirst({
      where: {
        marketId: params.marketId,
        outcomeId: sibling.id,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "desc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
    tx.order.findFirst({
      where: {
        marketId: params.marketId,
        outcomeId: sibling.id,
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: ZERO },
      },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      select: { price: true },
    }),
  ]);

  const resultingBestBid =
    params.side === "BUY"
      ? maxDecimal(sameBestBid?.price ?? null, params.price)
      : sameBestBid?.price ?? null;
  const resultingBestAsk =
    params.side === "SELL"
      ? minDecimal(sameBestAsk?.price ?? null, params.price)
      : sameBestAsk?.price ?? null;

  if (resultingBestBid && siblingBestBid?.price) {
    const sumBids = toDec(resultingBestBid).add(siblingBestBid.price);
    if (sumBids.gt(ONE.add(BINARY_INVARIANT_TOLERANCE))) {
      throw new MarketGuardError(
        "Binary invariant violation: resting order would make best_bid_yes + best_bid_no exceed 1",
        409
      );
    }
  }

  if (resultingBestAsk && siblingBestAsk?.price) {
    const sumAsks = toDec(resultingBestAsk).add(siblingBestAsk.price);
    if (sumAsks.lt(ONE.sub(BINARY_INVARIANT_TOLERANCE))) {
      throw new MarketGuardError(
        "Binary invariant violation: resting order would make best_ask_yes + best_ask_no fall below 1",
        409
      );
    }
  }
};

const ensureBalanceRowLocked = async (tx: Tx, userId: string): Promise<LockedBalanceRow> => {
  await tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const rows = await tx.$queryRaw<LockedBalanceRow[]>`
    SELECT "userId", "availableUSDC", "lockedUSDC"
    FROM "UserBalance"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new MarketGuardError("User balance row lock failed", 500);
  }
  return row;
};

const lockOrderRow = async (tx: Tx, orderId: string): Promise<LockedOrderRow | null> => {
  const rows = await tx.$queryRaw<LockedOrderRow[]>`
    SELECT "id", "userId", "marketId", "outcomeId", "side", "price", "amount", "remaining", "reservedNotional", "status", "createdAt"
    FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
};

const lockPositionRow = async (
  tx: Tx,
  userId: string,
  marketId: string,
  outcomeId: string
): Promise<LockedPositionRow | null> => {
  const rows = await tx.$queryRaw<LockedPositionRow[]>`
    SELECT "id", "userId", "marketId", "outcomeId", "shares", "avgCost", "reservedShares", "realizedPnl"
    FROM "Position"
    WHERE "userId" = ${userId}
      AND "marketId" = ${marketId}
      AND "outcomeId" = ${outcomeId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
};

const lockMakersForMatch = async (
  tx: Tx,
  params: {
    marketId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
    userId: string;
    price: Prisma.Decimal;
  }
): Promise<LockedOrderRow[]> => {
  if (params.side === "BUY") {
    return tx.$queryRaw<LockedOrderRow[]>`
      SELECT "id", "userId", "marketId", "outcomeId", "side", "price", "amount", "remaining", "reservedNotional", "status", "createdAt"
      FROM "Order"
      WHERE "marketId" = ${params.marketId}
        AND "outcomeId" = ${params.outcomeId}
        AND "userId" <> ${params.userId}
        AND "side" = 'SELL'::"TradeSide"
        AND "status" IN ('OPEN'::"OrderStatus", 'PARTIAL'::"OrderStatus")
        AND "remaining" > 0
        AND "price" <= ${params.price}
      ORDER BY "price" ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
    `;
  }

  return tx.$queryRaw<LockedOrderRow[]>`
    SELECT "id", "userId", "marketId", "outcomeId", "side", "price", "amount", "remaining", "reservedNotional", "status", "createdAt"
    FROM "Order"
    WHERE "marketId" = ${params.marketId}
      AND "outcomeId" = ${params.outcomeId}
      AND "userId" <> ${params.userId}
      AND "side" = 'BUY'::"TradeSide"
      AND "status" IN ('OPEN'::"OrderStatus", 'PARTIAL'::"OrderStatus")
      AND "remaining" > 0
      AND "price" >= ${params.price}
    ORDER BY "price" DESC, "createdAt" ASC
    FOR UPDATE SKIP LOCKED
  `;
};

const ensureNoSelfCrossingRestingOrder = async (
  tx: Tx,
  params: {
    marketId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
    userId: string;
    price: Prisma.Decimal;
  }
) => {
  const crossingOwnOrders =
    params.side === "BUY"
      ? await tx.$queryRaw<LockedOrderRow[]>`
          SELECT "id", "userId", "marketId", "outcomeId", "side", "price", "amount", "remaining", "reservedNotional", "status", "createdAt"
          FROM "Order"
          WHERE "marketId" = ${params.marketId}
            AND "outcomeId" = ${params.outcomeId}
            AND "userId" = ${params.userId}
            AND "side" = 'SELL'::"TradeSide"
            AND "status" IN ('OPEN'::"OrderStatus", 'PARTIAL'::"OrderStatus")
            AND "remaining" > 0
            AND "price" <= ${params.price}
          ORDER BY "price" ASC, "createdAt" ASC
          FOR UPDATE
        `
      : await tx.$queryRaw<LockedOrderRow[]>`
          SELECT "id", "userId", "marketId", "outcomeId", "side", "price", "amount", "remaining", "reservedNotional", "status", "createdAt"
          FROM "Order"
          WHERE "marketId" = ${params.marketId}
            AND "outcomeId" = ${params.outcomeId}
            AND "userId" = ${params.userId}
            AND "side" = 'BUY'::"TradeSide"
            AND "status" IN ('OPEN'::"OrderStatus", 'PARTIAL'::"OrderStatus")
            AND "remaining" > 0
            AND "price" >= ${params.price}
          ORDER BY "price" DESC, "createdAt" ASC
          FOR UPDATE
        `;

  if (crossingOwnOrders.length > 0) {
    throw new MarketGuardError("Self-crossing order would cross existing own order", 409);
  }
};

const createLedgerEntry = async (
  tx: Tx,
  data: {
    userId: string;
    reason: "LOCK" | "UNLOCK" | "FILL" | "SELL" | "FEE";
    operation: "LOCK" | "UNLOCK" | "FILL" | "TRADE";
    idempotencyKey?: string;
    referenceType?: string;
    referenceId?: string;
    deltaAvailableUSDC?: Prisma.Decimal;
    deltaLockedUSDC?: Prisma.Decimal;
    amountDelta?: Prisma.Decimal;
  }
) =>
  tx.ledgerEntry.create({
    data: {
      userId: data.userId,
      reason: data.reason,
      operation: data.operation,
      idempotencyKey: data.idempotencyKey,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      deltaAvailableUSDC: data.deltaAvailableUSDC,
      deltaLockedUSDC: data.deltaLockedUSDC,
      amountDelta: data.amountDelta ?? ZERO,
    },
  });

const lockBalancesInOrder = async (tx: Tx, userIds: string[]) => {
  const dedup = Array.from(new Set(userIds)).sort();
  const map = new Map<string, LockedBalanceRow>();
  for (const userId of dedup) {
    map.set(userId, await ensureBalanceRowLocked(tx, userId));
  }
  return map;
};

const lockPositionsInOrder = async (
  tx: Tx,
  refs: Array<{ userId: string; marketId: string; outcomeId: string }>
) => {
  const dedup = new Map<string, { userId: string; marketId: string; outcomeId: string }>();
  for (const ref of refs) {
    dedup.set(`${ref.userId}:${ref.marketId}:${ref.outcomeId}`, ref);
  }
  const ordered = Array.from(dedup.values()).sort((a, b) => a.userId.localeCompare(b.userId));
  const map = new Map<string, LockedPositionRow | null>();
  for (const ref of ordered) {
    map.set(
      `${ref.userId}:${ref.marketId}:${ref.outcomeId}`,
      await lockPositionRow(tx, ref.userId, ref.marketId, ref.outcomeId)
    );
  }
  return map;
};

const ensurePlatformUserId = async (tx: Tx): Promise<string> => {
  const user = await tx.user.upsert({
    where: { username: PLATFORM_USERNAME },
    update: { email: `${PLATFORM_USERNAME}@kaoshi.local` },
    create: {
      username: PLATFORM_USERNAME,
      email: `${PLATFORM_USERNAME}@kaoshi.local`,
      displayName: "Platform Fees",
    },
    select: { id: true },
  });
  await tx.userBalance.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  return user.id;
};

export const placeOrderAndMatch = async (params: {
  marketId: string;
  userId: string;
  outcomeId: string;
  apiCredentialId?: string | null;
  side: "BUY" | "SELL";
  type?: "LIMIT" | "MARKET";
  price: string | number | Prisma.Decimal;
  size: string | number | Prisma.Decimal;
  maxSpend?: string | number | Prisma.Decimal | null;
}) => {
  const market = await prisma.market.findUnique({
    where: { id: params.marketId },
    include: { outcomes: { where: { isActive: true }, select: { id: true } } },
  });
  if (!market) {
    throw new MarketGuardError("Market not found", 404);
  }
  await assertMarketVisibleToUser({ market, userId: params.userId });
  ensurePublicOrderbookLive(market);
  if (!market.outcomes.some((o) => o.id === params.outcomeId)) {
    throw new MarketGuardError("Invalid outcome", 400);
  }

  const orderType = params.type ?? "LIMIT";
  const price = clampPrice(toDec(params.price));
  const size = normalizeSize(toDec(params.size));
  const maxSpend = params.maxSpend == null ? null : toUsdcDown(toDec(params.maxSpend));
  if (size.lte(0)) {
    throw new MarketGuardError("Size must be greater than zero", 400);
  }

  return prisma.$transaction(async (tx) => {
    await assertPublicOrderbookCollateralInvariant(tx, params.marketId);
    const platformUserId = await ensurePlatformUserId(tx);
    await ensureNoSelfCrossingRestingOrder(tx, {
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      side: params.side,
      userId: params.userId,
      price,
    });
    const incomingReservedInitial =
      params.side === "BUY"
        ? orderType === "MARKET"
          ? maxSpend ?? toUsdcUp(notionalFor(size, price))
          : toUsdcUp(notionalFor(size, price))
        : ZERO;

    if (params.side === "BUY") {
      const takerBalance = await ensureBalanceRowLocked(tx, params.userId);
      if (toDec(takerBalance.availableUSDC).lt(incomingReservedInitial)) {
        throw new MarketGuardError("Insufficient available USDC", 409);
      }
      await tx.userBalance.update({
        where: { userId: params.userId },
        data: {
          availableUSDC: { decrement: incomingReservedInitial },
          lockedUSDC: { increment: incomingReservedInitial },
        },
      });
    } else {
      const pos = await lockPositionRow(tx, params.userId, params.marketId, params.outcomeId);
      if (!pos) {
        throw new MarketGuardError("Insufficient shares", 409);
      }
      const held = toDec(pos.shares);
      const reserved = toDec(pos.reservedShares ?? ZERO);
      const availableShares = held.sub(reserved);
      if (availableShares.lt(size)) {
        throw new MarketGuardError("Insufficient available shares", 409);
      }
      await tx.position.update({
        where: { id: pos.id },
        data: { reservedShares: reserved.add(size) },
      });
    }

    const incoming = await tx.order.create({
      data: {
        marketId: params.marketId,
        userId: params.userId,
        outcomeId: params.outcomeId,
        createdApiCredentialId: params.apiCredentialId ?? null,
        side: params.side,
        price,
        amount: size,
        remaining: size,
        reservedNotional: incomingReservedInitial,
        status: "OPEN",
      },
    });

    if (params.side === "BUY" && incomingReservedInitial.gt(0)) {
      await createLedgerEntry(tx, {
        userId: params.userId,
        reason: "LOCK",
        operation: "LOCK",
        idempotencyKey: `lock:${incoming.id}`,
        referenceType: "Order",
        referenceId: incoming.id,
        deltaAvailableUSDC: incomingReservedInitial.neg(),
        deltaLockedUSDC: incomingReservedInitial,
        amountDelta: ZERO,
      });
    }

    let incomingRemaining = toDec(incoming.remaining);
    let incomingReserved = toDec(incoming.reservedNotional);
    const fills: Array<{
      id: string;
      takerOrderId: string;
      makerOrderId: string;
      price: string;
      size: string;
      notionalUSDC: string;
      feeUSDC: string;
    }> = [];

    const makers = await lockMakersForMatch(tx, {
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      side: params.side,
      userId: params.userId,
      price,
    });

    for (const maker of makers) {
      if (incomingRemaining.lte(0)) break;
      if (maker.remaining.lte(0)) continue;

      const fillSize = maker.remaining.lt(incomingRemaining)
        ? toDec(maker.remaining)
        : toDec(incomingRemaining);
      if (fillSize.lte(0)) continue;

      const tradePrice = toDec(maker.price);
      const notionalUSDC = toUsdcDown(notionalFor(fillSize, tradePrice));
      if (orderType === "MARKET" && params.side === "BUY" && maxSpend) {
        const spentSoFar = incomingReservedInitial.sub(incomingReserved);
        if (spentSoFar.add(notionalUSDC).gt(maxSpend)) {
          break;
        }
      }
      const feeUSDC = toUsdcDown(notionalUSDC.mul(FEE_BPS).div(ONE_HUNDRED));
      const sellerCreditUSDC = notionalUSDC.sub(feeUSDC);

      const buyerId = params.side === "BUY" ? params.userId : maker.userId;
      const sellerId = params.side === "SELL" ? params.userId : maker.userId;
      const buyerOrderId = params.side === "BUY" ? incoming.id : maker.id;
      const sellerOrderId = params.side === "SELL" ? incoming.id : maker.id;
      const buyerLimitPrice = params.side === "BUY"
        ? toDec(incoming.price)
        : toDec(maker.price);
      const buyerOrderRemainingBefore = params.side === "BUY"
        ? toDec(incomingRemaining)
        : toDec(maker.remaining);
      const buyerOrderRemainingAfter = buyerOrderRemainingBefore.sub(fillSize);
      const buyerOrderExpectedBefore = toUsdcUp(notionalFor(buyerOrderRemainingBefore, buyerLimitPrice));
      const buyerOrderExpectedAfter = toUsdcUp(notionalFor(buyerOrderRemainingAfter, buyerLimitPrice));

      let buyerOrderReservedBefore = params.side === "BUY"
        ? toDec(incomingReserved)
        : toDec(maker.reservedNotional ?? ZERO);

      const balances = await lockBalancesInOrder(tx, [buyerId, sellerId, platformUserId]);
      const buyerBalance = balances.get(buyerId);
      const sellerBalance = balances.get(sellerId);
      const platformBalance = balances.get(platformUserId);
      if (!buyerBalance || !sellerBalance || !platformBalance) {
        throw new MarketGuardError("Failed to lock balances for fill", 500);
      }

      let buyerAvailableBefore = toDec(buyerBalance.availableUSDC);
      let buyerLockedBefore = toDec(buyerBalance.lockedUSDC);
      let buyerTopUp = ZERO;
      if (buyerOrderReservedBefore.lt(buyerOrderExpectedBefore)) {
        const deficit = buyerOrderExpectedBefore.sub(buyerOrderReservedBefore);
        if (buyerAvailableBefore.lt(deficit)) {
          continue;
        }
        buyerTopUp = deficit;
        buyerOrderReservedBefore = buyerOrderReservedBefore.add(deficit);
      }
      const reservedConsumption = buyerOrderReservedBefore.sub(buyerOrderExpectedAfter);
      ensureNonNegative(reservedConsumption, "Buyer reservation consumption cannot be negative");
      if (buyerLockedBefore.add(buyerTopUp).lt(reservedConsumption)) {
        continue;
      }

      const positions = await lockPositionsInOrder(tx, [
        { userId: buyerId, marketId: params.marketId, outcomeId: params.outcomeId },
        { userId: sellerId, marketId: params.marketId, outcomeId: params.outcomeId },
      ]);
      const sellerPos = positions.get(`${sellerId}:${params.marketId}:${params.outcomeId}`);
      const buyerPos = positions.get(`${buyerId}:${params.marketId}:${params.outcomeId}`);
      if (!sellerPos) {
        continue;
      }
      const sellerSharesBefore = toDec(sellerPos.shares);
      const sellerReservedBefore = toDec(sellerPos.reservedShares ?? ZERO);
      if (sellerSharesBefore.lt(fillSize) || sellerReservedBefore.lt(fillSize)) {
        if (maker.side === "SELL") {
          await tx.order.update({
            where: { id: maker.id },
            data: { status: "CANCELED" },
          });
        }
        continue;
      }

      const buyerRefund = reservedConsumption.sub(notionalUSDC);
      ensureNonNegative(buyerRefund, "Negative buyer refund detected");

      const buyerAvailableAfter = buyerAvailableBefore.sub(buyerTopUp).add(buyerRefund);
      const buyerLockedAfter = buyerLockedBefore.add(buyerTopUp).sub(reservedConsumption);
      ensureNonNegative(buyerAvailableAfter, "Buyer available USDC cannot go negative");
      ensureNonNegative(buyerLockedAfter, "Buyer locked USDC cannot go negative");

      await tx.userBalance.update({
        where: { userId: buyerId },
        data: {
          availableUSDC: buyerAvailableAfter,
          lockedUSDC: buyerLockedAfter,
        },
      });
      await tx.userBalance.update({
        where: { userId: sellerId },
        data: { availableUSDC: { increment: sellerCreditUSDC } },
      });
      await tx.userBalance.update({
        where: { userId: platformUserId },
        data: { availableUSDC: { increment: feeUSDC } },
      });

      if (buyerTopUp.gt(0)) {
        await createLedgerEntry(tx, {
          userId: buyerId,
          reason: "LOCK",
          operation: "LOCK",
          idempotencyKey: `lock:topup:${buyerOrderId}:${maker.id}:${incoming.id}`,
          referenceType: "Order",
          referenceId: buyerOrderId,
          deltaAvailableUSDC: buyerTopUp.neg(),
          deltaLockedUSDC: buyerTopUp,
          amountDelta: ZERO,
        });
      }

      const fill = await tx.fill.create({
        data: {
          takerOrderId: incoming.id,
          makerOrderId: maker.id,
          takerUserId: params.userId,
          makerUserId: maker.userId,
          marketId: params.marketId,
          outcomeId: params.outcomeId,
          side: params.side,
          price: tradePrice,
          size: fillSize,
          notionalUSDC,
          feeUSDC,
        },
      });

      await createLedgerEntry(tx, {
        userId: buyerId,
        reason: "FILL",
        operation: "FILL",
        idempotencyKey: `fill:${fill.id}:buyer`,
        referenceType: "Fill",
        referenceId: fill.id,
        deltaAvailableUSDC: buyerRefund,
        deltaLockedUSDC: reservedConsumption.neg(),
        amountDelta: notionalUSDC.neg(),
      });
      await createLedgerEntry(tx, {
        userId: sellerId,
        reason: "SELL",
        operation: "TRADE",
        idempotencyKey: `fill:${fill.id}:seller`,
        referenceType: "Fill",
        referenceId: fill.id,
        deltaAvailableUSDC: sellerCreditUSDC,
        deltaLockedUSDC: ZERO,
        amountDelta: sellerCreditUSDC,
      });
      await createLedgerEntry(tx, {
        userId: platformUserId,
        reason: "FEE",
        operation: "TRADE",
        idempotencyKey: `fill:${fill.id}:fee`,
        referenceType: "Fill",
        referenceId: fill.id,
        deltaAvailableUSDC: feeUSDC,
        deltaLockedUSDC: ZERO,
        amountDelta: feeUSDC,
      });

      await tx.trade.createMany({
        data: [
          {
            userId: buyerId,
            marketId: params.marketId,
            outcomeId: params.outcomeId,
            side: "BUY",
            shares: fillSize,
            cost: notionalUSDC,
            fee: ZERO,
          },
          {
            userId: sellerId,
            marketId: params.marketId,
            outcomeId: params.outcomeId,
            side: "SELL",
            shares: fillSize,
            cost: notionalUSDC,
            fee: feeUSDC,
          },
        ],
      });

      const sellerAvgCost = toDec(sellerPos.avgCost);
      const sellerSharesAfter = sellerSharesBefore.sub(fillSize);
      const sellerReservedAfter = sellerReservedBefore.sub(fillSize);
      const realizedDelta = tradePrice.sub(sellerAvgCost).mul(fillSize).sub(feeUSDC);
      await tx.position.update({
        where: { id: sellerPos.id },
        data: {
          shares: sellerSharesAfter.lte(0) ? ZERO : sellerSharesAfter,
          avgCost: sellerSharesAfter.lte(0) ? ZERO : sellerAvgCost,
          reservedShares: sellerReservedAfter,
          realizedPnl: toDec(sellerPos.realizedPnl).add(realizedDelta),
        },
      });

      if (buyerPos) {
        const buyerSharesBefore = toDec(buyerPos.shares);
        const buyerSharesAfter = buyerSharesBefore.add(fillSize);
        const buyerCostBasis = toDec(buyerPos.avgCost).mul(buyerSharesBefore);
        const buyerAvgAfter = buyerCostBasis.add(notionalUSDC).div(buyerSharesAfter);
        await tx.position.update({
          where: { id: buyerPos.id },
          data: {
            shares: buyerSharesAfter,
            avgCost: buyerAvgAfter,
          },
        });
      } else {
        await tx.position.create({
          data: {
            userId: buyerId,
            marketId: params.marketId,
            outcomeId: params.outcomeId,
            shares: fillSize,
            avgCost: tradePrice,
            reservedShares: ZERO,
            realizedPnl: ZERO,
          },
        });
      }

      const makerRemainingAfter = toDec(maker.remaining).sub(fillSize);
      const makerReservedAfter = maker.side === "BUY"
        ? buyerOrderExpectedAfter
        : toDec(maker.reservedNotional ?? ZERO);
      ensureNonNegative(makerReservedAfter, "Maker reserved notional cannot go negative");
      await tx.order.update({
        where: { id: maker.id },
        data: {
          remaining: makerRemainingAfter,
          reservedNotional: makerReservedAfter,
          status: makerRemainingAfter.eq(0) ? "FILLED" : "PARTIAL",
        },
      });
      maker.remaining = makerRemainingAfter;
      maker.reservedNotional = makerReservedAfter;

      incomingRemaining = incomingRemaining.sub(fillSize);
      if (params.side === "BUY") {
        incomingReserved = buyerOrderExpectedAfter;
        ensureNonNegative(incomingReserved, "Incoming reserved notional cannot go negative");
      }

      fills.push({
        id: fill.id,
        takerOrderId: fill.takerOrderId,
        makerOrderId: fill.makerOrderId,
        price: fill.price.toString(),
        size: fill.size.toString(),
        notionalUSDC: fill.notionalUSDC.toString(),
        feeUSDC: fill.feeUSDC.toString(),
      });
    }

    let incomingStatus: OrderStatus =
      incomingRemaining.eq(size) ? "OPEN" : incomingRemaining.eq(0) ? "FILLED" : "PARTIAL";

    if (orderType === "MARKET") {
      if (params.side === "BUY" && incomingReserved.gt(0)) {
        const balance = await ensureBalanceRowLocked(tx, params.userId);
        if (toDec(balance.lockedUSDC).lt(incomingReserved)) {
          throw new MarketGuardError("Insufficient locked USDC for market cleanup", 409);
        }
        await tx.userBalance.update({
          where: { userId: params.userId },
          data: {
            availableUSDC: { increment: incomingReserved },
            lockedUSDC: { decrement: incomingReserved },
          },
        });
        await createLedgerEntry(tx, {
          userId: params.userId,
          reason: "UNLOCK",
          operation: "UNLOCK",
          idempotencyKey: `unlock:${incoming.id}:market`,
          referenceType: "Order",
          referenceId: incoming.id,
          deltaAvailableUSDC: incomingReserved,
          deltaLockedUSDC: incomingReserved.neg(),
          amountDelta: ZERO,
        });
      }

      if (params.side === "SELL" && incomingRemaining.gt(0)) {
        const position = await lockPositionRow(tx, params.userId, params.marketId, params.outcomeId);
        if (!position) {
          throw new MarketGuardError("Position not found during market cleanup", 409);
        }
        const reserved = toDec(position.reservedShares ?? ZERO);
        if (reserved.lt(incomingRemaining)) {
          throw new MarketGuardError("Insufficient reserved shares for market cleanup", 409);
        }
        await tx.position.update({
          where: { id: position.id },
          data: { reservedShares: reserved.sub(incomingRemaining) },
        });
      }

      incomingRemaining = ZERO;
      incomingReserved = ZERO;
      incomingStatus = fills.length > 0 ? "FILLED" : "CANCELED";
    } else if (params.side === "BUY") {
      const expectedReserved = toUsdcUp(notionalFor(incomingRemaining, price));
      if (!incomingReserved.eq(expectedReserved)) {
        throw new MarketGuardError("BUY reservation invariant failed", 500);
      }
    }

    if (orderType === "LIMIT") {
      await ensureRestingBinaryInvariant(tx, {
        marketId: params.marketId,
        orderId: incoming.id,
        outcomeId: params.outcomeId,
        side: params.side,
        price,
        remaining: incomingRemaining,
      });
    }

    const updatedIncoming = await tx.order.update({
      where: { id: incoming.id },
      data: {
        remaining: incomingRemaining,
        reservedNotional: params.side === "BUY" ? incomingReserved : ZERO,
        status: incomingStatus,
      },
    });

    const [balance, position] = await Promise.all([
      tx.userBalance.findUnique({ where: { userId: params.userId } }),
      tx.position.findUnique({
        where: {
          userId_marketId_outcomeId: {
            userId: params.userId,
            marketId: params.marketId,
            outcomeId: params.outcomeId,
          },
        },
      }),
    ]);

    await enforceBinaryPriceSumInvariant(tx, params.marketId);
    await assertPublicOrderbookCollateralInvariant(tx, params.marketId);

    const filledShares = sumDecimalStrings(fills.map((fill) => fill.size));
    const actualNotionalUSDC = sumDecimalStrings(fills.map((fill) => fill.notionalUSDC));
    const actualFeesUSDC = sumDecimalStrings(fills.map((fill) => fill.feeUSDC));
    const averageFillPrice = filledShares.gt(0)
      ? actualNotionalUSDC.div(filledShares).toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP)
      : null;
    const estimatedNotionalAtLimit = filledShares.gt(0)
      ? toUsdcUp(notionalFor(filledShares, price))
      : ZERO;
    const priceImprovementUSDC = filledShares.gt(0)
      ? params.side === "BUY"
        ? Prisma.Decimal.max(ZERO, estimatedNotionalAtLimit.sub(actualNotionalUSDC))
        : Prisma.Decimal.max(ZERO, actualNotionalUSDC.sub(estimatedNotionalAtLimit))
      : ZERO;
    const requestedNotionalUSDC = params.side === "BUY"
      ? incomingReservedInitial
      : toUsdcUp(notionalFor(size, price));
    const remainingUnfilledShares = Prisma.Decimal.max(ZERO, size.sub(filledShares));

    return {
      order: {
        id: updatedIncoming.id,
        marketId: updatedIncoming.marketId,
        outcomeId: updatedIncoming.outcomeId,
        side: updatedIncoming.side,
        price: updatedIncoming.price.toString(),
        size: updatedIncoming.amount.toString(),
        remaining: updatedIncoming.remaining.toString(),
        reservedNotional: updatedIncoming.reservedNotional.toString(),
        status: updatedIncoming.status,
      },
      fills,
      execution: {
        side: params.side,
        orderType,
        submittedLimitPrice: price.toString(),
        requestedShares: size.toString(),
        requestedNotionalUSDC: requestedNotionalUSDC.toString(),
        maxCostUSDC: params.side === "BUY" ? incomingReservedInitial.toString() : null,
        filledShares: filledShares.toString(),
        averageFillPrice: averageFillPrice?.toString() ?? null,
        actualNotionalUSDC: actualNotionalUSDC.toString(),
        actualFeesUSDC: actualFeesUSDC.toString(),
        actualProceedsUSDC: params.side === "SELL" ? actualNotionalUSDC.sub(actualFeesUSDC).toString() : null,
        priceImprovementUSDC: priceImprovementUSDC.toString(),
        remainingUnfilledShares: remainingUnfilledShares.toString(),
        status: updatedIncoming.status,
      },
      balance: balance
        ? {
            availableUSDC: balance.availableUSDC.toString(),
            lockedUSDC: balance.lockedUSDC.toString(),
          }
        : null,
      position: position
        ? {
            shares: position.shares.toString(),
            reservedShares: position.reservedShares.toString(),
            avgCost: position.avgCost.toString(),
            realizedPnl: position.realizedPnl.toString(),
          }
        : null,
    };
  });
};

export const cancelOrderAndUnlock = async (params: {
  orderId: string;
  userId: string;
  apiCredentialId?: string | null;
}) => {
  return prisma.$transaction(async (tx) => {
    const order = await lockOrderRow(tx, params.orderId);
    if (!order) {
      throw new MarketGuardError("Order not found", 404);
    }
    if (order.userId !== params.userId) {
      throw new MarketGuardError("Forbidden", 403);
    }
    if ((order.status !== "OPEN" && order.status !== "PARTIAL") || order.remaining.lte(0)) {
      throw new MarketGuardError("Order cannot be canceled", 400);
    }

    let balanceAfter: { availableUSDC: string; lockedUSDC: string } | null = null;
    let positionAfter: { shares: number; reservedShares: string } | null = null;

    if (order.side === "BUY") {
      const unlockUSDC = toDec(order.reservedNotional ?? ZERO);
      const balance = await ensureBalanceRowLocked(tx, params.userId);
      if (toDec(balance.lockedUSDC).lt(unlockUSDC)) {
        throw new MarketGuardError("Insufficient locked USDC for cancel", 409);
      }
      const updated = await tx.userBalance.update({
        where: { userId: params.userId },
        data: {
          availableUSDC: { increment: unlockUSDC },
          lockedUSDC: { decrement: unlockUSDC },
        },
      });
      await createLedgerEntry(tx, {
        userId: params.userId,
        reason: "UNLOCK",
        operation: "UNLOCK",
        idempotencyKey: `unlock:${order.id}`,
        referenceType: "Order",
        referenceId: order.id,
        deltaAvailableUSDC: unlockUSDC,
        deltaLockedUSDC: unlockUSDC.neg(),
        amountDelta: ZERO,
      });
      balanceAfter = {
        availableUSDC: updated.availableUSDC.toString(),
        lockedUSDC: updated.lockedUSDC.toString(),
      };
    } else {
      const position = await lockPositionRow(tx, params.userId, order.marketId, order.outcomeId);
      if (!position) {
        throw new MarketGuardError("Position not found", 409);
      }
      const reserved = toDec(position.reservedShares ?? ZERO);
      if (reserved.lt(order.remaining)) {
        throw new MarketGuardError("Insufficient locked shares for cancel", 409);
      }
      const updated = await tx.position.update({
        where: { id: position.id },
        data: {
          reservedShares: reserved.sub(order.remaining),
        },
      });
      positionAfter = {
        shares: Number(updated.shares),
        reservedShares: updated.reservedShares.toString(),
      };
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELED",
        reservedNotional: ZERO,
        canceledByApiCredentialId: params.apiCredentialId ?? null,
      },
    });

    return {
      order: {
        id: updatedOrder.id,
        marketId: updatedOrder.marketId,
        outcomeId: updatedOrder.outcomeId,
        side: updatedOrder.side,
        price: updatedOrder.price.toString(),
        size: updatedOrder.amount.toString(),
        remaining: updatedOrder.remaining.toString(),
        status: updatedOrder.status,
      },
      balance: balanceAfter,
      position: positionAfter,
    };
  });
};
