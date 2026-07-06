import fs from "node:fs";
import path from "node:path";
import { eventIdsFilter } from "../src/server/services/mobileEventListFilters";

const CYCLE = "cycle-LN-mobile-saved-event-identity-filter-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const savedValues = ["db-event-id", "saved-event-slug"];
const filter = eventIdsFilter(savedValues);
const emptyFilter = eventIdsFilter([]);
const serialized = JSON.stringify(filter);

const assertions = {
  emptySavedFilterDoesNotConstrainRoute: JSON.stringify(emptyFilter) === "{}",
  savedFilterMatchesDatabaseIds: serialized.includes('"id"') && serialized.includes("db-event-id"),
  savedFilterMatchesMobileSlugs: serialized.includes('"slug"') && serialized.includes("saved-event-slug"),
  savedFilterUsesSameValuesForIdAndSlug: serialized === JSON.stringify({
    OR: [
      { id: { in: savedValues } },
      { slug: { in: savedValues } },
    ],
  }),
};

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const proof = {
  cycle: "Cycle LN",
  feature: "Mobile saved event identity filter contract",
  generatedAt: new Date().toISOString(),
  route: "/api/events?eventIds=...",
  contract: {
    mobileIdentity: "mobile saves normalized event.id, which is event.slug when present",
    backendIdentity: "backend filters saved values against both Event.id and Event.slug",
    emptySavedState: "empty saved state remains handled by mobile and produces no route constraint",
  },
  samples: {
    savedValues,
    filter,
    emptyFilter,
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

if (failed.length) {
  console.error(`Cycle LN proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
