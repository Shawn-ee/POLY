import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { GET as liveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";
import { loadEventDetailForCard } from "../mobile/src/services/eventDetailHydrationService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KX-event-detail-advance-contract/cycle-KX-event-detail-advance-contract.json";

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

const createAdvanceEvent = async (suffix: string) =>
  prisma.event.create({
    data: {
      slug: `mobile-kx-live-advance-${suffix}`,
      title: `KX Advance Home vs Away ${suffix}`,
      description: "One team advances; no draw outcome.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "live",
      liveStatus: "in_progress",
      startTime: new Date(),
      homeTeamName: "Advance Home",
      awayTeamName: "Advance Away",
      markets: {
        create: [{
          slug: `mobile-kx-who-advances-${suffix}`,
          title: "KX Who Advances",
          description: "KX advance-only market.",
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
              {
                name: "Advance Home",
                label: "Advance Home",
                side: "home",
                code: "HOME",
                slug: `mobile-kx-advance-home-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Advance Away",
                label: "Advance Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-kx-advance-away-${suffix}`,
                displayOrder: 1,
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
  const seededEvent = await createAdvanceEvent(suffix);

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
  assert(summaryEvent.slug === seededEvent.slug, "Expected route summary to expose backend event slug.");

  const normalizedSummary = normalizeEventSummary(summaryEvent, summaryEvent.markets ?? []);
  assert(normalizedSummary.backendSlug === seededEvent.slug, "Expected mobile summary to preserve backend slug.");

  const slugDetail = await callLiveDetail(seededEvent.slug);
  assert(slugDetail.status === 200, `Expected slug live-detail status 200, received ${slugDetail.status}.`);

  const detailKeys: string[] = [];
  const hydrated = await loadEventDetailForCard({
    getEvent: async (key) => {
      detailKeys.push(key);
      const detail = await callLiveDetail(key);
      assert(detail.status === 200, `Expected hydrated detail status 200 for ${key}, received ${detail.status}.`);
      return detail.body;
    },
  }, normalizedSummary);

  assert(hydrated, "Expected hydrated advance Event Detail.");
  assert(detailKeys[0] === seededEvent.slug, "Expected mobile Event Detail hydration to request backend slug.");
  assert(hydrated.marketProfile === "to_advance", `Expected to_advance profile, received ${hydrated.marketProfile}.`);
  assert(hydrated.resultMode === "no_draw", `Expected no_draw result mode, received ${hydrated.resultMode}.`);
  assert(hydrated.gameRules?.allowDraw === false, "Expected advance detail to preserve allowDraw=false.");
  assert(hydrated.gameRules?.includesOvertime === true, "Expected advance detail to preserve includesOvertime=true.");
  assert(hydrated.supportedMarketTypes?.includes("to_advance"), "Expected hydrated detail to support to_advance.");
  const outcomeSides = hydrated.markets.flatMap((market) => market.outcomes.map((outcome) => outcome.side));
  assert(!outcomeSides.includes("draw"), "Expected advance profile to have no draw outcome.");
  assert(outcomeSides.length === 2, `Expected exactly two advance outcomes, received ${outcomeSides.length}.`);

  const summary = {
    pass: true,
    cycle: "Cycle KX",
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
      requestedKeys: detailKeys,
    },
    hydratedDetail: {
      id: hydrated.id,
      backendSlug: hydrated.backendSlug,
      marketProfile: hydrated.marketProfile,
      resultMode: hydrated.resultMode,
      gameRules: hydrated.gameRules,
      supportedMarketTypes: hydrated.supportedMarketTypes,
      outcomeSides,
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
