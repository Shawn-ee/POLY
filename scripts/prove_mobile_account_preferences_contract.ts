import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPreferences, PUT as putPreferences } from "@/app/api/profile/preferences/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JZ-account-preferences-contract/cycle-JZ-account-preferences-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_jz_${suffix}`,
      email: `mobile-jz-${suffix}@example.test`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-jz-${suffix}`,
    scopes: ["account:read", "account:write"],
  });

  const defaultResponse = await getPreferences(
    new NextRequest("http://localhost/api/profile/preferences", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(defaultResponse.status === 200, `Expected default GET status 200, received ${defaultResponse.status}.`);
  const defaultBody = await defaultResponse.json();
  assert(defaultBody.preferences?.locale === "en", "Expected default locale en.");
  assert(defaultBody.preferences?.ticketDefaultAmount === "100", "Expected default ticket amount 100.");
  assert(defaultBody.preferences?.ticketDefaultSide === "BUY", "Expected default ticket side BUY.");
  assert(defaultBody.preferences?.ticketDefaultSlippage === "1%", "Expected default slippage 1%.");
  assert(Array.isArray(defaultBody.preferences?.savedEventIds), "Expected default savedEventIds array.");

  const savedPayload = {
    locale: "zh",
    ticketDefaultAmount: "250",
    ticketDefaultSide: "SELL",
    ticketDefaultSlippage: "2%",
    savedEventIds: ["world-cup-winner", "mexico-ecuador"],
  };
  const putResponse = await putPreferences(
    new NextRequest("http://localhost/api/profile/preferences", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${credential.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(savedPayload),
    }),
  );
  assert(putResponse.status === 200, `Expected PUT status 200, received ${putResponse.status}.`);
  const putBody = await putResponse.json();
  assert(JSON.stringify(putBody.preferences) === JSON.stringify(savedPayload), "Expected PUT response to echo normalized preferences.");

  const persistedResponse = await getPreferences(
    new NextRequest("http://localhost/api/profile/preferences", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(persistedResponse.status === 200, `Expected persisted GET status 200, received ${persistedResponse.status}.`);
  const persistedBody = await persistedResponse.json();
  assert(JSON.stringify(persistedBody.preferences) === JSON.stringify(savedPayload), "Expected persisted GET preferences to match saved payload.");

  const invalidResponse = await putPreferences(
    new NextRequest("http://localhost/api/profile/preferences", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${credential.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        savedEventIds: [],
      }),
    }),
  );
  assert(invalidResponse.status === 400, `Expected invalid PUT status 400, received ${invalidResponse.status}.`);
  const invalidBody = await invalidResponse.json();
  assert(invalidBody.error?.message === "ticketDefaultSlippage is required.", "Expected clear invalid slippage error.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/profile/preferences",
    auth: "canonical API key with account:read and account:write",
    accountScreenFields: {
      locale: persistedBody.preferences.locale,
      ticketDefaultAmount: persistedBody.preferences.ticketDefaultAmount,
      ticketDefaultSide: persistedBody.preferences.ticketDefaultSide,
      ticketDefaultSlippage: persistedBody.preferences.ticketDefaultSlippage,
      savedMarketCount: persistedBody.preferences.savedEventIds.length,
    },
    defaultPreferences: defaultBody.preferences,
    savedPreferences: persistedBody.preferences,
    invalidPayload: {
      status: invalidResponse.status,
      message: invalidBody.error.message,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));
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
