import { PrismaClient, Prisma } from "@prisma/client";
import { placeOrderAndMatch } from "@/server/services/matching";
import { pauseAllReferenceMarketMakerQuotes } from "@/server/services/referenceMarketMaker";

const prisma = new PrismaClient();
const MARKET_SLUG = "fixture-france-win-2026-fifa-world-cup";
const BOT_USERNAME = "system-liquidity-bot";
const ADMIN_EMAIL = "admin.test@poly.local";

async function main() {
  assertLiveLocalAllowed();

  const market = await prisma.market.findUnique({
    where: { slug: MARKET_SLUG },
    include: { outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!market) throw new Error("Fixture market missing.");

  const bot = await prisma.user.findUnique({ where: { username: BOT_USERNAME }, include: { balance: true } });
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, include: { balance: true } });
  if (!bot?.balance) throw new Error("Bot user or balance missing.");
  if (!admin?.balance) throw new Error("Admin user or balance missing.");

  const openOrders = await prisma.order.findMany({
    where: { marketId: market.id, userId: bot.id, status: { in: ["OPEN", "PARTIAL"] }, remaining: { gt: new Prisma.Decimal(0) } },
    orderBy: [{ side: "asc" }, { price: "asc" }],
  });
  if (openOrders.length === 0) throw new Error("No live-local bot orders found.");
  if (!bot.balance.lockedUSDC.gt(0)) throw new Error("Bot BUY orders did not lock demo balance.");

  const sellOrder = openOrders.find((order) => order.side === "SELL");
  if (!sellOrder) throw new Error("No bot SELL order found for user trade validation.");

  const before = {
    fills: await prisma.fill.count({ where: { marketId: market.id } }),
    trades: await prisma.trade.count({ where: { marketId: market.id } }),
    ledger: await prisma.ledgerEntry.count({ where: { userId: { in: [admin.id, bot.id] } } }),
  };

  const userTrade = await placeOrderAndMatch({
    marketId: market.id,
    outcomeId: sellOrder.outcomeId,
    userId: admin.id,
    side: "BUY",
    type: "LIMIT",
    price: sellOrder.price,
    size: "0.10",
  });
  if (userTrade.fills.length === 0) throw new Error("Admin order did not trade against bot liquidity.");

  const after = {
    fills: await prisma.fill.count({ where: { marketId: market.id } }),
    trades: await prisma.trade.count({ where: { marketId: market.id } }),
    ledger: await prisma.ledgerEntry.count({ where: { userId: { in: [admin.id, bot.id] } } }),
    adminPosition: await prisma.position.findUnique({
      where: {
        userId_marketId_outcomeId: {
          userId: admin.id,
          marketId: market.id,
          outcomeId: sellOrder.outcomeId,
        },
      },
    }),
  };
  if (after.fills <= before.fills) throw new Error("Fill row was not created.");
  if (after.trades < before.trades + 2) throw new Error("Trade rows were not created for both sides.");
  if (after.ledger <= before.ledger) throw new Error("Ledger entries were not created.");
  if (!after.adminPosition || after.adminPosition.shares.lte(0)) throw new Error("Admin position was not updated.");

  const pause = await pauseAllReferenceMarketMakerQuotes();
  const remainingOpenBotOrders = await prisma.order.count({
    where: { marketId: market.id, userId: bot.id, status: { in: ["OPEN", "PARTIAL"] }, remaining: { gt: new Prisma.Decimal(0) } },
  });
  if (remainingOpenBotOrders !== 0) throw new Error("Pause-all did not cancel open bot orders.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        marketId: market.id,
        initialBotOrders: openOrders.length,
        userOrderId: userTrade.order.id,
        fillsCreated: after.fills - before.fills,
        tradesCreated: after.trades - before.trades,
        ledgerEntriesCreated: after.ledger - before.ledger,
        adminShares: after.adminPosition.shares.toString(),
        pause,
      },
      null,
      2,
    ),
  );
}

function assertLiveLocalAllowed() {
  if (process.env.NODE_ENV === "production") throw new Error("Live-local verification is disabled in production.");
  if (process.env.REAL_MONEY_MODE !== "false") throw new Error("Live-local verification requires REAL_MONEY_MODE=false.");
  if (process.env.ALLOW_BOT_TRADING !== "true") throw new Error("Live-local verification requires ALLOW_BOT_TRADING=true.");
  if (process.env.LOCAL_BOT_TRADING_ONLY !== "true") {
    throw new Error("Live-local verification requires LOCAL_BOT_TRADING_ONLY=true.");
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
