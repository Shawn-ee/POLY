import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mintCompleteSetForPublicOrderbook, getPublicBinaryInvariantState } from "@/server/services/orderbookCollateral";
import { placeOrderAndMatch, cancelOrderAndUnlock } from "@/server/services/matching";
import { resolveOrderbookMarket } from "@/server/services/settlement";
import { requestWithdrawal, completeWithdrawalByAdmin, rejectWithdrawalByAdmin } from "@/server/services/withdrawals";

const ZERO = new Prisma.Decimal(0);
const DECIMAL_EPS = new Prisma.Decimal("0.000001");

type SimulationActionType = "MINT" | "BUY" | "SELL" | "CANCEL" | "HOLD";

type SimulationActionLog = {
  step: number;
  action: SimulationActionType;
  userId: string;
  details: Record<string, string>;
  ok: boolean;
  error?: string;
};

export type Phase85SimulationOptions = {
  seed?: string;
  userCount?: number;
  actionCount?: number;
  checkEvery?: number;
  initialBalanceUSDC?: string;
  withWithdrawalScenario?: boolean;
  verbose?: boolean;
};

export type Phase85SimulationReport = {
  pass: boolean;
  seed: string;
  users: number;
  actionsRequested: number;
  actionsExecuted: number;
  actionCounts: Record<SimulationActionType, number>;
  fillsCount: number;
  tradesCount: number;
  openOrdersCount: number;
  preResolution: {
    collateralUSDC: string;
    outcomeYesShares: string;
    outcomeNoShares: string;
    invariantSummary: string;
  };
  settlement: {
    winningOutcomeId: string;
    totalPoolPayout: string;
    collateralDebitedUSDC: string;
    payoutConservationPass: boolean;
    collateralZeroAfterPass: boolean;
    positionsFinalizedPass: boolean;
  };
  withdrawals?: {
    requestCompletedId: string;
    requestRejectedId: string;
    pass: boolean;
  };
  invariantChecks: {
    checksRun: number;
    passed: boolean;
  };
  finalBalanceSummary: {
    minAvailableUSDC: string;
    minLockedUSDC: string;
    anyNegativeBalances: boolean;
    anyStuckLocksAfterSettlement: boolean;
  };
  logs: SimulationActionLog[];
  failure?: {
    step: number;
    lastAction?: SimulationActionLog;
    reason: string;
    invariantSnapshot?: unknown;
  };
};

type SimContext = {
  marketId: string;
  outcomeYesId: string;
  outcomeNoId: string;
  userIds: string[];
};

const toDec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
const toMoney = (value: Prisma.Decimal) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);
const normShares = (value: Prisma.Decimal) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);

const hashSeed = (seed: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const chooseAction = (rand: () => number): SimulationActionType => {
  const r = rand();
  if (r < 0.18) return "MINT";
  if (r < 0.46) return "BUY";
  if (r < 0.74) return "SELL";
  if (r < 0.9) return "CANCEL";
  return "HOLD";
};

const pick = <T>(arr: T[], rand: () => number): T => arr[Math.floor(rand() * arr.length)];

const randomQty = (rand: () => number, min = 1, max = 3) =>
  normShares(new Prisma.Decimal(min + Math.floor(rand() * (max - min + 1))));

const randomPrice = (rand: () => number, side: "BUY" | "SELL", aggressive: boolean) => {
  if (side === "BUY") {
    const base = aggressive ? 0.62 : 0.46;
    return new Prisma.Decimal(base + (rand() - 0.5) * 0.16).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  }
  const base = aggressive ? 0.38 : 0.54;
  return new Prisma.Decimal(base + (rand() - 0.5) * 0.16).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
};

const getUserPosition = async (marketId: string, userId: string, outcomeId: string) => {
  return prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId,
        marketId,
        outcomeId,
      },
    },
  });
};

const ensureAdminUser = async (seed: string) => {
  const username = `phase85_admin_${seed}`;
  const email = `${username}@kaoshi.local`;
  return prisma.user.upsert({
    where: { username },
    update: { isAdmin: true, email },
    create: { username, email, isAdmin: true },
  });
};

const ensureSimulationUsers = async (seed: string, userCount: number, initialBalanceUSDC: Prisma.Decimal) => {
  const userIds: string[] = [];
  for (let i = 1; i <= userCount; i += 1) {
    const suffix = String(i).padStart(3, "0");
    const username = `phase85_${seed}_u${suffix}`;
    const email = `${username}@kaoshi.local`;
    const user = await prisma.user.upsert({
      where: { username },
      update: { email },
      create: { username, email },
      select: { id: true },
    });
    await prisma.userBalance.upsert({
      where: { userId: user.id },
      update: {
        availableUSDC: initialBalanceUSDC,
        lockedUSDC: ZERO,
      },
      create: {
        userId: user.id,
        availableUSDC: initialBalanceUSDC,
        lockedUSDC: ZERO,
      },
    });
    userIds.push(user.id);
  }
  return userIds;
};

const ensureSimulationMarket = async (seed: string) => {
  const slug = `phase85-sim-${seed}`;
  const existing = await prisma.market.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    await prisma.market.delete({ where: { id: existing.id } });
  }
  const now = new Date();
  const market = await prisma.market.create({
    data: {
      slug,
      title: `Phase 8.5 Simulation ${seed}`,
      description: "Deterministic exchange simulation harness market",
      status: "LIVE",
      type: "BINARY",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      betCloseTime: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      resolveTime: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      outcomes: {
        create: [
          { name: "YES", slug: `${slug}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `${slug}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { orderBy: [{ displayOrder: "asc" }] } },
  });
  const [yes, no] = market.outcomes;
  return { marketId: market.id, outcomeYesId: yes.id, outcomeNoId: no.id };
};

export const validatePhase85Invariants = async (ctx: SimContext) => {
  const balances = await prisma.userBalance.findMany({
    where: { userId: { in: ctx.userIds } },
  });
  for (const b of balances) {
    if (b.availableUSDC.lt(ZERO)) {
      throw new Error(`Invariant failed: negative availableUSDC for user=${b.userId}`);
    }
    if (b.lockedUSDC.lt(ZERO)) {
      throw new Error(`Invariant failed: negative lockedUSDC for user=${b.userId}`);
    }
  }

  const positions = await prisma.position.findMany({
    where: { marketId: ctx.marketId, userId: { in: ctx.userIds } },
  });
  const positionMap = new Map<string, Prisma.Decimal>();
  for (const p of positions) {
    if (p.shares.lt(ZERO)) {
      throw new Error(`Invariant failed: negative shares for user=${p.userId} outcome=${p.outcomeId}`);
    }
    if (p.reservedShares.lt(ZERO)) {
      throw new Error(`Invariant failed: negative reservedShares for user=${p.userId} outcome=${p.outcomeId}`);
    }
    if (p.reservedShares.gt(p.shares.add(DECIMAL_EPS))) {
      throw new Error(`Invariant failed: reservedShares > shares for user=${p.userId} outcome=${p.outcomeId}`);
    }
    positionMap.set(`${p.userId}:${p.outcomeId}`, p.reservedShares);
  }

  const openSellOrders = await prisma.order.groupBy({
    by: ["userId", "outcomeId"],
    where: {
      marketId: ctx.marketId,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
    _sum: { remaining: true },
  });
  for (const row of openSellOrders) {
    const expectedReserved = row._sum.remaining ?? ZERO;
    const actualReserved = positionMap.get(`${row.userId}:${row.outcomeId}`) ?? ZERO;
    if (actualReserved.sub(expectedReserved).abs().gt(DECIMAL_EPS)) {
      throw new Error(
        `Invariant failed: reservedShares mismatch user=${row.userId} outcome=${row.outcomeId} expected=${expectedReserved.toString()} actual=${actualReserved.toString()}`
      );
    }
  }

  const openBuyReservations = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      marketId: ctx.marketId,
      side: "BUY",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
    _sum: { reservedNotional: true },
  });
  const lockedByUser = new Map(balances.map((b) => [b.userId, b.lockedUSDC]));
  for (const row of openBuyReservations) {
    const needed = row._sum.reservedNotional ?? ZERO;
    const locked = lockedByUser.get(row.userId) ?? ZERO;
    if (locked.add(DECIMAL_EPS).lt(needed)) {
      throw new Error(
        `Invariant failed: lockedUSDC below buy reservation user=${row.userId} locked=${locked.toString()} needed=${needed.toString()}`
      );
    }
  }

  const invalidOrders = await prisma.order.findMany({
    where: {
      marketId: ctx.marketId,
      OR: [{ remaining: { lt: ZERO } }, { amount: { lt: ZERO } }],
    },
    take: 1,
  });
  if (invalidOrders.length > 0) {
    throw new Error(`Invariant failed: invalid order state orderId=${invalidOrders[0].id}`);
  }

  const invariant = await getPublicBinaryInvariantState(ctx.marketId);
  if (!invariant.bidInvariantPass) {
    throw new Error("Invariant failed: bid sum invariant violated");
  }
  if (!invariant.askInvariantPass) {
    throw new Error("Invariant failed: ask sum invariant violated");
  }
  if (!invariant.outstandingSharesEqual) {
    throw new Error("Invariant failed: binary outstanding shares are imbalanced");
  }
  if (!invariant.collateralMatchesOutstanding) {
    throw new Error("Invariant failed: market collateral does not match outstanding");
  }

  return invariant;
};

const runOptionalWithdrawals = async (seed: string, adminUserId: string, userIds: string[]) => {
  const firstUser = userIds[0];
  const secondUser = userIds[1];
  const requestA = await requestWithdrawal({
    userId: firstUser,
    amount: "10",
    destinationAddress: "0x1111111111111111111111111111111111111111",
    withdrawalRequestId: `phase85-${seed}-wd-a`,
  });
  const requestB = await requestWithdrawal({
    userId: secondUser,
    amount: "8",
    destinationAddress: "0x2222222222222222222222222222222222222222",
    withdrawalRequestId: `phase85-${seed}-wd-b`,
  });
  await completeWithdrawalByAdmin({
    adminUserId,
    withdrawalRequestId: requestA.request.id,
    txHash: `0x${"a".repeat(60)}${(hashSeed(seed) % 65535).toString(16).padStart(4, "0")}`,
    notes: "phase85 simulation complete path",
  });
  await rejectWithdrawalByAdmin({
    adminUserId,
    withdrawalRequestId: requestB.request.id,
    reason: "phase85 simulation reject path",
  });

  const [finalA, finalB] = await Promise.all([
    prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: requestA.request.id } }),
    prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: requestB.request.id } }),
  ]);
  return {
    requestCompletedId: finalA.id,
    requestRejectedId: finalB.id,
    pass: finalA.status === "COMPLETED" && finalB.status === "REJECTED",
  };
};

export const runPhase85Simulation = async (
  options: Phase85SimulationOptions = {}
): Promise<Phase85SimulationReport> => {
  const seed = options.seed ?? "phase85-default-seed";
  const rand = mulberry32(hashSeed(seed));
  const userCount = Math.max(2, Math.min(options.userCount ?? 12, 30));
  const actionCount = Math.max(1, options.actionCount ?? 180);
  const checkEvery = Math.max(1, options.checkEvery ?? 5);
  const initialBalance = toMoney(toDec(options.initialBalanceUSDC ?? "2500"));
  const verbose = options.verbose ?? true;

  const actionCounts: Record<SimulationActionType, number> = {
    MINT: 0,
    BUY: 0,
    SELL: 0,
    CANCEL: 0,
    HOLD: 0,
  };
  const logs: SimulationActionLog[] = [];
  let checksRun = 0;

  const admin = await ensureAdminUser(seed);
  const userIds = await ensureSimulationUsers(seed, userCount, initialBalance);
  const market = await ensureSimulationMarket(seed);
  const ctx: SimContext = { ...market, userIds };

  const pushLog = (entry: SimulationActionLog) => {
    logs.push(entry);
    if (verbose) {
      const details = Object.entries(entry.details)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ");
      if (entry.ok) {
        console.info(`[phase85] step=${entry.step} action=${entry.action} user=${entry.userId} ${details}`);
      } else {
        console.error(
          `[phase85] step=${entry.step} action=${entry.action} user=${entry.userId} FAILED ${details} err=${entry.error}`
        );
      }
    }
  };

  const isSkippableActionError = (message: string) => {
    const m = message.toLowerCase();
    return (
      m.includes("insufficient available usdc") ||
      m.includes("insufficient shares") ||
      m.includes("insufficient available shares") ||
      m.includes("order cannot be canceled") ||
      m.includes("self-crossing order would cross existing own order") ||
      m.includes("binary invariant violation")
    );
  };

  const withFailure = async (step: number, reason: string, lastAction?: SimulationActionLog) => {
    let invariantSnapshot: unknown = null;
    try {
      invariantSnapshot = await getPublicBinaryInvariantState(ctx.marketId);
    } catch {
      invariantSnapshot = null;
    }
    const counts = await Promise.all([
      prisma.fill.count({ where: { marketId: ctx.marketId } }),
      prisma.trade.count({ where: { marketId: ctx.marketId } }),
      prisma.order.count({
        where: { marketId: ctx.marketId, status: { in: ["OPEN", "PARTIAL"] }, remaining: { gt: ZERO } },
      }),
    ]);
    return {
      pass: false as const,
      seed,
      users: userCount,
      actionsRequested: actionCount,
      actionsExecuted: logs.length,
      actionCounts,
      fillsCount: counts[0],
      tradesCount: counts[1],
      openOrdersCount: counts[2],
      preResolution: {
        collateralUSDC: "0",
        outcomeYesShares: "0",
        outcomeNoShares: "0",
        invariantSummary: "FAIL",
      },
      settlement: {
        winningOutcomeId: "",
        totalPoolPayout: "0",
        collateralDebitedUSDC: "0",
        payoutConservationPass: false,
        collateralZeroAfterPass: false,
        positionsFinalizedPass: false,
      },
      invariantChecks: {
        checksRun,
        passed: false,
      },
      finalBalanceSummary: {
        minAvailableUSDC: "0",
        minLockedUSDC: "0",
        anyNegativeBalances: true,
        anyStuckLocksAfterSettlement: true,
      },
      logs,
      failure: {
        step,
        lastAction,
        reason,
        invariantSnapshot: invariantSnapshot ?? undefined,
      },
    };
  };

  for (let step = 1; step <= actionCount; step += 1) {
    const userId = pick(userIds, rand);
    const action = chooseAction(rand);
    actionCounts[action] += 1;

    try {
      if (action === "MINT") {
        const qty = randomQty(rand, 1, 2);
        await mintCompleteSetForPublicOrderbook({
          marketId: ctx.marketId,
          userId,
          quantity: qty.toString(),
        });
        pushLog({
          step,
          action,
          userId,
          details: { qty: qty.toString() },
          ok: true,
        });
      } else if (action === "BUY") {
        const outcomeId = rand() < 0.5 ? ctx.outcomeYesId : ctx.outcomeNoId;
        const qty = randomQty(rand, 1, 3);
        const price = randomPrice(rand, "BUY", rand() < 0.45);
        await placeOrderAndMatch({
          marketId: ctx.marketId,
          userId,
          outcomeId,
          side: "BUY",
          price: price.toString(),
          size: qty.toString(),
        });
        pushLog({
          step,
          action,
          userId,
          details: { side: "BUY", outcomeId, price: price.toString(), qty: qty.toString() },
          ok: true,
        });
      } else if (action === "SELL") {
        const yesPos = await getUserPosition(ctx.marketId, userId, ctx.outcomeYesId);
        const noPos = await getUserPosition(ctx.marketId, userId, ctx.outcomeNoId);
        const yesAvailable = yesPos
          ? toDec(yesPos.shares).sub(toDec(yesPos.reservedShares))
          : ZERO;
        const noAvailable = noPos
          ? toDec(noPos.shares).sub(toDec(noPos.reservedShares))
          : ZERO;

        let outcomeId: string | null = null;
        let maxQty = ZERO;
        if (yesAvailable.gt(DECIMAL_EPS) && noAvailable.gt(DECIMAL_EPS)) {
          outcomeId = rand() < 0.5 ? ctx.outcomeYesId : ctx.outcomeNoId;
          maxQty = outcomeId === ctx.outcomeYesId ? yesAvailable : noAvailable;
        } else if (yesAvailable.gt(DECIMAL_EPS)) {
          outcomeId = ctx.outcomeYesId;
          maxQty = yesAvailable;
        } else if (noAvailable.gt(DECIMAL_EPS)) {
          outcomeId = ctx.outcomeNoId;
          maxQty = noAvailable;
        }

        if (!outcomeId || maxQty.lte(DECIMAL_EPS)) {
          pushLog({
            step,
            action: "HOLD",
            userId,
            details: { reason: "no_sellable_shares" },
            ok: true,
          });
        } else {
          const qty = randomQty(rand, 1, 3);
          const finalQty = qty.gt(maxQty) ? normShares(maxQty) : qty;
          if (finalQty.lte(DECIMAL_EPS)) {
            pushLog({
              step,
              action: "HOLD",
              userId,
              details: { reason: "sell_qty_too_small" },
              ok: true,
            });
          } else {
            const price = randomPrice(rand, "SELL", rand() < 0.45);
            await placeOrderAndMatch({
              marketId: ctx.marketId,
              userId,
              outcomeId,
              side: "SELL",
              price: price.toString(),
              size: finalQty.toString(),
            });
            pushLog({
              step,
              action,
              userId,
              details: {
                side: "SELL",
                outcomeId,
                price: price.toString(),
                qty: finalQty.toString(),
              },
              ok: true,
            });
          }
        }
      } else if (action === "CANCEL") {
        const order = await prisma.order.findFirst({
          where: {
            marketId: ctx.marketId,
            userId,
            status: { in: ["OPEN", "PARTIAL"] },
            remaining: { gt: ZERO },
          },
          orderBy: [{ createdAt: "asc" }],
          select: { id: true },
        });
        if (!order) {
          pushLog({
            step,
            action: "HOLD",
            userId,
            details: { reason: "no_open_orders" },
            ok: true,
          });
        } else {
          await cancelOrderAndUnlock({ orderId: order.id, userId });
          pushLog({
            step,
            action,
            userId,
            details: { orderId: order.id },
            ok: true,
          });
        }
      } else {
        pushLog({ step, action, userId, details: { reason: "idle" }, ok: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      if (isSkippableActionError(message)) {
        pushLog({
          step,
          action: "HOLD",
          userId,
          details: { reason: `skipped:${message}` },
          ok: true,
        });
        continue;
      }
      const failed = {
        step,
        action,
        userId,
        details: {},
        ok: false,
        error: message,
      } satisfies SimulationActionLog;
      pushLog(failed);
      const failure = await withFailure(step, `Action failed: ${message}`, failed);
      return failure;
    }

    if (step % checkEvery === 0) {
      try {
        await validatePhase85Invariants(ctx);
        checksRun += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown invariant failure";
        return withFailure(step, message, logs[logs.length - 1]);
      }
    }
  }

  try {
    await validatePhase85Invariants(ctx);
    checksRun += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown invariant failure";
    return withFailure(actionCount, message, logs[logs.length - 1]);
  }

  const openOrders = await prisma.order.findMany({
    where: {
      marketId: ctx.marketId,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
    select: { id: true, userId: true },
    orderBy: [{ createdAt: "asc" }],
  });
  for (const open of openOrders) {
    await cancelOrderAndUnlock({ orderId: open.id, userId: open.userId });
  }

  try {
    await validatePhase85Invariants(ctx);
    checksRun += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown invariant failure";
    return withFailure(actionCount, `post-cancel invariant failed: ${message}`, logs[logs.length - 1]);
  }

  const preInvariant = await getPublicBinaryInvariantState(ctx.marketId);
  const prePositions = await prisma.position.findMany({
    where: { marketId: ctx.marketId, userId: { in: userIds }, shares: { gt: ZERO } },
    select: { userId: true, outcomeId: true, shares: true },
  });
  const winnerOutcomeId = rand() < 0.5 ? ctx.outcomeYesId : ctx.outcomeNoId;
  const balancesBefore = await prisma.userBalance.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, availableUSDC: true, lockedUSDC: true },
  });
  const beforeAvailableMap = new Map(balancesBefore.map((b) => [b.userId, b.availableUSDC]));

  const settlement = await resolveOrderbookMarket({
    marketId: ctx.marketId,
    winningOutcomeId: winnerOutcomeId,
    actorUserId: admin.id,
  });

  const balancesAfter = await prisma.userBalance.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, availableUSDC: true, lockedUSDC: true },
  });

  const winnerSharesByUser = new Map<string, Prisma.Decimal>();
  for (const p of prePositions) {
    if (p.outcomeId !== winnerOutcomeId) continue;
    winnerSharesByUser.set(p.userId, (winnerSharesByUser.get(p.userId) ?? ZERO).add(p.shares));
  }

  let payoutConservationPass = true;
  for (const userId of userIds) {
    const before = beforeAvailableMap.get(userId) ?? ZERO;
    const after = balancesAfter.find((b) => b.userId === userId)?.availableUSDC ?? ZERO;
    const delta = toMoney(after.sub(before));
    const expected = toMoney(winnerSharesByUser.get(userId) ?? ZERO);
    if (delta.sub(expected).abs().gt(DECIMAL_EPS)) {
      payoutConservationPass = false;
      break;
    }
  }

  const marketAfter = await prisma.market.findUniqueOrThrow({
    where: { id: ctx.marketId },
    select: { collateralUSDC: true, status: true, resolvedOutcomeId: true },
  });
  const positionsAfter = await prisma.position.count({
    where: {
      marketId: ctx.marketId,
      OR: [{ shares: { gt: ZERO } }, { reservedShares: { gt: ZERO } }],
    },
  });

  const fillsCount = await prisma.fill.count({ where: { marketId: ctx.marketId } });
  const tradesCount = await prisma.trade.count({ where: { marketId: ctx.marketId } });
  const openOrdersCount = await prisma.order.count({
    where: {
      marketId: ctx.marketId,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
  });

  let withdrawals: Phase85SimulationReport["withdrawals"] | undefined;
  if (options.withWithdrawalScenario) {
    withdrawals = await runOptionalWithdrawals(seed, admin.id, userIds);
  }

  const minAvailable = balancesAfter.reduce(
    (acc, cur) => (cur.availableUSDC.lt(acc) ? cur.availableUSDC : acc),
    balancesAfter[0]?.availableUSDC ?? ZERO
  );
  const minLocked = balancesAfter.reduce(
    (acc, cur) => (cur.lockedUSDC.lt(acc) ? cur.lockedUSDC : acc),
    balancesAfter[0]?.lockedUSDC ?? ZERO
  );
  const anyNegativeBalances = balancesAfter.some(
    (b) => b.availableUSDC.lt(ZERO) || b.lockedUSDC.lt(ZERO)
  );
  const anyStuckLocksAfterSettlement = balancesAfter.some((b) => b.lockedUSDC.gt(DECIMAL_EPS));

  const pass =
    preInvariant.invariantStatusSummary === "PASS" &&
    payoutConservationPass &&
    marketAfter.status === "RESOLVED" &&
    marketAfter.resolvedOutcomeId === winnerOutcomeId &&
    marketAfter.collateralUSDC.eq(ZERO) &&
    positionsAfter === 0 &&
    !anyNegativeBalances &&
    !anyStuckLocksAfterSettlement &&
    (!withdrawals || withdrawals.pass);

  return {
    pass,
    seed,
    users: userCount,
    actionsRequested: actionCount,
    actionsExecuted: logs.length,
    actionCounts,
    fillsCount,
    tradesCount,
    openOrdersCount,
    preResolution: {
      collateralUSDC: preInvariant.marketCollateralUSDC,
      outcomeYesShares: preInvariant.outstandingSharesOutcome1,
      outcomeNoShares: preInvariant.outstandingSharesOutcome2,
      invariantSummary: preInvariant.invariantStatusSummary,
    },
    settlement: {
      winningOutcomeId: winnerOutcomeId,
      totalPoolPayout: settlement.totalPoolPayout,
      collateralDebitedUSDC: settlement.collateralDebitedUSDC,
      payoutConservationPass,
      collateralZeroAfterPass: marketAfter.collateralUSDC.eq(ZERO),
      positionsFinalizedPass: positionsAfter === 0,
    },
    withdrawals,
    invariantChecks: {
      checksRun,
      passed: true,
    },
    finalBalanceSummary: {
      minAvailableUSDC: minAvailable.toString(),
      minLockedUSDC: minLocked.toString(),
      anyNegativeBalances,
      anyStuckLocksAfterSettlement,
    },
    logs,
  };
};
