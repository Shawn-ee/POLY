import fs from "node:fs";
import path from "node:path";
import {
  resolveLineTicketTarget,
  ticketSelectionFromBackendMarket,
} from "../mobile/src/services/eventDetailLineTicketService";
import type { Market, Outcome } from "../mobile/src/mocks/worldCup";

const CYCLE = "cycle-NG-event-detail-line-ticket-route-backed-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const outcome = (id: string, label = id): Outcome => ({
  id,
  label,
  zhLabel: label,
  probability: 54,
  color: "#22c55e",
});

const market = (id: string, marketType: Market["marketType"], outcomes: Outcome[], overrides: Partial<Market> = {}): Market => ({
  id,
  title: id,
  zhTitle: id,
  type: "live",
  marketType,
  period: "regulation",
  line: marketType === "spread" ? "-0.5" : "2.5",
  referenceSource: "polymarket",
  externalMarketId: `gamma-${id}`,
  conditionId: `condition-${id}`,
  outcomes,
  ...overrides,
});

const main = async () => {
  const backendOutcome = outcome("backend-over", "Over 2.5");
  const backendMarket = market("backend-totals-25", "totals", [backendOutcome], {
    selection: {
      selectorKey: "totals:regulation:2.5",
      marketId: "backend-totals-25",
      marketGroupId: "totals",
      marketType: "total_goals",
      marketFamily: "total",
      displayLabel: "Totals regulation 2.5",
      period: "regulation",
      line: "2.5",
      outcomes: [{
        id: "backend-over",
        outcomeId: "backend-over",
        side: "over",
        label: "Over 2.5",
        referenceTokenId: "token-over-25",
        referenceOutcomeLabel: "Over 2.5",
        isTradable: true,
      }],
    },
  });
  const syntheticOutcome = outcome("display-over-35", "Over 3.5 2H");
  const syntheticMarket = market("display-totals-35", "totals", [syntheticOutcome], { line: "3.5", period: "second-half" });

  const matchedSelection = ticketSelectionFromBackendMarket(
    { marketType: "totals", line: "2.5", period: "Reg. Time", displayLabel: "Over 2.5 RT" },
    backendMarket,
    backendOutcome,
  );

  const matchedRouteTarget = resolveLineTicketTarget({
    selection: matchedSelection,
    backendMarket,
    backendOutcome,
    syntheticOutcome,
    syntheticMarkets: { totals: syntheticMarket },
    routeBacked: true,
  });

  const mismatchedRouteTarget = resolveLineTicketTarget({
    selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
    backendMarket,
    backendOutcome,
    syntheticOutcome,
    syntheticMarkets: { totals: syntheticMarket },
    routeBacked: true,
  });

  const missingRouteTarget = resolveLineTicketTarget({
    selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
    syntheticOutcome,
    syntheticMarkets: { totals: syntheticMarket },
    routeBacked: true,
  });

  const localFallbackTarget = resolveLineTicketTarget({
    selection: { marketType: "totals", line: "3.5", period: "2nd Half", displayLabel: "Over 3.5 2H" },
    backendMarket,
    backendOutcome,
    syntheticOutcome,
    syntheticMarkets: { totals: syntheticMarket },
    routeBacked: false,
  });

  const assertions = {
    routeBackedMatchedBackendLineAccepted:
      matchedRouteTarget?.source === "backend-line-market" &&
      matchedRouteTarget.market.id === "backend-totals-25" &&
      matchedRouteTarget.outcome.id === "backend-over",
    routeBackedMismatchedLineDoesNotInventTicket: mismatchedRouteTarget === null,
    routeBackedMissingLineDoesNotInventTicket: missingRouteTarget === null,
    localFallbackStillAllowed:
      localFallbackTarget?.source === "deterministic-line-fixture" &&
      localFallbackTarget.market.id === "display-totals-35",
    backendSelectionPreservesProviderIdentity:
      matchedSelection?.marketId === "backend-totals-25" &&
      matchedSelection?.externalMarketId === "gamma-backend-totals-25" &&
      matchedSelection?.conditionId === "condition-backend-totals-25" &&
      matchedSelection?.referenceTokenId === "token-over-25",
  };

  const proof = {
    cycle: "Cycle NG",
    feature: "Event Detail route-backed line ticket identity contract",
    generatedAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    contract: {
      validPayload: "route-backed Game Lines may open tickets only with matching backend market/outcome identity.",
      malformedPayload: "route-backed mismatched or missing backend line identity returns no ticket target instead of deterministic synthetic identity.",
      localPayload: "non-route-backed/local Event Detail may still use deterministic fallback fixtures.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NG proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
