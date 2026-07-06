import fs from "node:fs";
import path from "node:path";
import { normalizeEventDetail } from "../mobile/src/adapters/worldCupAdapter";
import { resolveLineTicketTarget, ticketSelectionFromBackendMarket } from "../mobile/src/services/eventDetailLineTicketService";
import type { EventDetail } from "../mobile/src/types";
import type { Market, Outcome } from "../mobile/src/mocks/worldCup";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const outputPath = argValue("output") ?? "docs/mobile/harness/cycle-KA-line-selector-backend-selection/cycle-KA-line-selector-backend-selection.json";

const expect = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const detail: EventDetail = {
  event: {
    id: "cycle-ka-event",
    slug: "cycle-ka-backend-selection",
    title: "Backend Home vs Backend Away",
    description: "Cycle KA route-shaped event detail payload.",
    category: "sports",
    sportKey: "soccer",
    leagueKey: "world_cup",
    homeTeamName: "Backend Home",
    awayTeamName: "Backend Away",
    startTime: "2026-07-10T20:00:00.000Z",
    status: "upcoming",
    liveStatus: null,
    period: null,
    clock: null,
    homeScore: null,
    awayScore: null,
    imageUrl: null,
    marketCount: 2,
    activeMarketCount: 2,
    marketProfile: "regulation_90",
    resultMode: "can_draw",
    gameRules: {
      allowDraw: true,
      includesOvertime: false,
      description: "Regulation-time market can settle as draw.",
    },
    supportedMarketTypes: ["regulation_90", "totals", "team-total"],
  },
  markets: [
    {
      id: "cycle-ka-total-25-1h",
      title: "Totals first-half 2.5",
      description: null,
      status: "OPEN",
      referenceSource: "polymarket",
      externalSlug: "cycle-ka-total-25-1h",
      externalMarketId: "gamma-cycle-ka-total-25-1h",
      conditionId: "condition-cycle-ka-total-25-1h",
      outcomes: [
        {
          id: "cycle-ka-total-over",
          name: "Over 2.5",
          label: "Over 2.5",
          side: "over",
          referenceTokenId: "token-cycle-ka-total-over",
          referenceOutcomeLabel: "Over 2.5 first half",
          price: 0.52,
          bestBid: 0.5,
          bestAsk: 0.55,
          isTradable: true,
        },
        {
          id: "cycle-ka-total-under",
          name: "Under 2.5",
          label: "Under 2.5",
          side: "under",
          referenceTokenId: "token-cycle-ka-total-under",
          referenceOutcomeLabel: "Under 2.5 first half",
          price: 0.48,
          bestBid: 0.45,
          bestAsk: 0.5,
          isTradable: true,
        },
      ],
      event: null,
      rulesText: null,
      marketGroupKey: "totals",
      marketGroupId: "totals",
      marketGroupTitle: "Totals",
      marketType: "total_goals",
      period: "first-half",
      line: "2.5",
      selection: {
        selectorKey: "totals:first-half:2.5",
        marketId: "cycle-ka-total-25-1h",
        marketGroupKey: "totals",
        marketGroupId: "totals",
        marketGroupTitle: "Totals",
        marketType: "total_goals",
        marketFamily: "total",
        displayLabel: "Totals first-half 2.5",
        period: "first-half",
        line: "2.5",
        lineValue: 2.5,
        unit: "goals",
        outcomes: [
          {
            id: "cycle-ka-total-over",
            outcomeId: "cycle-ka-total-over",
            side: "over",
            label: "Over 2.5",
            tokenId: "token-cycle-ka-total-over",
            referenceTokenId: "token-cycle-ka-total-over",
            referenceOutcomeLabel: "Over 2.5 first half",
            isTradable: true,
          },
          {
            id: "cycle-ka-total-under",
            outcomeId: "cycle-ka-total-under",
            side: "under",
            label: "Under 2.5",
            tokenId: "token-cycle-ka-total-under",
            referenceTokenId: "token-cycle-ka-total-under",
            referenceOutcomeLabel: "Under 2.5 first half",
            isTradable: true,
          },
        ],
      },
      liquidity: "1000",
      orderbookDepth: [],
      propCategory: null,
    },
    {
      id: "cycle-ka-team-total-15-2h",
      title: "Backend Home team total second-half 1.5",
      description: null,
      status: "OPEN",
      referenceSource: "polymarket",
      externalSlug: "cycle-ka-team-total-15-2h",
      externalMarketId: "gamma-cycle-ka-team-total-15-2h",
      conditionId: "condition-cycle-ka-team-total-15-2h",
      outcomes: [
        {
          id: "cycle-ka-team-over",
          name: "Backend Home over 1.5",
          label: "Backend Home over 1.5",
          side: "over",
          referenceTokenId: "token-cycle-ka-team-over",
          referenceOutcomeLabel: "Backend Home over 1.5 second half",
          price: 0.59,
          bestBid: 0.57,
          bestAsk: 0.61,
          isTradable: true,
        },
      ],
      event: null,
      rulesText: null,
      marketGroupKey: "team-totals",
      marketGroupId: "team-totals",
      marketGroupTitle: "Team Totals",
      marketType: "team_total_goals",
      period: "second-half",
      line: "1.5",
      selection: {
        selectorKey: "team-totals:second-half:1.5",
        marketId: "cycle-ka-team-total-15-2h",
        marketGroupKey: "team-totals",
        marketGroupId: "team-totals",
        marketGroupTitle: "Team Totals",
        marketType: "team_total_goals",
        marketFamily: "team_total",
        displayLabel: "Team Totals second-half 1.5",
        period: "second-half",
        line: "1.5",
        lineValue: 1.5,
        unit: "goals",
        outcomes: [{
          id: "cycle-ka-team-over",
          outcomeId: "cycle-ka-team-over",
          side: "over",
          label: "Backend Home over 1.5",
          tokenId: "token-cycle-ka-team-over",
          referenceTokenId: "token-cycle-ka-team-over",
          referenceOutcomeLabel: "Backend Home over 1.5 second half",
          isTradable: true,
        }],
      },
      liquidity: "1000",
      orderbookDepth: [],
      propCategory: null,
    },
  ],
};

const event = normalizeEventDetail(detail);
expect(event, "event detail should normalize");

const totalsMarket = event!.markets.find((market) => market.id === "cycle-ka-total-25-1h") as Market | undefined;
const totalsOutcome = totalsMarket?.outcomes.find((outcome) => outcome.id === "cycle-ka-total-over") as Outcome | undefined;
expect(totalsMarket?.selection?.selectorKey === "totals:first-half:2.5", "totals selector key should survive mobile normalization");
expect(totalsMarket!.marketType === "totals", "total_goals should normalize to totals");
expect(totalsMarket!.selection?.outcomes?.[0]?.referenceTokenId === "token-cycle-ka-total-over", "selection outcome token should survive mobile normalization");

const ticketSelection = ticketSelectionFromBackendMarket(
  { marketType: "totals", line: "2.5", period: "1st Half", displayLabel: "Over 2.5 1H" },
  totalsMarket,
  totalsOutcome,
);
expect(ticketSelection?.marketId === "cycle-ka-total-25-1h", "ticket selection should use backend market id");
expect(ticketSelection?.period === "first-half", "ticket selection should use backend period");
expect(ticketSelection?.referenceTokenId === "token-cycle-ka-total-over", "ticket selection should use backend token");

const resolved = resolveLineTicketTarget({
  selection: ticketSelection,
  backendMarket: totalsMarket,
  backendOutcome: totalsOutcome,
  syntheticOutcome: totalsOutcome,
  syntheticMarkets: { totals: totalsMarket },
});
expect(resolved?.source === "backend-line-market", "line ticket should resolve to backend market");

const teamTotalMarket = event!.markets.find((market) => market.id === "cycle-ka-team-total-15-2h");
expect(teamTotalMarket?.marketType === "team-total", "team_total_goals should normalize to team-total");
expect(teamTotalMarket?.selection?.marketFamily === "team_total", "team-total market family should survive normalization");

const summary = {
  cycle: "Cycle KA",
  generatedAt: new Date().toISOString(),
  status: "pass",
  checks: {
    backendRouteShapeIncludesSelection: true,
    mobileAdapterPreservesSelection: true,
    totalGoalsMapsToTotalsTicket: true,
    teamTotalGoalsMapsToTeamTotalTicket: true,
    lineTicketResolvesToBackendMarket: true,
    providerIdentityPreserved: {
      externalMarketId: ticketSelection?.externalMarketId,
      conditionId: ticketSelection?.conditionId,
      referenceTokenId: ticketSelection?.referenceTokenId,
      referenceOutcomeLabel: ticketSelection?.referenceOutcomeLabel,
    },
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
