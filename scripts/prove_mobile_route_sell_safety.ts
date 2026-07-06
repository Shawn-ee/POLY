import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KG-route-sell-safety/cycle-KG-route-sell-safety.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createUserWithCredential(prefix: string) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}-${suffix}@example.test`,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `${prefix}-${suffix}`,
    scopes: ["orders:write", "account:read"],
  });
  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("100.00"),
      lockedUSDC: dec("0"),
    },
  });
  return { user, credential };
}

async function createMarket(prefix: string) {
  const suffix = randomUUID().slice(0, 8);
  return prisma.market.create({
    data: {
      title: `${prefix} Route Sell Safety`,
      description: "Disposable market proving route-backed mobile sell/cashout safety.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          {
            name: "YES",
            label: "Yes",
            side: "yes",
            code: "YES",
            slug: `${prefix}-yes-${suffix}`,
            displayOrder: 0,
            isActive: true,
            isTradable: true,
          },
          {
            name: "NO",
            label: "No",
            side: "no",
            code: "NO",
            slug: `${prefix}-no-${suffix}`,
            displayOrder: 1,
            isActive: true,
            isTradable: true,
          },
        ],
      },
    },
    include: { outcomes: true },
  });
}

async function postSellOrder(params: {
  token: string;
  marketId: string;
  outcomeId: string;
  price: string;
  size: string;
  key: string;
}) {
  const response = await createOrder(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.key,
      },
      body: JSON.stringify({
        marketId: params.marketId,
        outcomeId: params.outcomeId,
        side: "SELL",
        type: "LIMIT",
        price: params.price,
        size: params.size,
        clientOrderId: params.key,
      }),
    }),
  );
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function readPortfolio(token: string) {
  const response = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
  assert(response.status === 200, `Expected portfolio status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const market = await createMarket(`mobile-kg-${suffix}`);
  const outcome = market.outcomes.find((item) => item.side === "yes") ?? market.outcomes[0];
  assert(outcome, "Expected proof outcome.");

  const noPosition = await createUserWithCredential(`mobile_kg_no_position_${suffix}`);
  const noPositionSell = await postSellOrder({
    token: noPosition.credential.token,
    marketId: market.id,
    outcomeId: outcome.id,
    price: "0.50",
    size: "1",
    key: `kg-no-position-${suffix}`,
  });
  assert(noPositionSell.status === 409, `Expected no-position SELL status 409, received ${noPositionSell.status}.`);
  assert(
    noPositionSell.body?.error?.message === "Insufficient shares",
    `Expected no-position SELL to fail with Insufficient shares, received ${JSON.stringify(noPositionSell.body)}.`,
  );
  const noPositionPortfolio = await readPortfolio(noPosition.credential.token);
  assert(noPositionPortfolio.positions.length === 0, "Expected no-position rejection to leave no positions.");
  assert(noPositionPortfolio.openOrders.length === 0, "Expected no-position rejection to leave no open orders.");

  const holder = await createUserWithCredential(`mobile_kg_holder_${suffix}`);
  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: holder.user.id,
    quantity: "2",
  });

  const oversell = await postSellOrder({
    token: holder.credential.token,
    marketId: market.id,
    outcomeId: outcome.id,
    price: "0.52",
    size: "3",
    key: `kg-oversell-${suffix}`,
  });
  assert(oversell.status === 409, `Expected oversell status 409, received ${oversell.status}.`);
  assert(
    oversell.body?.error?.message === "Insufficient available shares",
    `Expected oversell to fail with Insufficient available shares, received ${JSON.stringify(oversell.body)}.`,
  );
  const afterOversellPortfolio = await readPortfolio(holder.credential.token);
  const afterOversellPosition = afterOversellPortfolio.positions.find((item: any) => item.outcomeId === outcome.id);
  assert(afterOversellPosition, "Expected holder position after oversell rejection.");
  assert(afterOversellPosition.shares === 2, `Expected oversell rejection to preserve 2 shares, received ${afterOversellPosition.shares}.`);
  assert(afterOversellPortfolio.openOrders.length === 0, "Expected oversell rejection to leave no open orders.");

  const validClose = await postSellOrder({
    token: holder.credential.token,
    marketId: market.id,
    outcomeId: outcome.id,
    price: "0.52",
    size: "2",
    key: `kg-valid-close-${suffix}`,
  });
  assert(validClose.status === 200, `Expected valid sell-all close status 200, received ${validClose.status}.`);
  assert(validClose.body?.order?.side === "SELL", "Expected valid close to create a SELL order.");
  assert(validClose.body?.order?.size === "2", `Expected valid close size 2, received ${validClose.body?.order?.size}.`);
  const afterValidPortfolio = await readPortfolio(holder.credential.token);
  const validOpenOrder = afterValidPortfolio.openOrders.find((item: any) => item.id === validClose.body.order.id);
  assert(validOpenOrder, "Expected valid close order to appear in portfolio open orders.");
  const afterValidPosition = afterValidPortfolio.positions.find((item: any) => item.outcomeId === outcome.id);
  assert(afterValidPosition?.shares === 2, "Expected valid close to preserve owned shares while reserving them.");

  const storedPosition = await prisma.position.findUniqueOrThrow({
    where: {
      userId_marketId_outcomeId: {
        userId: holder.user.id,
        marketId: market.id,
        outcomeId: outcome.id,
      },
    },
  });
  assert(storedPosition.reservedShares.toString() === "2", `Expected valid close to reserve all 2 shares, received ${storedPosition.reservedShares}.`);

  const summary = {
    pass: true,
    cycle: "Cycle KG",
    createdAt: new Date().toISOString(),
    routes: {
      submit: "/api/orders",
      portfolio: "/api/portfolio",
    },
    cases: {
      noPositionSellRejected: {
        status: noPositionSell.status,
        message: noPositionSell.body.error.message,
        positions: noPositionPortfolio.positions.length,
        openOrders: noPositionPortfolio.openOrders.length,
      },
      oversellRejected: {
        status: oversell.status,
        message: oversell.body.error.message,
        sharesAfter: afterOversellPosition.shares,
        openOrdersAfter: afterOversellPortfolio.openOrders.length,
      },
      validSellAllAccepted: {
        status: validClose.status,
        orderId: validClose.body.order.id,
        side: validClose.body.order.side,
        size: validClose.body.order.size,
        reservedSharesAfter: storedPosition.reservedShares.toString(),
        portfolioOpenOrder: {
          id: validOpenOrder.id,
          side: validOpenOrder.side,
          remaining: validOpenOrder.remaining,
        },
      },
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
