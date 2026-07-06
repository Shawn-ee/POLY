import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { GET as liveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";
import { loadEventDetailForCard } from "../mobile/src/services/eventDetailHydrationService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KW-event-detail-hydration-contract/cycle-KW-event-detail-hydration-contract.json";

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
      slug: `mobile-kw-live-regulation-${suffix}`,
      title: `KW Regulation Mexico vs Ecuador ${suffix}`,
      description: "Regulation market can settle as draw.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "live",
      liveStatus: "in_progress",
      startTime: new Date(),
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      markets: {
        create: [{
          slug: `mobile-kw-regulation-winner-${suffix}`,
          title: "KW Regulation Time Winner",
          description: "KW regulation 90 minute winner.",
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
              {
                name: "Mexico",
                label: "Mexico",
                side: "home",
                code: "MEX",
                slug: `mobile-kw-mexico-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Tie",
                label: "Tie",
                side: "draw",
                code: "DRAW",
                slug: `mobile-kw-draw-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Ecuador",
                label: "Ecuador",
                side: "away",
                code: "ECU",
                slug: `mobile-kw-ecuador-${suffix}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
              },
            ],
          },
        }],
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
  const summaryEvent = summaryBody.events[0];
  assert(summaryEvent.id === seededEvent.id, "Expected route summary to expose database event id.");
  assert(summaryEvent.slug === seededEvent.slug, "Expected route summary to expose backend event slug.");

  const normalizedSummary = normalizeEventSummary(summaryEvent, summaryEvent.markets ?? []);
  assert(normalizedSummary.id === seededEvent.slug, "Expected mobile normalized event id to remain slug-compatible.");
  assert(normalizedSummary.backendSlug === seededEvent.slug, "Expected mobile normalized event to preserve backend slug.");

  const slugDetail = await callLiveDetail(seededEvent.slug);
  assert(slugDetail.status === 200, `Expected slug live-detail status 200, received ${slugDetail.status}.`);
  const idDetail = await callLiveDetail(seededEvent.id);
  assert(idDetail.status === 404, "Expected database id live-detail lookup to fail because route is slug-addressed.");

  const detailKeys: string[] = [];
  const hydrated = await loadEventDetailForCard({
    getEvent: async (key) => {
      detailKeys.push(key);
      const detail = await callLiveDetail(key);
      assert(detail.status === 200, `Expected hydrated detail status 200 for ${key}, received ${detail.status}.`);
      return detail.body;
    },
  }, normalizedSummary);

  assert(hydrated, "Expected hydrated Event Detail.");
  assert(detailKeys[0] === seededEvent.slug, "Expected mobile Event Detail hydration to request backend slug.");
  assert(hydrated.marketProfile === "regulation_90", `Expected regulation_90 profile, received ${hydrated.marketProfile}.`);
  assert(hydrated.resultMode === "can_draw", `Expected can_draw result mode, received ${hydrated.resultMode}.`);
  assert(hydrated.gameRules?.allowDraw === true, "Expected hydrated detail to preserve allowDraw=true.");
  assert(hydrated.supportedMarketTypes?.includes("regulation_90"), "Expected hydrated detail to support regulation_90.");
  assert(hydrated.markets[0]?.outcomes.some((outcome) => outcome.side === "draw"), "Expected hydrated detail to include draw outcome.");

  const summary = {
    pass: true,
    cycle: "Cycle KW",
    createdAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    seeded: {
      eventId: seededEvent.id,
      slug: seededEvent.slug,
    },
    summaryRoute: {
      query: Object.fromEntries(query.entries()),
      eventId: summaryEvent.id,
      slug: summaryEvent.slug,
      normalizedId: normalizedSummary.id,
      normalizedBackendSlug: normalizedSummary.backendSlug,
    },
    detailRoute: {
      slugStatus: slugDetail.status,
      idStatus: idDetail.status,
      requestedKeys: detailKeys,
    },
    hydratedDetail: {
      id: hydrated.id,
      backendSlug: hydrated.backendSlug,
      marketProfile: hydrated.marketProfile,
      resultMode: hydrated.resultMode,
      gameRules: hydrated.gameRules,
      supportedMarketTypes: hydrated.supportedMarketTypes,
      outcomeSides: hydrated.markets.flatMap((market) => market.outcomes.map((outcome) => outcome.side)),
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
