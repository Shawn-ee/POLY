import fs from "node:fs";
import path from "node:path";
import { resolveLineTicketTarget, ticketSelectionFromBackendMarket } from "../mobile/src/services/eventDetailLineTicketService";
import type { Market, Outcome } from "../mobile/src/mocks/worldCup";

const CYCLE = "cycle-NV-event-detail-line-ticket-outcome-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const outcome = (id: string, label = id): Outcome => ({
  id,
  label,
  zhLabel: label,
  probability: 54,
  color: "#22c55e",
});

const market = (id: string, outcomes: Outcome[]): Market => ({
  id,
  title: id,
  zhTitle: id,
  type: "live",
  marketType: "totals",
  period: "regulation",
  line: "2.5",
  referenceSource: "polymarket",
  externalMarketId: `gamma-${id}`,
  conditionId: `condition-${id}`,
  outcomes,
  selection: {
    selectorKey: "totals:regulation:2.5",
    marketId: id,
    marketGroupId: "totals",
    marketType: "total_goals",
    marketFamily: "total",
    displayLabel: "Totals regulation 2.5",
    period: "regulation",
    line: "2.5",
    outcomes: outcomes.map((item) => ({
      id: item.id,
      outcomeId: item.id,
      side: item.side,
      label: item.label,
      tokenId: item.referenceTokenId ?? item.id,
      referenceTokenId: item.referenceTokenId ?? item.id,
      referenceOutcomeLabel: item.referenceOutcomeLabel ?? item.label,
      isTradable: true,
    })),
  },
});

const actualOutcome = outcome("backend-over-25", "Over 2.5");
const staleOutcome = outcome("stale-over-35", "Over 3.5");
const backendMarket = market("backend-totals-25", [actualOutcome]);
const syntheticOutcome = outcome("display-over-25", "Over 2.5 RT");
const syntheticMarket = market("display-totals-25", [syntheticOutcome]);

const routeBackedMatch = resolveLineTicketTarget({
  selection: { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
  backendMarket,
  backendOutcome: actualOutcome,
  syntheticOutcome,
  syntheticMarkets: { totals: syntheticMarket },
  routeBacked: true,
});

const routeBackedMismatch = resolveLineTicketTarget({
  selection: { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
  backendMarket,
  backendOutcome: staleOutcome,
  syntheticOutcome,
  syntheticMarkets: { totals: syntheticMarket },
  routeBacked: true,
});

const nonRouteMismatch = resolveLineTicketTarget({
  selection: { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
  backendMarket,
  backendOutcome: staleOutcome,
  syntheticOutcome,
  syntheticMarkets: { totals: syntheticMarket },
});

const staleSelection = ticketSelectionFromBackendMarket(
  { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
  backendMarket,
  staleOutcome,
);

const assertions = {
  acceptsRouteBackedMarketOutcomeMatch:
    routeBackedMatch?.source === "backend-line-market" &&
    routeBackedMatch.market.id === "backend-totals-25" &&
    routeBackedMatch.outcome.id === "backend-over-25",
  rejectsRouteBackedOutcomeMismatch: routeBackedMismatch === null,
  fallsBackForNonRouteOutcomeMismatch:
    nonRouteMismatch?.source === "deterministic-line-fixture" &&
    nonRouteMismatch.market.id === "display-totals-25" &&
    nonRouteMismatch.outcome.id === "display-over-25",
  doesNotBuildSelectionFromStaleOutcome:
    staleSelection?.marketId === undefined &&
    staleSelection?.outcomeId === undefined &&
    staleSelection?.displayLabel === "Over 2.5 RT",
};

const proof = {
  cycle: "Cycle NV",
  feature: "Event Detail line-ticket outcome contract",
  generatedAt: new Date().toISOString(),
  route: "/api/mobile/events/:slug/live-detail",
  contract: {
    validPayload: "route-backed line tickets require the selected backend outcome to belong to the selected backend market.",
    malformedPayload: "stale or mismatched backend outcomes reject before route-backed tickets open, and non-route fallbacks remain deterministic.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NV proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
