import { prisma } from "@/lib/db";
import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildDraftImportPlanFromCandidates,
  buildImportCandidateFromPersistedCandidate,
  buildWorldCupDiscoveryReport,
  executePolymarketImportRollback,
  listDraftImportReadyDiscoveryCandidates,
  markDiscoveryCandidateImported,
  persistWorldCupDiscoveryReport,
  validateImportedPolymarketMappingsFromDb,
} from "@/server/services/polymarket";
import { upsertPolymarketReferenceMarket } from "@/server/services/polymarketReferenceImport";

async function main() {
  assertQueueE2EAllowed();

  const actor = await prisma.user.upsert({
    where: { username: "wc-candidate-queue-e2e-admin" },
    update: { isAdmin: true },
    create: {
      username: "wc-candidate-queue-e2e-admin",
      email: "wc-candidate-queue-e2e-admin@poly.local",
      isAdmin: true,
    },
  });
  const batchId = `wc-candidate-queue-e2e-${Date.now()}`;
  const discovery = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets,
    source: "fixture",
    fixtureMode: true,
    liveSmoke: false,
    now: "2026-06-28T00:00:00.000Z",
  });
  const persisted = await persistWorldCupDiscoveryReport(discovery, { batchId });

  const persistedRows = await prisma.polymarketDiscoveryCandidate.findMany({
    where: { batchId },
    orderBy: [{ createdAt: "asc" }],
  });
  const eligibleRows = persistedRows.filter((row) => {
    const candidate = buildImportCandidateFromPersistedCandidate(row);
    return candidate?.reasons.length === 0;
  });
  if (eligibleRows.length === 0) {
    throw new Error("Candidate queue E2E found no eligible rows to mark import-ready.");
  }

  await prisma.polymarketDiscoveryCandidate.updateMany({
    where: { id: { in: eligibleRows.map((row) => row.id) } },
    data: {
      status: "draft_import_ready",
      reviewedBy: actor.id,
      reviewedAt: new Date(),
      reviewNotes: "Candidate queue E2E marked import-ready.",
    },
  });

  const queueRows = await listDraftImportReadyDiscoveryCandidates({ batchId });
  const candidateRowIds = new Map<string, string>();
  const importCandidates = queueRows.flatMap((row) => {
    const candidate = buildImportCandidateFromPersistedCandidate(row);
    if (!candidate) return [];
    candidateRowIds.set(candidate.candidateId, row.id);
    return [candidate];
  });
  const importPlan = buildDraftImportPlanFromCandidates(importCandidates);
  const imported = [];
  for (const planned of importPlan.planned) {
    const result = await upsertPolymarketReferenceMarket(planned.request, actor.id);
    const candidateRowId = candidateRowIds.get(planned.candidate.candidateId);
    if (!candidateRowId) throw new Error(`Missing persisted row for ${planned.candidate.candidateId}`);
    await markDiscoveryCandidateImported({
      candidateId: candidateRowId,
      eventId: result.eventId,
      marketId: result.marketId,
      outcomeIds: result.outcomeIds,
    });
    imported.push(result);
  }

  const validation = await validateImportedPolymarketMappingsFromDb({ batchId, confirmUpdate: true });
  if (validation.validatedCount !== imported.length) {
    throw new Error(`Expected ${imported.length} imported mappings to validate; got ${validation.validatedCount}.`);
  }

  const rollbackDryRun = await executePolymarketImportRollback({ selector: { batchId } });
  if (!rollbackDryRun.dryRun || rollbackDryRun.candidateCount !== imported.length || rollbackDryRun.mutatedCount !== 0) {
    throw new Error("Rollback dry-run did not produce the expected scoped non-mutating plan.");
  }

  const publicLeakCount = await prisma.market.count({
    where: {
      id: { in: imported.map((item) => item.marketId) },
      OR: [{ visibility: "PUBLIC" }, { isListed: true }],
    },
  });
  if (publicLeakCount !== 0) {
    throw new Error("Imported draft candidate queue markets leaked into public listing.");
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: "fixture",
    batchId,
    persisted,
    markedImportReadyCount: eligibleRows.length,
    importedCount: imported.length,
    validation,
    rollbackDryRun: {
      dryRun: rollbackDryRun.dryRun,
      candidateCount: rollbackDryRun.candidateCount,
      mutatedCount: rollbackDryRun.mutatedCount,
      plannedMarketIds: rollbackDryRun.plannedMarketIds,
    },
    publicLeakCount,
    realMoneyMode: process.env.REAL_MONEY_MODE,
    externalOrdersCreated: false,
  };
  console.log(JSON.stringify(output, null, 2));
}

function assertQueueE2EAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Candidate queue E2E is disabled in production.");
  }
  if (process.env.REAL_MONEY_MODE !== "false") {
    throw new Error("Candidate queue E2E requires REAL_MONEY_MODE=false.");
  }
  if (process.env.POLYMARKET_CANDIDATE_QUEUE_E2E !== "true") {
    throw new Error("Candidate queue E2E requires POLYMARKET_CANDIDATE_QUEUE_E2E=true.");
  }
  if (!isLocalDatabaseUrl(process.env.DATABASE_URL)) {
    throw new Error("Candidate queue E2E requires a local/test DATABASE_URL.");
  }
}

function isLocalDatabaseUrl(value: string | undefined) {
  return Boolean(value && /localhost|127\.0\.0\.1|\[::1\]/i.test(value));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
