import fs from "node:fs";
import path from "node:path";
import {
  loadProfilePreferences,
  saveProfilePreferences,
} from "../mobile/src/services/profilePreferencesService";
import type { PolyApi } from "../mobile/src/api";

const CYCLE = "cycle-NE-profile-preferences-numeric-defaults-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const preferences = (overrides: Record<string, unknown> = {}) => ({
  locale: "en",
  ticketDefaultAmount: "100",
  ticketDefaultSide: "BUY",
  ticketDefaultSlippage: "1%",
  savedEventIds: ["mexico-ecuador"],
  ...overrides,
});

const apiForPreferences = (payload: unknown) => ({
  getProfilePreferences: async () => ({ preferences: payload }),
});

const rejectedWith = async (operation: () => Promise<unknown>, message: string) => {
  const result = await Promise.allSettled([operation()]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const valid = await loadProfilePreferences(apiForPreferences(preferences({
    ticketDefaultAmount: "0.01",
    ticketDefaultSlippage: "0%",
  })) as unknown as PolyApi);

  const maxSlippage = await loadProfilePreferences(apiForPreferences(preferences({
    ticketDefaultSlippage: "100%",
  })) as unknown as PolyApi);

  const savedPayloads: unknown[] = [];
  const saved = await saveProfilePreferences({
    saveProfilePreferences: async (payload: unknown) => {
      savedPayloads.push(payload);
      return { preferences: preferences({ ticketDefaultAmount: "250", ticketDefaultSlippage: "2%" }) };
    },
  } as unknown as PolyApi, {
    locale: "en",
    ticketDefaultAmount: "250",
    ticketDefaultSide: "buy",
    ticketDefaultSlippage: "2%",
    savedEventIds: ["world-cup-winner"],
  });

  const assertions = {
    positiveAmountAndZeroSlippageAccepted:
      valid.ticketDefaultAmount === "0.01" &&
      valid.ticketDefaultSlippage === "0%",
    maxSlippageAccepted: maxSlippage.ticketDefaultSlippage === "100%",
    saveRoundTripPreservesNumericDefaults:
      saved.ticketDefaultAmount === "250" &&
      saved.ticketDefaultSlippage === "2%" &&
      (savedPayloads[0] as { ticketDefaultAmount?: string; ticketDefaultSlippage?: string } | undefined)?.ticketDefaultAmount === "250" &&
      (savedPayloads[0] as { ticketDefaultAmount?: string; ticketDefaultSlippage?: string } | undefined)?.ticketDefaultSlippage === "2%",
    nonnumericAmountRejects: await rejectedWith(
      () => loadProfilePreferences(apiForPreferences(preferences({ ticketDefaultAmount: "abc" })) as unknown as PolyApi),
      "ticketDefaultAmount",
    ),
    zeroAmountRejects: await rejectedWith(
      () => loadProfilePreferences(apiForPreferences(preferences({ ticketDefaultAmount: "0" })) as unknown as PolyApi),
      "ticketDefaultAmount",
    ),
    malformedSlippageRejects: await rejectedWith(
      () => loadProfilePreferences(apiForPreferences(preferences({ ticketDefaultSlippage: "banana" })) as unknown as PolyApi),
      "ticketDefaultSlippage",
    ),
    aboveMaxSlippageRejects: await rejectedWith(
      () => loadProfilePreferences(apiForPreferences(preferences({ ticketDefaultSlippage: "101%" })) as unknown as PolyApi),
      "ticketDefaultSlippage",
    ),
  };

  const proof = {
    cycle: "Cycle NE",
    feature: "Profile preferences numeric defaults contract",
    generatedAt: new Date().toISOString(),
    route: "/api/profile/preferences",
    contract: {
      validPayload: "ticketDefaultAmount must be a positive numeric string and ticketDefaultSlippage must be a 0..100 percent string.",
      legacyPayload: "missing slippage remains supported through the existing 1% default.",
      malformedPayload: "nonnumeric amount, nonpositive amount, malformed slippage, or out-of-range slippage rejects before visible Account settings state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NE proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
