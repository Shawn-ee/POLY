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
              markets: {
                some: {
                  visibility: "PUBLIC",
                  isListed: true,
                },
              },
            }),
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
    const findManyInput = mockPrisma.event.findMany.mock.calls[0]?.[0] as any;
    expect(findManyInput.where.AND).toEqual(expect.arrayContaining([
      expect.objectContaining({
        markets: {
          some: {
            visibility: "PUBLIC",
            isListed: true,
          },
        },
      }),
    ]));
    const body = await response.json();
    expectOnlyKeys(body, ["events", "nextCursor", "page"]);
    expect(body.events).toHaveLength(1);
    expectOnlyKeys(body.events[0], [
      ...expectedEventSummaryKeys,
      "groupedSummary",
      "metrics",
      "markets",
      "topOutcomes",
    ]);
    expect(body.events[0]).toMatchObject({
      slug: "france-vs-argentina",
      marketCount: 1,
      activeMarketCount: 1,
      metrics: {
        source: "event-route-mobile-markets",
        marketCount: 1,
        activeMarketCount: 1,
        liquidity: null,
        volume24h: null,
        commentCount: null,
      },
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

  test("GET /api/events search matches teams, markets, and outcomes for mobile Search", async () => {
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        markets: [{ status: "LIVE", title: "Clean sheet", referenceMetadata: null }],
      },
    ]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&search=clean&limit=10"),
    );

    expect(response.status).toBe(200);
    const findManyInput = mockPrisma.event.findMany.mock.calls[0]?.[0] as any;
    expect(JSON.stringify(findManyInput.where)).toContain("homeTeamName");
    expect(JSON.stringify(findManyInput.where)).toContain("awayTeamName");
    expect(JSON.stringify(findManyInput.where)).toContain("markets");
    expect(JSON.stringify(findManyInput.where)).toContain("outcomes");
    expect(findManyInput).toEqual(expect.objectContaining({ take: 11 }));

    const body = await response.json();
    expect(body.events).toHaveLength(1);
    expect(body.page).toEqual({ limit: 10, nextCursor: null, hasMore: false });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events supports mobile Search statusGroup filters", async () => {
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        status: "live",
        markets: [{ status: "LIVE", title: "Match Winner", referenceMetadata: null }],
      },
    ]);

    const liveResponse = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&statusGroup=live&limit=10"),
    );
    expect(liveResponse.status).toBe(200);
    const liveInput = mockPrisma.event.findMany.mock.calls[0]?.[0] as any;
    expect(JSON.stringify(liveInput.where)).toContain("live");
    expect(JSON.stringify(liveInput.where)).toContain("liveStatus");
    expect(JSON.stringify(liveInput.where)).toContain("in_progress");
    expect(liveInput).toEqual(expect.objectContaining({ take: 11 }));

    mockPrisma.event.findMany.mockClear();
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        status: "upcoming",
        markets: [{ status: "LIVE", title: "Match Winner", referenceMetadata: null }],
      },
    ]);

    const upcomingResponse = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&statusGroup=upcoming&limit=10"),
    );
    expect(upcomingResponse.status).toBe(200);
    const upcomingInput = mockPrisma.event.findMany.mock.calls[0]?.[0] as any;
    expect(JSON.stringify(upcomingInput.where)).toContain("NOT");
    expect(JSON.stringify(upcomingInput.where)).toContain("live");
    expect(JSON.stringify(upcomingInput.where)).toContain("scheduled");
    expect(JSON.stringify(upcomingInput.where)).toContain("closed");
    expect(JSON.stringify(upcomingInput.where)).toContain("resolved");
    expect(JSON.stringify(upcomingInput.where)).toContain("canceled");

    const body = await upcomingResponse.json();
    expect(body.events).toHaveLength(1);
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events supports backend-owned mobile Search sorting", async () => {
    const listedMarket = (id: string) => ({
      ...mobileListMarket,
      id,
      slug: id,
      outcomes: mobileListMarket.outcomes.map((outcome, index) => ({
        ...outcome,
        id: `${id}-outcome-${index}`,
      })),
    });
    const oneMarketEvent = {
      ...baseEvent,
      id: "one-market-event",
      slug: "one-market-event",
      status: "upcoming",
      liveStatus: null,
      markets: [listedMarket("one-market")],
    };
    const threeMarketEvent = {
      ...baseEvent,
      id: "three-market-event",
      slug: "three-market-event",
      status: "upcoming",
      liveStatus: null,
      markets: [listedMarket("three-market-a"), listedMarket("three-market-b"), listedMarket("three-market-c")],
    };
    const liveTwoMarketEvent = {
      ...baseEvent,
      id: "live-two-market-event",
      slug: "live-two-market-event",
      status: "live",
      liveStatus: "in_progress",
      markets: [listedMarket("live-market-a"), listedMarket("live-market-b")],
    };

    mockPrisma.event.findMany.mockResolvedValueOnce([oneMarketEvent, threeMarketEvent, liveTwoMarketEvent]);
    const popularResponse = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&sortBy=popular&limit=2"),
    );
    expect(popularResponse.status).toBe(200);
    const popularBody = await popularResponse.json();
    expect(popularBody.events.map((event: any) => event.slug)).toEqual(["three-market-event", "live-two-market-event"]);
    expect(popularBody.page).toEqual({ limit: 2, nextCursor: "live-two-market-event", hasMore: true, sortBy: "popular" });

    mockPrisma.event.findMany.mockResolvedValueOnce([oneMarketEvent, threeMarketEvent, liveTwoMarketEvent]);
    const liveResponse = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&sortBy=live&limit=2"),
    );
    expect(liveResponse.status).toBe(200);
    const liveBody = await liveResponse.json();
    expect(liveBody.events.map((event: any) => event.slug)).toEqual(["live-two-market-event", "three-market-event"]);
    expect(liveBody.page).toEqual({ limit: 2, nextCursor: "three-market-event", hasMore: true, sortBy: "live" });
    expectNoForbiddenKeys(liveBody);
  });

  test("GET /api/events advances sorted mobile pages from the backend cursor", async () => {
    const listedMarket = (id: string) => ({
      ...mobileListMarket,
      id,
      slug: id,
      outcomes: mobileListMarket.outcomes.map((outcome, index) => ({
        ...outcome,
        id: `${id}-outcome-${index}`,
      })),
    });
    const oneMarketEvent = {
      ...baseEvent,
      id: "one-market-event",
      slug: "one-market-event",
      status: "upcoming",
      liveStatus: null,
      markets: [listedMarket("one-market")],
    };
    const threeMarketEvent = {
      ...baseEvent,
      id: "three-market-event",
      slug: "three-market-event",
      status: "upcoming",
      liveStatus: null,
      markets: [listedMarket("three-market-a"), listedMarket("three-market-b"), listedMarket("three-market-c")],
    };
    const liveTwoMarketEvent = {
      ...baseEvent,
      id: "live-two-market-event",
      slug: "live-two-market-event",
      status: "live",
      liveStatus: "in_progress",
      markets: [listedMarket("live-market-a"), listedMarket("live-market-b")],
    };

    mockPrisma.event.findUnique.mockResolvedValue({ ...baseEvent, id: "live-two-market-event" });
    mockPrisma.event.findMany.mockResolvedValue([oneMarketEvent, threeMarketEvent, liveTwoMarketEvent]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&sortBy=popular&limit=2&cursor=live-two-market-event"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.events.map((event: any) => event.slug)).toEqual(["one-market-event"]);
    expect(body.page).toEqual({ limit: 2, nextCursor: null, hasMore: false, sortBy: "popular" });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events rejects sorted mobile cursors outside the filtered page contract", async () => {
    const listedMarket = (id: string) => ({
      ...mobileListMarket,
      id,
      slug: id,
      outcomes: mobileListMarket.outcomes.map((outcome, index) => ({
        ...outcome,
        id: `${id}-outcome-${index}`,
      })),
    });
    const visibleEvent = {
      ...baseEvent,
      id: "visible-event",
      slug: "visible-event",
      markets: [listedMarket("visible-market")],
    };

    mockPrisma.event.findUnique.mockResolvedValue({ ...baseEvent, id: "stale-event" });
    mockPrisma.event.findMany.mockResolvedValue([visibleEvent]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&sortBy=popular&limit=2&cursor=stale-event"),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Invalid event cursor for filtered mobile page." });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/events supports backend-filtered futures markets for mobile Home", async () => {
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        id: "future-event",
        slug: "future-event",
        markets: [{
          ...mobileListMarket,
          id: "future-market",
          marketType: "future",
          marketGroupTitle: "World Cup Winner",
        }],
      },
    ]);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&marketType=future&limit=10"),
    );

    expect(response.status).toBe(200);
    const findManyInput = mockPrisma.event.findMany.mock.calls[0]?.[0] as any;
    expect(findManyInput.where.AND).toEqual(expect.arrayContaining([
      expect.objectContaining({
        markets: {
          some: expect.objectContaining({
            visibility: "PUBLIC",
            isListed: true,
            marketType: { in: ["future", "outright"] },
          }),
        },
      }),
    ]));
    expect(findManyInput.include.markets.where).toEqual({
      visibility: "PUBLIC",
      isListed: true,
      marketType: { in: ["future", "outright"] },
    });
    const body = await response.json();
    expect(body.events[0].markets[0]).toMatchObject({ id: "future-market", marketType: "future" });
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
