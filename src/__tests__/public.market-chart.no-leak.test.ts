import { NextRequest } from "next/server";

const getUserId = jest.fn();
const assertMarketVisibleToUser = jest.fn();

const mockPrisma = {
  market: {
    findUnique: jest.fn(),
  },
  marketOutcomeSnapshot: {
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  getUserId: () => getUserId(),
}));

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/marketAccess", () => ({
  assertMarketVisibleToUser: (...args: unknown[]) => assertMarketVisibleToUser(...args),
}));

jest.mock("@/lib/marketGuards", () => ({
  toGuardResponse: () => ({ status: 403, body: { error: "Not allowed." } }),
}));

import { GET as getMarketChart } from "@/app/api/markets/[id]/chart/route";

const now = new Date("2026-06-15T12:00:00.000Z");

const forbiddenFieldNames = [
  "privateKey",
  "secret",
  "token",
  "credential",
  "signer",
  "mnemonic",
  "seedPhrase",
  "adminNotes",
  "internalNotes",
  "botAccountId",
  "botCredentialId",
  "ledgerEntryId",
  "ledgerTransactionId",
  "walletPrivateKey",
  "depositPrivateKey",
  "withdrawalApproval",
  "riskLimit",
  "killSwitch",
  "ownerId",
  "userId",
  "positionId",
  "balanceId",
  "orderOwnerId",
];

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectKeys);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
  }

  return [];
};

const expectNoForbiddenKeys = (body: unknown) => {
  const keys = collectKeys(body);
  for (const forbidden of forbiddenFieldNames) {
    expect(keys).not.toContain(forbidden);
  }
};

const expectOnlyKeys = (value: Record<string, unknown>, allowedKeys: string[]) => {
  expect(Object.keys(value).sort()).toEqual([...allowedKeys].sort());
};

describe("public market chart API no-leak checks", () => {
  beforeEach(() => {
    getUserId.mockReset();
    assertMarketVisibleToUser.mockReset();
    mockPrisma.market.findUnique.mockReset();
    mockPrisma.marketOutcomeSnapshot.findMany.mockReset();

    getUserId.mockResolvedValue(null);
    assertMarketVisibleToUser.mockResolvedValue(undefined);
    mockPrisma.market.findUnique.mockResolvedValue({
      id: "market-1",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      ownerId: null,
      outcomes: [
        { id: "yes", name: "Yes" },
        { id: "no", name: "No" },
      ],
    });
    mockPrisma.marketOutcomeSnapshot.findMany.mockResolvedValue([
      { outcomeId: "yes", ts: now, price: 0.57 },
      { outcomeId: "no", ts: now, price: 0.43 },
    ]);
  });

  test("GET /api/markets/[id]/chart returns display chart data without sensitive keys", async () => {
    const response = await getMarketChart(new NextRequest("http://localhost/api/markets/market-1/chart?range=1W"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(200);
    expect(assertMarketVisibleToUser).toHaveBeenCalledWith(
      expect.objectContaining({
        market: expect.objectContaining({ id: "market-1" }),
        userId: null,
      }),
    );
    expect(mockPrisma.marketOutcomeSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          marketId: "market-1",
          ts: expect.objectContaining({ gte: expect.any(Date) }),
        }),
        orderBy: { ts: "asc" },
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["emptyState", "generatedAt", "history", "lastUpdated", "marketId", "outcomes", "range", "ranges", "series", "source"]);
    expect(body).toMatchObject({
      marketId: "market-1",
      source: "market-outcome-snapshot",
      range: "1W",
      ranges: ["1H", "1D", "1W", "1M", "MAX"],
      generatedAt: expect.any(String),
      lastUpdated: now.toISOString(),
      emptyState: null,
      outcomes: [
        { id: "yes", name: "Yes" },
        { id: "no", name: "No" },
      ],
      history: [
        { outcomeId: "yes", timestamp: now.toISOString(), price: 0.57, probability: 57 },
        { outcomeId: "no", timestamp: now.toISOString(), price: 0.43, probability: 43 },
      ],
      series: {
        yes: [{ ts: now.toISOString(), price: 0.57 }],
        no: [{ ts: now.toISOString(), price: 0.43 }],
      },
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets/[id]/chart supports the visible 1H range", async () => {
    const response = await getMarketChart(new NextRequest("http://localhost/api/markets/market-1/chart?range=1H"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(200);
    const findInput = mockPrisma.marketOutcomeSnapshot.findMany.mock.calls[0]?.[0];
    expect(findInput.where.ts.gte).toBeInstanceOf(Date);
    expect(now.getTime() - findInput.where.ts.gte.getTime()).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    const body = await response.json();
    expect(body.range).toBe("1H");
    expect(body.ranges).toEqual(["1H", "1D", "1W", "1M", "MAX"]);
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets/[id]/chart returns an empty public series when no snapshots exist", async () => {
    mockPrisma.marketOutcomeSnapshot.findMany.mockResolvedValue([]);

    const response = await getMarketChart(new NextRequest("http://localhost/api/markets/market-1/chart?range=1M"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.marketOutcomeSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          marketId: "market-1",
          ts: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["emptyState", "generatedAt", "history", "lastUpdated", "marketId", "outcomes", "range", "ranges", "series", "source"]);
    expect(body).toEqual({
      marketId: "market-1",
      source: "empty",
      range: "1M",
      ranges: ["1H", "1D", "1W", "1M", "MAX"],
      generatedAt: expect.any(String),
      lastUpdated: null,
      emptyState: "no-history",
      outcomes: [
        { id: "yes", name: "Yes" },
        { id: "no", name: "No" },
      ],
      history: [],
      series: {},
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets/[id]/chart marks Polymarket-backed history source", async () => {
    mockPrisma.market.findUnique.mockResolvedValue({
      id: "market-1",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      ownerId: null,
      referenceSource: "polymarket",
      outcomes: [
        { id: "yes", name: "Yes" },
        { id: "no", name: "No" },
      ],
    });

    const response = await getMarketChart(new NextRequest("http://localhost/api/markets/market-1/chart?range=1D"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      marketId: "market-1",
      source: "polymarket-clob-prices-history",
      emptyState: null,
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets/[id]/chart returns a public 404 error shape when missing", async () => {
    mockPrisma.market.findUnique.mockResolvedValue(null);

    const response = await getMarketChart(new NextRequest("http://localhost/api/markets/missing-market/chart"), {
      params: Promise.resolve({ id: "missing-market" }),
    });

    expect(response.status).toBe(404);
    expect(assertMarketVisibleToUser).not.toHaveBeenCalled();
    expect(mockPrisma.marketOutcomeSnapshot.findMany).not.toHaveBeenCalled();

    const body = await response.json();
    expectOnlyKeys(body, ["error"]);
    expect(body).toEqual({ error: "Market not found." });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets/[id]/chart uses the visibility guard for hidden markets", async () => {
    assertMarketVisibleToUser.mockRejectedValue(new Error("hidden"));

    const response = await getMarketChart(new NextRequest("http://localhost/api/markets/market-1/chart"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(403);
    expect(mockPrisma.marketOutcomeSnapshot.findMany).not.toHaveBeenCalled();

    const body = await response.json();
    expect(body).toEqual({ error: "Not allowed." });
    expectNoForbiddenKeys(body);
  });
});
