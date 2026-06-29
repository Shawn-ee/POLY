import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyDeposit } from "@/server/services/ledger";
import { createDeterministicUser, resetPublicSchema } from "@/server/services/__tests__/dbTestUtils";
import { POST as createMarket } from "@/app/api/admin/markets/create/route";
import { GET as getAdminMarket, PATCH as patchAdminMarket } from "@/app/api/admin/markets/[id]/route";
import { GET as getInvariantState } from "@/app/api/admin/markets/[id]/invariants/route";
import { POST as pauseMarket } from "@/app/api/admin/markets/pause/route";
import { POST as mintCompleteSet } from "@/app/api/orderbook/[marketId]/mint/route";
import { POST as resolveMarket } from "@/app/api/admin/markets/resolve/route";

const requireAdmin = jest.fn();
const requireCanonicalActor = jest.fn();
const enforceSensitiveRateLimit = jest.fn();
const emitMarketUpdate = jest.fn();
const emitUserUpdate = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/lib/canonicalAuth", () => ({
  requireCanonicalActor: (...args: unknown[]) => requireCanonicalActor(...args),
}));

jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceSensitiveRateLimit: (...args: unknown[]) => enforceSensitiveRateLimit(...args),
}));

jest.mock("@/server/services/orderbookEvents", () => ({
  emitMarketUpdate: (...args: unknown[]) => emitMarketUpdate(...args),
  emitUserUpdate: (...args: unknown[]) => emitUserUpdate(...args),
}));

const dec = (value: Prisma.Decimal) => value.toFixed(6);

const createAdminUser = async () =>
  prisma.user.create({
    data: {
      username: `admin_sim_${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      email: `admin_sim_${process.pid}_${Date.now()}@test.local`,
      isAdmin: true,
    },
  });

describe("admin market simulation harness", () => {
  beforeEach(async () => {
    await resetPublicSchema();
    emitMarketUpdate.mockResolvedValue(undefined);
    emitUserUpdate.mockResolvedValue(undefined);
  });

  test("admin agent can create, activate, inspect, and resolve a public orderbook market via routes", async () => {
    const admin = await createAdminUser();
    const trader = await createDeterministicUser();

    requireAdmin.mockResolvedValue({ user: admin });
    requireCanonicalActor.mockResolvedValue({
      userId: trader.id,
      authType: "session",
      apiCredentialId: null,
      apiKeyId: null,
      scopes: null,
      apiCredential: null,
    });

    await applyDeposit({
      eventKey: `admin-sim-deposit:${trader.id}`,
      userId: trader.id,
      amount: "10",
      chainId: 8453,
      txHash: `0x${"1".repeat(64)}`,
      logIndex: 1,
      token: "USDC",
    });

    const createResponse = await createMarket(
      new NextRequest("http://localhost/api/admin/markets/create", {
        method: "POST",
        body: JSON.stringify({
          title: "Admin simulation market",
          description: "Focused integration harness for admin market flow.",
          resolveTime: "2026-05-10T12:00:00.000Z",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          type: "BINARY",
          tags: ["simulation", "admin"],
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(createResponse.status).toBe(200);
    const createBody = await createResponse.json();
    expect(typeof createBody.marketId).toBe("string");
    const marketId = createBody.marketId as string;

    const detailResponse = await getAdminMarket(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}`),
      { params: Promise.resolve({ id: marketId }) }
    );
    expect(detailResponse.status).toBe(200);
    const detailBody = await detailResponse.json();
    expect(detailBody.market.outcomes).toHaveLength(2);
    const [yesOutcome, noOutcome] = detailBody.market.outcomes;
    expect([yesOutcome.name, noOutcome.name]).toEqual(["YES", "NO"]);

    const patchResponse = await patchAdminMarket(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: "Admin simulation market updated",
          description: "Updated through admin route before market goes live.",
        }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: marketId }) }
    );
    expect(patchResponse.status).toBe(200);
    const patchBody = await patchResponse.json();
    expect(patchBody.market.title).toBe("Admin simulation market updated");

    const liveResponse = await pauseMarket(
      new NextRequest("http://localhost/api/admin/markets/pause", {
        method: "POST",
        body: JSON.stringify({ marketId, status: "LIVE" }),
        headers: { "content-type": "application/json" },
      })
    );
    expect(liveResponse.status).toBe(200);
    expect(await liveResponse.json()).toEqual({ status: "LIVE" });

    const mintResponse = await mintCompleteSet(
      new NextRequest(`http://localhost/api/orderbook/${marketId}/mint`, {
        method: "POST",
        body: JSON.stringify({ quantity: "7.500000" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ marketId }) }
    );
    expect(mintResponse.status).toBe(200);
    expect(await mintResponse.json()).toMatchObject({
      ok: true,
      marketId,
      quantity: "7.5",
      outcomesMinted: 2,
    });

    const invariantResponse = await getInvariantState(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}/invariants`),
      { params: Promise.resolve({ id: marketId }) }
    );
    expect(invariantResponse.status).toBe(200);
    expect(await invariantResponse.json()).toMatchObject({
      marketId,
      marketStatus: "LIVE",
      invariantStatusSummary: "PASS",
      marketCollateralUSDC: "7.5",
      outstandingSharesOutcome1: "7.5",
      outstandingSharesOutcome2: "7.5",
    });

    const resolveResponse = await resolveMarket(
      new NextRequest("http://localhost/api/admin/markets/resolve", {
        method: "POST",
        body: JSON.stringify({
          marketId,
          winningOutcomeId: yesOutcome.id,
        }),
        headers: { "content-type": "application/json" },
      })
    );
    expect(resolveResponse.status).toBe(200);
    expect(await resolveResponse.json()).toMatchObject({
      ok: true,
      marketId,
      winningOutcomeId: yesOutcome.id,
      totalPoolPayout: "7.5",
      totalWinningShares: "7.5",
      collateralDebitedUSDC: "7.5",
      payouts: [{ userId: trader.id, amountPaid: "7.5" }],
    });

    const resolvedMarket = await prisma.market.findUniqueOrThrow({
      where: { id: marketId },
    });
    expect(resolvedMarket.status).toBe("RESOLVED");
    expect(resolvedMarket.resolvedOutcomeId).toBe(yesOutcome.id);
    expect(dec(resolvedMarket.collateralUSDC)).toBe("0.000000");

    const positions = await prisma.position.findMany({
      where: { marketId },
      orderBy: [{ outcomeId: "asc" }],
    });
    expect(positions).toHaveLength(2);
    expect(positions.every((position) => dec(position.shares) === "0.000000")).toBe(true);
    expect(positions.every((position) => dec(position.reservedShares) === "0.000000")).toBe(true);

    const balance = await prisma.userBalance.findUniqueOrThrow({
      where: { userId: trader.id },
    });
    expect(dec(balance.availableUSDC)).toBe("10.000000");
    expect(dec(balance.lockedUSDC)).toBe("0.000000");

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { userId: trader.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { reason: true, referenceId: true },
    });
    expect(ledgerEntries.map((entry) => entry.reason)).toEqual(["DEPOSIT", "LOCK", "WIN"]);
    expect(ledgerEntries[1]?.referenceId).toBe(marketId);
    expect(ledgerEntries[2]?.referenceId).toBe(marketId);

    expect(enforceSensitiveRateLimit).toHaveBeenCalledTimes(4);
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith(admin.id, "admin_market_mutation");
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith(trader.id, "mint");
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith(admin.id, "admin_market_resolve");
    expect(emitMarketUpdate).toHaveBeenCalled();
    expect(emitUserUpdate).toHaveBeenCalledWith({ userId: trader.id, marketId });
  });
});
