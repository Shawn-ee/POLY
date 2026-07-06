import fs from "node:fs/promises";
import path from "node:path";
import { resolveAccountBootstrapResults } from "../mobile/src/services/accountBootstrapService";
import type { AccountBalanceResult } from "../mobile/src/services/accountBalanceService";
import type { AccountNavigationResult } from "../mobile/src/services/accountNavigationService";
import type { AccountProfileResult } from "../mobile/src/services/accountProfileService";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LI-account-bootstrap-contract/cycle-LI-account-bootstrap-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const balance: AccountBalanceResult = {
  availableUSDC: 140.86,
  lockedUSDC: 10,
  totalUSDC: 150.86,
  updatedAt: "2026-07-06T08:00:00.000Z",
};

const profile: AccountProfileResult = {
  id: "user-1",
  username: "grouchypike7067",
  displayName: "grouchypike7067",
  email: null,
  image: null,
  walletAddress: null,
  hasWalletLinked: false,
  hasGoogleLinked: false,
};

const navigation: AccountNavigationResult = {
  source: "account-navigation-route",
  generatedAt: "2026-07-06T08:00:00.000Z",
  items: [
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: "trophy-outline",
      kind: "placeholder",
      enabled: false,
      status: "unavailable",
      destination: null,
      reason: "Leaderboard is not enabled.",
    },
  ],
};

const fulfilled = <T,>(value: T): PromiseFulfilledResult<T> => ({ status: "fulfilled", value });
const rejected = (): PromiseRejectedResult => ({ status: "rejected", reason: new Error("route failed") });

const cases = {
  allSucceeded: resolveAccountBootstrapResults(fulfilled(balance), fulfilled(profile), fulfilled(navigation)),
  profileFailed: resolveAccountBootstrapResults(fulfilled(balance), rejected(), fulfilled(navigation)),
  navigationFailed: resolveAccountBootstrapResults(fulfilled(balance), fulfilled(profile), rejected()),
  allFailed: resolveAccountBootstrapResults(rejected(), rejected(), rejected()),
};

assert(cases.allSucceeded.status === "synced", "All account routes must report synced.");
assert(cases.profileFailed.status === "error", "Profile route failure must report visible account error.");
assert(cases.profileFailed.balance === balance, "Profile failure must preserve loaded balance.");
assert(cases.profileFailed.navigation === navigation, "Profile failure must preserve loaded navigation.");
assert(cases.navigationFailed.status === "error", "Navigation route failure must report visible account error.");
assert(cases.navigationFailed.profile === profile, "Navigation failure must preserve loaded profile.");
assert(cases.navigationFailed.navigation === undefined, "Navigation failure must not invent menu data.");
assert(cases.allFailed.status === "error", "All route failures must report visible account error.");
assert(!cases.allFailed.balance && !cases.allFailed.profile && !cases.allFailed.navigation, "All failures must not invent account data.");

const proof = {
  cycle: "LI",
  gate: "account-bootstrap-contract",
  generatedAt: new Date().toISOString(),
  routes: ["/api/account/balance", "/api/account/profile", "/api/account/navigation"],
  assertions: {
    allAccountRoutesRequiredForSyncedStatus: true,
    partialAccountFailuresShowVisibleError: true,
    successfulPartialAccountDataStillApplies: true,
    failedAccountRoutesDoNotInventData: true,
  },
  cases,
};

async function main() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, assertions: proof.assertions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
