import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { CanonicalApiError, serializeForApi } from "@/lib/canonicalApi";
import { prisma } from "@/lib/db";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { COMBO_RISK_LIMITS, validateComboRisk, type ComboRiskLeg } from "@/server/services/comboRisk";
import { worldCupEligibleMarketWhere, worldCupFreshReferenceCutoff } from "@/server/services/worldCupPublicEligibility";

const ZERO = new Prisma.Decimal(0);
const ONE = new Prisma.Decimal(1);

type ComboLegInput = {
  marketId: string;
  outcomeId: string;
  line?: string | null;
  label?: string | null;
};

type NormalizedComboRequest = {
  idempotencyKey: string;
  clientOrderId: string | null;
  stakeUSDC: Prisma.Decimal;
  requestFingerprint: string;
  requestBody: Prisma.InputJsonObject;
  legs: Array<{
    marketId: string;
    outcomeId: string;
    line: string | null;
    label: string;
  }>;
};

type ServerPricedComboLeg = NormalizedComboRequest["legs"][number] & {
  price: Prisma.Decimal;
};

const parsePositiveDecimal = (value: unknown, fieldName: string, maxScale: number) => {
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
    throw new CanonicalApiError("INVALID_REQUEST", `${fieldName} supports up to ${maxScale} decimals.`, 400);
  }
  return decimal;
};

const buildFingerprint = (body: Prisma.InputJsonObject) =>
  createHash("sha256").update(JSON.stringify(body)).digest("hex");

const parseServerPrice = (value: number, outcomeId: string) => {
  const price = new Prisma.Decimal(value).toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);
  if (!price.isFinite() || price.lte(ZERO) || price.gt(ONE)) {
    throw new CanonicalApiError("COMBO_PRICE_UNAVAILABLE", `Server price is unavailable for outcome ${outcomeId}.`, 409);
  }
  return price;
};

const findExistingComboOrder = async (params: {
  userId: string;
  idempotencyKey: string;
  clientOrderId: string | null;
}) =>
  prisma.comboOrder.findFirst({
    where: {
      userId: params.userId,
      OR: [
        { idempotencyKey: params.idempotencyKey },
        ...(params.clientOrderId ? [{ clientOrderId: params.clientOrderId }] : []),
      ],
    },
    select: { id: true, requestFingerprint: true },
  });

const returnExistingComboOrder = async (params: {
  userId: string;
  existing: { id: string; requestFingerprint: string };
  requestFingerprint: string;
}) => {
  if (params.existing.requestFingerprint !== params.requestFingerprint) {
    throw new CanonicalApiError("IDEMPOTENCY_KEY_CONFLICT", "Combo idempotency key was already used with a different payload.", 409);
  }
  return { comboOrder: serializeForApi(serializeComboOrder(await loadComboOrder(params.userId, params.existing.id))) };
};

const normalizeComboRequest = (params: {
  body: unknown;
  idempotencyKeyHeader: string | null;
}): NormalizedComboRequest => {
  const body = (params.body ?? {}) as Record<string, unknown>;
  const clientOrderId =
    typeof body.clientOrderId === "string" && body.clientOrderId.trim().length > 0
      ? body.clientOrderId.trim()
      : null;
  const idempotencyKey = params.idempotencyKeyHeader?.trim() || clientOrderId;
  if (!idempotencyKey) {
    throw new CanonicalApiError(
      "IDEMPOTENCY_KEY_REQUIRED_FOR_RETRYABLE_CLIENTS",
      "POST /api/combo-orders requires Idempotency-Key or clientOrderId.",
      400,
    );
  }

  const rawLegs = Array.isArray(body.legs) ? body.legs : null;
  if (!rawLegs || rawLegs.length < 2) {
    throw new CanonicalApiError("INVALID_REQUEST", "Combo orders require at least two legs.", 400);
  }
  if (rawLegs.length > COMBO_RISK_LIMITS.maxLegs) {
    throw new CanonicalApiError("COMBO_TOO_MANY_LEGS", `Combo orders support up to ${COMBO_RISK_LIMITS.maxLegs} legs.`, 400);
  }

  const seenMarkets = new Set<string>();
  const seenOutcomes = new Set<string>();
  const legs = rawLegs.map((rawLeg, index) => {
    const leg = (rawLeg ?? {}) as Partial<ComboLegInput>;
    const marketId = typeof leg.marketId === "string" ? leg.marketId.trim() : "";
    const outcomeId = typeof leg.outcomeId === "string" ? leg.outcomeId.trim() : "";
    if (!marketId || !outcomeId) {
      throw new CanonicalApiError("INVALID_REQUEST", "Each combo leg requires marketId and outcomeId.", 400);
    }
    if (seenMarkets.has(marketId)) {
      throw new CanonicalApiError("COMBO_DUPLICATE_MARKET", "Combo orders allow only one leg per market.", 400);
    }
    if (seenOutcomes.has(outcomeId)) {
      throw new CanonicalApiError("COMBO_DUPLICATE_OUTCOME", "Duplicate combo outcome.", 400);
    }
    seenMarkets.add(marketId);
    seenOutcomes.add(outcomeId);

    return {
      marketId,
      outcomeId,
      line: typeof leg.line === "string" && leg.line.trim() ? leg.line.trim() : null,
      label: typeof leg.label === "string" && leg.label.trim() ? leg.label.trim() : `Leg ${index + 1}`,
    };
  });

  const stakeUSDC = parsePositiveDecimal(body.stakeUSDC ?? body.amount, "stakeUSDC", 6).toDecimalPlaces(6);
  if (stakeUSDC.gt(COMBO_RISK_LIMITS.maxStakeUSDC)) {
    throw new CanonicalApiError("COMBO_STAKE_EXCEEDS_LIMIT", `Combo stake exceeds ${COMBO_RISK_LIMITS.maxStakeUSDC.toString()} USDC.`, 400);
  }
  const requestBody = {
    stakeUSDC: stakeUSDC.toString(),
    clientOrderId,
    legs: legs.map((leg) => ({
      marketId: leg.marketId,
      outcomeId: leg.outcomeId,
      line: leg.line,
      label: leg.label,
    })),
  } satisfies Prisma.InputJsonObject;

  return {
    idempotencyKey,
    clientOrderId,
    stakeUSDC,
    requestBody,
    requestFingerprint: buildFingerprint(requestBody),
    legs,
  };
};

const throwRiskError = (risk: ReturnType<typeof validateComboRisk>) => {
  const primary = risk.reasons[0];
  if (!primary) return;
  throw new CanonicalApiError(primary.code, primary.message, primary.code.includes("NOT_TRADABLE") || primary.code.includes("NOT_PUBLIC") ? 400 : 409);
};

const validateAndPriceComboLegs = async (legs: NormalizedComboRequest["legs"], stakeUSDC: Prisma.Decimal) => {
  const marketIds = legs.map((leg) => leg.marketId);
  const outcomeIds = legs.map((leg) => leg.outcomeId);
  const markets = await prisma.market.findMany({
    where: { id: { in: marketIds } },
    select: {
      id: true,
      status: true,
      visibility: true,
      mechanism: true,
      isListed: true,
      eventId: true,
      marketType: true,
      marketGroupKey: true,
      line: true,
      period: true,
      participantName: true,
      externalMarketId: true,
      conditionId: true,
      sourceUpdatedAt: true,
    },
  });
  const marketById = new Map(markets.map((market) => [market.id, market]));
  if (marketById.size !== marketIds.length) {
    throw new CanonicalApiError("INVALID_REQUEST", "One or more combo markets are invalid.", 400);
  }
  await assertComboWorldCupMarketsEligible(marketIds);

  const outcomes = await prisma.outcome.findMany({
    where: { id: { in: outcomeIds } },
    select: { id: true, marketId: true, isActive: true, isTradable: true, side: true, code: true, status: true },
  });
  const outcomeById = new Map(outcomes.map((outcome) => [outcome.id, outcome]));
  for (const leg of legs) {
    const outcome = outcomeById.get(leg.outcomeId);
    if (!outcome || outcome.marketId !== leg.marketId) {
      throw new CanonicalApiError("INVALID_REQUEST", "Combo outcome does not belong to its market.", 400);
    }
  }

  const byMarket = new Map<string, string[]>();
  for (const leg of legs) {
    byMarket.set(leg.marketId, [...(byMarket.get(leg.marketId) ?? []), leg.outcomeId]);
  }
  const quoteEntries = await Promise.all(
    Array.from(byMarket.entries()).map(async ([marketId, marketOutcomeIds]) => ({
      marketId,
      quotes: await getOutcomeQuotes(marketId, marketOutcomeIds),
    })),
  );
  const quotesByMarket = new Map(quoteEntries.map((entry) => [entry.marketId, entry.quotes]));
  const riskLegs: ComboRiskLeg[] = legs.map((leg) => ({
    ...leg,
    market: marketById.get(leg.marketId)!,
    outcome: outcomeById.get(leg.outcomeId)!,
    quote: quotesByMarket.get(leg.marketId)?.get(leg.outcomeId) ?? null,
  }));
  const initialRisk = validateComboRisk({ legs: riskLegs, stakeUSDC });
  throwRiskError(initialRisk);

  const pricedLegs = legs.map((leg) => {
    const quote = quotesByMarket.get(leg.marketId)?.get(leg.outcomeId);
    if (!quote?.hasQuote) {
      throw new CanonicalApiError("COMBO_PRICE_UNAVAILABLE", `Server price is unavailable for outcome ${leg.outcomeId}.`, 409);
    }
    return {
      ...leg,
      price: parseServerPrice(quote.mid, leg.outcomeId),
    };
  });
  const { potentialPayout } = calculateComboMath(stakeUSDC, pricedLegs);
  const finalRisk = validateComboRisk({ legs: riskLegs, stakeUSDC, potentialPayoutUSDC: potentialPayout });
  throwRiskError(finalRisk);

  return { pricedLegs, risk: finalRisk };
};

async function assertComboWorldCupMarketsEligible(marketIds: string[]) {
  const uniqueMarketIds = [...new Set(marketIds)];
  const worldCupMarkets = await prisma.market.findMany({
    where: { id: { in: uniqueMarketIds }, event: { sportKey: "soccer", leagueKey: "world_cup" } },
    select: { id: true },
  });
  if (worldCupMarkets.length === 0) return;

  const eligible = await prisma.market.findMany({
    where: { id: { in: worldCupMarkets.map((market) => market.id) }, ...worldCupEligibleMarketWhere(worldCupFreshReferenceCutoff()) },
    select: { id: true },
  });
  const eligibleIds = new Set(eligible.map((market) => market.id));
  const blocked = worldCupMarkets.find((market) => !eligibleIds.has(market.id));
  if (blocked) {
    throw new CanonicalApiError("COMBO_MARKET_NOT_TRADABLE", "World Cup combo legs require approved mapping and fresh reference pricing.", 400);
  }
}

const calculateComboMath = (stakeUSDC: Prisma.Decimal, pricedLegs: ServerPricedComboLeg[]) => {
  const comboPrice = pricedLegs
    .reduce((product, leg) => product.mul(leg.price), ONE)
    .toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);
  if (comboPrice.lte(ZERO)) {
    throw new CanonicalApiError("INVALID_REQUEST", "Combo price is invalid.", 400);
  }
  const potentialPayout = stakeUSDC.div(comboPrice).toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);
  return { comboPrice, potentialPayout };
};

export const quoteComboOrder = async (params: { body: unknown }) => {
  const normalized = normalizeComboRequest({
    body: params.body,
    idempotencyKeyHeader: "quote",
  });
  const { pricedLegs, risk } = await validateAndPriceComboLegs(normalized.legs, normalized.stakeUSDC);
  const { comboPrice, potentialPayout } = calculateComboMath(normalized.stakeUSDC, pricedLegs);
  return {
    quote: serializeForApi({
      stakeUSDC: normalized.stakeUSDC,
      comboPrice,
      potentialPayout,
      potentialProfit: potentialPayout.sub(normalized.stakeUSDC).gt(ZERO)
        ? potentialPayout.sub(normalized.stakeUSDC)
        : ZERO,
      legs: pricedLegs.map((leg, index) => ({
        marketId: leg.marketId,
        outcomeId: leg.outcomeId,
        price: leg.price,
        line: leg.line,
        label: leg.label,
        displayOrder: index,
      })),
      risk,
    }),
  };
};

const serializeComboOrder = (combo: Prisma.ComboOrderGetPayload<{
  include: {
    legs: {
      include: {
        market: { select: { id: true; title: true; status: true } };
        outcome: { select: { id: true; name: true; label: true; side: true; code: true } };
      };
    };
  };
}>) => ({
  id: combo.id,
  status: combo.status,
  stakeUSDC: combo.stakeUSDC,
  comboPrice: combo.comboPrice,
  potentialPayout: combo.potentialPayout,
  clientOrderId: combo.clientOrderId,
  createdAt: combo.createdAt,
  updatedAt: combo.updatedAt,
  legs: combo.legs
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((leg) => ({
      id: leg.id,
      marketId: leg.marketId,
      marketTitle: leg.market.title,
      marketStatus: leg.market.status,
      outcomeId: leg.outcomeId,
      outcomeName: leg.outcome.label ?? leg.outcome.name,
      outcomeSide: leg.outcome.side,
      outcomeCode: leg.outcome.code,
      price: leg.price,
      line: leg.line,
      label: leg.label,
      displayOrder: leg.displayOrder,
    })),
});

const loadComboOrder = async (userId: string, id: string) => {
  const combo = await prisma.comboOrder.findFirst({
    where: { id, userId },
    include: {
      legs: {
        include: {
          market: { select: { id: true, title: true, status: true } },
          outcome: { select: { id: true, name: true, label: true, side: true, code: true } },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!combo) {
    throw new CanonicalApiError("COMBO_ORDER_NOT_FOUND", "Combo order not found.", 404);
  }
  return combo;
};

export const submitComboOrder = async (params: {
  userId: string;
  body: unknown;
  idempotencyKeyHeader: string | null;
}) => {
  const normalized = normalizeComboRequest({
    body: params.body,
    idempotencyKeyHeader: params.idempotencyKeyHeader,
  });

  const existing = await findExistingComboOrder({
    userId: params.userId,
    idempotencyKey: normalized.idempotencyKey,
    clientOrderId: normalized.clientOrderId,
  });
  if (existing) {
    return returnExistingComboOrder({
      userId: params.userId,
      existing,
      requestFingerprint: normalized.requestFingerprint,
    });
  }

  const { pricedLegs } = await validateAndPriceComboLegs(normalized.legs, normalized.stakeUSDC);
  const { comboPrice, potentialPayout } = calculateComboMath(normalized.stakeUSDC, pricedLegs);

  let combo: { id: string };
  try {
    combo = await prisma.$transaction(async (tx) => {
      const balance = await tx.userBalance.upsert({
        where: { userId: params.userId },
        update: {},
        create: { userId: params.userId },
      });
      const lockedRows = await tx.$queryRaw<Array<{ availableUSDC: Prisma.Decimal; lockedUSDC: Prisma.Decimal }>>`
        SELECT "availableUSDC", "lockedUSDC"
        FROM "UserBalance"
        WHERE "userId" = ${params.userId}
        FOR UPDATE
      `;
      const lockedBalance = lockedRows[0] ?? balance;
      if (new Prisma.Decimal(lockedBalance.availableUSDC).lt(normalized.stakeUSDC)) {
        throw new CanonicalApiError("INSUFFICIENT_BALANCE", "Insufficient available USDC.", 409);
      }

      const created = await tx.comboOrder.create({
        data: {
          userId: params.userId,
          stakeUSDC: normalized.stakeUSDC,
          comboPrice,
          potentialPayout,
          idempotencyKey: normalized.idempotencyKey,
          clientOrderId: normalized.clientOrderId,
          requestFingerprint: normalized.requestFingerprint,
          legs: {
            create: pricedLegs.map((leg, index) => ({
              marketId: leg.marketId,
              outcomeId: leg.outcomeId,
              price: leg.price,
              line: leg.line,
              label: leg.label,
              displayOrder: index,
            })),
          },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: params.userId,
          asset: "USDC",
          status: "APPLIED",
          reason: "LOCK",
          operation: "LOCK",
          idempotencyKey: `combo-lock:${created.id}`,
          referenceType: "ComboOrder",
          referenceId: created.id,
          deltaAvailableUSDC: normalized.stakeUSDC.neg(),
          deltaLockedUSDC: normalized.stakeUSDC,
          amountDelta: ZERO,
        },
      });

      await tx.userBalance.update({
        where: { userId: params.userId },
        data: {
          version: { increment: 1 },
          availableUSDC: { decrement: normalized.stakeUSDC },
          lockedUSDC: { increment: normalized.stakeUSDC },
        },
      });

      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const racedExisting = await findExistingComboOrder({
        userId: params.userId,
        idempotencyKey: normalized.idempotencyKey,
        clientOrderId: normalized.clientOrderId,
      });
      if (racedExisting) {
        return returnExistingComboOrder({
          userId: params.userId,
          existing: racedExisting,
          requestFingerprint: normalized.requestFingerprint,
        });
      }
    }
    throw error;
  }

  return { comboOrder: serializeForApi(serializeComboOrder(await loadComboOrder(params.userId, combo.id))) };
};

export const listComboOrders = async (params: { userId: string; limit: number }) => {
  const combos = await prisma.comboOrder.findMany({
    where: { userId: params.userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit,
    include: {
      legs: {
        include: {
          market: { select: { id: true, title: true, status: true } },
          outcome: { select: { id: true, name: true, label: true, side: true, code: true } },
        },
      },
    },
  });
  return { items: serializeForApi(combos.map(serializeComboOrder)) };
};

export const getComboOrder = async (params: { userId: string; id: string }) => ({
  comboOrder: serializeForApi(serializeComboOrder(await loadComboOrder(params.userId, params.id))),
});

export const cancelComboOrder = async (params: { userId: string; id: string }) => {
  const combo = await prisma.comboOrder.findFirst({
    where: { id: params.id, userId: params.userId },
    select: { id: true, status: true, stakeUSDC: true },
  });
  if (!combo) {
    throw new CanonicalApiError("COMBO_ORDER_NOT_FOUND", "Combo order not found.", 404);
  }
  if (combo.status !== "OPEN") {
    throw new CanonicalApiError("COMBO_ORDER_NOT_CANCELABLE", "Only open combo orders can be canceled.", 409);
  }

  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ lockedUSDC: Prisma.Decimal }>>`
      SELECT "lockedUSDC"
      FROM "UserBalance"
      WHERE "userId" = ${params.userId}
      FOR UPDATE
    `;
    if (!rows[0] || new Prisma.Decimal(rows[0].lockedUSDC).lt(combo.stakeUSDC)) {
      throw new CanonicalApiError("INSUFFICIENT_BALANCE", "Insufficient locked USDC.", 409);
    }

    await tx.comboOrder.update({
      where: { id: combo.id },
      data: { status: "CANCELED" },
    });
    await tx.ledgerEntry.create({
      data: {
        userId: params.userId,
        asset: "USDC",
        status: "APPLIED",
        reason: "UNLOCK",
        operation: "UNLOCK",
        idempotencyKey: `combo-unlock:${combo.id}`,
        referenceType: "ComboOrder",
        referenceId: combo.id,
        deltaAvailableUSDC: combo.stakeUSDC,
        deltaLockedUSDC: combo.stakeUSDC.neg(),
        amountDelta: ZERO,
      },
    });
    await tx.userBalance.update({
      where: { userId: params.userId },
      data: {
        version: { increment: 1 },
        availableUSDC: { increment: combo.stakeUSDC },
        lockedUSDC: { decrement: combo.stakeUSDC },
      },
    });
  });

  return getComboOrder(params);
};
