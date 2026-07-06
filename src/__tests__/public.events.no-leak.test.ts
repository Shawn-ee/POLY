import { NextRequest } from "next/server";

const mockPrisma = {
  event: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
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

import { GET as listEvents } from "@/app/api/events/route";
import { GET as getEventDetail } from "@/app/api/events/[slug]/route";
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

const expectedEventSummaryKeys = [
  "activeMarketCount",
  "awayTeamName",
  "category",
  "chartHistory",
  "createdAt",
  "description",
  "eventType",
  "externalEventId",
  "externalSlug",
  "gameRules",
  "hasGroupedMarkets",
  "homeTeamName",
  "icon",
  "id",
  "image",
  "imageUrl",
  "leagueKey",
  "liveStats",
  "marketCount",
  "marketProfile",
  "metadata",
  "resultMode",
  "slug",
  "source",
  "sportKey",
  "startTime",
  "status",
  "supportedMarketTypes",
  "title",
  "updatedAt",
];

const baseEvent = {
  id: "event-1",
  slug: "france-vs-argentina",
  title: "France vs Argentina",
  description: "Demo soccer event",
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
  imageUrl: null,
  icon: null,
  metadata: { displayGroup: "World Cup" },
  createdAt: now,
  updatedAt: now,
};

const market = {
  id: "market-1",
  title: "Match Winner",
  description: "Who will win?",
  status: "LIVE",
  resolveTime: null,
  createdAt: now,
  outcomes: [
    {
      id: "home",
      name: "France",
      label: "France",
      code: "HOME",
      displayOrder: 0,
      status: "active",
      isTradable: true,
      metadata: {},
      referenceTokenId: null,
      referenceOutcomeLabel: null,
    },
    {
      id: "away",
      name: "Argentina",
      label: "Argentina",
      code: "AWAY",
      displayOrder: 1,
      status: "active",
      isTradable: true,
      metadata: {},
      referenceTokenId: null,
      referenceOutcomeLabel: null,
    },
  ],
  event: baseEvent,
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

const mobileListMarket = {
  ...market,
  event: baseEvent,
  category: null,
  tags: [],
  outcomeSnapshots: [],
  marketGroupKey: "main",
  marketGroupTitle: "Match Winner",
  displayOrder: 0,
  line: null,
  unit: null,
  period: "full-game",
  participantType: null,
  participantName: null,
  participantId: null,
  propCategory: null,
  sourceUpdatedAt: now,
  updatedAt: now,
  rulesText: null,
  outcomes: market.outcomes.map((outcome) => ({
    ...outcome,
    side: outcome.id === "home" ? "home" : "away",
    resolvedResult: null,
  })),
};

describe("public event API no-leak checks", () => {
  beforeEach(() => {
    mockPrisma.event.findMany.mockReset();
    mockPrisma.event.findUnique.mockReset();
    jest.mocked(getOutcomeQuotes).mockResolvedValue(new Map());
    jest.mocked(parseReferenceReview).mockReturnValue({});
    jest.mocked(getReferenceSummaryForMarket).mockResolvedValue(null);
  });

  test("GET /api/events returns event summaries without sensitive keys", async () => {
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        markets: [{ status: "LIVE", title: "Match Winner", referenceMetadata: null }],
      },
    ]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?category=sports&sportKey=soccer&leagueKey=world_cup"),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              category: "sports",
              sportKey: "soccer",
              leagueKey: "world_cup",
            }),
          ]),
        }),
        take: 51,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["events", "nextCursor", "page"]);
    expect(body.nextCursor).toBeNull();
    expect(body.page).toEqual({ limit: 50, nextCursor: null, hasMore: false });
    expect(body.events).toHaveLength(1);
    expectOnlyKeys(body.events[0], [
      ...expectedEventSummaryKeys,
      "groupedSummary",
      "topOutcomes",
    ]);
    expect(body.events[0]).toMatchObject({
      slug: "france-vs-argentina",
      category: "sports",
      sportKey: "soccer",
      marketCount: 1,
      activeMarketCount: 1,
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events can include mobile compact markets when explicitly requested", async () => {
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        markets: [mobileListMarket],
      },
    ]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expectOnlyKeys(body, ["events", "nextCursor", "page"]);
    expect(body.events).toHaveLength(1);
    expectOnlyKeys(body.events[0], [
      ...expectedEventSummaryKeys,
      "groupedSummary",
      "markets",
      "topOutcomes",
    ]);
    expect(body.events[0]).toMatchObject({
      slug: "france-vs-argentina",
      marketCount: 1,
      activeMarketCount: 1,
      markets: [
        {
          id: "market-1",
          marketGroupTitle: "Match Winner",
          marketType: "match_winner",
          period: "full-game",
          outcomes: [
            { id: "home", label: "France", side: "home", isTradable: true },
            { id: "away", label: "Argentina", side: "away", isTradable: true },
          ],
        },
      ],
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events supports cursor pagination for mobile Home", async () => {
    const cursorEvent = { ...baseEvent, id: "cursor-event", updatedAt: now, createdAt: now };
    mockPrisma.event.findUnique.mockResolvedValue(cursorEvent);
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        id: "page-event-1",
        slug: "page-event-1",
        markets: [{ status: "LIVE", title: "Match Winner", referenceMetadata: null }],
      },
      {
        ...baseEvent,
        id: "page-event-2",
        slug: "page-event-2",
        markets: [{ status: "LIVE", title: "Match Winner", referenceMetadata: null }],
      },
    ]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&limit=1&cursor=cursor-event"),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
      where: { id: "cursor-event" },
      select: { id: true, updatedAt: true, createdAt: true },
    });
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      }),
    );

    const body = await response.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].slug).toBe("page-event-1");
    expect(body.nextCursor).toBe("page-event-1");
    expect(body.page).toEqual({ limit: 1, nextCursor: "page-event-1", hasMore: true });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events/[slug] returns event detail without sensitive keys", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      ...baseEvent,
      _count: { markets: 1 },
      markets: [market],
    });

    const response = await getEventDetail(new Request("http://localhost/api/events/france-vs-argentina"), {
      params: Promise.resolve({ slug: "france-vs-argentina" }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expectOnlyKeys(body, ["event", "markets"]);
    expectOnlyKeys(body.event, [...expectedEventSummaryKeys, "closedMarketCount"]);
    expect(body.event).toMatchObject({
      slug: "france-vs-argentina",
      sportKey: "soccer",
      marketCount: 1,
      activeMarketCount: 1,
    });
    expect(body.markets[0]).toMatchObject({
      id: "market-1",
      visibility: "PUBLIC",
      outcomes: [
        { id: "home", name: "France", code: "HOME" },
        { id: "away", name: "Argentina", code: "AWAY" },
      ],
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events/[slug] returns a public 404 error shape when missing", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);

    const response = await getEventDetail(new Request("http://localhost/api/events/missing-event"), {
      params: Promise.resolve({ slug: "missing-event" }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();
    expectOnlyKeys(body, ["error"]);
    expect(body).toEqual({ error: "Event not found." });
    expectNoForbiddenKeys(body);
  });
});
