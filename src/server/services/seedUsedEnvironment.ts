import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyDeposit } from "@/server/services/ledger";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { placeOrderAndMatch, cancelOrderAndUnlock } from "@/server/services/matching";
import {
  cancelPrivatePool,
  resolveOrderbookMarket,
  resolvePrivatePool,
} from "@/server/services/settlement";
import {
  completeWithdrawalByAdmin,
  rejectWithdrawalByAdmin,
  requestWithdrawal,
} from "@/server/services/withdrawals";
import {
  reconcileBalances,
  reconcilePublicMarkets,
  reconcileWithdrawals,
} from "@/server/services/opsReconciliation";

const ZERO = new Prisma.Decimal(0);
const ONE = new Prisma.Decimal(1);

type GeneratorMode = "light" | "heavy";

export type SeedUsedEnvironmentOptions = {
  mode?: GeneratorMode;
  seed?: string;
  reset?: boolean;
  users?: number;
  publicMarkets?: number;
  privateMarkets?: number;
  withWithdrawals?: boolean;
  withResolutions?: boolean;
  verbose?: boolean;
};

export type SeedUsedEnvironmentSummary = {
  seed: string;
  mode: GeneratorMode;
  users: {
    target: number;
    ensured: number;
    adminUserId: string;
  };
  markets: {
    publicCreated: number;
    privateCreated: number;
    active: number;
    resolved: number;
    canceled: number;
    resolvedPublicMarkets: number;
  };
  activity: {
    openOrders: number;
    fills: number;
    trades: number;
    poolBets: number;
  };
  withdrawals: {
    pending: number;
    completed: number;
    rejected: number;
  };
  reconciliation: {
    balances: Awaited<ReturnType<typeof reconcileBalances>>;
    markets: Awaited<ReturnType<typeof reconcilePublicMarkets>>;
    withdrawals: Awaited<ReturnType<typeof reconcileWithdrawals>>;
    pass: boolean;
  };
};

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

const choose = <T>(rand: () => number, values: T[]) =>
  values[Math.floor(rand() * values.length)];

const numToDec = (n: number) => new Prisma.Decimal(n).toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const safeInt = (value: unknown, fallback: number) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const toTxHash = (seed: string, n: number) => {
  const raw = `${seed}:${n}`.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const hex = raw.toString(16).padStart(8, "0");
  return `0x${hex.repeat(8)}`.slice(0, 66);
};

const resetPublicSchema = async () => {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename.replace(/"/g, "\"\"")}"`)
    .join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
};

const placePoolBetSeedOnly = async (params: {
  userId: string;
  marketId: string;
  outcomeId: string;
  amount: Prisma.Decimal;
}) => {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.poolBet.findUnique({
      where: {
        userId_marketId: {
          userId: params.userId,
          marketId: params.marketId,
        },
      },
    });
    if (existing) return;

    await tx.userBalance.upsert({
      where: { userId: params.userId },
      update: {},
      create: { userId: params.userId },
    });

    const rows = await tx.$queryRaw<Array<{ availableUSDC: Prisma.Decimal }>>`
      SELECT "availableUSDC"
      FROM "UserBalance"
      WHERE "userId" = ${params.userId}
      FOR UPDATE
    `;
    const balance = rows[0];
    if (!balance || balance.availableUSDC.lt(params.amount)) {
      return;
    }

    await tx.poolBet.create({
      data: {
        userId: params.userId,
        marketId: params.marketId,
        outcomeId: params.outcomeId,
        amount: params.amount,
      },
    });

    await tx.userBalance.update({
      where: { userId: params.userId },
      data: { availableUSDC: { decrement: params.amount } },
    });

    await tx.ledgerEntry.create({
      data: {
        userId: params.userId,
        amountDelta: params.amount.neg(),
        reason: "POOL_BET",
        operation: "POOL_BET",
        referenceType: "PoolBet",
        referenceId: params.marketId,
        idempotencyKey: `seed-pool-bet:${params.marketId}:${params.userId}`,
        deltaAvailableUSDC: params.amount.neg(),
        deltaLockedUSDC: ZERO,
      },
    });
  });
};

const ensureAdmin = async (seed: string) => {
  const username = `admin_${seed}`;
  return prisma.user.upsert({
    where: { username },
    update: { isAdmin: true, email: `${username}@test.local` },
    create: {
      username,
      email: `${username}@test.local`,
      isAdmin: true,
    },
  });
};

const ensureUsersAndFunding = async (params: {
  seed: string;
  userCount: number;
  rand: () => number;
  verbose: boolean;
}) => {
  const users: Array<{ id: string; username: string }> = [];
  let depositSeq = 1;

  for (let i = 1; i <= params.userCount; i += 1) {
    const suffix = String(i).padStart(3, "0");
    const username = `trader_${params.seed}_${suffix}`;
    const email = `${username}@test.local`;
    const user = await prisma.user.upsert({
      where: { username },
      update: { email },
      create: { username, email },
      select: { id: true, username: true },
    });
    users.push(user);

    const existingDeposit = await prisma.ledgerEntry.findFirst({
      where: {
        userId: user.id,
        operation: "DEPOSIT",
        idempotencyKey: `seed-used:deposit:${params.seed}:${suffix}`,
      },
      select: { id: true },
    });
    if (!existingDeposit) {
      const amount = numToDec(900 + Math.floor(params.rand() * 2100));
      await applyDeposit({
        eventKey: `seed-used:deposit:${params.seed}:${suffix}`,
        userId: user.id,
        amount: amount.toString(),
        chainId: 8453,
        txHash: toTxHash(params.seed, depositSeq),
        logIndex: depositSeq,
        token: "USDC",
        referenceType: "SeedUsedEnvironment",
        referenceId: params.seed,
      });
      depositSeq += 1;
      if (params.verbose) {
        console.info("[seed:used] funded user", { userId: user.id, amount: amount.toString() });
      }
    }
  }
  return users;
};

const ensurePublicMarket = async (params: {
  seed: string;
  index: number;
}) => {
  const slug = `used-${params.seed}-pub-${String(params.index).padStart(2, "0")}`;
  const now = new Date();
  const existing = await prisma.market.findUnique({
    where: { slug },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  if (existing) {
    return { market: existing, created: false };
  }
  const market = await prisma.market.create({
    data: {
      slug,
      title: `Used Env Public Market #${params.index}`,
      description: `Generated public orderbook market ${params.index} for seed ${params.seed}.`,
      type: "BINARY",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      status: "LIVE",
      betCloseTime: new Date(now.getTime() + 4 * 24 * 3600 * 1000),
      resolveTime: new Date(now.getTime() + 8 * 24 * 3600 * 1000),
      outcomes: {
        create: [
          { name: "YES", slug: `${slug}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `${slug}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  return { market, created: true };
};

const generatePublicMarketActivity = async (params: {
  marketId: string;
  outcomeYesId: string;
  outcomeNoId: string;
  users: Array<{ id: string }>;
  rand: () => number;
}) => {
  const hasAnyOrders = await prisma.order.count({ where: { marketId: params.marketId } });
  if (hasAnyOrders > 0) return;

  const pickedUsers = [...params.users]
    .sort(() => params.rand() - 0.5)
    .slice(0, clamp(params.users.length, 4, 8));

  for (const user of pickedUsers) {
    const qty = numToDec(4 + Math.floor(params.rand() * 3));
    await mintCompleteSetForPublicOrderbook({
      marketId: params.marketId,
      userId: user.id,
      quantity: qty.toString(),
    });
  }

  const buyerA = pickedUsers[0];
  const sellerA = pickedUsers[1];
  const buyerB = pickedUsers[2] ?? pickedUsers[0];
  const sellerB = pickedUsers[3] ?? pickedUsers[1];

  const makerSell = await placeOrderAndMatch({
    marketId: params.marketId,
    userId: sellerA.id,
    outcomeId: params.outcomeYesId,
    side: "SELL",
    price: "0.580000",
    size: "3.000000",
  });
  await placeOrderAndMatch({
    marketId: params.marketId,
    userId: buyerA.id,
    outcomeId: params.outcomeYesId,
    side: "BUY",
    price: "0.600000",
    size: "1.000000",
  });
  const cancellableMakerSell = await prisma.order.findFirst({
    where: {
      id: makerSell.order.id,
      userId: sellerA.id,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
    select: { id: true },
  });
  if (cancellableMakerSell) {
    await cancelOrderAndUnlock({ orderId: cancellableMakerSell.id, userId: sellerA.id });
  }

  await placeOrderAndMatch({
    marketId: params.marketId,
    userId: sellerB.id,
    outcomeId: params.outcomeNoId,
    side: "SELL",
    price: "0.620000",
    size: "2.000000",
  });
  await placeOrderAndMatch({
    marketId: params.marketId,
    userId: buyerB.id,
    outcomeId: params.outcomeNoId,
    side: "BUY",
    price: "0.630000",
    size: "1.000000",
  });

  await placeOrderAndMatch({
    marketId: params.marketId,
    userId: buyerA.id,
    outcomeId: params.outcomeYesId,
    side: "BUY",
    price: "0.450000",
    size: "2.000000",
  });
  await placeOrderAndMatch({
    marketId: params.marketId,
    userId: sellerA.id,
    outcomeId: params.outcomeYesId,
    side: "SELL",
    price: "0.650000",
    size: "2.000000",
  });
};

const ensurePrivateMarket = async (params: {
  seed: string;
  index: number;
  ownerId: string;
}) => {
  const slug = `used-${params.seed}-pool-${String(params.index).padStart(2, "0")}`;
  const now = new Date();
  const existing = await prisma.market.findUnique({
    where: { slug },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  if (existing) return { market: existing, created: false };
  const market = await prisma.market.create({
    data: {
      slug,
      title: `Used Env Private Pool #${params.index}`,
      description: `Generated private pool market ${params.index} for seed ${params.seed}.`,
      type: "BINARY",
      mechanism: "POOL",
      visibility: "PRIVATE",
      kind: "POOL",
      ownerId: params.ownerId,
      status: "LIVE",
      betCloseTime: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
      resolveTime: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
      outcomes: {
        create: [
          { name: "Option A", slug: `${slug}-a`, displayOrder: 0, isActive: true },
          { name: "Option B", slug: `${slug}-b`, displayOrder: 1, isActive: true },
        ],
      },
      poolStakePresets: {
        create: [{ amount: "10.000000" }, { amount: "20.000000" }, { amount: "50.000000" }],
      },
      members: {
        create: [{ userId: params.ownerId, role: "OWNER" }],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  return { market, created: true };
};

const populatePrivatePoolBets = async (params: {
  marketId: string;
  outcomeIds: string[];
  users: Array<{ id: string }>;
  rand: () => number;
}) => {
  const existing = await prisma.poolBet.count({ where: { marketId: params.marketId } });
  if (existing > 0) return;

  const participants = [...params.users]
    .sort(() => params.rand() - 0.5)
    .slice(0, clamp(params.users.length, 3, 7));
  const presetOptions = [new Prisma.Decimal("10"), new Prisma.Decimal("20"), new Prisma.Decimal("50")];
  for (const user of participants) {
    const outcomeId = choose(params.rand, params.outcomeIds);
    const amount = choose(params.rand, presetOptions);
    await placePoolBetSeedOnly({
      userId: user.id,
      marketId: params.marketId,
      outcomeId,
      amount,
    });
  }
};

const generateWithdrawals = async (params: {
  seed: string;
  adminUserId: string;
  users: Array<{ id: string }>;
}) => {
  if (params.users.length < 3) return;
  const [u1, u2, u3] = params.users;

  const requests: Array<{ id: string; userId: string; amount: string; address: string }> = [
    {
      id: `seed-used:wd:${params.seed}:01`,
      userId: u1.id,
      amount: "15.000000",
      address: "0x1111111111111111111111111111111111111111",
    },
    {
      id: `seed-used:wd:${params.seed}:02`,
      userId: u2.id,
      amount: "12.000000",
      address: "0x2222222222222222222222222222222222222222",
    },
    {
      id: `seed-used:wd:${params.seed}:03`,
      userId: u3.id,
      amount: "8.000000",
      address: "0x3333333333333333333333333333333333333333",
    },
  ];

  for (const request of requests) {
    await requestWithdrawal({
      userId: request.userId,
      amount: request.amount,
      destinationAddress: request.address,
      withdrawalRequestId: request.id,
    }).catch(() => null);
  }

  const req1 = await prisma.withdrawalRequest.findUnique({ where: { id: requests[0].id } });
  const req2 = await prisma.withdrawalRequest.findUnique({ where: { id: requests[1].id } });

  if (req1?.status === "PENDING") {
    await completeWithdrawalByAdmin({
      adminUserId: params.adminUserId,
      withdrawalRequestId: req1.id,
      txHash: toTxHash(params.seed, 9001),
      notes: "seed used env complete",
    });
  }
  if (req2?.status === "PENDING") {
    await rejectWithdrawalByAdmin({
      adminUserId: params.adminUserId,
      withdrawalRequestId: req2.id,
      reason: "seed used env reject",
    });
  }
};

export async function generateUsedEnvironment(
  options: SeedUsedEnvironmentOptions = {}
): Promise<SeedUsedEnvironmentSummary> {
  const mode: GeneratorMode = options.mode ?? "light";
  const seed = options.seed ?? "used-env-001";
  const verbose = options.verbose ?? true;
  const rand = mulberry32(hashSeed(seed));

  if (options.reset) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Refusing reset in production environment.");
    }
    await resetPublicSchema();
  }

  const defaultByMode =
    mode === "heavy"
      ? { users: 24, publicMarkets: 8, privateMarkets: 6, withWithdrawals: true, withResolutions: true }
      : { users: 12, publicMarkets: 4, privateMarkets: 3, withWithdrawals: true, withResolutions: true };

  const userCount = clamp(safeInt(options.users, defaultByMode.users), 2, 40);
  const publicCount = clamp(safeInt(options.publicMarkets, defaultByMode.publicMarkets), 1, 20);
  const privateCount = clamp(safeInt(options.privateMarkets, defaultByMode.privateMarkets), 0, 20);
  const withWithdrawals = options.withWithdrawals ?? defaultByMode.withWithdrawals;
  const withResolutions = options.withResolutions ?? defaultByMode.withResolutions;

  const admin = await ensureAdmin(seed);
  const users = await ensureUsersAndFunding({
    seed,
    userCount,
    rand,
    verbose,
  });

  const publicMarkets: Array<{ id: string; yesId: string; noId: string }> = [];
  let publicCreated = 0;
  for (let i = 1; i <= publicCount; i += 1) {
    const res = await ensurePublicMarket({ seed, index: i });
    if (res.created) publicCreated += 1;
    publicMarkets.push({
      id: res.market.id,
      yesId: res.market.outcomes[0].id,
      noId: res.market.outcomes[1].id,
    });
    await generatePublicMarketActivity({
      marketId: res.market.id,
      outcomeYesId: res.market.outcomes[0].id,
      outcomeNoId: res.market.outcomes[1].id,
      users,
      rand,
    });
  }

  const privateMarkets: Array<{ id: string; ownerId: string; outcomes: string[] }> = [];
  let privateCreated = 0;
  for (let i = 1; i <= privateCount; i += 1) {
    const owner = users[(i - 1) % users.length];
    const res = await ensurePrivateMarket({ seed, index: i, ownerId: owner.id });
    if (res.created) privateCreated += 1;
    privateMarkets.push({
      id: res.market.id,
      ownerId: owner.id,
      outcomes: res.market.outcomes.map((o) => o.id),
    });
    await populatePrivatePoolBets({
      marketId: res.market.id,
      outcomeIds: res.market.outcomes.map((o) => o.id),
      users,
      rand,
    });
  }

  if (withResolutions && publicMarkets.length > 0) {
    const toResolve = mode === "heavy" ? Math.max(2, Math.floor(publicMarkets.length / 2)) : 1;
    for (let i = 0; i < toResolve; i += 1) {
      const market = publicMarkets[i];
      const row = await prisma.market.findUnique({
        where: { id: market.id },
        select: { status: true, resolvedOutcomeId: true },
      });
      if (!row || row.status === "RESOLVED" || row.resolvedOutcomeId) continue;
      const winningOutcomeId = rand() < 0.5 ? market.yesId : market.noId;
      await resolveOrderbookMarket({
        marketId: market.id,
        winningOutcomeId,
        actorUserId: admin.id,
      });
    }

    const toResolvePool = mode === "heavy" ? Math.floor(privateMarkets.length / 2) : Math.min(1, privateMarkets.length);
    for (let i = 0; i < toResolvePool; i += 1) {
      const market = privateMarkets[i];
      const row = await prisma.market.findUnique({
        where: { id: market.id },
        select: { status: true, isCanceled: true, resolvedOutcomeId: true },
      });
      if (!row || row.status === "RESOLVED" || row.isCanceled || row.resolvedOutcomeId) continue;
      const winningOutcomeId = choose(rand, market.outcomes);
      await resolvePrivatePool({
        poolId: market.id,
        winningOutcomeId,
        actorUserId: market.ownerId,
      });
    }

    if (privateMarkets.length >= 2) {
      const idx = privateMarkets.length - 1;
      const market = privateMarkets[idx];
      const row = await prisma.market.findUnique({
        where: { id: market.id },
        select: { status: true, isCanceled: true, resolvedOutcomeId: true },
      });
      if (row && !row.isCanceled && row.status !== "RESOLVED" && !row.resolvedOutcomeId) {
        await cancelPrivatePool({
          poolId: market.id,
          actorUserId: market.ownerId,
        });
      }
    }
  }

  if (withWithdrawals) {
    await generateWithdrawals({ seed, adminUserId: admin.id, users });
  }

  const marketRows = await prisma.market.findMany({
    where: {
      OR: [
        { slug: { startsWith: `used-${seed}-pub-` } },
        { slug: { startsWith: `used-${seed}-pool-` } },
      ],
    },
    select: { id: true, status: true, isCanceled: true, mechanism: true },
  });
  const generatedMarketIds = marketRows.map((m) => m.id);
  const openOrders = await prisma.order.count({
    where: { marketId: { in: generatedMarketIds }, status: { in: ["OPEN", "PARTIAL"] }, remaining: { gt: ZERO } },
  });
  const fills = await prisma.fill.count({ where: { marketId: { in: generatedMarketIds } } });
  const trades = await prisma.trade.count({ where: { marketId: { in: generatedMarketIds } } });
  const poolBets = await prisma.poolBet.count({ where: { marketId: { in: generatedMarketIds } } });

  const withdrawalRows = await prisma.withdrawalRequest.findMany({
    where: {
      id: { startsWith: `seed-used:wd:${seed}:` },
    },
    select: { status: true },
  });

  const balances = await reconcileBalances();
  const marketsRecon = await reconcilePublicMarkets();
  const withdrawalsRecon = await reconcileWithdrawals();
  const reconPass = balances.pass && marketsRecon.pass && withdrawalsRecon.pass;

  const summary: SeedUsedEnvironmentSummary = {
    seed,
    mode,
    users: {
      target: userCount,
      ensured: users.length,
      adminUserId: admin.id,
    },
    markets: {
      publicCreated,
      privateCreated,
      active: marketRows.filter((m) => m.status === "LIVE" && !m.isCanceled).length,
      resolved: marketRows.filter((m) => m.status === "RESOLVED").length,
      canceled: marketRows.filter((m) => m.isCanceled).length,
      resolvedPublicMarkets: marketRows.filter(
        (m) => m.status === "RESOLVED" && m.mechanism === "ORDERBOOK"
      ).length,
    },
    activity: {
      openOrders,
      fills,
      trades,
      poolBets,
    },
    withdrawals: {
      pending: withdrawalRows.filter((w) => w.status === "PENDING").length,
      completed: withdrawalRows.filter((w) => w.status === "COMPLETED").length,
      rejected: withdrawalRows.filter((w) => w.status === "REJECTED").length,
    },
    reconciliation: {
      balances,
      markets: marketsRecon,
      withdrawals: withdrawalsRecon,
      pass: reconPass,
    },
  };

  return summary;
}
