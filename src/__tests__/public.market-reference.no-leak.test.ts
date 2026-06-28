import { NextRequest } from "next/server";

const getUserId = jest.fn();
const assertMarketVisibleToUser = jest.fn();
const parseBotInitializationMetadata = jest.fn();
const getLatestReferenceQuotePlansForMarket = jest.fn();

const mockPrisma = {
  market: {
    findUnique: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
  userBalance: {
    findUnique: jest.fn(),
  },
  position: {
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

jest.mock("@/server/services/referenceBotInitialization", () => ({
  parseBotInitializationMetadata: (...args: unknown[]) => parseBotInitializationMetadata(...args),
}));

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  getLatestReferenceQuotePlansForMarket: (...args: unknown[]) => getLatestReferenceQuotePlansForMarket(...args),
}));

import { GET as getMarketReference } from "@/app/api/markets/[id]/reference/route";

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
  }
  return [];
};

const forbiddenFieldNames = [
  "externalSlug",
  "externalMarketId",
  "conditionId",
  "referenceMetadata",
  "polymarketSlug",
  "polymarketMarketId",
  "polymarketTokenId",
  "tokenId",
  "botUserId",
  "botUsername",
  "botApiCredentialId",
  "botApiKeyId",
  "activeBidOrderId",
  "activeAskOrderId",
  "availableCashUSDC",
  "lockedCashUSDC",
];

describe("public market reference API no-leak checks", () => {
  beforeEach(() => {
    getUserId.mockResolvedValue(null);
    assertMarketVisibleToUser.mockResolvedValue(undefined);
    mockPrisma.market.findUnique.mockResolvedValue({
      id: "market-1",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      ownerId: "owner-1",
      referenceSource: "polymarket",
      referenceMetadata: { secret: "do-not-leak" },
    });
    getLatestReferenceQuotePlansForMarket.mockResolvedValue([
      {
        localOutcomeId: "yes",
        outcomeName: "YES",
        polymarketSlug: "forbidden",
        polymarketMarketId: "forbidden",
        conditionId: "forbidden",
        polymarketTokenId: "forbidden",
        hasSnapshot: true,
        referenceBid: 0.51,
        referenceAsk: 0.53,
        plannedBotBid: 0.49,
        plannedBotAsk: 0.55,
      },
    ]);
    parseBotInitializationMetadata.mockReturnValue({
      status: "ready",
      lastCheckedAt: "2026-06-28T00:00:00.000Z",
      reason: null,
      approvedBy: "admin-1",
      approvedAt: "2026-06-28T00:00:00.000Z",
      riskProfile: "closed_beta",
      capital: {
        budgetCents: 1000,
        mintBudgetCents: 500,
        mintedCompleteSets: 1,
        cashReserveCents: 200,
        autoReplenish: false,
        initializedAt: "2026-06-28T00:00:00.000Z",
        initializedBy: "admin-1",
        botUserId: "bot-user-1",
        botUsername: "bot",
        botApiCredentialId: "credential-1",
        botApiKeyId: "api-key-1",
        maxSingleOrderNotionalCents: 100,
        maxOpenOrderNotionalCents: 500,
        maxDailyLossCents: 100,
      },
      runtime: {
        liveOrdersEnabled: false,
        emergencyStop: false,
        cancelRequestedAt: null,
        lastSeededAt: null,
        lastLiveRunAt: null,
        lastRuntimeSyncAt: null,
      },
      readiness: {
        ready: true,
        dryRun: true,
        liveRequested: false,
        reasons: [],
        referenceBid: 0.51,
        referenceAsk: 0.53,
        plannedBotBid: 0.49,
        plannedBotAsk: 0.55,
      },
    });
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        outcomeId: "yes",
        side: "BUY",
        price: 0.49,
        remaining: 1,
        reservedNotional: 0.49,
        createdAt: new Date("2026-06-28T00:00:00.000Z"),
      },
    ]);
    mockPrisma.userBalance.findUnique.mockResolvedValue({ availableUSDC: 100, lockedUSDC: 1 });
    mockPrisma.position.findMany.mockResolvedValue([{ outcomeId: "yes", shares: 1, reservedShares: 0, realizedPnl: 0 }]);
  });

  test("GET /api/markets/[id]/reference returns reference status without mapping or bot identifiers", async () => {
    const response = await getMarketReference(new NextRequest("http://localhost/api/markets/market-1/reference"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    const keys = collectKeys(body);
    for (const forbidden of forbiddenFieldNames) {
      expect(keys).not.toContain(forbidden);
    }
    expect(body).toMatchObject({
      marketId: "market-1",
      source: "polymarket",
      hasSnapshot: true,
      botInitialization: {
        status: "ready",
        capital: {
          budgetCents: 1000,
          maxDailyLossCents: 100,
        },
      },
      outcomes: [
        {
          localOutcomeId: "yes",
          activeBotBid: 0.49,
          activeBotAsk: null,
        },
      ],
    });
  });
});
