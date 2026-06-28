const mockPrisma = {
  event: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  referenceSnapshotConfig: { staleMs: 30_000 },
}));

import { GET as listSports } from "@/app/api/sports/route";
import { GET as listSoccerEvents } from "@/app/api/sports/soccer/events/route";
import { GET as listWorldCupEvents } from "@/app/api/sports/soccer/world-cup/events/route";

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
  "createdAt",
  "description",
  "eventType",
  "hasGroupedMarkets",
  "homeTeamName",
  "icon",
  "id",
  "image",
  "imageUrl",
  "leagueKey",
  "marketCount",
  "slug",
  "source",
  "sportKey",
  "startTime",
  "status",
  "title",
  "updatedAt",
];

const soccerEvent = {
  id: "event-1",
  slug: "france-vs-argentina",
  title: "France vs Argentina",
  description: "World Cup fixture",
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
  _count: { markets: 2 },
  markets: [{ status: "LIVE" }, { status: "CLOSED" }],
};

describe("public sports API no-leak checks", () => {
  beforeEach(() => {
    mockPrisma.event.groupBy.mockReset();
    mockPrisma.event.findMany.mockReset();
  });

  test("GET /api/sports returns public sport summaries without sensitive keys", async () => {
    mockPrisma.event.groupBy.mockResolvedValue([
      {
        sportKey: "soccer",
        _count: { _all: 3 },
      },
    ]);

    const response = await listSports();
    expect(response.status).toBe(200);
    expect(mockPrisma.event.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["sportKey"],
        where: { category: "sports", sportKey: { not: null } },
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["sports"]);
    expectOnlyKeys(body.sports[0], ["eventCount", "sportKey"]);
    expect(body.sports).toEqual([{ sportKey: "soccer", eventCount: 3 }]);
    expectNoForbiddenKeys(body);
  });

  test("GET /api/sports returns an empty public sport list without sensitive keys", async () => {
    mockPrisma.event.groupBy.mockResolvedValue([]);

    const response = await listSports();
    expect(response.status).toBe(200);

    const body = await response.json();
    expectOnlyKeys(body, ["sports"]);
    expect(body).toEqual({ sports: [] });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/sports/soccer/events returns public event summaries without sensitive keys", async () => {
    mockPrisma.event.findMany.mockResolvedValue([soccerEvent]);

    const response = await listSoccerEvents();
    expect(response.status).toBe(200);
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: "sports",
          sportKey: "soccer",
          AND: expect.any(Array),
        }),
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["events"]);
    expectOnlyKeys(body.events[0], expectedEventSummaryKeys);
    expect(body.events[0]).toMatchObject({
      slug: "france-vs-argentina",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      marketCount: 2,
      activeMarketCount: 1,
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/sports/soccer/events returns an empty public event list without sensitive keys", async () => {
    mockPrisma.event.findMany.mockResolvedValue([]);

    const response = await listSoccerEvents();
    expect(response.status).toBe(200);

    const body = await response.json();
    expectOnlyKeys(body, ["events"]);
    expect(body).toEqual({ events: [] });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/sports/soccer/world-cup/events returns public event summaries without sensitive keys", async () => {
    mockPrisma.event.findMany.mockResolvedValue([soccerEvent]);

    const response = await listWorldCupEvents();
    expect(response.status).toBe(200);
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: "sports",
          sportKey: "soccer",
          leagueKey: "world_cup",
          markets: expect.objectContaining({
            some: expect.objectContaining({
              referenceSource: "polymarket",
              referenceMetadata: { path: ["importStatus"], equals: "approved" },
            }),
          }),
        }),
      }),
    );

    const body = await response.json();
    expectOnlyKeys(body, ["events"]);
    expectOnlyKeys(body.events[0], expectedEventSummaryKeys);
    expect(body.events[0]).toMatchObject({
      slug: "france-vs-argentina",
      sportKey: "soccer",
      leagueKey: "world_cup",
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/sports/soccer/world-cup/events returns an empty public event list without sensitive keys", async () => {
    mockPrisma.event.findMany.mockResolvedValue([]);

    const response = await listWorldCupEvents();
    expect(response.status).toBe(200);

    const body = await response.json();
    expectOnlyKeys(body, ["events"]);
    expect(body).toEqual({ events: [] });
    expectNoForbiddenKeys(body);
  });
});
