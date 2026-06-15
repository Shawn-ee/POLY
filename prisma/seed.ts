import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

type SeedMarket = {
  title: string;
  description: string;
  categorySlug: "sports" | "crypto" | "finance";
  tagSlugs: string[];
  outcomes: string[];
  resolveDaysFromNow: number;
};

const ensureCategory = async (data: { name: string; slug: string; order: number }) =>
  prisma.category.upsert({
    where: { slug: data.slug },
    update: { name: data.name, order: data.order, isActive: true },
    create: { name: data.name, slug: data.slug, order: data.order, isActive: true },
  });

const ensureTag = async (data: { name: string; slug: string; group: string; order: number }) =>
  prisma.tag.upsert({
    where: { slug: data.slug },
    update: { name: data.name, group: data.group, order: data.order, isActive: true },
    create: {
      name: data.name,
      slug: data.slug,
      group: data.group,
      order: data.order,
      isActive: true,
    },
  });

const getSeedMarkets = (): SeedMarket[] => {
  const markets: SeedMarket[] = [];

  const btcThresholds = [80, 85, 90, 95, 100, 105, 110, 115, 120, 125];
  btcThresholds.forEach((threshold, index) => {
    markets.push({
      title: `Will BTC be above $${threshold}k by Dec 31, 2026?`,
      description: `Orderbook market on whether BTC closes above $${threshold},000 on December 31, 2026 UTC.`,
      categorySlug: "crypto",
      tagSlugs: ["crypto", "bitcoin"],
      outcomes: ["YES", "NO"],
      resolveDaysFromNow: 90 + index,
    });
  });

  const nbaTitles = [
    "2026 NBA Champion",
    "2027 NBA Champion",
    "2026 Western Conference Champion",
    "2026 Eastern Conference Champion",
    "2026 NBA MVP",
    "2026 NBA Finals MVP",
    "2026 NBA Rookie of the Year",
    "2026 NBA Defensive Player of the Year",
    "2026 NBA Sixth Man of the Year",
    "2026 NBA Most Improved Player",
  ];
  nbaTitles.forEach((title, index) => {
    const outcomes =
      title.includes("MVP") || title.includes("Rookie") || title.includes("Defensive") || title.includes("Sixth") || title.includes("Improved")
        ? ["Nikola Jokic", "Shai Gilgeous-Alexander", "Jayson Tatum", "Luka Doncic", "Other"]
        : ["Celtics", "Nuggets", "Warriors", "Lakers", "Other"];

    markets.push({
      title,
      description: `Orderbook market for ${title}.`,
      categorySlug: "sports",
      tagSlugs: ["sports", "nba"],
      outcomes,
      resolveDaysFromNow: 25 + index,
    });
  });

  const fedMeetings = [
    "March 2026",
    "May 2026",
    "June 2026",
    "July 2026",
    "September 2026",
    "November 2026",
    "December 2026",
    "January 2027",
  ];
  fedMeetings.forEach((meeting, index) => {
    markets.push({
      title: `US Fed decision next meeting (${meeting})`,
      description: `Orderbook market on the FOMC policy decision for the ${meeting} meeting.`,
      categorySlug: "finance",
      tagSlugs: ["finance", "fed"],
      outcomes: ["Hike", "Hold", "Cut"],
      resolveDaysFromNow: 15 + index,
    });
  });

  const inflowMonths = [
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
    "October 2026",
    "November 2026",
    "December 2026",
  ];
  inflowMonths.forEach((month, index) => {
    markets.push({
      title: `Will ETH spot ETF inflows be positive in ${month}?`,
      description: `Orderbook market on net ETH spot ETF inflows for ${month}.`,
      categorySlug: "crypto",
      tagSlugs: ["crypto", "ethereum"],
      outcomes: ["YES", "NO"],
      resolveDaysFromNow: 35 + index,
    });
  });

  if (markets.length !== 35) {
    throw new Error(`Expected 35 markets, got ${markets.length}.`);
  }

  return markets;
};

const syncOutcomes = async (marketId: string, marketSlug: string, outcomes: string[]) => {
  const desiredSlugs: string[] = [];

  for (let index = 0; index < outcomes.length; index += 1) {
    const name = outcomes[index];
    const outcomeSlug = `${marketSlug}-${slugify(name)}`;
    desiredSlugs.push(outcomeSlug);

    await prisma.outcome.upsert({
      where: { slug: outcomeSlug },
      update: {
        name,
        isActive: true,
        displayOrder: index,
      },
      create: {
        marketId,
        name,
        slug: outcomeSlug,
        displayOrder: index,
        isActive: true,
      },
    });
  }

  const existing = await prisma.outcome.findMany({
    where: { marketId },
    select: { id: true, slug: true },
  });

  const desired = new Set(desiredSlugs);
  const toDeactivate = existing.filter((outcome) => !outcome.slug || !desired.has(outcome.slug));

  for (const outcome of toDeactivate) {
    await prisma.outcome.update({
      where: { id: outcome.id },
      data: { isActive: false },
    });
  }
};

const run = async () => {
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { isAdmin: true, email: "admin@example.com" },
    create: { username: "admin", email: "admin@example.com", isAdmin: true },
  });

  const playwrightAdminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim() || "admin.test@poly.local";
  const playwrightAdmin = await prisma.user.upsert({
    where: { email: playwrightAdminEmail },
    update: {
      username: "playwright_admin",
      displayName: "Playwright Admin",
      isAdmin: true,
    },
    create: {
      email: playwrightAdminEmail,
      username: "playwright_admin",
      displayName: "Playwright Admin",
      isAdmin: true,
    },
  });
  await prisma.userBalance.upsert({
    where: { userId: playwrightAdmin.id },
    update: { availableUSDC: new Prisma.Decimal(1000), lockedUSDC: new Prisma.Decimal(0) },
    create: {
      userId: playwrightAdmin.id,
      availableUSDC: new Prisma.Decimal(1000),
      lockedUSDC: new Prisma.Decimal(0),
    },
  });

  const categories = {
    sports: await ensureCategory({ name: "Sports", slug: "sports", order: 1 }),
    crypto: await ensureCategory({ name: "Crypto", slug: "crypto", order: 2 }),
    finance: await ensureCategory({ name: "Finance", slug: "finance", order: 3 }),
  };

  const tagDefs = [
    { name: "Sports", slug: "sports", group: "top-nav", order: 1 },
    { name: "Crypto", slug: "crypto", group: "top-nav", order: 2 },
    { name: "Finance", slug: "finance", group: "top-nav", order: 3 },
    { name: "NBA", slug: "nba", group: "sports", order: 1 },
    { name: "Soccer", slug: "soccer", group: "sports", order: 2 },
    { name: "World Cup", slug: "world-cup", group: "sports", order: 3 },
    { name: "Bitcoin", slug: "bitcoin", group: "topic", order: 1 },
    { name: "Ethereum", slug: "ethereum", group: "topic", order: 2 },
    { name: "Fed", slug: "fed", group: "topic", order: 3 },
  ] as const;

  const tags = new Map<string, string>();
  for (const tag of tagDefs) {
    const created = await ensureTag(tag);
    tags.set(created.slug, created.id);
  }

  const seedMarkets = getSeedMarkets();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3001";
  const createdMarketIds: string[] = [];

  for (let index = 0; index < seedMarkets.length; index += 1) {
    const seedMarket = seedMarkets[index];
    const slug = `${slugify(seedMarket.title)}-${String(index + 1).padStart(2, "0")}`;
    const now = new Date();
    const resolveTime = new Date(now.getTime() + seedMarket.resolveDaysFromNow * 24 * 60 * 60 * 1000);
    const betCloseTime = new Date(resolveTime.getTime() - 24 * 60 * 60 * 1000);

    const market = await prisma.market.upsert({
      where: { slug },
      update: {
        title: seedMarket.title,
        description: seedMarket.description,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        ownerId: null,
        type: seedMarket.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        categoryId: categories[seedMarket.categorySlug].id,
        categoryLegacy: seedMarket.categorySlug,
        createdBy: admin.id,
        betCloseTime,
        resolveTime,
        isListed: true,
        isCanceled: false,
      },
      create: {
        slug,
        title: seedMarket.title,
        description: seedMarket.description,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        ownerId: null,
        type: seedMarket.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        categoryId: categories[seedMarket.categorySlug].id,
        categoryLegacy: seedMarket.categorySlug,
        createdBy: admin.id,
        betCloseTime,
        resolveTime,
        isListed: true,
        isCanceled: false,
      },
      select: { id: true, title: true, slug: true },
    });

    await syncOutcomes(market.id, market.slug ?? slug, seedMarket.outcomes);

    for (const tagSlug of seedMarket.tagSlugs) {
      const tagId = tags.get(tagSlug);
      if (!tagId) continue;
      await prisma.marketTag.upsert({
        where: { marketId_tagId: { marketId: market.id, tagId } },
        update: {},
        create: { marketId: market.id, tagId },
      });
    }

    createdMarketIds.push(market.id);
    console.log(
      `Created market: ${market.title} id=${market.id} url=${baseUrl}/markets/${market.id}`
    );
  }

  const sportsEvents = [
    { title: "France vs Argentina", slug: "france-vs-argentina", home: "France", away: "Argentina", offsetDays: 45, extra: true },
    { title: "Mexico vs South Korea", slug: "mexico-vs-south-korea", home: "Mexico", away: "South Korea", offsetDays: 46 },
    { title: "Brazil vs Morocco", slug: "brazil-vs-morocco", home: "Brazil", away: "Morocco", offsetDays: 47 },
    { title: "Spain vs Uruguay", slug: "spain-vs-uruguay", home: "Spain", away: "Uruguay", offsetDays: 48 },
    { title: "England vs Croatia", slug: "england-vs-croatia", home: "England", away: "Croatia", offsetDays: 49 },
  ];

  const syncSportsMarket = async (params: {
    eventId: string;
    eventSlug: string;
    title: string;
    description: string;
    marketType: string;
    outcomes: Array<{ name: string; code: string; metadata?: Record<string, unknown> }>;
    startTime: Date;
    rules: Record<string, unknown>;
  }) => {
    const slug = `${params.eventSlug}-${slugify(params.title)}`;
    const market = await prisma.market.upsert({
      where: { slug },
      update: {
        title: params.title,
        description: params.description,
        eventId: params.eventId,
        categoryId: categories.sports.id,
        categoryLegacy: "sports",
        marketType: params.marketType,
        rules: params.rules,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        type: params.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        betCloseTime: params.startTime,
        closeTime: params.startTime,
        resolveTime: new Date(params.startTime.getTime() + 3 * 60 * 60 * 1000),
        isListed: true,
        isCanceled: false,
        createdBy: admin.id,
      },
      create: {
        slug,
        title: params.title,
        description: params.description,
        eventId: params.eventId,
        categoryId: categories.sports.id,
        categoryLegacy: "sports",
        marketType: params.marketType,
        rules: params.rules,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        type: params.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        betCloseTime: params.startTime,
        closeTime: params.startTime,
        resolveTime: new Date(params.startTime.getTime() + 3 * 60 * 60 * 1000),
        isListed: true,
        isCanceled: false,
        createdBy: admin.id,
      },
      select: { id: true, slug: true },
    });

    for (let index = 0; index < params.outcomes.length; index += 1) {
      const outcome = params.outcomes[index];
      const existingOutcome = await prisma.outcome.findFirst({
        where: { marketId: market.id, code: outcome.code },
        select: { id: true },
      });

      if (existingOutcome) {
        await prisma.outcome.update({
          where: { id: existingOutcome.id },
          data: {
            name: outcome.name,
            label: outcome.name,
            displayOrder: index,
            isActive: true,
            isTradable: true,
            status: "active",
            metadata: outcome.metadata ?? {},
          },
        });
      } else {
        await prisma.outcome.create({
          data: {
            marketId: market.id,
            name: outcome.name,
            label: outcome.name,
            code: outcome.code,
            slug: `${market.slug}-${slugify(outcome.code)}`,
            displayOrder: index,
            isActive: true,
            isTradable: true,
            status: "active",
            metadata: outcome.metadata ?? {},
          },
        });
      }
    }

    for (const tagSlug of ["sports", "soccer", "world-cup"]) {
      const tagId = tags.get(tagSlug);
      if (!tagId) continue;
      await prisma.marketTag.upsert({
        where: { marketId_tagId: { marketId: market.id, tagId } },
        update: {},
        create: { marketId: market.id, tagId },
      });
    }

    return market.id;
  };

  for (const eventDef of sportsEvents) {
    const startTime = new Date(Date.now() + eventDef.offsetDays * 24 * 60 * 60 * 1000);
    const event = await prisma.event.upsert({
      where: { slug: eventDef.slug },
      update: {
        title: eventDef.title,
        description: `Demo soccer event for ${eventDef.title}.`,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "match",
        homeTeamName: eventDef.home,
        awayTeamName: eventDef.away,
        startTime,
        status: "scheduled",
        metadata: { demo: true },
      },
      create: {
        slug: eventDef.slug,
        title: eventDef.title,
        description: `Demo soccer event for ${eventDef.title}.`,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "match",
        homeTeamName: eventDef.home,
        awayTeamName: eventDef.away,
        startTime,
        status: "scheduled",
        metadata: { demo: true },
        createdBy: admin.id,
      },
      select: { id: true, slug: true },
    });

    const marketSpecs = [
      {
        title: "Match Winner",
        description: `Who will win ${eventDef.title}?`,
        marketType: "match_winner_1x2",
        rules: { template: "MATCH_WINNER_1X2", settlement: "manual" },
        outcomes: [
          { name: eventDef.home, code: "HOME", metadata: { side: "home" } },
          { name: "Draw", code: "DRAW", metadata: { side: "draw" } },
          { name: eventDef.away, code: "AWAY", metadata: { side: "away" } },
        ],
      },
      {
        title: "Total Goals 2.5",
        description: `Will ${eventDef.title} finish over or under 2.5 total goals?`,
        marketType: "total_goals",
        rules: { template: "TOTAL_GOALS_2_5", settlement: "manual", line: 2.5 },
        outcomes: [
          { name: "Over 2.5", code: "OVER_2_5", metadata: { side: "over", line: 2.5 } },
          { name: "Under 2.5", code: "UNDER_2_5", metadata: { side: "under", line: 2.5 } },
        ],
      },
      {
        title: "Both Teams To Score",
        description: `Will both teams score in ${eventDef.title}?`,
        marketType: "both_teams_to_score",
        rules: { template: "BOTH_TEAMS_TO_SCORE", settlement: "manual" },
        outcomes: [
          { name: "Yes", code: "YES", metadata: { value: true } },
          { name: "No", code: "NO", metadata: { value: false } },
        ],
      },
    ];

    if (eventDef.extra) {
      marketSpecs.push(
        {
          title: "Correct Score Basic",
          description: `What will be the correct score in ${eventDef.title}?`,
          marketType: "correct_score",
          rules: { template: "CORRECT_SCORE_BASIC", settlement: "manual", scoreSet: "basic" },
          outcomes: ["0-0", "1-0", "0-1", "1-1", "2-1", "1-2", "Other"].map((score) => ({
            name: score,
            code: score === "Other" ? "OTHER" : score,
            metadata: { score },
          })),
        },
        {
          title: `Will ${eventDef.home} qualify?`,
          description: `Will ${eventDef.home} qualify from ${eventDef.title}?`,
          marketType: "team_to_qualify",
          rules: { template: "TEAM_TO_QUALIFY", settlement: "manual", team: "home" },
          outcomes: [
            { name: "Yes", code: "YES", metadata: { team: "home", value: true } },
            { name: "No", code: "NO", metadata: { team: "home", value: false } },
          ],
        },
        {
          title: `Will ${eventDef.away} qualify?`,
          description: `Will ${eventDef.away} qualify from ${eventDef.title}?`,
          marketType: "team_to_qualify",
          rules: { template: "TEAM_TO_QUALIFY", settlement: "manual", team: "away" },
          outcomes: [
            { name: "Yes", code: "YES", metadata: { team: "away", value: true } },
            { name: "No", code: "NO", metadata: { team: "away", value: false } },
          ],
        },
      );
    }

    for (const spec of marketSpecs) {
      createdMarketIds.push(
        await syncSportsMarket({
          ...spec,
          eventId: event.id,
          eventSlug: event.slug ?? eventDef.slug,
          startTime,
        }),
      );
    }
  }

  const summary = {
    createdOrUpdated: createdMarketIds.length,
    totalOrderbookPublicMarkets: await prisma.market.count({
      where: { mechanism: "ORDERBOOK", visibility: "PUBLIC" },
    }),
    totalOutcomes: await prisma.outcome.count({
      where: { market: { mechanism: "ORDERBOOK", visibility: "PUBLIC" } },
    }),
  };

  console.log("ORDERBOOK seed summary:", summary);
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
