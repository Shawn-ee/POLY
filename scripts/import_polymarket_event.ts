import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug, importPolymarketGroupedEvent } from "@/server/services/polymarketEventImport";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.eventSlug) {
    throw new Error("--eventSlug is required.");
  }

  const event = await fetchPolymarketEventBySlug(options.eventSlug);
  const rawOutputPath = path.resolve(process.cwd(), "test-logs", "polymarket-worldcup-winner-full-event.json");
  await mkdir(path.dirname(rawOutputPath), { recursive: true });
  await writeFile(rawOutputPath, `${JSON.stringify(event, null, 2)}\n`, "utf8");

  const actorUserId = options.dryRun ? "dry-run" : await getAdminUserId();
  const result = await importPolymarketGroupedEvent(options.eventSlug, {
    dryRun: options.dryRun,
    confirmImport: options.confirmImport,
    actorUserId,
    maxMarkets: options.maxMarkets,
  });

  console.log(
    JSON.stringify(
      {
        event: {
          title: event.title,
          slug: event.eventSlug,
          localEventSlug: result.localEventSlug,
          marketCount: event.markets.length,
          filteredImportCount: result.groupedMarketCount,
          negativeRiskLike: event.negativeRiskLike,
        },
        result,
        rawOutputPath,
      },
      null,
      2,
    ),
  );
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    args.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    eventSlug: stringArg(args.get("eventSlug")),
    dryRun: boolArg(args.get("dryRun"), true),
    confirmImport: boolArg(args.get("confirmImport"), false),
    maxMarkets: intArg(args.get("maxMarkets")),
  };
}

async function getAdminUserId() {
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("No local admin user found.");
  }
  return admin.id;
}

function boolArg(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value.trim().toLowerCase() === "true";
}

function stringArg(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function intArg(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
