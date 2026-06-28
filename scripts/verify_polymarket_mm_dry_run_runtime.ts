import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MARKET_SLUG = "fixture-france-win-2026-fifa-world-cup";

async function main() {
  const market = await prisma.market.findUnique({
    where: { slug: MARKET_SLUG },
    include: { outcomes: true, referenceQuoteSnapshots: true },
  });
  if (!market) throw new Error("Fixture market missing.");

  const config = await prisma.botQuoteConfig.findFirst({ where: { marketId: market.id, enabled: true, dryRun: true } });
  if (!config) throw new Error("Enabled dry-run BotQuoteConfig missing.");

  const intents = await prisma.botOrderIntent.findMany({ where: { marketId: market.id }, orderBy: { createdAt: "desc" } });
  if (intents.length === 0) throw new Error("BotOrderIntent rows missing.");
  if (intents.some((intent) => !intent.dryRun || intent.status !== "DRY_RUN")) {
    throw new Error("Expected all intents to be DRY_RUN.");
  }

  const orders = await prisma.order.count({ where: { marketId: market.id } });
  const trades = await prisma.trade.count({ where: { marketId: market.id } });
  const fills = await prisma.fill.count({ where: { marketId: market.id } });
  if (orders !== 0 || trades !== 0 || fills !== 0) {
    throw new Error(`Dry-run created real activity: orders=${orders} trades=${trades} fills=${fills}`);
  }

  const snapshots = await prisma.referenceQuoteSnapshot.count({ where: { marketId: market.id, source: "polymarket" } });
  if (snapshots < market.outcomes.length) throw new Error("ReferencePrice snapshots missing.");

  const bot = await prisma.user.findUnique({ where: { username: "system-liquidity-bot" }, include: { balance: true } });
  if (!bot?.balance) throw new Error("Bot demo balance missing.");
  if (!bot.balance.availableUSDC.equals("100") || !bot.balance.lockedUSDC.equals("0")) {
    throw new Error("Bot balance changed during dry-run.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        marketId: market.id,
        referencePrices: snapshots,
        intents: intents.length,
        orders,
        trades,
        fills,
        botAvailableUSDC: bot.balance.availableUSDC.toString(),
        botLockedUSDC: bot.balance.lockedUSDC.toString(),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
