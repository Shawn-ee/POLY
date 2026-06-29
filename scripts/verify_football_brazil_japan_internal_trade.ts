import { Prisma, PrismaClient } from "@prisma/client";
import { placeOrderAndMatch } from "@/server/services/matching";

const prisma = new PrismaClient();
const EVENT_SLUG = "brazil-vs-japan";
const BOT_USERNAME = "system-liquidity-bot";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL?.trim() || "csychenshangyi@gmail.com";

async function main() {
  assertClosedBetaInternalOnly();

  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      markets: {
        where: {
          referenceSource: "polymarket",
          marketType: "match_winner_1x2",
          status: "LIVE",
          visibility: "PUBLIC",
          isListed: true,
        },
        include: {
          outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] },
        },
      },
    },
  });
  if (!event) throw new Error("Brazil vs Japan event is missing.");
  const market = event.markets[0];
  if (!market) throw new Error("Brazil vs Japan Match Winner market is missing or not public/live.");

  const labels = market.outcomes.map((outcome) => outcome.name);
  for (const required of ["Brazil", "Draw", "Japan"]) {
    if (!labels.includes(required)) throw new Error(`Missing ${required} outcome.`);
  }

  const bot = await prisma.user.findUnique({ where: { username: BOT_USERNAME }, include: { balance: true } });
  const testUser = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL }, include: { balance: true } });
  if (!bot?.balance) throw new Error("Bot user or bot balance is missing.");
  if (!testUser?.balance) throw new Error("Admin test user or test balance is missing.");

  const openSell = await prisma.order.findFirst({
    where: {
      marketId: market.id,
      userId: bot.id,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: new Prisma.Decimal(0) },
    },
    include: { outcome: true },
    orderBy: [{ price: "asc" }, { createdAt: "asc" }],
  });
  if (!openSell) throw new Error("No local-only bot SELL order is available for internal user trade validation.");

  const before = {
    fills: await prisma.fill.count({ where: { marketId: market.id } }),
    trades: await prisma.trade.count({ where: { marketId: market.id } }),
    ledger: await prisma.ledgerEntry.count({ where: { userId: { in: [testUser.id, bot.id] } } }),
    userAvailableUSDC: testUser.balance.availableUSDC,
  };

  const trade = await placeOrderAndMatch({
    marketId: market.id,
    outcomeId: openSell.outcomeId,
    userId: testUser.id,
    side: "BUY",
    type: "LIMIT",
    price: openSell.price,
    size: "0.10",
  });
  if (trade.fills.length === 0) throw new Error("Test user order did not fill against local bot liquidity.");

  const [afterUser, position] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: testUser.id }, include: { balance: true } }),
    prisma.position.findUnique({
      where: {
        userId_marketId_outcomeId: {
          userId: testUser.id,
          marketId: market.id,
          outcomeId: openSell.outcomeId,
        },
      },
    }),
  ]);
  const after = {
    fills: await prisma.fill.count({ where: { marketId: market.id } }),
    trades: await prisma.trade.count({ where: { marketId: market.id } }),
    ledger: await prisma.ledgerEntry.count({ where: { userId: { in: [testUser.id, bot.id] } } }),
  };

  if (after.fills <= before.fills) throw new Error("Fill row was not created.");
  if (after.trades < before.trades + 2) throw new Error("Trade rows were not created for both sides.");
  if (after.ledger <= before.ledger) throw new Error("Ledger entries were not created.");
  if (!position || position.shares.lte(0)) throw new Error("Test user position was not updated.");
  if (!afterUser.balance || afterUser.balance.availableUSDC.gte(before.userAvailableUSDC)) {
    throw new Error("Test user balance did not decrease after internal trade.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        eventSlug: event.slug,
        marketId: market.id,
        outcome: openSell.outcome.name,
        botSellOrderId: openSell.id,
        userOrderId: trade.order.id,
        fillsCreated: after.fills - before.fills,
        tradesCreated: after.trades - before.trades,
        ledgerEntriesCreated: after.ledger - before.ledger,
        userShares: position.shares.toString(),
        userAvailableUSDCBefore: before.userAvailableUSDC.toString(),
        userAvailableUSDCAfter: afterUser.balance.availableUSDC.toString(),
      },
      null,
      2,
    ),
  );
}

function assertClosedBetaInternalOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Football internal trade verification is disabled in production.");
  if (process.env.REAL_MONEY_MODE !== "false") throw new Error("REAL_MONEY_MODE=false is required.");
  if (process.env.ALLOW_BOT_TRADING !== "true") throw new Error("ALLOW_BOT_TRADING=true is required.");
  if (process.env.LOCAL_BOT_TRADING_ONLY !== "true") throw new Error("LOCAL_BOT_TRADING_ONLY=true is required.");
  if (process.env.INTERNAL_FUNDING_BETA_ENABLED === "true") throw new Error("Funding beta must remain disabled.");
  if (process.env.ALLOW_AUTO_DEPOSIT_CREDIT === "true") throw new Error("Automatic deposit credit must remain disabled.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
