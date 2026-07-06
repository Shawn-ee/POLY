import fs from "node:fs";
import path from "node:path";
import { eventMarketTypeFilter, listedMarketWhere, marketTypeAliases } from "../src/server/services/mobileEventListFilters";

const CYCLE = "cycle-LL-mobile-event-listed-market-filter-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const defaultMarketWhere = listedMarketWhere("");
const futureMarketWhere = listedMarketWhere("future");
const defaultEventFilter = eventMarketTypeFilter("");
const futureEventFilter = eventMarketTypeFilter("future");

const assertions = {
  defaultEventPagesRequirePublicListedMarkets:
    defaultMarketWhere.visibility === "PUBLIC" &&
    defaultMarketWhere.isListed === true &&
    !("marketType" in defaultMarketWhere),
  futuresAliasesAreBackendOwned:
    JSON.stringify(marketTypeAliases("future")) === JSON.stringify(["future", "outright"]) &&
    JSON.stringify(marketTypeAliases("futures")) === JSON.stringify(["future", "outright"]),
  futurePagesRequirePublicListedFutureOrOutrightMarkets:
    futureMarketWhere.visibility === "PUBLIC" &&
    futureMarketWhere.isListed === true &&
    JSON.stringify(futureMarketWhere.marketType) === JSON.stringify({ in: ["future", "outright"] }),
  eventFilterRunsBeforePagination:
    JSON.stringify(defaultEventFilter) === JSON.stringify({ markets: { some: defaultMarketWhere } }) &&
    JSON.stringify(futureEventFilter) === JSON.stringify({ markets: { some: futureMarketWhere } }),
};

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const proof = {
  cycle: "Cycle LL",
  feature: "Mobile event listed-market filter contract",
  generatedAt: new Date().toISOString(),
  route: "/api/events",
  contract: {
    defaultDiscovery: "event query requires at least one PUBLIC listed market before pagination",
    futuresDiscovery: "future/futures/outright filter requires at least one PUBLIC listed future or outright market before pagination",
    visiblePageSafety: "mobile does not rely on post-fetch filtering to discard no-market events",
  },
  samples: {
    defaultMarketWhere,
    futureMarketWhere,
    defaultEventFilter,
    futureEventFilter,
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

if (failed.length) {
  console.error(`Cycle LL proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
