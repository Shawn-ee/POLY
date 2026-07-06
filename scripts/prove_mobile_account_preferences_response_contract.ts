import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPreferences, PUT as putPreferences } from "@/app/api/profile/preferences/route";
import { fromProfilePreferencesPayload } from "../mobile/src/services/profilePreferencesService";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LD-account-preferences-response-contract/cycle-LD-account-preferences-response-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function routeJson(response: Response) {
  return response.json() as Promise<any>;
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_ld_${suffix}`,
      email: `mobile-ld-${suffix}@example.test`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-ld-${suffix}`,
    scopes: ["account:read", "account:write"],
  });
  const headers = { Authorization: `Bearer ${credential.token}` };

  const defaultResponse = await getPreferences(new NextRequest("http://localhost/api/profile/preferences", { headers }));
  assert(defaultResponse.status === 200, `Expected default GET 200, received ${defaultResponse.status}.`);
  const defaultBody = await routeJson(defaultResponse);
  const defaultMobile = fromProfilePreferencesPayload(defaultBody.preferences);
  assert(defaultMobile.locale === "en", "Expected mobile default locale en.");
  assert(defaultMobile.ticketDefaultSide === "buy", "Expected mobile default side buy.");
  assert(defaultMobile.ticketDefaultSlippage === "1%", "Expected mobile default slippage 1%.");
  assert(Array.isArray(defaultMobile.savedEventIds), "Expected mobile savedEventIds array.");

  const savedPayload = {
    locale: "zh",
    ticketDefaultAmount: "250",
    ticketDefaultSide: "SELL",
    ticketDefaultSlippage: "2%",
    savedEventIds: ["world-cup-winner", "mexico-ecuador"],
  };
  const saveResponse = await putPreferences(
    new NextRequest("http://localhost/api/profile/preferences", {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(savedPayload),
    }),
  );
  assert(saveResponse.status === 200, `Expected save PUT 200, received ${saveResponse.status}.`);
  const saveBody = await routeJson(saveResponse);
  const savedMobile = fromProfilePreferencesPayload(saveBody.preferences);
  assert(savedMobile.locale === "zh", "Expected saved mobile locale zh.");
  assert(savedMobile.ticketDefaultSide === "sell", "Expected saved mobile side sell.");
  assert(savedMobile.ticketDefaultSlippage === "2%", "Expected saved mobile slippage 2%.");
  assert(savedMobile.savedEventIds.length === 2, "Expected two saved ids.");

  const persistedResponse = await getPreferences(new NextRequest("http://localhost/api/profile/preferences", { headers }));
  assert(persistedResponse.status === 200, `Expected persisted GET 200, received ${persistedResponse.status}.`);
  const persistedBody = await routeJson(persistedResponse);
  const persistedMobile = fromProfilePreferencesPayload(persistedBody.preferences);
  assert(JSON.stringify(persistedMobile) === JSON.stringify(savedMobile), "Expected persisted mobile preferences to match saved mobile state.");

  const invalidResponseChecks = [
    {
      name: "invalid-locale",
      payload: { ...savedPayload, locale: "fr" },
      expected: "Profile preferences response had invalid locale.",
    },
    {
      name: "invalid-side",
      payload: { ...savedPayload, ticketDefaultSide: "MAYBE" },
      expected: "Profile preferences response had invalid ticketDefaultSide.",
    },
    {
      name: "invalid-saved-ids",
      payload: { ...savedPayload, savedEventIds: ["world-cup-winner", 42] },
      expected: "Profile preferences response had invalid savedEventIds.",
    },
  ].map((check) => {
    let message = "";
    try {
      fromProfilePreferencesPayload(check.payload as any);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    assert(message === check.expected, `Expected ${check.name} to reject with ${check.expected}, received ${message}.`);
    return { ...check, rejected: true, message };
  });

  const proof = {
    cycle: "LD",
    gate: "account-preferences-response-contract",
    generatedAt: new Date().toISOString(),
    route: "/api/profile/preferences",
    auth: "canonical API key with account:read and account:write",
    assertions: {
      defaultRoutePayloadNormalizesToMobileState: true,
      savedRoutePayloadNormalizesToVisibleMobileState: true,
      persistedRoutePayloadMatchesSavedMobileState: true,
      malformedPreferenceFieldsRejectedBeforeApply: true,
    },
    defaultMobile,
    savedMobile,
    persistedMobile,
    invalidResponseChecks,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, assertions: proof.assertions }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
