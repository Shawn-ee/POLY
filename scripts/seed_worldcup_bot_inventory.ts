import { prisma } from "@/lib/db";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const DEFAULT_BOT_USERNAME = "system-liquidity-bot";

function option(name: string, fallback: string | null = null) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function main() {
  assertLocalOnly();
  const marketId = option("marketId");
  const eventSlug = option("eventSlug");
  const username = option("botUsername", DEFAULT_BOT_USERNAME) ?? DEFAULT_BOT_USERNAME;
  const quantity = option("quantity", "3") ?? "3";

  const market = await prisma.market.findFirst({
    where: {
      ...(marketId ? { id: marketId } : {}),
      ...(eventSlug ? { event: { slug: eventSlug } } : {}),
      referenceSource: "polymarket",
      marketType: "match_winner_1x2",
      status: "LIVE",
      visibility: "PUBLIC",
      isListed: true,
    },
    include: { outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!market) {
    throw new Error("No live public Polymarket match_winner_1x2 market found for the selector.");
  }
  const bot = await prisma.user.findUnique({ where: { username }, include: { balance: true } });
  if (!bot?.balance) {
    throw new Error(`Bot user ${username} or demo balance is missing.`);
  }
  const result = await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: bot.id, quantity });
  console.log(
    JSON.stringify(
      {
        ok: true,
        marketId: market.id,
        eventSlug: market.eventId ? eventSlug : null,
        botUserId: bot.id,
        quantity,
        outcomes: market.outcomes.map((outcome) => ({ id: outcome.id, name: outcome.name })),
        result,
      },
      null,
      2,
    ),
  );
}

function assertLocalOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Bot inventory seed is disabled in production.");
  if (process.env.REAL_MONEY_MODE !== "false") throw new Error("Bot inventory seed requires REAL_MONEY_MODE=false.");
  if (process.env.ALLOW_BOT_TRADING !== "true") throw new Error("Bot inventory seed requires ALLOW_BOT_TRADING=true.");
  if (process.env.LOCAL_BOT_TRADING_ONLY !== "true") throw new Error("Bot inventory seed requires LOCAL_BOT_TRADING_ONLY=true.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
