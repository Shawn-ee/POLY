import type { Prisma } from "@prisma/client";
import { referenceSnapshotConfig } from "@/server/services/referenceQuoteSnapshots";

export function worldCupFreshReferenceCutoff(now = new Date()) {
  return new Date(now.getTime() - referenceSnapshotConfig.staleMs);
}

export function worldCupEligibleMarketWhere(staleCutoff = worldCupFreshReferenceCutoff()): Prisma.MarketWhereInput {
  return {
    event: worldCupOpenEventWhere(),
    visibility: "PUBLIC",
    isListed: true,
    referenceSource: "polymarket",
    referenceMetadata: { path: ["importStatus"], equals: "approved" },
    status: { in: ["LIVE", "UPCOMING"] },
    referenceQuoteSnapshots: { some: { source: "polymarket", fetchedAt: { gte: staleCutoff } } },
  };
}

export function publicEventMarketWhere(staleCutoff = worldCupFreshReferenceCutoff()): Prisma.MarketWhereInput {
  return {
    visibility: "PUBLIC",
    isListed: true,
    OR: [
      { event: { NOT: { sportKey: "soccer", leagueKey: "world_cup" } } },
      worldCupEligibleMarketWhere(staleCutoff),
    ],
  };
}

export function eventWithWorldCupEligibilityWhere(staleCutoff = worldCupFreshReferenceCutoff()): Prisma.EventWhereInput {
  return {
    OR: [
      { NOT: { sportKey: "soccer", leagueKey: "world_cup" } },
      {
        sportKey: "soccer",
        leagueKey: "world_cup",
        ...worldCupOpenEventWhere(),
        markets: { some: worldCupEligibleMarketWhere(staleCutoff) },
      },
    ],
  };
}

function worldCupOpenEventWhere(): Prisma.EventWhereInput {
  return {
    sportKey: "soccer",
    leagueKey: "world_cup",
    OR: [{ startTime: null }, { startTime: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } }],
    NOT: [{ status: { in: ["closed", "resolved", "ended", "canceled", "cancelled"] } }],
  };
}
