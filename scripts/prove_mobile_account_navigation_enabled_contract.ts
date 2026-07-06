import fs from "node:fs";
import path from "node:path";
import { loadAccountNavigation } from "../mobile/src/services/accountNavigationService";

const CYCLE = "cycle-LZ-account-navigation-enabled-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const navigationPayload = () => ({
  source: "account-navigation-route",
  generatedAt: "2026-07-06T08:00:00.000Z",
  items: [{
    id: "leaderboard",
    label: "Leaderboard",
    icon: "trophy-outline",
    kind: "placeholder",
    enabled: false,
    status: "unavailable",
    destination: null,
    reason: "Leaderboard is not enabled.",
  }],
});

const apiForPayload = (payload: unknown) => ({
  getAccountNavigation: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadAccountNavigation(apiForPayload(payload) as Parameters<typeof loadAccountNavigation>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validNavigation = await loadAccountNavigation(apiForPayload(navigationPayload()));
  const stringEnabled = {
    ...navigationPayload(),
    items: [{ ...navigationPayload().items[0], enabled: "false" }],
  };
  const numericEnabled = {
    ...navigationPayload(),
    items: [{ ...navigationPayload().items[0], enabled: 1 }],
  };

  const assertions = {
    validBooleanEnabledApplies:
      validNavigation.items[0]?.id === "leaderboard" &&
      validNavigation.items[0]?.enabled === false &&
      validNavigation.items[0]?.status === "unavailable",
    stringEnabledRejects: await rejectedWith(
      stringEnabled,
      "Account navigation response was missing items[0].enabled.",
    ),
    numericEnabledRejects: await rejectedWith(
      numericEnabled,
      "Account navigation response was missing items[0].enabled.",
    ),
  };

  const proof = {
    cycle: "Cycle LZ",
    feature: "Account navigation enabled contract",
    generatedAt: new Date().toISOString(),
    route: "/api/account/navigation",
    contract: {
      validPayload: "navigation item enabled state must be a real boolean before visible Account menu state applies",
      malformedPayload: "string/number enabled values reject instead of being coerced into enabled/disabled UI state",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LZ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
