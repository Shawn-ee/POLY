import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { GET as liveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";
import { loadEventDetailForCard } from "../mobile/src/services/eventDetailHydrationService";
import { canRenderEventDetailLineFamily, selectEventDetailPrimaryMarket, selectEventDetailRegulationMarket } from "../mobile/src/services/eventDetailMarketProfileService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KZ-event-detail-market-availability-contract/cycle-KZ-event-detail-market-availability-contract.json";

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
      slug: `mobile-kz-live-availability-${suffix}`,
      title: `KZ Availability Home vs Away ${suffix}`,
      description: "Backend provides only advance and regulation winner markets.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "live",
      liveStatus: "in_progress",
      startTime: new Date(),
      homeTeamName: "Availability Home",
      awayTeamName: "Availability Away",
      markets: {
        create: [
          {
            slug: `mobile-kz-who-advances-${suffix}`,
            title: "KZ Who Advances",
            description: "KZ advance market.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "to_advance",
            marketGroupKey: "to_advance",
            marketGroupTitle: "Who Advances",
            displayOrder: 0,
            isListed: true,
            outcomes: {
              create: [
                { name: "Availability Home", label: "Availability Home", side: "home", code: "HOME", slug: `mobile-kz-advance-home-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "Availability Away", label: "Availability Away", side: "away", code: "AWAY", slug: `mobile-kz-advance-away-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
              ],
            },
          },
          {
            slug: `mobile-kz-regulation-winner-${suffix}`,
            title: "KZ Regulation Time Winner",
            description: "KZ regulation 90 minute winner.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "moneyline",
            marketGroupKey: "regulation_90",
            marketGroupTitle: "Regulation Time Winner",
            period: "regulation",
            displayOrder: 1,
            isListed: true,
            outcomes: {
              create: [
                { name: "Availability Home", label: "Availability Home", side: "home", code: "HOME", slug: `mobile-kz-reg-home-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "Tie", label: "Tie", side: "draw", code: "DRAW", slug: `mobile-kz-reg-draw-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
                { name: "Availability Away", label: "Availability Away", side: "away", code: "AWAY", slug: `mobile-kz-reg-away-${suffix}`, displayOrder: 2, isActive: true, isTradable: true },
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
  const primaryMarket = selectEventDetailPrimaryMarket(hydrated, hydrated.markets);
  const regulationMarket = selectEventDetailRegulationMarket(hydrated, hydrated.markets);
  const spreadMarket = hydrated.markets.find((market) => market.marketType === "spread");
  const totalsMarket = hydrated.markets.find((market) => market.marketType === "totals");
  const teamTotalMarket = hydrated.markets.find((market) => market.marketType === "team-total");
  const firstHalfMarket = hydrated.markets.find((market) => market.period === "first-half");
  const secondHalfMarket = hydrated.markets.find((market) => market.period === "second-half");

  const visibility = {
    spread: canRenderEventDetailLineFamily(hydrated, spreadMarket),
    totals: canRenderEventDetailLineFamily(hydrated, totalsMarket),
    teamTotal: canRenderEventDetailLineFamily(hydrated, teamTotalMarket),
    firstHalf: canRenderEventDetailLineFamily(hydrated, firstHalfMarket),
    secondHalf: canRenderEventDetailLineFamily(hydrated, secondHalfMarket),
  };

  assert(primaryMarket?.marketType === "to_advance", "Expected primary advance market.");
  assert(regulationMarket?.outcomes.some((outcome) => outcome.side === "draw"), "Expected regulation market with draw outcome.");
  assert(visibility.spread === false, "Expected route-backed Event Detail to hide unsupported Spread.");
  assert(visibility.totals === false, "Expected route-backed Event Detail to hide unsupported Totals.");
  assert(visibility.teamTotal === false, "Expected route-backed Event Detail to hide unsupported Team Total.");
  assert(visibility.firstHalf === false, "Expected route-backed Event Detail to hide unsupported First Half.");
  assert(visibility.secondHalf === false, "Expected route-backed Event Detail to hide unsupported Second Half.");

  const summary = {
    pass: true,
    cycle: "Cycle KZ",
    createdAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    seeded: { eventId: seededEvent.id, slug: seededEvent.slug },
    hydratedDetail: {
      marketProfile: hydrated.marketProfile,
      resultMode: hydrated.resultMode,
      supportedMarketTypes: hydrated.supportedMarketTypes,
      backendSlug: hydrated.backendSlug,
      routeMarkets: hydrated.markets.map((market) => ({ id: market.id, marketType: market.marketType, period: market.period, outcomeSides: market.outcomes.map((outcome) => outcome.side) })),
      selectedPrimaryMarket: primaryMarket ? { id: primaryMarket.id, marketType: primaryMarket.marketType } : null,
      selectedRegulationMarket: regulationMarket ? { id: regulationMarket.id, outcomeSides: regulationMarket.outcomes.map((outcome) => outcome.side) } : null,
      unsupportedLineFamilyVisibility: visibility,
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
