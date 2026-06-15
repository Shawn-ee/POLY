import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const DEFAULT_PLAYWRIGHT_ADMIN_EMAIL = "admin.test@poly.local";
export const DEFAULT_PLAYWRIGHT_ADMIN_PASSWORD = "local-admin-password";
export const PLAYWRIGHT_ADMIN_USERNAME = "playwright_admin";
const PLAYWRIGHT_ADMIN_BALANCE = new Prisma.Decimal(1000);

type DevLoginEnv = {
  NODE_ENV?: string;
  ALLOW_DEV_LOGIN?: string;
};

export function isDevLoginAllowed(env: DevLoginEnv = process.env) {
  return env.NODE_ENV !== "production" && env.ALLOW_DEV_LOGIN === "true";
}

export function getPlaywrightAdminCredentials(env: NodeJS.ProcessEnv = process.env) {
  return {
    email: env.PLAYWRIGHT_ADMIN_EMAIL?.trim() || DEFAULT_PLAYWRIGHT_ADMIN_EMAIL,
    password: env.PLAYWRIGHT_ADMIN_PASSWORD || DEFAULT_PLAYWRIGHT_ADMIN_PASSWORD,
  };
}

export async function ensurePlaywrightAdminUser(email: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username: PLAYWRIGHT_ADMIN_USERNAME,
      displayName: "Playwright Admin",
      isAdmin: true,
    },
    create: {
      email,
      username: PLAYWRIGHT_ADMIN_USERNAME,
      displayName: "Playwright Admin",
      isAdmin: true,
    },
    select: { id: true, email: true, username: true, displayName: true, isAdmin: true },
  });

  await prisma.userBalance.upsert({
    where: { userId: user.id },
    update: {
      availableUSDC: PLAYWRIGHT_ADMIN_BALANCE,
      lockedUSDC: new Prisma.Decimal(0),
    },
    create: {
      userId: user.id,
      availableUSDC: PLAYWRIGHT_ADMIN_BALANCE,
      lockedUSDC: new Prisma.Decimal(0),
    },
  });

  return user;
}
