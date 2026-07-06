import fs from "node:fs";
import path from "node:path";
import { resolveSortedMobilePageStart, INVALID_FILTERED_MOBILE_CURSOR_ERROR } from "../src/server/services/mobileEventPagination";

const CYCLE = "cycle-LK-sorted-event-cursor-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const orderedEventIds = ["event-most-markets", "event-live-second", "event-small-third"];
const firstPage = resolveSortedMobilePageStart(orderedEventIds, null);
const secondPage = resolveSortedMobilePageStart(orderedEventIds, "event-live-second");
const staleCursor = resolveSortedMobilePageStart(orderedEventIds, "event-filtered-out");

const assertions = {
  firstSortedMobilePageStartsAtZero: firstPage.pageStart === 0 && firstPage.error === null,
  validBackendCursorAdvancesPastCursor: secondPage.pageStart === 2 && secondPage.error === null,
  filteredOutCursorIsRejected: staleCursor.pageStart === 0 && staleCursor.error === INVALID_FILTERED_MOBILE_CURSOR_ERROR,
  routeErrorMessageIsStableForMobile: INVALID_FILTERED_MOBILE_CURSOR_ERROR === "Invalid event cursor for filtered mobile page.",
};

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const proof = {
  cycle: "Cycle LK",
  feature: "Sorted mobile event cursor contract",
  generatedAt: new Date().toISOString(),
  route: "/api/events?includeMobileMarkets=1&sortBy=popular|live",
  contract: {
    sortedCursorScope: "cursor must be present in the backend-filtered sorted mobile page",
    validCursorBehavior: "start after the cursor",
    invalidFilteredCursorBehavior: "reject with 400 instead of restarting from the first page",
  },
  samples: {
    orderedEventIds,
    firstPage,
    secondPage,
    staleCursor,
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

if (failed.length) {
  console.error(`Cycle LK proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
