import fs from "node:fs/promises";
import path from "node:path";
import { resolvePortfolioSyncResults } from "../mobile/src/services/portfolioSyncService";
import type { PortfolioActivity } from "../mobile/src/components/Portfolio";
import type { PortfolioSnapshotResult } from "../mobile/src/services/portfolioSnapshotService";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-LE-portfolio-partial-sync-contract/cycle-LE-portfolio-partial-sync-contract.json";

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const snapshot: PortfolioSnapshotResult = {
  balance: 10000,
  positions: [
    {
      id: "server-proof-position",
      mode: "server",
      title: "LE Portfolio snapshot",
      outcome: "Home",
      side: "buy",
      amount: 100,
      probability: 50,
      shares: 200,
      currentPrice: 0.5,
    },
  ],
  openOrders: [
    {
      id: "server-proof-open-order",
      title: "LE Portfolio order",
      outcome: "Away",
      side: "buy",
      status: "OPEN",
      price: 0.4,
      remaining: 25,
    },
  ],
};

const activities: PortfolioActivity[] = [
  {
    id: "server-proof-activity",
    action: "opened",
    title: "LE Portfolio activity",
    outcome: "Home",
    amount: 25,
    timestamp: "Jul 6, 4:56 AM",
  },
];

const fulfilled = <T,>(value: T): PromiseFulfilledResult<T> => ({ status: "fulfilled", value });
const rejected = (): PromiseRejectedResult => ({ status: "rejected", reason: new Error("route failed") });

const cases = {
  bothSucceeded: resolvePortfolioSyncResults(fulfilled(snapshot), fulfilled(activities)),
  historyFailed: resolvePortfolioSyncResults(fulfilled(snapshot), rejected()),
  snapshotFailed: resolvePortfolioSyncResults(rejected(), fulfilled(activities)),
  bothFailed: resolvePortfolioSyncResults(rejected(), rejected()),
};

assert(cases.bothSucceeded.syncStatus === "synced", "Both-route success must report synced.");
assert(cases.bothSucceeded.snapshotStatus === "synced", "Both-route success must report snapshot synced.");
assert(cases.bothSucceeded.historyStatus === "synced", "Both-route success must report history synced.");
assert(cases.historyFailed.syncStatus === "error", "History failure must report visible error.");
assert(cases.historyFailed.snapshotStatus === "synced", "History failure must preserve synced snapshot status.");
assert(cases.historyFailed.historyStatus === "error", "History failure must mark history error.");
assert(Boolean(cases.historyFailed.snapshot), "History failure must still keep usable snapshot data.");
assert(cases.snapshotFailed.syncStatus === "error", "Snapshot failure must report visible error.");
assert(cases.snapshotFailed.snapshotStatus === "error", "Snapshot failure must mark snapshot error.");
assert(cases.snapshotFailed.historyStatus === "synced", "Snapshot failure must preserve synced history status.");
assert(Boolean(cases.snapshotFailed.activities), "Snapshot failure must still keep usable activity data.");
assert(cases.bothFailed.syncStatus === "error", "Both-route failure must report visible error.");
assert(!cases.bothFailed.snapshot && !cases.bothFailed.activities, "Both-route failure must not invent Portfolio data.");

const proof = {
  cycle: "LE",
  gate: "portfolio-partial-sync-contract",
  generatedAt: new Date().toISOString(),
  routes: ["/api/portfolio", "/api/portfolio/history"],
  assertions: {
    bothRoutesRequiredForSyncedStatus: true,
    partialSnapshotFailureShowsVisibleError: true,
    partialHistoryFailureShowsVisibleError: true,
    successfulPartialDataStillApplied: true,
    bothFailuresDoNotInventData: true,
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
