import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getAccountNavigation } from "@/app/api/account/navigation/route";
import { loadAccountNavigation } from "../mobile/src/services/accountNavigationService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KM-account-navigation-contract/cycle-KM-account-navigation-contract.json";

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

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_km_navigation_${suffix}`,
      email: `mobile-km-navigation-${suffix}@example.test`,
      displayName: `KM Navigation ${suffix}`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-km-navigation-${suffix}`,
    scopes: ["account:read"],
  });

  const response = await getAccountNavigation(
    new NextRequest("http://localhost/api/account/navigation", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(response.status === 200, `Expected account navigation status 200, received ${response.status}.`);
  const routeNavigation = await response.json();
  assert(routeNavigation.source === "account-navigation-route", "Expected backend account navigation source.");
  assert(Array.isArray(routeNavigation.items), "Expected backend account navigation items.");
  assert(routeNavigation.items.length >= 8, "Expected backend to return all visible Account menu rows.");
  assert(routeNavigation.items.every((item: any) => item.kind === "placeholder"), "Expected Account menu items to be backend-owned placeholders.");
  assert(routeNavigation.items.every((item: any) => item.enabled === false), "Expected unsupported Account menu items to be disabled.");
  assert(routeNavigation.items.every((item: any) => item.status === "unavailable"), "Expected unsupported Account menu items to be unavailable.");

  const mobileNavigation = await loadAccountNavigation({
    getAccountNavigation: async () => routeNavigation,
  });
  assert(mobileNavigation.source === "account-navigation-route", "Expected mobile navigation source to match route.");
  assert(mobileNavigation.items.length === routeNavigation.items.length, "Expected mobile navigation item count to match route.");
  assert(mobileNavigation.items.every((item) => item.enabled === false), "Expected mobile navigation rows to remain disabled.");
  assert(mobileNavigation.items.every((item) => item.reason), "Expected mobile navigation rows to retain backend reason copy.");

  const summary = {
    pass: true,
    cycle: "Cycle KM",
    createdAt: new Date().toISOString(),
    routes: {
      accountNavigation: "/api/account/navigation",
    },
    account: {
      auth: "canonical API key with account:read",
      userId: user.id,
      username: user.username,
    },
    routeNavigation: {
      source: routeNavigation.source,
      generatedAt: routeNavigation.generatedAt,
      itemCount: routeNavigation.items.length,
      disabledItemIds: routeNavigation.items.filter((item: any) => item.enabled === false).map((item: any) => item.id),
      unavailableItemIds: routeNavigation.items.filter((item: any) => item.status === "unavailable").map((item: any) => item.id),
    },
    mobileNavigation: {
      source: mobileNavigation.source,
      itemCount: mobileNavigation.items.length,
      disabledItemIds: mobileNavigation.items.filter((item) => item.enabled === false).map((item) => item.id),
      placeholderItemIds: mobileNavigation.items.filter((item) => item.kind === "placeholder").map((item) => item.id),
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
