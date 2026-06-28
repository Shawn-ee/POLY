import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import { PolymarketDiscoveryClient, buildWorldCupDiscoveryReport, persistWorldCupDiscoveryReport } from "@/server/services/polymarket";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-world-cup-discovery-candidates.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtureMode = envFlag("POLYMARKET_DISCOVERY_FIXTURE_MODE", true);
  const liveSmoke = envFlag("POLYMARKET_DISCOVERY_LIVE_SMOKE", false);
  const skipDb = argFlag(args.skipDb, envFlag("POLYMARKET_DISCOVERY_SKIP_DB", fixtureMode));
  const persistCandidates = argFlag(args.persistCandidates, envFlag("POLYMARKET_DISCOVERY_PERSIST_CANDIDATES", false));
  const outputPath = args.output ?? DEFAULT_OUTPUT;

  if (!fixtureMode && !liveSmoke) {
    throw new Error("Live discovery is disabled. Set POLYMARKET_DISCOVERY_FIXTURE_MODE=true or POLYMARKET_DISCOVERY_LIVE_SMOKE=true.");
  }
  if (persistCandidates && skipDb) {
    throw new Error("Persisted discovery candidates require POLYMARKET_DISCOVERY_SKIP_DB=false.");
  }
  const existingDuplicateKeys = skipDb ? new Set<string>() : await loadExistingDuplicateKeys();

  const rawMarkets = fixtureMode ? readFixtureMarkets() : await readLiveMarkets(Number(args.limit ?? "25"));
  const report = buildWorldCupDiscoveryReport({
    rawMarkets,
    source: fixtureMode ? "fixture" : "polymarket",
    fixtureMode,
    liveSmoke,
    existingDuplicateKeys,
  });
  const persisted = persistCandidates
    ? await persistWorldCupDiscoveryReport(report, { batchId: args.batchId })
    : null;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ ...report, persisted }, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...report, persisted, outputPath }, null, 2)}\n`);
}

function readFixtureMarkets(): PolymarketGammaWire[] {
  return Array.isArray(fixture.markets)
    ? fixture.markets.filter((entry): entry is PolymarketGammaWire => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)))
    : [];
}

async function readLiveMarkets(limit: number): Promise<PolymarketGammaWire[]> {
  const client = new PolymarketDiscoveryClient();
  const candidates = await client.discoverWorldCupMarkets({ limit: Number.isFinite(limit) && limit > 0 ? limit : 25 });
  return candidates.map((candidate) =>
    candidate.raw && typeof candidate.raw === "object" && !Array.isArray(candidate.raw)
      ? (candidate.raw as PolymarketGammaWire)
      : ({ id: candidate.externalMarketId, question: candidate.title } satisfies PolymarketGammaWire),
  );
}

async function loadExistingDuplicateKeys() {
  const markets = await prisma.market.findMany({
    where: { referenceSource: "polymarket" },
    select: {
      conditionId: true,
      externalMarketId: true,
      externalSlug: true,
      slug: true,
      title: true,
      event: { select: { slug: true, externalEventId: true, externalSlug: true } },
      outcomes: { select: { referenceTokenId: true } },
    },
  });
  return new Set(
    markets
      .flatMap((market) => [
        market.conditionId,
        market.externalMarketId,
        market.externalSlug,
        market.slug,
        market.title,
        market.event?.slug,
        market.event?.externalEventId,
        market.event?.externalSlug,
        ...market.outcomes.map((outcome) => outcome.referenceTokenId),
      ])
      .filter((value): value is string => Boolean(value)),
  );
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const [key, inlineValue] = part.slice(2).split("=", 2);
    if (inlineValue != null) {
      args[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function argFlag(value: string | undefined, fallback: boolean) {
  if (value == null || value.trim() === "") return fallback;
  return value.trim().toLowerCase() === "true";
}

function envFlag(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value == null || value.trim() === "") return fallback;
  return value.trim().toLowerCase() === "true";
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
