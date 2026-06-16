import { Prisma } from "@prisma/client";
import { vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  __setLedgerTestHook,
  applyDeposit,
  applyFill,
  completeWithdrawal,
  createWithdrawalRequest,
  lockFundsForOrder,
  recomputeBalanceFromLedger,
  unlockFundsForCancel,
} from "@/server/services/ledger";
import { getCustodyBalance, getWalletBalance } from "@/lib/wallet";
import { createDeterministicUser, resetPublicSchema } from "./dbTestUtils";

const DECIMALS = 6;

const toNumber = (value: Prisma.Decimal) => Number(value.toFixed(DECIMALS));

const expectBalance = async (userId: string, available: number, locked: number) => {
  const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId } });
  expect(toNumber(balance.availableUSDC)).toBe(available);
  expect(toNumber(balance.lockedUSDC)).toBe(locked);
  expect(balance.availableUSDC.gte(0)).toBe(true);
  expect(balance.lockedUSDC.gte(0)).toBe(true);
};

const ledgerCount = async (userId: string) => {
  return prisma.ledgerEntry.count({ where: { userId } });
};

const setTestHook = (
  hook: Parameters<NonNullable<typeof __setLedgerTestHook>>[0]
) => {
  expect(typeof __setLedgerTestHook).toBe("function");
  __setLedgerTestHook?.(hook);
};

describe("Phase 3 ledger invariants", () => {
  beforeEach(async () => {
    setTestHook(null);
    await resetPublicSchema();
  });

  afterEach(() => {
    setTestHook(null);
  });

  test("hook export is undefined when module is loaded with NODE_ENV=production", async () => {
    vi.resetModules();
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const prodModule = await import("../ledger");
    expect(prodModule.__setLedgerTestHook).toBeUndefined();
    process.env.NODE_ENV = previousNodeEnv;
  });

  test("A) atomicity: forced error rolls back ledger+balance write", async () => {
    const user = await createDeterministicUser();

    setTestHook((stage) => {
      if (stage === "applyDeposit.afterLedgerBeforeBalance") {
        throw new Error("forced test failure");
      }
    });

    await expect(
      applyDeposit({
        eventKey: "atomicity:deposit:1",
        userId: user.id,
        amount: "100",
        chainId: 8453,
        txHash: "0xatomicity",
        logIndex: 1,
        token: "USDC",
      })
    ).rejects.toThrow("forced test failure");

    expect(await ledgerCount(user.id)).toBe(0);
    const balance = await prisma.userBalance.findUnique({ where: { userId: user.id } });
    expect(balance).toBeNull();
  });

  test("B) basic money math and ledger cardinality", async () => {
    const user = await createDeterministicUser();

    await applyDeposit({
      eventKey: "math:deposit:1",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xmathdep",
      logIndex: 1,
      token: "USDC",
    });
    await expectBalance(user.id, 100, 0);

    await lockFundsForOrder({ orderId: "math-order-1", userId: user.id, amount: "40" });
    await expectBalance(user.id, 60, 40);

    await unlockFundsForCancel({ orderId: "math-order-2", userId: user.id, amount: "10" });
    await expectBalance(user.id, 70, 30);

    await applyFill({
      fillId: "math-fill-1",
      orderId: "math-order-1",
      userId: user.id,
      costUSDC: "20",
    });
    await expectBalance(user.id, 70, 10);

    await createWithdrawalRequest({
      withdrawalRequestId: "math-withdraw-1",
      userId: user.id,
      amount: "30",
    });
    await expectBalance(user.id, 40, 40);

    const entries = await prisma.ledgerEntry.findMany({ where: { userId: user.id } });
    expect(entries).toHaveLength(5);
  });

  test("C1) idempotency: deposit applies once for same eventKey", async () => {
    const user = await createDeterministicUser();
    const payload = {
      eventKey: "idem:deposit:1",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xidemdep",
      logIndex: 1,
      token: "USDC",
    };

    const first = await applyDeposit(payload);
    const second = await applyDeposit(payload);

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(await ledgerCount(user.id)).toBe(1);
    await expectBalance(user.id, 100, 0);
  });

  test("C2) idempotency: fill applies once for same fillId", async () => {
    const user = await createDeterministicUser();
    await applyDeposit({
      eventKey: "idem:fill:deposit",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xidemfilldep",
      logIndex: 1,
      token: "USDC",
    });
    await lockFundsForOrder({ orderId: "idem-fill-order", userId: user.id, amount: "40" });

    const first = await applyFill({
      fillId: "idem-fill-1",
      orderId: "idem-fill-order",
      userId: user.id,
      costUSDC: "20",
    });
    const second = await applyFill({
      fillId: "idem-fill-1",
      orderId: "idem-fill-order",
      userId: user.id,
      costUSDC: "20",
    });

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    await expectBalance(user.id, 60, 20);
    expect(await ledgerCount(user.id)).toBe(3);
  });

  test("C3) idempotency: withdrawal request applies once for same id", async () => {
    const user = await createDeterministicUser();
    await applyDeposit({
      eventKey: "idem:wreq:deposit",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xidemwreqdep",
      logIndex: 1,
      token: "USDC",
    });

    const first = await createWithdrawalRequest({
      withdrawalRequestId: "idem-wreq-1",
      userId: user.id,
      amount: "30",
    });
    const second = await createWithdrawalRequest({
      withdrawalRequestId: "idem-wreq-1",
      userId: user.id,
      amount: "30",
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await prisma.withdrawalRequest.count({ where: { id: "idem-wreq-1" } })).toBe(1);
    await expectBalance(user.id, 70, 30);
    expect(await ledgerCount(user.id)).toBe(2);
  });

  test("C4) idempotency: withdrawal completion txHash is unique", async () => {
    const user = await createDeterministicUser();
    await applyDeposit({
      eventKey: "idem:wcomplete:deposit",
      userId: user.id,
      amount: "200",
      chainId: 8453,
      txHash: "0xidemwcompdep",
      logIndex: 1,
      token: "USDC",
    });
    await createWithdrawalRequest({
      withdrawalRequestId: "idem-complete-w1",
      userId: user.id,
      amount: "50",
    });
    await createWithdrawalRequest({
      withdrawalRequestId: "idem-complete-w2",
      userId: user.id,
      amount: "50",
    });

    await completeWithdrawal({
      withdrawalRequestId: "idem-complete-w1",
      txHash: "0x00000000000000000000000000000000000000000000000000000000000000aa",
    });

    await expect(
      completeWithdrawal({
        withdrawalRequestId: "idem-complete-w2",
        txHash: "0x00000000000000000000000000000000000000000000000000000000000000aa",
      })
    ).rejects.toThrow();
  });

  test("D1) concurrency: one of two parallel 80-USDC locks succeeds", async () => {
    const user = await createDeterministicUser();
    await applyDeposit({
      eventKey: "race:lock:deposit",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xracelockdep",
      logIndex: 1,
      token: "USDC",
    });

    const [a, b] = await Promise.allSettled([
      lockFundsForOrder({ orderId: "race-lock-1", userId: user.id, amount: "80" }),
      lockFundsForOrder({ orderId: "race-lock-2", userId: user.id, amount: "80" }),
    ]);

    const fulfilled = [a, b].filter((item) => item.status === "fulfilled");
    const rejected = [a, b].filter((item) => item.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    await expectBalance(user.id, 20, 80);
    const lockEntries = await prisma.ledgerEntry.count({
      where: { userId: user.id, operation: "LOCK" },
    });
    expect(lockEntries).toBe(1);
  });

  test("D2) concurrency: one of two parallel withdrawal requests succeeds", async () => {
    const user = await createDeterministicUser();
    await applyDeposit({
      eventKey: "race:wreq:deposit",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xracewreqdep",
      logIndex: 1,
      token: "USDC",
    });

    const [a, b] = await Promise.allSettled([
      createWithdrawalRequest({ withdrawalRequestId: "race-wreq-1", userId: user.id, amount: "80" }),
      createWithdrawalRequest({ withdrawalRequestId: "race-wreq-2", userId: user.id, amount: "80" }),
    ]);

    const fulfilled = [a, b].filter((item) => item.status === "fulfilled");
    const rejected = [a, b].filter((item) => item.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    await expectBalance(user.id, 20, 80);
    expect(await prisma.withdrawalRequest.count({ where: { userId: user.id } })).toBe(1);
  });

  test("E) ledger reconciliation matches UserBalance buckets", async () => {
    const user = await createDeterministicUser();
    await applyDeposit({
      eventKey: "reconcile:deposit",
      userId: user.id,
      amount: "100",
      chainId: 8453,
      txHash: "0xreconciledep",
      logIndex: 1,
      token: "USDC",
    });
    await lockFundsForOrder({ orderId: "reconcile-order-1", userId: user.id, amount: "40" });
    await unlockFundsForCancel({ orderId: "reconcile-order-2", userId: user.id, amount: "10" });
    await applyFill({
      fillId: "reconcile-fill-1",
      orderId: "reconcile-order-1",
      userId: user.id,
      costUSDC: "20",
    });
    await createWithdrawalRequest({
      withdrawalRequestId: "reconcile-wreq-1",
      userId: user.id,
      amount: "30",
    });

    const recomputed = await recomputeBalanceFromLedger(user.id);
    const persisted = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });

    expect(toNumber(recomputed.availableUSDC)).toBe(toNumber(persisted.availableUSDC));
    expect(toNumber(recomputed.lockedUSDC)).toBe(toNumber(persisted.lockedUSDC));
    expect(toNumber(recomputed.totalUSDC)).toBe(
      toNumber(persisted.availableUSDC.add(persisted.lockedUSDC))
    );
  });

  test("recompute includes WITHDRAWAL_REJECT custody deltas", async () => {
    const user = await createDeterministicUser();
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: user.id,
          reason: "DEPOSIT",
          operation: "DEPOSIT",
          amountDelta: new Prisma.Decimal("100"),
          deltaAvailableUSDC: new Prisma.Decimal("100"),
          deltaLockedUSDC: new Prisma.Decimal("0"),
          idempotencyKey: `withdraw-reject-${user.id}-deposit`,
        },
        {
          userId: user.id,
          reason: "WITHDRAWAL_REQUEST",
          operation: "WITHDRAWAL_REQUEST",
          amountDelta: new Prisma.Decimal("0"),
          deltaAvailableUSDC: new Prisma.Decimal("-30"),
          deltaLockedUSDC: new Prisma.Decimal("30"),
          idempotencyKey: `withdraw-reject-${user.id}-request`,
        },
        {
          userId: user.id,
          reason: "WITHDRAWAL_REJECT",
          operation: "WITHDRAWAL_REJECT",
          amountDelta: new Prisma.Decimal("0"),
          deltaAvailableUSDC: new Prisma.Decimal("30"),
          deltaLockedUSDC: new Prisma.Decimal("-30"),
          idempotencyKey: `withdraw-reject-${user.id}-reject`,
        },
      ],
    });

    const recomputed = await recomputeBalanceFromLedger(user.id);
    expect(toNumber(recomputed.availableUSDC)).toBe(100);
    expect(toNumber(recomputed.lockedUSDC)).toBe(0);
    expect(toNumber(recomputed.totalUSDC)).toBe(100);
  });

  test("recompute ignores legacy amountDelta-only entries", async () => {
    const user = await createDeterministicUser();
    await prisma.ledgerEntry.create({
      data: {
        userId: user.id,
        reason: "FAUCET",
        operation: "OTHER",
        amountDelta: new Prisma.Decimal("999.123456"),
      },
    });

    const recomputed = await recomputeBalanceFromLedger(user.id);
    expect(recomputed.availableUSDC.eq(new Prisma.Decimal(0))).toBe(true);
    expect(recomputed.lockedUSDC.eq(new Prisma.Decimal(0))).toBe(true);
    expect(recomputed.totalUSDC.eq(new Prisma.Decimal(0))).toBe(true);
  });

  test("getCustodyBalance fallback uses delta-based recompute when UserBalance is missing", async () => {
    const user = await createDeterministicUser();
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: user.id,
          reason: "DEPOSIT",
          operation: "DEPOSIT",
          amountDelta: new Prisma.Decimal("50"),
          deltaAvailableUSDC: new Prisma.Decimal("50"),
          deltaLockedUSDC: new Prisma.Decimal("0"),
          idempotencyKey: `fallback-delta-${user.id}-1`,
        },
        {
          userId: user.id,
          reason: "FAUCET",
          operation: "OTHER",
          amountDelta: new Prisma.Decimal("1000"),
        },
      ],
    });

    const custody = await getCustodyBalance(user.id);
    expect(custody.availableUSDC).toBe("50.000000");
    expect(custody.lockedUSDC).toBe("0.000000");
    expect(custody.totalUSDC).toBe("50.000000");
    expect(typeof custody.availableUSDC).toBe("string");
    expect(typeof custody.lockedUSDC).toBe("string");
    expect(typeof custody.totalUSDC).toBe("string");

    const persisted = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
    expect(persisted.availableUSDC.eq(new Prisma.Decimal("50"))).toBe(true);
    expect(persisted.lockedUSDC.eq(new Prisma.Decimal("0"))).toBe(true);
  });

  test("wallet money helpers return string values (no JS number)", async () => {
    const user = await createDeterministicUser();
    await prisma.ledgerEntry.create({
      data: {
        userId: user.id,
        reason: "DEPOSIT",
        operation: "DEPOSIT",
        amountDelta: new Prisma.Decimal("12.345678"),
        deltaAvailableUSDC: new Prisma.Decimal("12.345678"),
        deltaLockedUSDC: new Prisma.Decimal("0"),
        idempotencyKey: `wallet-money-${user.id}-1`,
      },
    });

    const legacy = await getWalletBalance(user.id);
    const custody = await getCustodyBalance(user.id);
    expect(typeof legacy).toBe("string");
    expect(typeof custody.availableUSDC).toBe("string");
    expect(typeof custody.lockedUSDC).toBe("string");
    expect(typeof custody.totalUSDC).toBe("string");
  });
});
