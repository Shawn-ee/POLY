import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin.test@poly.local";
const BOT_USERNAME = "system-liquidity-bot";
const BOT_EMAIL = "system-liquidity-bot@local.test";
const EVENT_SLUG = "fixture-2026-fifa-world-cup";
const MARKET_SLUG = "fixture-france-win-2026-fifa-world-cup";

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { username: "playwright_admin", displayName: "Playwright Admin", isAdmin: true },
    create: {
      email: ADMIN_EMAIL,
      username: "playwright_admin",
      displayName: "Playwright Admin",
      isAdmin: true,
    },
  });
  await prisma.userBalance.upsert({
    where: { userId: admin.id },
    update: { availableUSDC: new Prisma.Decimal("1000"), lockedUSDC: new Prisma.Decimal("0") },
    create: { userId: admin.id, availableUSDC: new Prisma.Decimal("1000"), lockedUSDC: new Prisma.Decimal("0") },
  });

  const bot = await prisma.user.upsert({
    where: { username: BOT_USERNAME },
    update: { email: BOT_EMAIL, displayName: "System Liquidity Bot" },
    create: { username: BOT_USERNAME, email: BOT_EMAIL, displayName: "System Liquidity Bot" },
  });
  await prisma.userBalance.upsert({
    where: { userId: bot.id },
    update: { availableUSDC: new Prisma.Decimal("100"), lockedUSDC: new Prisma.Decimal("0") },
    create: { userId: bot.id, availableUSDC: new Prisma.Decimal("100"), lockedUSDC: new Prisma.Decimal("0") },
  });

  const category = await prisma.category.upsert({
    where: { slug: "sports" },
    update: { name: "Sports", isActive: true },
    create: { name: "Sports", slug: "sports", order: 1, isActive: true },
  });
  const worldCupTag = await prisma.tag.upsert({
    where: { slug: "world-cup" },
    update: { name: "World Cup", group: "sports", isActive: true },
    create: { name: "World Cup", slug: "world-cup", group: "sports", order: 3, isActive: true },
  });

  const startTime = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const event = await prisma.event.upsert({
    where: { slug: EVENT_SLUG },
    update: {
      title: "Fixture 2026 FIFA World Cup",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "tournament",
      startTime,
      status: "scheduled",
      source: "fixture",
      metadata: { fixture: true, phase: "polymarket-mm-runtime-validation" },
    },
    create: {
      slug: EVENT_SLUG,
      title: "Fixture 2026 FIFA World Cup",
      description: "Local fixture event for Polymarket reference MM runtime validation.",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "tournament",
      startTime,
      status: "scheduled",
      source: "fixture",
      metadata: { fixture: true, phase: "polymarket-mm-runtime-validation" },
      createdBy: admin.id,
    },
  });

  const market = await prisma.market.upsert({
    where: { slug: MARKET_SLUG },
    update: {
      title: "Will France win the 2026 FIFA World Cup?",
      description: "Local fixture reference market for dry-run market maker validation.",
      categoryId: category.id,
      categoryLegacy: "sports",
      marketType: "yes_no",
      eventId: event.id,
      type: "BINARY",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      status: "LIVE",
      isListed: true,
      isCanceled: false,
      referenceSource: "polymarket",
      externalSlug: MARKET_SLUG,
      externalMarketId: "fixture-polymarket-market-france-wc",
      conditionId: "fixture-condition-france-wc",
      referenceMetadata: fixtureReferenceMetadata(admin.id),
      createdBy: admin.id,
    },
    create: {
      slug: MARKET_SLUG,
      title: "Will France win the 2026 FIFA World Cup?",
      description: "Local fixture reference market for dry-run market maker validation.",
      categoryId: category.id,
      categoryLegacy: "sports",
      marketType: "yes_no",
      eventId: event.id,
      type: "BINARY",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      status: "LIVE",
      isListed: true,
      isCanceled: false,
      referenceSource: "polymarket",
      externalSlug: MARKET_SLUG,
      externalMarketId: "fixture-polymarket-market-france-wc",
      conditionId: "fixture-condition-france-wc",
      referenceMetadata: fixtureReferenceMetadata(admin.id),
      createdBy: admin.id,
    },
  });

  const yes = await upsertOutcome(market.id, `${MARKET_SLUG}-yes`, "YES", "fixture-token-france-yes", 0);
  const no = await upsertOutcome(market.id, `${MARKET_SLUG}-no`, "NO", "fixture-token-france-no", 1);

  await prisma.marketTag.upsert({
    where: { marketId_tagId: { marketId: market.id, tagId: worldCupTag.id } },
    update: {},
    create: { marketId: market.id, tagId: worldCupTag.id },
  });

  await prisma.botQuoteConfig.upsert({
    where: { id: "fixture-polymarket-mm-config" },
    update: {
      marketId: market.id,
      outcomeId: null,
      enabled: true,
      dryRun: true,
      source: "polymarket",
      edgeTicks: 2,
      tickSize: new Prisma.Decimal("0.01"),
      baseOrderSize: new Prisma.Decimal("1"),
      maxOrderSize: new Prisma.Decimal("2"),
      maxOutcomeExposure: new Prisma.Decimal("10"),
      maxMarketExposure: new Prisma.Decimal("20"),
      maxDailyNotional: new Prisma.Decimal("25"),
      staleAfterSeconds: 60,
    },
    create: {
      id: "fixture-polymarket-mm-config",
      marketId: market.id,
      outcomeId: null,
      enabled: true,
      dryRun: true,
      source: "polymarket",
      edgeTicks: 2,
      tickSize: new Prisma.Decimal("0.01"),
      baseOrderSize: new Prisma.Decimal("1"),
      maxOrderSize: new Prisma.Decimal("2"),
      maxOutcomeExposure: new Prisma.Decimal("10"),
      maxMarketExposure: new Prisma.Decimal("20"),
      maxDailyNotional: new Prisma.Decimal("25"),
      staleAfterSeconds: 60,
    },
  });

  await prisma.botOrderIntent.deleteMany({ where: { marketId: market.id } });

  console.log(
    JSON.stringify(
      {
        ok: true,
        marketId: market.id,
        outcomeIds: [yes.id, no.id],
        botUserId: bot.id,
        adminUserId: admin.id,
        configId: "fixture-polymarket-mm-config",
      },
      null,
      2,
    ),
  );
}

function fixtureReferenceMetadata(adminId: string): Prisma.InputJsonObject {
  const now = new Date().toISOString();
  return {
    importedFrom: "polymarket",
    importStatus: "approved",
    referenceOnly: true,
    tradable: false,
    mmEnabled: true,
    reviewedAt: now,
    reviewedBy: adminId,
    reviewNotes: "Local fixture mapping for Polymarket reference MM runtime validation.",
    mappingDisabled: false,
    fixtureReferencePrice: {
      bestBid: 0.49,
      bestAsk: 0.51,
      spread: 0.02,
      lastTradePrice: 0.5,
      volume: 1000,
      volume24hr: 100,
      liquidity: 5000,
      liquidityClob: 500,
      acceptingOrders: true,
      outcomes: [
        { label: "Yes", tokenId: "fixture-token-france-yes", outcomePrice: 0.5 },
        { label: "No", tokenId: "fixture-token-france-no", outcomePrice: 0.5 },
      ],
    },
  };
}

async function upsertOutcome(marketId: string, slug: string, name: string, tokenId: string, displayOrder: number) {
  const existing = await prisma.outcome.findFirst({ where: { marketId, slug } });
  if (existing) {
    return prisma.outcome.update({
      where: { id: existing.id },
      data: {
        name,
        isActive: true,
        isTradable: false,
        displayOrder,
        referenceTokenId: tokenId,
        referenceOutcomeLabel: name === "YES" ? "Yes" : "No",
      },
    });
  }
  return prisma.outcome.create({
    data: {
      marketId,
      slug,
      name,
      isActive: true,
      isTradable: false,
      displayOrder,
      referenceTokenId: tokenId,
      referenceOutcomeLabel: name === "YES" ? "Yes" : "No",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
