import { MarketStatus, MarketVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import { buildWorldCupDiscoveryReport } from "@/server/services/polymarket/discoveryReport";
import { buildDraftImportPlanFromCandidates } from "@/server/services/polymarket/draftImport";
import { evaluatePromotionGuardrails } from "@/server/services/polymarket/promotionGuardrails";
import { applyDbBackedLifecyclePromotion } from "@/server/services/polymarket/lifecyclePromotion";
import {
  buildReferenceSnapshotInputsForMarket,
  readFixtureGammaMarketFromMetadata,
} from "@/server/services/polymarketReferenceSnapshots";
import { upsertPolymarketReferenceMarket } from "@/server/services/polymarketReferenceImport";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";
import { runReferenceMarketMakerOnce } from "@/server/services/referenceMarketMaker";

type E2ERow = {
  candidateId: string;
  externalMarketId: string;
  marketId: string | null;
  imported: boolean;
  guardrailEligible: boolean;
  promoted: boolean;
  promotionSkippedReason: string | null;
  referenceSnapshots: number;
  botQuoteConfigCreated: boolean;
  visibility: string | null;
  isListed: boolean | null;
  status: string | null;
  tradableOutcomes: number | null;
  reasonCodes: string[];
};

async function main() {
  assertLocalDbE2EAllowed();

  const actor = await prisma.user.upsert({
    where: { username: "wc-db-e2e-admin" },
    update: { isAdmin: true },
    create: {
      username: "wc-db-e2e-admin",
      email: "wc-db-e2e-admin@poly.local",
      isAdmin: true,
    },
  });

  const report = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets,
    source: "fixture",
    fixtureMode: true,
    liveSmoke: false,
    now: "2026-06-28T00:00:00.000Z",
  });
  const importPlan = buildDraftImportPlanFromCandidates(report.candidates);

  const rows: E2ERow[] = [];
  for (const planned of importPlan.planned) {
    const candidate = planned.candidate;
    const guardrails = evaluatePromotionGuardrails(candidate);
    const imported = await upsertPolymarketReferenceMarket(planned.request, actor.id);
    const market = await prisma.market.findUnique({
      where: { id: imported.marketId },
      include: {
        outcomes: {
          where: { isActive: true },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!market) {
      throw new Error(`Imported market ${imported.marketId} was not found.`);
    }

    assertDraftSafety(market);
    const gamma = readFixtureGammaMarketFromMetadata(market.referenceMetadata);
    let referenceSnapshots = 0;
    let botQuoteConfigCreated = false;
    let promoted = false;
    let promotionSkippedReason: string | null = null;

    if (gamma && guardrails.eligible) {
      const inputs = buildReferenceSnapshotInputsForMarket(
        {
          id: market.id,
          title: market.title,
          externalSlug: market.externalSlug,
          externalMarketId: market.externalMarketId,
          conditionId: market.conditionId,
          referenceMetadata: market.referenceMetadata,
          outcomes: market.outcomes.map((outcome) => ({
            id: outcome.id,
            name: outcome.name,
            referenceTokenId: outcome.referenceTokenId,
            referenceOutcomeLabel: outcome.referenceOutcomeLabel,
          })),
        },
        gamma,
        new Date().toISOString(),
      );
      await upsertReferenceQuoteSnapshots(inputs);
      referenceSnapshots = inputs.length;

      await upsertDryRunBotQuoteConfig(market.id);
      botQuoteConfigCreated = true;
    }

    const promotion = await applyDbBackedLifecyclePromotion({
      candidate,
      actorUserId: actor.id,
    });
    promoted = promotion.applied === true;
    promotionSkippedReason = promotion.skippedReason;

    const after = await prisma.market.findUnique({
      where: { id: market.id },
      include: { outcomes: true },
    });
    if (!after) {
      throw new Error(`Market ${market.id} disappeared after promotion step.`);
    }
    if (guardrails.eligible) {
      assertEligiblePromotion(after);
    } else {
      assertInvalidRemainsDraft(after);
    }

    rows.push({
      candidateId: candidate.candidateId,
      externalMarketId: candidate.market.externalMarketId,
      marketId: market.id,
      imported: true,
      guardrailEligible: guardrails.eligible,
      promoted,
      promotionSkippedReason,
      referenceSnapshots,
      botQuoteConfigCreated,
      visibility: after.visibility,
      isListed: after.isListed,
      status: after.status,
      tradableOutcomes: after.outcomes.filter((outcome) => outcome.isTradable).length,
      reasonCodes: guardrails.reasonCodes,
    });
  }

  const beforeIntentCount = await prisma.botOrderIntent.count();
  const mm = await runReferenceMarketMakerOnce({ dryRun: true });
  const afterIntentCount = await prisma.botOrderIntent.count();
  const createdIntents = afterIntentCount - beforeIntentCount;

  const eligibleImported = rows.filter((row) => row.guardrailEligible);
  const invalidImported = rows.filter((row) => !row.guardrailEligible);
  if (eligibleImported.length === 0) {
    throw new Error("No eligible fixture market was imported.");
  }
  if (eligibleImported.some((row) => !row.promoted || row.visibility !== "PUBLIC" || row.isListed !== true)) {
    throw new Error("At least one eligible imported market was not promoted to enabled/public-listed.");
  }
  if (invalidImported.some((row) => row.promoted || row.visibility !== "PRIVATE" || row.isListed !== false)) {
    throw new Error("At least one ineligible imported market leaked or was promoted.");
  }
  if (createdIntents <= 0 || mm.intentsCreated <= 0) {
    throw new Error("Reference market maker dry-run did not create BotOrderIntent rows for promoted imported markets.");
  }

  const publicListed = await prisma.market.count({
    where: {
      referenceSource: "polymarket",
      visibility: "PUBLIC",
      isListed: true,
      externalMarketId: { in: eligibleImported.map((row) => row.externalMarketId) },
    },
  });
  const draftLeaked = await prisma.market.count({
    where: {
      referenceSource: "polymarket",
      visibility: "PUBLIC",
      isListed: true,
      externalMarketId: { in: invalidImported.map((row) => row.externalMarketId) },
    },
  });
  if (publicListed !== eligibleImported.length) {
    throw new Error("Enabled imported markets are missing from the public-listed query.");
  }
  if (draftLeaked !== 0) {
    throw new Error("Draft or blocked imported markets leaked into the public-listed query.");
  }

  const output = {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    liveOrdersEnabled: false,
    source: "fixture",
    candidateCount: report.candidateCount,
    importedCount: rows.length,
    eligiblePromotedCount: eligibleImported.length,
    invalidDraftCount: invalidImported.length,
    referenceSnapshotCount: rows.reduce((sum, row) => sum + row.referenceSnapshots, 0),
    mmIntentsCreated: createdIntents,
    publicListed,
    draftLeaked,
    rows,
  };
  console.log(JSON.stringify(output, null, 2));
}

function assertLocalDbE2EAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("World Cup DB E2E is disabled in production.");
  }
  if (process.env.REAL_MONEY_MODE !== "false") {
    throw new Error("World Cup DB E2E requires REAL_MONEY_MODE=false.");
  }
  if (process.env.POLYMARKET_DB_E2E !== "true") {
    throw new Error("World Cup DB E2E requires POLYMARKET_DB_E2E=true.");
  }
  if (!isLocalDatabaseUrl(process.env.DATABASE_URL)) {
    throw new Error("World Cup DB E2E requires a local DATABASE_URL.");
  }
}

function isLocalDatabaseUrl(value: string | undefined) {
  return Boolean(value && /localhost|127\.0\.0\.1|\[::1\]/i.test(value));
}

function assertDraftSafety(market: {
  id: string;
  visibility: MarketVisibility;
  isListed: boolean;
  status: MarketStatus;
  outcomes: Array<{ isTradable: boolean }>;
}) {
  if (market.visibility !== "PRIVATE" || market.isListed !== false || market.outcomes.some((outcome) => outcome.isTradable)) {
    throw new Error(`Imported market ${market.id} is not draft-hidden-disabled before promotion.`);
  }
}

function assertEligiblePromotion(market: {
  id: string;
  visibility: MarketVisibility;
  isListed: boolean;
  status: MarketStatus;
  outcomes: Array<{ isTradable: boolean }>;
}) {
  if (market.visibility !== "PUBLIC" || market.isListed !== true || market.status !== "LIVE") {
    throw new Error(`Eligible market ${market.id} was not enabled correctly.`);
  }
  if (market.outcomes.some((outcome) => outcome.isTradable)) {
    throw new Error(`Eligible market ${market.id} enabled public listing but outcomes became tradable too early.`);
  }
}

function assertInvalidRemainsDraft(market: {
  id: string;
  visibility: MarketVisibility;
  isListed: boolean;
  outcomes: Array<{ isTradable: boolean }>;
}) {
  if (market.visibility !== "PRIVATE" || market.isListed !== false || market.outcomes.some((outcome) => outcome.isTradable)) {
    throw new Error(`Ineligible market ${market.id} did not remain private/unlisted/non-tradable.`);
  }
}

async function upsertDryRunBotQuoteConfig(marketId: string) {
  const existing = await prisma.botQuoteConfig.findFirst({
    where: {
      marketId,
      outcomeId: null,
      source: "polymarket",
      dryRun: true,
    },
    select: { id: true },
  });
  const data = {
    enabled: true,
    dryRun: true,
    source: "polymarket",
    edgeTicks: 2,
    tickSize: new Prisma.Decimal("0.01"),
    baseOrderSize: new Prisma.Decimal("1"),
    maxOrderSize: new Prisma.Decimal("1"),
    maxOutcomeExposure: new Prisma.Decimal("10"),
    maxMarketExposure: new Prisma.Decimal("25"),
    maxDailyNotional: new Prisma.Decimal("50"),
    staleAfterSeconds: 60,
    minQuoteLifetimeSeconds: 1,
  };
  if (existing) {
    await prisma.botQuoteConfig.update({
      where: { id: existing.id },
      data,
    });
    return;
  }
  await prisma.botQuoteConfig.create({
    data: {
      marketId,
      outcomeId: null,
      ...data,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
