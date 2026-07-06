import { Prisma, type OrderStatus, type TradeSide } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { getCustodyBalance } from "@/lib/wallet";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

const ZERO = new Prisma.Decimal(0);
const ONE = new Prisma.Decimal(1);

const oppositeSide = (side: TradeSide): TradeSide => (side === "BUY" ? "SELL" : "BUY");

const cursorFilter = (cursor: { id: string; createdAt: Date } | null) =>
  cursor
    ? {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      }
    : {};

const normalizeOrderStatuses = (status: string | null): OrderStatus[] | null => {
  if (!status) return null;
  const parts = status
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const valid: OrderStatus[] = ["OPEN", "PARTIAL", "FILLED", "CANCELED"];
  const normalized = parts.filter((item): item is OrderStatus =>
    valid.includes(item as OrderStatus)
  );

  if (normalized.length !== parts.length) {
    throw new MarketGuardError("Invalid order status filter.", 400);
  }

  return normalized;
};

export const listCanonicalOrders = async (params: {
  userId: string;
  marketId?: string | null;
  status?: string | null;
  cursor?: string | null;
  limit: number;
}) => {
  const statuses = normalizeOrderStatuses(params.status ?? null);
  const cursorRow = params.cursor
    ? await prisma.order.findFirst({
        where: {
          id: params.cursor,
          userId: params.userId,
        },
        select: { id: true, createdAt: true },
      })
    : null;

  if (params.cursor && !cursorRow) {
    throw new MarketGuardError("Invalid order cursor.", 400);
  }

  const items = await prisma.order.findMany({
    where: {
      userId: params.userId,
      ...(params.marketId ? { marketId: params.marketId } : {}),
      ...(statuses ? { status: { in: statuses } } : {}),
      ...cursorFilter(cursorRow),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit + 1,
    include: {
      outcome: {
        select: { id: true, name: true },
      },
      market: {
        select: { id: true, title: true },
      },
      apiOrderRequest: {
        select: { clientOrderId: true },
      },
      createdApiCredential: {
        select: { keyId: true },
      },
      canceledByApiCredential: {
        select: { keyId: true },
      },
    },
  });

  const page = items.slice(0, params.limit);

  return {
    items: page.map((item) => ({
      id: item.id,
      clientOrderId: item.apiOrderRequest?.clientOrderId ?? null,
      marketId: item.marketId,
      marketTitle: item.market.title,
      outcomeId: item.outcomeId,
      outcomeName: item.outcome.name,
      side: item.side,
      type: "LIMIT" as const,
      status: item.status,
      apiKeyId: item.createdApiCredential?.keyId ?? null,
      canceledByApiKeyId: item.canceledByApiCredential?.keyId ?? null,
      price: item.price,
      size: item.amount,
      remaining: item.remaining,
      reservedNotional: item.reservedNotional,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    nextCursor: items.length > params.limit ? page[page.length - 1]?.id ?? null : null,
  };
};

export const getCanonicalOrder = async (params: { userId: string; orderId: string }) => {
  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: params.userId,
    },
    include: {
      outcome: {
        select: { id: true, name: true },
      },
      market: {
        select: { id: true, title: true },
      },
      apiOrderRequest: {
        select: { clientOrderId: true },
      },
      createdApiCredential: {
        select: { keyId: true },
      },
      canceledByApiCredential: {
        select: { keyId: true },
      },
    },
  });

  if (!order) {
    throw new MarketGuardError("Order not found.", 404);
  }

  const fills = await prisma.fill.findMany({
    where: {
      OR: [{ takerOrderId: order.id }, { makerOrderId: order.id }],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return {
    order: {
      id: order.id,
      clientOrderId: order.apiOrderRequest?.clientOrderId ?? null,
      marketId: order.marketId,
      marketTitle: order.market.title,
      outcomeId: order.outcomeId,
      outcomeName: order.outcome.name,
      side: order.side,
      type: "LIMIT" as const,
      status: order.status,
      apiKeyId: order.createdApiCredential?.keyId ?? null,
      canceledByApiKeyId: order.canceledByApiCredential?.keyId ?? null,
      price: order.price,
      size: order.amount,
      remaining: order.remaining,
      reservedNotional: order.reservedNotional,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
    fills: fills.map((fill) => ({
      id: fill.id,
      orderId:
        fill.takerUserId === params.userId ? fill.takerOrderId : fill.makerOrderId,
      marketId: fill.marketId,
      outcomeId: fill.outcomeId,
      side: fill.takerUserId === params.userId ? fill.side : oppositeSide(fill.side),
      liquidityRole: fill.takerUserId === params.userId ? "TAKER" : "MAKER",
      price: fill.price,
      size: fill.size,
      notionalUSDC: fill.notionalUSDC,
      feeUSDC: fill.feeUSDC,
      createdAt: fill.createdAt,
    })),
  };
};

export const listCanonicalFills = async (params: {
  userId: string;
  marketId?: string | null;
  cursor?: string | null;
  limit: number;
}) => {
  const cursorRow = params.cursor
    ? await prisma.fill.findFirst({
        where: {
          id: params.cursor,
          OR: [{ takerUserId: params.userId }, { makerUserId: params.userId }],
        },
        select: { id: true, createdAt: true },
      })
    : null;

  if (params.cursor && !cursorRow) {
    throw new MarketGuardError("Invalid fill cursor.", 400);
  }

  const items = await prisma.fill.findMany({
    where: {
      OR: [{ takerUserId: params.userId }, { makerUserId: params.userId }],
      ...(params.marketId ? { marketId: params.marketId } : {}),
      ...cursorFilter(cursorRow),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit + 1,
  });

  const page = items.slice(0, params.limit);

  return {
    items: page.map((fill) => {
      const isTaker = fill.takerUserId === params.userId;
      return {
        id: fill.id,
        orderId: isTaker ? fill.takerOrderId : fill.makerOrderId,
        marketId: fill.marketId,
        outcomeId: fill.outcomeId,
        side: isTaker ? fill.side : oppositeSide(fill.side),
        liquidityRole: isTaker ? "TAKER" : "MAKER",
        price: fill.price,
        size: fill.size,
        notionalUSDC: fill.notionalUSDC,
        feeUSDC: fill.feeUSDC,
        createdAt: fill.createdAt,
      };
    }),
    nextCursor: items.length > params.limit ? page[page.length - 1]?.id ?? null : null,
  };
};

export const getCanonicalAccountBalance = async (userId: string) => {
  const balance = await getCustodyBalance(userId);
  return {
    availableUSDC: balance.availableUSDC,
    lockedUSDC: balance.lockedUSDC,
    totalUSDC: balance.totalUSDC,
    updatedAt: balance.updatedAt,
  };
};

export const getCanonicalAccountProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      image: true,
      hasCustomAvatar: true,
      isAdmin: true,
      createdAt: true,
      wallets: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { address: true },
      },
      accounts: {
        select: { provider: true },
      },
    },
  });

  if (!user) {
    throw new MarketGuardError("Account profile not found.", 404);
  }

  const displayName = user.displayName?.trim() || user.username;
  return {
    id: user.id,
    username: user.username,
    displayName,
    email: user.email,
    image: user.image,
    hasCustomAvatar: user.hasCustomAvatar,
    isAdmin: user.isAdmin,
    walletAddress: user.wallets[0]?.address ?? null,
    hasWalletLinked: user.wallets.length > 0 || user.accounts.some((account) => account.provider === "wallet"),
    hasGoogleLinked: user.accounts.some((account) => account.provider === "google"),
    createdAt: user.createdAt,
  };
};

export const listCanonicalPositions = async (params: {
  userId: string;
  marketId?: string | null;
}) => {
  const positions = await prisma.position.findMany({
    where: {
      userId: params.userId,
      shares: { not: ZERO },
      ...(params.marketId ? { marketId: params.marketId } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      outcome: {
        select: { id: true, name: true },
      },
      market: {
        select: { id: true, title: true, status: true, mechanism: true, visibility: true },
      },
    },
  });

  return {
    items: positions.map((position) => ({
      marketId: position.marketId,
      marketTitle: position.market.title,
      marketStatus: position.market.status,
      outcomeId: position.outcomeId,
      outcomeName: position.outcome.name,
      shares: position.shares,
      reservedShares: position.reservedShares,
      avgCost: position.avgCost,
      realizedPnl: position.realizedPnl,
      updatedAt: position.updatedAt,
    })),
  };
};

export const listCanonicalLedger = async (params: {
  userId: string;
  cursor?: string | null;
  limit: number;
}) => {
  const cursorRow = params.cursor
    ? await prisma.ledgerEntry.findFirst({
        where: {
          id: params.cursor,
          userId: params.userId,
        },
        select: { id: true, createdAt: true },
      })
    : null;

  if (params.cursor && !cursorRow) {
    throw new MarketGuardError("Invalid ledger cursor.", 400);
  }

  const items = await prisma.ledgerEntry.findMany({
    where: {
      userId: params.userId,
      ...cursorFilter(cursorRow),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit + 1,
  });

  const page = items.slice(0, params.limit);

  return {
    items: page.map((entry) => ({
      id: entry.id,
      operation: entry.operation,
      reason: entry.reason,
      currency: entry.currency,
      amountDelta: entry.amountDelta,
      deltaAvailableUSDC: entry.deltaAvailableUSDC,
      deltaLockedUSDC: entry.deltaLockedUSDC,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      txHash: entry.txHash,
      chainId: entry.chainId,
      logIndex: entry.logIndex,
      tokenAddress: entry.tokenAddress,
      createdAt: entry.createdAt,
    })),
    nextCursor: items.length > params.limit ? page[page.length - 1]?.id ?? null : null,
  };
};

export const getCanonicalMarketQuote = async (params: {
  marketId: string;
  outcomeId?: string | null;
  userId: string | null;
}) => {
  const market = await prisma.market.findUnique({
    where: { id: params.marketId },
    include: {
      outcomes: {
        where: {
          isActive: true,
          ...(params.outcomeId ? { id: params.outcomeId } : {}),
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true },
      },
    },
  });

  if (!market) {
    throw new MarketGuardError("Market not found.", 404);
  }

  await assertMarketVisibleToUser({
    market,
    userId: params.userId,
  });

  if (market.mechanism !== "ORDERBOOK") {
    throw new MarketGuardError("Quote endpoint supports ORDERBOOK markets only.", 400);
  }

  if (params.outcomeId && market.outcomes.length === 0) {
    throw new MarketGuardError("Outcome not found.", 404);
  }

  const snapshot = await buildPublicOrderbookSnapshot({
    marketId: market.id,
    outcomeId: params.outcomeId,
  });

  const quotes = await Promise.all(
    market.outcomes.map(async (outcome) => {
      const bestBid = snapshot.bids.find((level) => level.outcomeId === outcome.id) ?? null;
      const bestAsk = snapshot.asks.find((level) => level.outcomeId === outcome.id) ?? null;
      const [lastFill] = await Promise.all([
        prisma.fill.findFirst({
          where: {
            marketId: market.id,
            outcomeId: outcome.id,
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { price: true, createdAt: true },
        }),
      ]);

      const bid = bestBid ? new Prisma.Decimal(bestBid.price) : null;
      const ask = bestAsk ? new Prisma.Decimal(bestAsk.price) : null;
      const mid =
        bid && ask ? bid.add(ask).div(2) : bid ?? ask ?? null;

      return {
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        bestBid: bid,
        bestAsk: ask,
        bestBidSize: bestBid?.size ?? null,
        bestAskSize: bestAsk?.size ?? null,
        midPrice: mid,
        lastPrice: lastFill?.price ?? null,
        lastTradeAt: lastFill?.createdAt ?? null,
      };
    })
  );

  return {
    marketId: market.id,
    quotes,
  };
};
