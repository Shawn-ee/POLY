import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  buildDraftImportPlanFromCandidates,
  buildImportCandidateFromPersistedCandidate,
  listDraftImportReadyDiscoveryCandidates,
  markDiscoveryCandidateImported,
} from "@/server/services/polymarket";
import { upsertPolymarketReferenceMarket } from "@/server/services/polymarketReferenceImport";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

const DEFAULT_INPUT = path.resolve(process.cwd(), "test-logs", "polymarket-world-cup-discovery-candidates.json");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-draft-import-report.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input ?? DEFAULT_INPUT;
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const confirmDraftImport = argFlag(args.confirmDraftImport, envFlag("POLYMARKET_AUTO_IMPORT_ENABLED", false));
  const fromDb = argFlag(args.fromDb, false);
  const { candidates, candidateRowIds } = fromDb
    ? await loadCandidatesFromQueue(args)
    : await loadCandidatesFromFile(inputPath);
  const plan = buildDraftImportPlanFromCandidates(candidates);

  const result: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    inputPath: fromDb ? null : inputPath,
    fromDb,
    batchId: args.batchId ?? null,
    dryRun: !confirmDraftImport,
    autoImportEnabled: confirmDraftImport,
    autoPromoteEnabled: false,
    candidateCount: candidates.length,
    plannedImportCount: plan.planned.length,
    skippedDuplicateCount: plan.skippedDuplicates.length,
    skippedDuplicates: plan.skippedDuplicates,
    plannedDraftImports: plan.planned.map(({ candidate, request, duplicateKeys }) => ({
      candidateId: candidate.candidateId,
      externalMarketId: request.market.externalMarketId,
      conditionId: request.market.conditionId,
      externalSlug: request.market.externalSlug,
      duplicateKeys,
      eventTitle: request.event?.title ?? null,
      marketTitle: request.market.title,
      visibility: request.market.visibility,
      desiredStatus: request.market.desiredStatus,
      outcomeCount: request.market.outcomes.length,
      outcomeTokenIds: request.market.outcomes.map((outcome) => outcome.referenceTokenId),
      safety: {
        isListed: false,
        outcomesTradable: false,
        mmEnabled: false,
        tradable: false,
      },
    })),
  };

  if (confirmDraftImport) {
    const actorUserId = await getAdminUserId();
    const imported = [];
    for (const { candidate, request } of plan.planned) {
      const importResult = await upsertPolymarketReferenceMarket(request, actorUserId);
      imported.push(importResult);
      const candidateRowId = candidateRowIds.get(candidate.candidateId);
      if (fromDb && candidateRowId) {
        await markDiscoveryCandidateImported({
          candidateId: candidateRowId,
          eventId: importResult.eventId,
          marketId: importResult.marketId,
          outcomeIds: importResult.outcomeIds,
        });
      }
    }
    result.imported = imported;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, outputPath }, null, 2)}\n`);
}

async function loadCandidatesFromFile(inputPath: string) {
  const report = JSON.parse(await readFile(inputPath, "utf8")) as { candidates?: PolymarketImportCandidate[] };
  const candidates = Array.isArray(report.candidates) ? report.candidates : [];
  return { candidates, candidateRowIds: new Map<string, string>() };
}

async function loadCandidatesFromQueue(args: Record<string, string>) {
  const rows = await listDraftImportReadyDiscoveryCandidates({
    source: args.source,
    batchId: args.batchId,
    limit: Number(args.limit ?? "100"),
  });
  const candidateRowIds = new Map<string, string>();
  const candidates: PolymarketImportCandidate[] = [];
  for (const row of rows) {
    const candidate = buildImportCandidateFromPersistedCandidate(row);
    if (!candidate) continue;
    candidateRowIds.set(candidate.candidateId, row.id);
    candidates.push(candidate);
  }
  return { candidates, candidateRowIds };
}

async function getAdminUserId() {
  const admin = await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
  if (!admin) {
    throw new Error("No admin user found for draft import actor.");
  }
  return admin.id;
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
