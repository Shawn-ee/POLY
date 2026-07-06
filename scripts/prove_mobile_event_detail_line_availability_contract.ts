import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { GET as liveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";
import { loadEventDetailForCard } from "../mobile/src/services/eventDetailHydrationService";
import { resolveLineSelectionAvailability } from "../mobile/src/services/eventDetailLineAvailabilityService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-LB-event-detail-line-availability-contract/cycle-LB-event-detail-line-availability-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const createEvent = async (suffix: string) =>
  prisma.event.create({
    data: {
      slug: `mobile-lb-line-availability-${suffix}`,
      title: `LB Line Availability Home vs Away ${suffix}`,
      description: "Backend provides non-default line markets so mobile must not use static line defaults.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "live",
      liveStatus: "in_progress",
      startTime: new Date(),
      homeTeamName: "Line Home",
      awayTeamName: "Line Away",
      markets: {
        create: [
          {
            slug: `mobile-lb-spread-35-2h-${suffix}`,
            title: "LB Spread second-half 3.5",
            description: "Only backend spread line.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            period: "second-half",
            line: "-3.5",
            displayOrder: 0,
            isListed: true,
            outcomes: {
              create: [
                { name: "Line Home -3.5", label: "Line Home -3.5", side: "yes", code: "YES", slug: `mobile-lb-spread-yes-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "No Line Home -3.5", label: "No Line Home -3.5", side: "no", code: "NO", slug: `mobile-lb-spread-no-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
              ],
            },
          },
          {
            slug: `mobile-lb-totals-45-1h-${suffix}`,
            title: "LB Totals first-half 4.5",
            description: "Only backend totals line.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "totals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            period: "first-half",
            line: "4.5",
            displayOrder: 1,
            isListed: true,
            outcomes: {
              create: [
                { name: "Over 4.5 1H", label: "Over 4.5 1H", side: "over", code: "OVER", slug: `mobile-lb-total-over-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "Under 4.5 1H", label: "Under 4.5 1H", side: "under", code: "UNDER", slug: `mobile-lb-total-under-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
              ],
            },
          },
          {
            slug: `mobile-lb-team-total-25-2h-${suffix}`,
            title: "LB Team total second-half 2.5",
            description: "Only backend team-total line.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "team-total",
            marketGroupKey: "team-total",
            marketGroupTitle: "Team Total",
            period: "second-half",
            line: "2.5",
            displayOrder: 2,
            isListed: true,
            outcomes: {
              create: [
                { name: "Line Home Over 2.5 2H", label: "Line Home Over 2.5 2H", side: "over", code: "OVER", slug: `mobile-lb-team-over-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "Line Home Under 2.5 2H", label: "Line Home Under 2.5 2H", side: "under", code: "UNDER", slug: `mobile-lb-team-under-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
              ],
            },
          },
        ],
      },
    },
  });

const callLiveDetail = async (slug: string) => {
  const response = await liveDetail(new Request("http://localhost/api/mobile/events/x/live-detail"), {
    params: Promise.resolve({ slug }),
  });
  const body = await response.json();
  return { status: response.status, body };
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const seededEvent = await createEvent(suffix);
  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    statusGroup: "live",
    limit: "1",
  });
  const summaryResponse = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(summaryResponse.status === 200, `Expected summary route status 200, received ${summaryResponse.status}.`);
  const summaryBody = await summaryResponse.json();
  assert(summaryBody.events.length === 1, `Expected one summary event, received ${summaryBody.events.length}.`);
  const normalizedSummary = normalizeEventSummary(summaryBody.events[0], summaryBody.events[0].markets ?? []);

  const hydrated = await loadEventDetailForCard({
    getEvent: async (key) => {
      const detail = await callLiveDetail(key);
      assert(detail.status === 200, `Expected hydrated detail status 200 for ${key}, received ${detail.status}.`);
      return detail.body;
    },
  }, normalizedSummary);

  assert(hydrated, "Expected hydrated Event Detail.");
  assert(hydrated.backendSlug === seededEvent.slug, "Expected hydrated detail to be route-backed.");

  const spread = resolveLineSelectionAvailability({
    markets: hydrated.markets,
    family: "spread",
    selectedLine: "1.5",
    selectedPeriod: "Reg. Time",
    fallbackLineOptions: ["0.5", "1.5", "2.5"],
    fallbackPeriodOptions: ["Reg. Time", "1st Half", "2nd Half"],
    routeBacked: true,
  });
  const totals = resolveLineSelectionAvailability({
    markets: hydrated.markets,
    family: "totals",
    selectedLine: "2.5",
    selectedPeriod: "Reg. Time",
    fallbackLineOptions: ["1.5", "2.5", "3.5"],
    fallbackPeriodOptions: ["Reg. Time", "1st Half", "2nd Half"],
    routeBacked: true,
  });
  const teamTotal = resolveLineSelectionAvailability({
    markets: hydrated.markets,
    family: "team-total",
    selectedLine: "1.5",
    selectedPeriod: "Reg. Time",
    fallbackLineOptions: ["1.5"],
    fallbackPeriodOptions: ["Reg. Time"],
    routeBacked: true,
  });

  assert(spread.selectedLine === "3.5" && spread.selectedPeriod === "2nd Half", `Expected spread to use backend 3.5 2H, received ${spread.selectedLine} ${spread.selectedPeriod}.`);
  assert(totals.selectedLine === "4.5" && totals.selectedPeriod === "1st Half", `Expected totals to use backend 4.5 1H, received ${totals.selectedLine} ${totals.selectedPeriod}.`);
  assert(teamTotal.selectedLine === "2.5" && teamTotal.selectedPeriod === "2nd Half", `Expected team total to use backend 2.5 2H, received ${teamTotal.selectedLine} ${teamTotal.selectedPeriod}.`);

  const summary = {
    pass: true,
    cycle: "Cycle LB",
    createdAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    seeded: { eventId: seededEvent.id, slug: seededEvent.slug },
    hydratedDetail: {
      backendSlug: hydrated.backendSlug,
      routeMarkets: hydrated.markets.map((market) => ({ id: market.id, marketType: market.marketType, period: market.period, line: market.line })),
      lineAvailability: {
        spread,
        totals,
        teamTotal,
      },
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
