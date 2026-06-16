import { prisma } from "@/lib/db";

async function run() {
  const [eventCount, marketCount, unlinkedMarketCount] = await Promise.all([
    prisma.event.count({
      where: { category: "sports", sportKey: "basketball", leagueKey: "nba" },
    }),
    prisma.market.count({ where: { slug: { startsWith: "nba-" } } }),
    prisma.market.count({ where: { slug: { startsWith: "nba-" }, eventId: null } }),
  ]);

  const sampleEvents = await prisma.event.findMany({
    where: { category: "sports", sportKey: "basketball", leagueKey: "nba" },
    select: {
      slug: true,
      title: true,
      _count: { select: { markets: true } },
    },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    take: 3,
  });

  console.log("NBA seed event alignment:", {
    eventCount,
    marketCount,
    unlinkedMarketCount,
    sampleEvents,
  });

  if (eventCount < 1) {
    throw new Error("Expected seed:nba to create at least one sports Event.");
  }

  if (marketCount < 1) {
    throw new Error("Expected seed:nba to create at least one NBA market.");
  }

  if (unlinkedMarketCount > 0) {
    throw new Error("Expected every NBA market to be linked to an Event.");
  }
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
