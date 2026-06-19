import { NextRequest } from "next/server";

const getUserId = jest.fn();
const assertMarketVisibleToUser = jest.fn();
const serializeMarketReadModel = jest.fn();

const mockPrisma = {
  market: {
    findUnique: jest.fn(),
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

jest.mock("@/server/services/marketReadModel", () => ({
  marketReadInclude: { outcomes: true, event: true, category: true, tags: true },
  serializeMarketReadModel: (...args: unknown[]) => serializeMarketReadModel(...args),
}));

import { GET as getMarketDetail } from "@/app/api/markets/[id]/route";

const now = new Date("2026-06-15T12:00:00.000Z");

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectKeys);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
  }

  return [];
};

const expectOnlyKeys = (value: Record<string, unknown>, allowedKeys: string[]) => {
  expect(Object.keys(value).sort()).toEqual([...allowedKeys].sort());
};

const forbiddenSecretFieldNames = [
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
  "userId",
  "positionId",
  "balanceId",
  "orderOwnerId",
];

const currentGapFieldNames = [
  "ownerId",
  "isCanceled",
  "betCloseTime",
  "isListed",
  "externalMarketId",
  "conditionId",
  "referenceSource",
  "externalSlug",
  "importStatus",
  "referenceOnly",
  "tradable",
  "mmEnabled",
  "referenceSummary",
  "metadata",
  "referenceTokenId",
  "referenceOutcomeLabel",
];

const expectNoSecretKeys = (body: unknown) => {
  const keys = collectKeys(body);
  for (const forbidden of forbiddenSecretFieldNames) {
    expect(keys).not.toContain(forbidden);
  }
};

const marketRecord = {
  id: "market-1",
  ownerId: "owner-1",
  visibility: "PUBLIC",
  mechanism: "ORDERBOOK",
  isCanceled: false,
  betCloseTime: now,
  isListed: true,
};

const serializedMarket = {
  id: "market-1",
  title: "Will France beat Argentina?",
  description: "Resolves according to official final result.",
  status: "LIVE",
  resolveTime: null,
  createdAt: now,
  outcomes: [
    {
      id: "yes",
      name: "Yes",
      label: "Yes",
      code: "YES",
      displayOrder: 0,
      status: "active",
      isTradable: true,
      metadata: {},
      referenceTokenId: "ref-token-yes",
      referenceOutcomeLabel: "France",
      price: 0.52,
      bestBid: 0.51,
      bestAsk: 0.53,
      spread: 0.02,
    },
  ],
  event: {
    id: "event-1",
    slug: "france-vs-argentina",
    title: "France vs Argentina",
    source: "fixture",
    externalEventId: "external-event-1",
    externalSlug: "france-argentina",
  },
  externalMarketId: "external-market-1",
  conditionId: "condition-1",
  referenceSource: "polymarket",
  externalSlug: "will-france-beat-argentina",
  importStatus: "imported",
  referenceOnly: false,
  tradable: true,
  mmEnabled: true,
  referenceSummary: { source: "fixture" },
  type: "BINARY",
  marketType: "match_winner",
  kind: "ORDERBOOK",
  visibility: "PUBLIC",
  mechanism: "ORDERBOOK",
  category: { id: "category-1", name: "Sports", slug: "sports" },
  tags: [{ id: "tag-1", name: "World Cup", slug: "world-cup", group: "sports" }],
  prices: { YES: 0.52, NO: 0.48 },
  pricesByOutcome: { yes: 0.52, no: 0.48 },
};

describe("public market detail API current-gap checks", () => {
  beforeEach(() => {
    getUserId.mockReset();
    assertMarketVisibleToUser.mockReset();
    mockPrisma.market.findUnique.mockReset();
    serializeMarketReadModel.mockReset();

    getUserId.mockResolvedValue(null);
    assertMarketVisibleToUser.mockResolvedValue(undefined);
    mockPrisma.market.findUnique.mockResolvedValue(marketRecord);
    serializeMarketReadModel.mockResolvedValue(serializedMarket);
  });

  test("GET /api/markets/[id] returns current extra fields as documented gaps", async () => {
    const response = await getMarketDetail(new NextRequest("http://localhost/api/markets/market-1"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.market.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "market-1" },
        include: expect.any(Object),
      }),
    );
    expect(assertMarketVisibleToUser).toHaveBeenCalledWith({
      market: marketRecord,
      userId: null,
    });
    expect(serializeMarketReadModel).toHaveBeenCalledWith(marketRecord);

    const body = await response.json();
    expectOnlyKeys(body, ["market"]);
    expect(body.market).toMatchObject({
      id: "market-1",
      title: "Will France beat Argentina?",
      ownerId: "owner-1",
      isCanceled: false,
      betCloseTime: now.toISOString(),
      isListed: true,
      externalMarketId: "external-market-1",
      conditionId: "condition-1",
      referenceSource: "polymarket",
      externalSlug: "will-france-beat-argentina",
      importStatus: "imported",
      referenceOnly: false,
      tradable: true,
      mmEnabled: true,
    });

    const keys = collectKeys(body);
    for (const currentGapField of currentGapFieldNames) {
      expect(keys).toContain(currentGapField);
    }
    expectNoSecretKeys(body);
  });

  test("GET /api/markets/[id] returns the current public 404 shape when missing", async () => {
    mockPrisma.market.findUnique.mockResolvedValue(null);

    const response = await getMarketDetail(new NextRequest("http://localhost/api/markets/missing-market"), {
      params: Promise.resolve({ id: "missing-market" }),
    });

    expect(response.status).toBe(404);
    expect(assertMarketVisibleToUser).not.toHaveBeenCalled();
    expect(serializeMarketReadModel).not.toHaveBeenCalled();

    const body = await response.json();
    expectOnlyKeys(body, ["error"]);
    expect(body).toEqual({ error: "Market not found." });
    expectNoSecretKeys(body);
  });

  test("GET /api/markets/[id] passes through the current visibility guard error shape", async () => {
    assertMarketVisibleToUser.mockRejectedValue(new Error("hidden"));

    const response = await getMarketDetail(new NextRequest("http://localhost/api/markets/market-1"), {
      params: Promise.resolve({ id: "market-1" }),
    });

    expect(response.status).toBe(403);
    expect(serializeMarketReadModel).not.toHaveBeenCalled();

    const body = await response.json();
    expectOnlyKeys(body, ["error"]);
    expect(body).toEqual({ error: "Not allowed." });
    expectNoSecretKeys(body);
  });
});
