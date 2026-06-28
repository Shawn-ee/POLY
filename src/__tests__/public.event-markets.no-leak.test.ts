const mockPrisma = {
  event: {
    findUnique: jest.fn(),
  },
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

jest.mock("@/server/services/eventGroupedMarkets", () => ({
  getGroupedEventMarkets: jest.fn(),
}));

import { GET as listEventMarkets } from "@/app/api/events/[slug]/markets/route";
import { GET as getGroupedMarkets } from "@/app/api/events/[slug]/grouped-markets/route";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { getGroupedEventMarkets } from "@/server/services/eventGroupedMarkets";
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
  "externalMarketId",
  "conditionId",
  "externalSlug",
  "externalEventId",
  "referenceTokenId",
  "referenceOutcomeLabel",
  "referenceMetadata",
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
  "createdAt",
  "description",
  "event",
  "id",
  "importStatus",
  "kind",
  "line",
  "marketType",
  "mechanism",
  "mmEnabled",
  "outcomes",
  "prices",
  "pricesByOutcome",
  "referenceOnly",
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
  category: null,
  tags: [],
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

describe("public event market API no-leak checks", () => {
  beforeEach(() => {
    mockPrisma.event.findUnique.mockReset();
    mockPrisma.market.findMany.mockReset();
    jest.mocked(getOutcomeQuotes).mockResolvedValue(
      new Map([
        ["yes", { bestBid: 0.51, bestAsk: 0.53, mid: 0.52, spread: 0.02 }],
        ["no", { bestBid: 0.47, bestAsk: 0.49, mid: 0.48, spread: 0.02 }],
      ]),
    );
    jest.mocked(parseReferenceReview).mockReturnValue({});
    jest.mocked(getReferenceSummaryForMarket).mockResolvedValue(null);
    jest.mocked(getGroupedEventMarkets).mockReset();
  });

  test("GET /api/events/[slug]/markets returns public event markets without sensitive keys", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({ id: "event-1" });
    mockPrisma.market.findMany.mockResolvedValue([market]);

    const response = await listEventMarkets(new Request("http://localhost/api/events/france-vs-argentina/markets"), {
      params: Promise.resolve({ slug: "france-vs-argentina" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
      where: { slug: "france-vs-argentina" },
      select: { id: true },
    });
    expect(mockPrisma.market.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: "event-1", visibility: "PUBLIC", isListed: true },
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["markets"]);
    expect(body.markets).toHaveLength(1);
    expectOnlyKeys(body.markets[0], expectedMarketKeys);
    expectOnlyKeys(body.markets[0].outcomes[0], [
      "bestAsk",
      "bestBid",
      "code",
      "displayOrder",
      "id",
      "isTradable",
      "label",
      "metadata",
      "name",
      "price",
      "spread",
      "status",
    ]);
    expect(body.markets[0]).toMatchObject({
      id: "market-1",
      title: "Will France beat Argentina?",
      visibility: "PUBLIC",
      event: {
        slug: "france-vs-argentina",
      },
      outcomes: [
        { id: "yes", name: "Yes", price: 0.52 },
        { id: "no", name: "No", price: 0.48 },
      ],
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events/[slug]/markets returns a public 404 error shape when event is missing", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);

    const response = await listEventMarkets(new Request("http://localhost/api/events/missing-event/markets"), {
      params: Promise.resolve({ slug: "missing-event" }),
    });

    expect(response.status).toBe(404);
    expect(mockPrisma.market.findMany).not.toHaveBeenCalled();

    const body = await response.json();
    expectOnlyKeys(body, ["error"]);
    expect(body).toEqual({ error: "Event not found." });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events/[slug]/markets hides draft imports by query and omits mapping fields for enabled imports", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({ id: "event-1" });
    mockPrisma.market.findMany.mockResolvedValue([
      {
        ...market,
        id: "imported-enabled",
        externalMarketId: "pm-worldcup-france-win",
        conditionId: "cond-worldcup-france-win",
        externalSlug: "will-france-win-2026-fifa-world-cup",
        referenceSource: "polymarket",
        referenceMetadata: {
          importStatus: "approved",
          referenceOnly: true,
          tradable: false,
          mmEnabled: true,
        },
        outcomes: market.outcomes.map((outcome, index) => ({
          ...outcome,
          referenceTokenId: index === 0 ? "tok-france-yes" : "tok-france-no",
          referenceOutcomeLabel: index === 0 ? "Yes" : "No",
        })),
      },
    ]);
    jest.mocked(parseReferenceReview).mockReturnValue({
      importStatus: "approved",
      referenceOnly: true,
      tradable: false,
      mmEnabled: true,
    });

    const response = await listEventMarkets(new Request("http://localhost/api/events/france-vs-argentina/markets"), {
      params: Promise.resolve({ slug: "france-vs-argentina" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.market.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: "event-1", visibility: "PUBLIC", isListed: true },
      }),
    );

    const body = await response.json();
    expect(body.markets).toHaveLength(1);
    expect(body.markets[0]).toMatchObject({
      id: "imported-enabled",
      importStatus: "approved",
      referenceOnly: true,
      tradable: false,
      mmEnabled: true,
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events/[slug]/grouped-markets returns grouped public markets without sensitive keys", async () => {
    jest.mocked(getGroupedEventMarkets).mockResolvedValue({
      event: {
        id: "event-1",
        slug: "france-vs-argentina",
        title: "France vs Argentina",
      },
      groups: [
        {
          slug: "match-winner",
          title: "Match winner",
          markets: [{ id: "market-1", title: "Will France beat Argentina?", outcomes: [] }],
        },
      ],
    });

    const response = await getGroupedMarkets(
      new Request("http://localhost/api/events/france-vs-argentina/grouped-markets"),
      {
        params: Promise.resolve({ slug: "france-vs-argentina" }),
      },
    );

    expect(response.status).toBe(200);
    expect(getGroupedEventMarkets).toHaveBeenCalledWith("france-vs-argentina");

    const body = await response.json();
    expectOnlyKeys(body, ["event", "groups"]);
    expectOnlyKeys(body.event, ["id", "slug", "title"]);
    expectOnlyKeys(body.groups[0], ["markets", "slug", "title"]);
    expectOnlyKeys(body.groups[0].markets[0], ["id", "outcomes", "title"]);
    expect(body.event).toMatchObject({
      slug: "france-vs-argentina",
      title: "France vs Argentina",
    });
    expect(body.groups[0]).toMatchObject({
      slug: "match-winner",
      title: "Match winner",
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events/[slug]/grouped-markets returns a public 404 error shape when missing", async () => {
    jest.mocked(getGroupedEventMarkets).mockResolvedValue(null);

    const response = await getGroupedMarkets(new Request("http://localhost/api/events/missing-event/grouped-markets"), {
      params: Promise.resolve({ slug: "missing-event" }),
    });

    expect(response.status).toBe(404);
    expect(getGroupedEventMarkets).toHaveBeenCalledWith("missing-event");

    const body = await response.json();
    expectOnlyKeys(body, ["error"]);
    expect(body).toEqual({ error: "Grouped event not found." });
    expectNoForbiddenKeys(body);
  });
});
