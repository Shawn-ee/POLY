import { prisma } from "@/lib/db";
import { resetPublicSchema } from "@/server/services/__tests__/dbTestUtils";
import { generateUsedEnvironment } from "@/server/services/seedUsedEnvironment";

describe("seedUsedEnvironment", () => {
  jest.setTimeout(30_000);

  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("light mode generates a realistic environment and reconciles", async () => {
    const summary = await generateUsedEnvironment({
      mode: "light",
      seed: "jest-used-light",
      users: 6,
      publicMarkets: 3,
      privateMarkets: 2,
      withWithdrawals: true,
      withResolutions: true,
      verbose: false,
    });

    expect(summary.users.ensured).toBe(6);
    expect(summary.activity.trades + summary.activity.poolBets).toBeGreaterThan(0);
    expect(summary.reconciliation.pass).toBe(true);
    expect(summary.reconciliation.balances.pass).toBe(true);
    expect(summary.reconciliation.markets.pass).toBe(true);
    expect(summary.reconciliation.withdrawals.pass).toBe(true);
  });

  test("deterministic seed returns stable summary shape across reset runs", async () => {
    const run = async () =>
      generateUsedEnvironment({
        mode: "light",
        seed: "jest-used-stable",
        reset: true,
        users: 5,
        publicMarkets: 2,
        privateMarkets: 2,
        withWithdrawals: true,
        withResolutions: true,
        verbose: false,
      });

    const a = await run();
    const b = await run();

    expect({
      users: a.users.ensured,
      publicCreated: a.markets.publicCreated,
      privateCreated: a.markets.privateCreated,
      resolved: a.markets.resolved,
      canceled: a.markets.canceled,
      openOrders: a.activity.openOrders,
      fills: a.activity.fills,
      trades: a.activity.trades,
      poolBets: a.activity.poolBets,
      wdPending: a.withdrawals.pending,
      wdCompleted: a.withdrawals.completed,
      wdRejected: a.withdrawals.rejected,
    }).toEqual({
      users: b.users.ensured,
      publicCreated: b.markets.publicCreated,
      privateCreated: b.markets.privateCreated,
      resolved: b.markets.resolved,
      canceled: b.markets.canceled,
      openOrders: b.activity.openOrders,
      fills: b.activity.fills,
      trades: b.activity.trades,
      poolBets: b.activity.poolBets,
      wdPending: b.withdrawals.pending,
      wdCompleted: b.withdrawals.completed,
      wdRejected: b.withdrawals.rejected,
    });
    expect(a.reconciliation.pass).toBe(true);
    expect(b.reconciliation.pass).toBe(true);
  });

  test("resolved public markets are collateral finalized", async () => {
    const summary = await generateUsedEnvironment({
      mode: "light",
      seed: "jest-used-resolve",
      users: 6,
      publicMarkets: 3,
      privateMarkets: 1,
      withWithdrawals: false,
      withResolutions: true,
      verbose: false,
    });

    expect(summary.markets.resolvedPublicMarkets).toBeGreaterThan(0);
    const resolvedPublic = await prisma.market.findMany({
      where: {
        mechanism: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "RESOLVED",
      },
      select: { id: true, collateralUSDC: true },
    });
    expect(resolvedPublic.length).toBeGreaterThan(0);
    for (const market of resolvedPublic) {
      expect(Number(market.collateralUSDC)).toBe(0);
    }
    expect(summary.reconciliation.markets.pass).toBe(true);
  });
});
