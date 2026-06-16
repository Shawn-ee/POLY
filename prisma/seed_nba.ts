import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const allowReset = args.has("--reset");
const isDev = process.env.NODE_ENV !== "production";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const teams = [
  "Boston Celtics",
  "New York Knicks",
  "Milwaukee Bucks",
  "Philadelphia 76ers",
  "Cleveland Cavaliers",
  "Denver Nuggets",
  "Oklahoma City Thunder",
  "Minnesota Timberwolves",
  "Phoenix Suns",
  "Dallas Mavericks",
];

const ensureSportsCategory = async () =>
  prisma.category.upsert({
    where: { slug: "sports" },
    update: { name: "Sports", order: 1 },
    create: { name: "Sports", slug: "sports", order: 1 },
  });

const ensureTag = async (name: string, group?: string | null) => {
  const slug = slugify(name);
  return prisma.tag.upsert({
    where: { slug },
    update: { name, group: group ?? null },
    create: { name, slug, group: group ?? null },
  });
};

const ensureAdmin = async () =>
  prisma.user.upsert({
    where: { username: "admin" },
    update: { isAdmin: true, email: "admin@example.com" },
    create: { username: "admin", email: "admin@example.com", isAdmin: true },
  });

const removeExistingNBA = async () => {
  if (!allowReset) return;
  if (!isDev) {
    throw new Error("Refusing to reset in non-development environment.");
  }

  const markets = await prisma.market.findMany({
    where: { slug: { startsWith: "nba-" } },
    select: { id: true },
  });

  if (!markets.length) return;

  const marketIds = markets.map((m) => m.id);

  await prisma.marketMember.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.marketTag.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.poolStakePreset.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.poolBet.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.order.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.trade.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.position.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.marketOutcomeSnapshot.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.outcome.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.market.deleteMany({ where: { id: { in: marketIds } } });
  await prisma.event.deleteMany({
    where: {
      category: "sports",
      sportKey: "basketball",
      leagueKey: "nba",
      slug: { startsWith: "nba-" },
    },
  });
};

const ensureNbaEvent = async (params: {
  slug: string;
  title: string;
  description: string;
  adminId: string;
  eventType: "future" | "game";
  startTime: Date;
  homeTeamName?: string;
  awayTeamName?: string;
}) => {
  return prisma.event.upsert({
    where: { slug: params.slug },
    update: {
      title: params.title,
      description: params.description,
      category: "sports",
      sportKey: "basketball",
      leagueKey: "nba",
      eventType: params.eventType,
      homeTeamName: params.homeTeamName ?? null,
      awayTeamName: params.awayTeamName ?? null,
      startTime: params.startTime,
      status: "scheduled",
      source: "seed:nba",
      metadata: { demo: true, seed: "nba" },
    },
    create: {
      slug: params.slug,
      title: params.title,
      description: params.description,
      category: "sports",
      sportKey: "basketball",
      leagueKey: "nba",
      eventType: params.eventType,
      homeTeamName: params.homeTeamName ?? null,
      awayTeamName: params.awayTeamName ?? null,
      startTime: params.startTime,
      status: "scheduled",
      source: "seed:nba",
      metadata: { demo: true, seed: "nba" },
      createdBy: params.adminId,
    },
    select: { id: true, slug: true },
  });
};

const createNbaMarket = async (params: {
  slug: string;
  title: string;
  description: string;
  outcomes: string[];
  categoryId: string;
  adminId: string;
  tagIds: string[];
  eventId: string;
  closeTime: Date;
}) => {
  const existing = await prisma.market.findUnique({ where: { slug: params.slug } });
  if (existing) {
    await prisma.market.update({
      where: { id: existing.id },
      data: {
        eventId: params.eventId,
        categoryId: params.categoryId,
        categoryLegacy: "sports",
        marketType: "sports",
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        betCloseTime: params.closeTime,
        closeTime: params.closeTime,
        resolveTime: new Date(params.closeTime.getTime() + 3 * 60 * 60 * 1000),
        isListed: true,
        isCanceled: false,
      },
    });

    for (const tagId of params.tagIds) {
      await prisma.marketTag.upsert({
        where: { marketId_tagId: { marketId: existing.id, tagId } },
        update: {},
        create: { marketId: existing.id, tagId },
      });
    }

    return "linked" as const;
  }

  await prisma.market.create({
    data: {
      slug: params.slug,
      title: params.title,
      description: params.description,
      type: params.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      categoryId: params.categoryId,
      categoryLegacy: "sports",
      marketType: "sports",
      eventId: params.eventId,
      createdBy: params.adminId,
      betCloseTime: params.closeTime,
      closeTime: params.closeTime,
      resolveTime: new Date(params.closeTime.getTime() + 3 * 60 * 60 * 1000),
      outcomes: {
        create: params.outcomes.map((name) => ({ name })),
      },
      tags: {
        create: params.tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  return "created" as const;
};

const run = async () => {
  const sports = await ensureSportsCategory();
  const admin = await ensureAdmin();

  if (allowReset) {
    await removeExistingNBA();
  }

  const sportsTag = await ensureTag("Sports", "top-nav");
  const nbaTag = await ensureTag("NBA", "sports");
  const finalsTag = await ensureTag("Finals", "topic");
  const mvpTag = await ensureTag("MVP", "topic");

  const tagIds = [sportsTag.id, nbaTag.id, finalsTag.id];

  const futures = [
    {
      slug: "nba-champion-2026",
      title: "NBA Champion 2026",
      description: "Which team will win the 2026 NBA title?",
      outcomes: teams,
      tags: tagIds,
    },
    {
      slug: "nba-mvp-2026",
      title: "NBA MVP 2026",
      description: "Who wins the 2026 MVP award?",
      outcomes: [
        "Shai Gilgeous-Alexander",
        "Nikola Jokic",
        "Giannis Antetokounmpo",
        "Jayson Tatum",
        "Other",
      ],
      tags: [sportsTag.id, nbaTag.id, mvpTag.id],
    },
  ];

  let created = 0;
  let linked = 0;

  const futuresEvent = await ensureNbaEvent({
    slug: "nba-2026-futures",
    title: "NBA 2026 Futures",
    description: "Season-long NBA futures markets for the 2026 season.",
    adminId: admin.id,
    eventType: "future",
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
  });

  for (const market of futures) {
    const result = await createNbaMarket({
      slug: market.slug,
      title: market.title,
      description: market.description,
      outcomes: market.outcomes,
      categoryId: sports.id,
      adminId: admin.id,
      tagIds: market.tags,
      eventId: futuresEvent.id,
      closeTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
    });
    if (result === "created") created += 1;
    else linked += 1;
  }

  for (let i = 0; i < 20; i += 1) {
    const away = teams[i % teams.length];
    let home = teams[(i * 3 + 1) % teams.length];
    while (home === away) {
      home = teams[(teams.indexOf(home) + 1) % teams.length];
    }

    const slug = `nba-game-${slugify(away)}-at-${slugify(home)}-${i + 1}`;
    const startTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * (7 + i));
    const event = await ensureNbaEvent({
      slug,
      title: `NBA: ${away} at ${home}`,
      description: `Demo NBA game event for ${away} at ${home}.`,
      adminId: admin.id,
      eventType: "game",
      homeTeamName: home,
      awayTeamName: away,
      startTime,
    });
    const result = await createNbaMarket({
      slug,
      title: `NBA: ${away} at ${home}`,
      description: "Who wins this game?",
      outcomes: [away, home],
      categoryId: sports.id,
      adminId: admin.id,
      tagIds,
      eventId: event.id,
      closeTime: startTime,
    });
    if (result === "created") created += 1;
    else linked += 1;
  }

  console.log("NBA seed summary:", {
    created,
    linked,
    markets: await prisma.market.count({ where: { slug: { startsWith: "nba-" } } }),
    events: await prisma.event.count({
      where: { category: "sports", sportKey: "basketball", leagueKey: "nba" },
    }),
  });
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
