import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getAccountBalance } from "@/app/api/account/balance/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { loadAccountBalance } from "../mobile/src/services/accountBalanceService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KH-account-balance-contract/cycle-KH-account-balance-contract.json";
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

const assertNear = (actual: number, expected: number, message: string) => {
  assert(Math.abs(actual - expected) < 0.000001, `${message} Expected ${expected}, received ${actual}.`);
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_kh_account_${suffix}`,
      email: `mobile-kh-account-${suffix}@example.test`,
      displayName: `KH Account ${suffix}`,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-kh-account-${suffix}`,
    scopes: ["account:read"],
  });

  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("140.86"),
      lockedUSDC: dec("12.34"),
    },
  });

  const authHeaders = { Authorization: `Bearer ${credential.token}` };
  const balanceResponse = await getAccountBalance(
    new NextRequest("http://localhost/api/account/balance", {
      headers: authHeaders,
    }),
  );
  assert(balanceResponse.status === 200, `Expected account balance status 200, received ${balanceResponse.status}.`);
  const routeBalance = await balanceResponse.json();
  assert(routeBalance.availableUSDC === "140.860000", `Expected route availableUSDC 140.860000, received ${routeBalance.availableUSDC}.`);
  assert(routeBalance.lockedUSDC === "12.340000", `Expected route lockedUSDC 12.340000, received ${routeBalance.lockedUSDC}.`);
  assert(routeBalance.totalUSDC === "153.200000", `Expected route totalUSDC 153.200000, received ${routeBalance.totalUSDC}.`);

  const mobileBalance = await loadAccountBalance({
    getAccountBalance: async () => routeBalance,
  });
  assert(mobileBalance.availableUSDC === 140.86, `Expected mobile availableUSDC 140.86, received ${mobileBalance.availableUSDC}.`);
  assert(mobileBalance.lockedUSDC === 12.34, `Expected mobile lockedUSDC 12.34, received ${mobileBalance.lockedUSDC}.`);
  assert(mobileBalance.totalUSDC === 153.2, `Expected mobile totalUSDC 153.2, received ${mobileBalance.totalUSDC}.`);

  const portfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: authHeaders,
    }),
  );
  assert(portfolioResponse.status === 200, `Expected portfolio status 200, received ${portfolioResponse.status}.`);
  const portfolio = await portfolioResponse.json();
  assertNear(portfolio.walletAvailableUSDC, 140.86, "Expected portfolio walletAvailableUSDC to match account balance.");
  assertNear(portfolio.walletLockedUSDC, 12.34, "Expected portfolio walletLockedUSDC to match account balance.");
  assertNear(portfolio.walletTotalUSDC, 153.2, "Expected portfolio walletTotalUSDC to match account balance.");

  const summary = {
    pass: true,
    cycle: "Cycle KH",
    createdAt: new Date().toISOString(),
    routes: {
      accountBalance: "/api/account/balance",
      portfolio: "/api/portfolio",
    },
    account: {
      userId: user.id,
      displayName: user.displayName,
      auth: "canonical API key with account:read",
    },
    routeBalance: {
      availableUSDC: routeBalance.availableUSDC,
      lockedUSDC: routeBalance.lockedUSDC,
      totalUSDC: routeBalance.totalUSDC,
      updatedAt: routeBalance.updatedAt,
    },
    mobileBalance: {
      availableUSDC: mobileBalance.availableUSDC,
      lockedUSDC: mobileBalance.lockedUSDC,
      totalUSDC: mobileBalance.totalUSDC,
      updatedAt: mobileBalance.updatedAt,
    },
    portfolioWallet: {
      walletAvailableUSDC: portfolio.walletAvailableUSDC,
      walletLockedUSDC: portfolio.walletLockedUSDC,
      walletTotalUSDC: portfolio.walletTotalUSDC,
      positions: portfolio.positions.length,
      openOrders: portfolio.openOrders.length,
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
