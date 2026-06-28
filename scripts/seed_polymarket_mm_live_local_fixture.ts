import { PrismaClient, Prisma } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { cancelOrderAndUnlock } from "@/server/services/matching";

const prisma = new PrismaClient();
const MARKET_SLUG = "fixture-france-win-2026-fifa-world-cup";
const BOT_USERNAME = "system-liquidity-bot";

async function main() {
  assertLiveLocalAllowed();

  const market = await prisma.market.findUnique({
    where: { slug: MARKET_SLUG },
    include: { outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!market) throw new Error("Fixture market missing. Run seed:polymarket-mm-fixture first.");

  const bot = await prisma.user.findUnique({ where: { username: BOT_USERNAME }, include: { balance: true } });
  if (!bot?.balance) throw new Error("Bot user or demo balance missing. Run seed:polymarket-mm-fixture first.");

  const existingOrders = await prisma.order.findMany({
    where: { marketId: market.id, userId: bot.id, status: { in: ["OPEN", "PARTIAL"] }, remaining: { gt: new Prisma.Decimal(0) } },
    select: { id: true },
  });
  for (const order of existingOrders) {
    await cancelOrderAndUnlock({ orderId: order.id, userId: bot.id });
  }
  await prisma.botOrderIntent.deleteMany({ where: { marketId: market.id, dryRun: false } });
  await prisma.botQuoteConfig.updateMany({
    where: { marketId: market.id, source: "polymarket" },
    data: {
      enabled: true,
      dryRun: false,
      baseOrderSize: new Prisma.Decimal("0.25"),
      maxOrderSize: new Prisma.Decimal("0.50"),
      maxOutcomeExposure: new Prisma.Decimal("2"),
      maxMarketExposure: new Prisma.Decimal("4"),
      maxDailyNotional: new Prisma.Decimal("5"),
      staleAfterSeconds: 60,
    },
  });

  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: bot.id, quantity: "2" });

  console.log(
    JSON.stringify(
      {
        ok: true,
        marketId: market.id,
        botUserId: bot.id,
        outcomes: market.outcomes.length,
        configMode: "live-local",
      },
      null,
      2,
    ),
  );
}

function assertLiveLocalAllowed() {
  if (process.env.NODE_ENV === "production") throw new Error("Live-local fixture seed is disabled in production.");
  if (process.env.REAL_MONEY_MODE !== "false") throw new Error("Live-local fixture seed requires REAL_MONEY_MODE=false.");
  if (process.env.ALLOW_BOT_TRADING !== "true") throw new Error("Live-local fixture seed requires ALLOW_BOT_TRADING=true.");
  if (process.env.LOCAL_BOT_TRADING_ONLY !== "true") {
    throw new Error("Live-local fixture seed requires LOCAL_BOT_TRADING_ONLY=true.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
