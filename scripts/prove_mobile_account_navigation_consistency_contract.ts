import fs from "node:fs";
import path from "node:path";
import { loadAccountNavigation } from "../mobile/src/services/accountNavigationService";

const CYCLE = "cycle-ND-account-navigation-consistency-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const navigationPayload = (item: Record<string, unknown>) => ({
  source: "account-navigation-route",
  generatedAt: "2026-07-06T08:00:00.000Z",
  items: [item],
});

const apiForPayload = (payload: unknown) => ({
  getAccountNavigation: async () => payload,
});

const placeholderItem = {
  id: "leaderboard",
  label: "Leaderboard",
  icon: "trophy-outline",
  kind: "placeholder",
  enabled: false,
  status: "unavailable",
  destination: null,
  reason: "Leaderboard is not enabled.",
};

const availableItem = {
  id: "settings",
  label: "Settings",
  icon: "settings-outline",
  kind: "internal",
  enabled: true,
  status: "available",
  destination: "AccountSettings",
  reason: null,
};

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadAccountNavigation(apiForPayload(payload) as Parameters<typeof loadAccountNavigation>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const placeholder = await loadAccountNavigation(apiForPayload(navigationPayload(placeholderItem)));
  const available = await loadAccountNavigation(apiForPayload(navigationPayload(availableItem)));

  const assertions = {
    validPlaceholderAccepted:
      placeholder.items[0]?.kind === "placeholder" &&
      placeholder.items[0]?.enabled === false &&
      placeholder.items[0]?.status === "unavailable" &&
      placeholder.items[0]?.destination === null,
    validAvailableDestinationAccepted:
      available.items[0]?.kind === "internal" &&
      available.items[0]?.enabled === true &&
      available.items[0]?.status === "available" &&
      available.items[0]?.destination === "AccountSettings",
    enabledUnavailableRejects: await rejectedWith(
      navigationPayload({ ...availableItem, status: "unavailable", reason: "Feature disabled." }),
      "inconsistent items[0]",
    ),
    availableWithoutDestinationRejects: await rejectedWith(
      navigationPayload({ ...availableItem, destination: null }),
      "inconsistent items[0]",
    ),
    enabledPlaceholderRejects: await rejectedWith(
      navigationPayload({ ...placeholderItem, enabled: true, status: "available", destination: "Leaderboard" }),
      "inconsistent items[0]",
    ),
  };

  const proof = {
    cycle: "Cycle ND",
    feature: "Account navigation consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/account/navigation",
    contract: {
      validPayload: "Available account navigation rows must be enabled and provide a destination.",
      placeholderPayload: "Placeholder rows must stay disabled, unavailable, and destinationless.",
      malformedPayload: "contradictory enabled/status/destination rows reject before visible Account menu state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle ND proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
