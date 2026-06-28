import {
  eventWithWorldCupEligibilityWhere,
  publicEventMarketWhere,
  worldCupEligibleMarketWhere,
} from "@/server/services/worldCupPublicEligibility";

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  referenceSnapshotConfig: { staleMs: 30_000 },
}));

describe("World Cup public eligibility Prisma gates", () => {
  test("eligible World Cup markets require approved Polymarket mapping and a fresh snapshot", () => {
    const where = worldCupEligibleMarketWhere(new Date("2026-06-28T12:00:00.000Z"));

    expect(where).toMatchObject({
      visibility: "PUBLIC",
      isListed: true,
      event: expect.objectContaining({ sportKey: "soccer", leagueKey: "world_cup" }),
      referenceSource: "polymarket",
      referenceMetadata: { path: ["importStatus"], equals: "approved" },
      status: { in: ["LIVE", "UPCOMING"] },
      referenceQuoteSnapshots: { some: { source: "polymarket", fetchedAt: { gte: new Date("2026-06-28T12:00:00.000Z") } } },
    });
  });

  test("public market routes allow generic markets but gate World Cup markets", () => {
    const where = publicEventMarketWhere(new Date("2026-06-28T12:00:00.000Z"));

    expect(where).toMatchObject({
      visibility: "PUBLIC",
      isListed: true,
      OR: [
        { event: { NOT: { sportKey: "soccer", leagueKey: "world_cup" } } },
        expect.objectContaining({
          referenceSource: "polymarket",
          referenceMetadata: { path: ["importStatus"], equals: "approved" },
        }),
      ],
    });
  });

  test("event routes hide World Cup events unless at least one eligible market exists", () => {
    const where = eventWithWorldCupEligibilityWhere(new Date("2026-06-28T12:00:00.000Z"));

    expect(where).toMatchObject({
      OR: [
        { NOT: { sportKey: "soccer", leagueKey: "world_cup" } },
        expect.objectContaining({
          sportKey: "soccer",
          leagueKey: "world_cup",
          markets: { some: expect.objectContaining({ referenceSource: "polymarket" }) },
        }),
      ],
    });
  });
});
