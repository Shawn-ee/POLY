import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { GET as liveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";
import { loadEventDetailForCard } from "../mobile/src/services/eventDetailHydrationService";
import { selectEventDetailPrimaryMarket, selectEventDetailRegulationMarket } from "../mobile/src/services/eventDetailMarketProfileService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KY-event-detail-mixed-profile-contract/cycle-KY-event-detail-mixed-profile-contract.json";

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

const createMixedEvent = async (suffix: string) =>
  prisma.event.create({
    data: {
      slug: `mobile-ky-live-mixed-${suffix}`,
      title: `KY Mixed Home vs Away ${suffix}`,
      description: "Knockout match with advance market and separate regulation 90-minute winner.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "live",
      liveStatus: "in_progress",
      startTime: new Date(),
      homeTeamName: "Mixed Home",
      awayTeamName: "Mixed Away",
      markets: {
        create: [
          {
            slug: `mobile-ky-regulation-winner-${suffix}`,
            title: "KY Regulation Time Winner",
            description: "KY regulation 90 minute winner.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "moneyline",
            marketGroupKey: "regulation_90",
            marketGroupTitle: "Regulation Time Winner",
            period: "regulation",
            displayOrder: 0,
            isListed: true,
            outcomes: {
              create: [
                { name: "Mixed Home", label: "Mixed Home", side: "home", code: "HOME", slug: `mobile-ky-reg-home-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "Tie", label: "Tie", side: "draw", code: "DRAW", slug: `mobile-ky-reg-draw-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
                { name: "Mixed Away", label: "Mixed Away", side: "away", code: "AWAY", slug: `mobile-ky-reg-away-${suffix}`, displayOrder: 2, isActive: true, isTradable: true },
              ],
            },
          },
          {
            slug: `mobile-ky-who-advances-${suffix}`,
            title: "KY Who Advances",
            description: "KY advance market.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "to_advance",
            marketGroupKey: "to_advance",
            marketGroupTitle: "Who Advances",
            displayOrder: 1,
            isListed: true,
            outcomes: {
              create: [
                { name: "Mixed Home", label: "Mixed Home", side: "home", code: "HOME", slug: `mobile-ky-advance-home-${suffix}`, displayOrder: 0, isActive: true, isTradable: true },
                { name: "Mixed Away", label: "Mixed Away", side: "away", code: "AWAY", slug: `mobile-ky-advance-away-${suffix}`, displayOrder: 1, isActive: true, isTradable: true },
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
  const seededEvent = await createMixedEvent(suffix);

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
  const summaryEvent = summaryBody.events[0];
  const normalizedSummary = normalizeEventSummary(summaryEvent, summaryEvent.markets ?? []);

  const detailKeys: string[] = [];
  const hydrated = await loadEventDetailForCard({
    getEvent: async (key) => {
      detailKeys.push(key);
      const detail = await callLiveDetail(key);
      assert(detail.status === 200, `Expected hydrated detail status 200 for ${key}, received ${detail.status}.`);
      return detail.body;
    },
  }, normalizedSummary);

  assert(hydrated, "Expected hydrated mixed Event Detail.");
  const primaryMarket = selectEventDetailPrimaryMarket(hydrated, hydrated.markets);
  const regulationMarket = selectEventDetailRegulationMarket(hydrated, hydrated.markets);
  assert(primaryMarket, "Expected selected primary market.");
  assert(regulationMarket, "Expected selected regulation Game Lines market.");
  assert(primaryMarket.marketType === "to_advance", `Expected primary market to be to_advance, received ${primaryMarket.marketType}.`);
  assert(regulationMarket.marketType === "moneyline", `Expected regulation market to be moneyline, received ${regulationMarket.marketType}.`);
  const regulationSides = regulationMarket.outcomes.map((outcome) => outcome.side);
  assert(regulationSides.includes("draw"), "Expected regulation Game Lines market to include draw.");
  assert(primaryMarket.outcomes.length === 2, "Expected primary advance market to have two outcomes.");
  assert(!primaryMarket.outcomes.map((outcome) => outcome.side).includes("draw"), "Expected primary advance market to have no draw.");
  assert(hydrated.marketProfile === "full_match_with_overtime", `Expected full_match_with_overtime, received ${hydrated.marketProfile}.`);
  assert(hydrated.resultMode === "can_draw", `Expected can_draw for separate regulation market, received ${hydrated.resultMode}.`);
  assert(hydrated.supportedMarketTypes?.includes("to_advance"), "Expected supportedMarketTypes to include to_advance.");
  assert(hydrated.supportedMarketTypes?.includes("regulation_90"), "Expected supportedMarketTypes to include regulation_90.");

  const summary = {
    pass: true,
    cycle: "Cycle KY",
    createdAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    seeded: {
      eventId: seededEvent.id,
      slug: seededEvent.slug,
    },
    summaryRoute: {
      query: Object.fromEntries(query.entries()),
      slug: summaryEvent.slug,
      normalizedBackendSlug: normalizedSummary.backendSlug,
    },
    detailRoute: {
      requestedKeys: detailKeys,
    },
    hydratedDetail: {
      marketProfile: hydrated.marketProfile,
      resultMode: hydrated.resultMode,
      gameRules: hydrated.gameRules,
      supportedMarketTypes: hydrated.supportedMarketTypes,
      routeMarketOrder: hydrated.markets.map((market) => ({ id: market.id, marketType: market.marketType, group: market.marketGroupId, outcomes: market.outcomes.map((outcome) => outcome.side) })),
      selectedPrimaryMarket: { id: primaryMarket.id, marketType: primaryMarket.marketType, outcomeSides: primaryMarket.outcomes.map((outcome) => outcome.side) },
      selectedRegulationMarket: { id: regulationMarket.id, marketType: regulationMarket.marketType, outcomeSides: regulationSides },
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
