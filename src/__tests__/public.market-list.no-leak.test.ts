import { NextRequest } from "next/server";

const mockPrisma = {
  market: {
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/orderbookPricing", () => ({
  getOutcomeQuotes: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock("@/server/services/polymarketReferenceImport", () => ({
  parseReferenceReview: jest.fn().mockReturnValue({}),
}));

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  getReferenceSummaryForMarket: jest.fn().mockResolvedValue(null),
}));

import { GET as listMarkets } from "@/app/api/markets/route";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";
import { getReferenceSummaryForMarket } from "@/server/services/referenceQuoteSnapshots";

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

const expectedMarketKeys = [
  "category",
  "conditionId",
  "createdAt",
  "description",
  "event",
  "externalMarketId",
  "externalSlug",
  "id",
  "importStatus",
  "kind",
  "marketType",
  "mechanism",
  "mmEnabled",
  "outcomes",
  "prices",
  "pricesByOutcome",
  "referenceOnly",
  "referenceSource",
  "referenceSummary",
  "resolveTime",
  "status",
  "tags",
  "title",
  "tradable",
  "type",
  "visibility",
];

const market = {
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
      referenceTokenId: null,
      referenceOutcomeLabel: null,
    },
    {
      id: "no",
      name: "No",
      label: "No",
      code: "NO",
      displayOrder: 1,
      status: "active",
      isTradable: true,
      metadata: {},
      referenceTokenId: null,
      referenceOutcomeLabel: null,
    },
  ],
  event: {
    id: "event-1",
    slug: "france-vs-argentina",
    title: "France vs Argentina",
    category: "sports",
    sportKey: "soccer",
    leagueKey: "world_cup",
    eventType: "match",
    homeTeamName: "France",
    awayTeamName: "Argentina",
    startTime: now,
    status: "scheduled",
    source: null,
    externalEventId: null,
    externalSlug: null,
    image: null,
    icon: null,
  },
  category: { id: "category-1", name: "Sports", slug: "sports" },
  tags: [{ tag: { id: "tag-1", name: "World Cup", slug: "world-cup", group: "sports" } }],
  externalMarketId: null,
  conditionId: null,
  referenceSource: null,
  externalSlug: null,
  referenceMetadata: null,
  type: "BINARY",
  marketType: "match_winner",
  kind: "ORDERBOOK",
  visibility: "PUBLIC",
  mechanism: "ORDERBOOK",
};

describe("public market list API no-leak checks", () => {
  beforeEach(() => {
    mockPrisma.market.findMany.mockReset();
    jest.mocked(getOutcomeQuotes).mockResolvedValue(
      new Map([
        ["yes", { bestBid: 0.51, bestAsk: 0.53, mid: 0.52, spread: 0.02 }],
        ["no", { bestBid: 0.47, bestAsk: 0.49, mid: 0.48, spread: 0.02 }],
      ]),
    );
    jest.mocked(parseReferenceReview).mockReturnValue({});
    jest.mocked(getReferenceSummaryForMarket).mockResolvedValue(null);
  });

  test("GET /api/markets returns public listed markets without sensitive keys", async () => {
    mockPrisma.market.findMany.mockResolvedValue([market]);

    const response = await listMarkets(
      new NextRequest("http://localhost/api/markets?category=sports&tags=world-cup&search=france"),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.market.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visibility: "PUBLIC",
          isListed: true,
          status: "LIVE",
          category: { slug: "sports" },
          tags: { some: { tag: { slug: { in: ["world-cup"] } } } },
        }),
        orderBy: [{ createdAt: "desc" }],
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["markets"]);
    expect(body.markets).toHaveLength(1);
    expectOnlyKeys(body.markets[0], expectedMarketKeys);
    expectOnlyKeys(body.markets[0].category, ["id", "name", "slug"]);
    expectOnlyKeys(body.markets[0].tags[0], ["group", "id", "name", "slug"]);
    expect(body.markets[0]).toMatchObject({
      id: "market-1",
      title: "Will France beat Argentina?",
      visibility: "PUBLIC",
      outcomes: [
        { id: "yes", name: "Yes", price: 0.52 },
        { id: "no", name: "No", price: 0.48 },
      ],
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets returns an empty public market list without sensitive keys", async () => {
    mockPrisma.market.findMany.mockResolvedValue([]);

    const response = await listMarkets(new NextRequest("http://localhost/api/markets?view=resolved"));

    expect(response.status).toBe(200);
    expect(mockPrisma.market.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visibility: "PUBLIC",
          isListed: true,
          status: "RESOLVED",
        }),
        orderBy: [{ resolveTime: "desc" }, { createdAt: "desc" }],
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["markets"]);
    expect(body).toEqual({ markets: [] });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/markets excludes grouped reference markets from the public list", async () => {
    mockPrisma.market.findMany.mockResolvedValue([
      market,
      {
        ...market,
        id: "grouped-market",
        title: "Grouped market should not appear in flat public list",
        referenceMetadata: { group: { slug: "match-winner" } },
      },
    ]);

    const response = await listMarkets(new NextRequest("http://localhost/api/markets?view=all"));

    expect(response.status).toBe(200);
    expect(mockPrisma.market.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visibility: "PUBLIC",
          isListed: true,
        }),
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["markets"]);
    expect(body.markets).toHaveLength(1);
    expect(body.markets[0]).toMatchObject({
      id: "market-1",
      title: "Will France beat Argentina?",
    });
    expect(body.markets.map((item: { id: string }) => item.id)).not.toContain("grouped-market");
    expectNoForbiddenKeys(body);
  });
});
