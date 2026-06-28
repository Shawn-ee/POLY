import { Prisma } from "@prisma/client";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";
import { WorldCupDiscoveryIgnoredMarket, WorldCupDiscoveryReport } from "@/server/services/polymarket/discoveryReport";
import { prisma } from "@/lib/db";

export const POLYMARKET_DISCOVERY_CANDIDATE_STATUSES = [
  "discovered",
  "ignored",
  "draft_import_ready",
  "imported_draft",
  "mapping_validated",
  "admin_review_required",
  "rejected",
  "promoted",
  "rollback_disabled",
  "blocked",
] as const;

export type PolymarketDiscoveryCandidateStatus = (typeof POLYMARKET_DISCOVERY_CANDIDATE_STATUSES)[number];

export type DiscoveryCandidatePersistenceInput = {
  source: string;
  externalSlug: string | null;
  externalMarketId: string | null;
  conditionId: string | null;
  title: string;
  question: string | null;
  eventTitle: string | null;
  marketType: string | null;
  status: PolymarketDiscoveryCandidateStatus;
  confidence: string | null;
  reasonCodes: Prisma.InputJsonValue;
  outcomes: Prisma.InputJsonValue;
  tokenIds: Prisma.InputJsonValue;
  rawMetadata: Prisma.InputJsonValue;
  batchId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type DiscoveryCandidatePersistenceResult = {
  batchId: string;
  createdCount: number;
  updatedCount: number;
  ignoredCount: number;
  candidateIds: string[];
};

export type DiscoveryCandidateListParams = {
  source?: string | null;
  status?: string | null;
  batchId?: string | null;
  page?: number;
  pageSize?: number;
};

export type DiscoveryCandidateStatusAction =
  | "approve"
  | "mark_import_ready"
  | "ignore"
  | "reject"
  | "block"
  | "mark_review_required";

type CandidateStoreDb = {
  polymarketDiscoveryCandidate: {
    count?: (args: unknown) => Promise<number>;
    findMany?: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<{ id: string; status: string; firstSeenAt: Date } | null>;
    findUnique?: (args: unknown) => Promise<unknown | null>;
    create: (args: unknown) => Promise<{ id: string }>;
    update: (args: unknown) => Promise<{ id: string }>;
  };
};

export function buildDiscoveryBatchId(now = new Date()) {
  return `wc-discovery-${now.toISOString().replace(/[:.]/g, "-")}`;
}

export function buildCandidatePersistenceInput(
  candidate: PolymarketImportCandidate,
  params: { batchId: string; now?: Date },
): DiscoveryCandidatePersistenceInput {
  const now = params.now ?? new Date();
  return {
    source: candidate.source,
    externalSlug: candidate.market.slug,
    externalMarketId: candidate.market.externalMarketId,
    conditionId: candidate.market.conditionId,
    title: candidate.market.title,
    question: candidate.market.title,
    eventTitle: candidate.event?.title ?? null,
    marketType: candidate.market.marketType,
    status: statusForCandidate(candidate),
    confidence: candidate.confidence,
    reasonCodes: toJsonArray(candidate.reasons),
    outcomes: toJsonValue(candidate.market.outcomes.map((outcome) => ({
      externalOutcomeId: outcome.externalOutcomeId,
      tokenId: outcome.tokenId,
      name: outcome.name,
      price: outcome.price,
      displayOrder: outcome.displayOrder,
    }))),
    tokenIds: toJsonArray(candidate.market.outcomes.map((outcome) => outcome.tokenId).filter(Boolean)),
    rawMetadata: toJsonValue({
      candidateId: candidate.candidateId,
      duplicateKey: candidate.duplicateKey,
      duplicateKeys: candidate.duplicateKeys,
      market: candidate.market.raw,
      event: candidate.event?.raw ?? null,
    }),
    batchId: params.batchId,
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

export function buildIgnoredCandidatePersistenceInput(
  ignored: WorldCupDiscoveryIgnoredMarket,
  params: { batchId: string; now?: Date; source?: string },
): DiscoveryCandidatePersistenceInput {
  const now = params.now ?? new Date();
  return {
    source: params.source ?? "polymarket",
    externalSlug: ignored.slug,
    externalMarketId: ignored.externalMarketId,
    conditionId: null,
    title: ignored.title ?? ignored.slug ?? ignored.externalMarketId ?? "Ignored Polymarket market",
    question: ignored.title,
    eventTitle: null,
    marketType: null,
    status: "ignored",
    confidence: "low",
    reasonCodes: toJsonArray(ignored.reasons),
    outcomes: toJsonArray([]),
    tokenIds: toJsonArray([]),
    rawMetadata: toJsonValue({ ignored }),
    batchId: params.batchId,
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

export async function persistWorldCupDiscoveryReport(
  report: WorldCupDiscoveryReport,
  params: {
    batchId?: string;
    now?: Date;
    db?: CandidateStoreDb;
  } = {},
): Promise<DiscoveryCandidatePersistenceResult> {
  const now = params.now ?? new Date();
  const batchId = params.batchId ?? buildDiscoveryBatchId(now);
  const inputs = [
    ...report.candidates.map((candidate) => buildCandidatePersistenceInput(candidate, { batchId, now })),
    ...report.ignored.map((ignored) => buildIgnoredCandidatePersistenceInput(ignored, { batchId, now, source: report.source === "fixture" ? "polymarket" : report.source })),
  ];
  return persistDiscoveryCandidateInputs(inputs, { batchId, db: params.db });
}

export async function persistDiscoveryCandidateInputs(
  inputs: DiscoveryCandidatePersistenceInput[],
  params: { batchId: string; db?: CandidateStoreDb },
): Promise<DiscoveryCandidatePersistenceResult> {
  const db = params.db ?? prisma;
  let createdCount = 0;
  let updatedCount = 0;
  const candidateIds: string[] = [];

  for (const input of inputs) {
    const existing = await db.polymarketDiscoveryCandidate.findFirst({
      where: duplicateWhere(input),
      select: { id: true, status: true, firstSeenAt: true },
    });
    if (existing) {
      const updated = await db.polymarketDiscoveryCandidate.update({
        where: { id: existing.id },
        data: {
          ...persistenceData(input),
          status: existing.status,
          firstSeenAt: existing.firstSeenAt,
          lastSeenAt: input.lastSeenAt,
        },
      });
      candidateIds.push(updated.id);
      updatedCount += 1;
    } else {
      const created = await db.polymarketDiscoveryCandidate.create({
        data: persistenceData(input),
      });
      candidateIds.push(created.id);
      createdCount += 1;
    }
  }

  return {
    batchId: params.batchId,
    createdCount,
    updatedCount,
    ignoredCount: inputs.filter((input) => input.status === "ignored").length,
    candidateIds,
  };
}

export async function listDiscoveryCandidates(params: DiscoveryCandidateListParams = {}) {
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
  const where = buildCandidateFilter(params);
  const [total, rows] = await Promise.all([
    prisma.polymarketDiscoveryCandidate.count({ where }),
    prisma.polymarketDiscoveryCandidate.findMany({
      where,
      orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(serializeDiscoveryCandidate),
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getDiscoveryCandidate(id: string) {
  const candidate = await prisma.polymarketDiscoveryCandidate.findUnique({ where: { id } });
  return candidate ? serializeDiscoveryCandidate(candidate) : null;
}

export async function updateDiscoveryCandidateReviewStatus(params: {
  id: string;
  action: DiscoveryCandidateStatusAction;
  reason?: string | null;
  reviewedBy: string;
}) {
  const status = statusForAction(params.action);
  const candidate = await prisma.polymarketDiscoveryCandidate.update({
    where: { id: params.id },
    data: {
      status,
      reviewNotes: params.reason?.trim() || null,
      reviewedBy: params.reviewedBy,
      reviewedAt: new Date(),
    },
  });
  return serializeDiscoveryCandidate(candidate);
}

function statusForCandidate(candidate: PolymarketImportCandidate): PolymarketDiscoveryCandidateStatus {
  if (candidate.reasons.includes("unsupported_market_type") || candidate.reasons.includes("not_world_cup_soccer")) {
    return "ignored";
  }
  if (candidate.reasons.includes("missing_token_mapping") || candidate.reasons.includes("inactive_or_closed")) {
    return "blocked";
  }
  if (candidate.reasons.includes("tbd_team") || candidate.status === "needs_review") {
    return "admin_review_required";
  }
  return "discovered";
}

export function isDiscoveryCandidateStatus(value: string): value is PolymarketDiscoveryCandidateStatus {
  return POLYMARKET_DISCOVERY_CANDIDATE_STATUSES.includes(value as PolymarketDiscoveryCandidateStatus);
}

export function isDiscoveryCandidateStatusAction(value: string): value is DiscoveryCandidateStatusAction {
  return ["approve", "mark_import_ready", "ignore", "reject", "block", "mark_review_required"].includes(value);
}

function statusForAction(action: DiscoveryCandidateStatusAction): PolymarketDiscoveryCandidateStatus {
  switch (action) {
    case "approve":
    case "mark_import_ready":
      return "draft_import_ready";
    case "ignore":
      return "ignored";
    case "reject":
      return "rejected";
    case "block":
      return "blocked";
    case "mark_review_required":
      return "admin_review_required";
  }
}

function buildCandidateFilter(params: DiscoveryCandidateListParams): Prisma.PolymarketDiscoveryCandidateWhereInput {
  return {
    ...(params.source ? { source: params.source } : {}),
    ...(params.status && isDiscoveryCandidateStatus(params.status) ? { status: params.status } : {}),
    ...(params.batchId ? { batchId: params.batchId } : {}),
  };
}

function serializeDiscoveryCandidate(candidate: Prisma.PolymarketDiscoveryCandidateGetPayload<Record<string, never>>) {
  return {
    id: candidate.id,
    source: candidate.source,
    externalSlug: candidate.externalSlug,
    externalMarketId: candidate.externalMarketId,
    conditionId: candidate.conditionId,
    title: candidate.title,
    question: candidate.question,
    eventTitle: candidate.eventTitle,
    marketType: candidate.marketType,
    status: candidate.status,
    confidence: candidate.confidence,
    reasonCodes: candidate.reasonCodes,
    outcomes: candidate.outcomes,
    tokenIds: candidate.tokenIds,
    rawMetadata: candidate.rawMetadata,
    batchId: candidate.batchId,
    importedEventId: candidate.importedEventId,
    importedMarketId: candidate.importedMarketId,
    importedOutcomeIds: candidate.importedOutcomeIds,
    reviewedBy: candidate.reviewedBy,
    reviewedAt: candidate.reviewedAt?.toISOString() ?? null,
    reviewNotes: candidate.reviewNotes,
    firstSeenAt: candidate.firstSeenAt.toISOString(),
    lastSeenAt: candidate.lastSeenAt.toISOString(),
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
  };
}

function duplicateWhere(input: DiscoveryCandidatePersistenceInput) {
  const OR: Prisma.PolymarketDiscoveryCandidateWhereInput[] = [];
  if (input.externalMarketId) {
    OR.push({ externalMarketId: input.externalMarketId });
  }
  if (input.conditionId) {
    OR.push({ conditionId: input.conditionId });
  }
  if (input.externalSlug) {
    OR.push({ externalSlug: input.externalSlug });
  }

  return {
    source: input.source,
    ...(OR.length > 0 ? { OR } : { title: input.title }),
  };
}

function persistenceData(input: DiscoveryCandidatePersistenceInput) {
  return {
    source: input.source,
    externalSlug: input.externalSlug,
    externalMarketId: input.externalMarketId,
    conditionId: input.conditionId,
    title: input.title,
    question: input.question,
    eventTitle: input.eventTitle,
    marketType: input.marketType,
    status: input.status,
    confidence: input.confidence,
    reasonCodes: input.reasonCodes,
    outcomes: input.outcomes,
    tokenIds: input.tokenIds,
    rawMetadata: input.rawMetadata,
    batchId: input.batchId,
    firstSeenAt: input.firstSeenAt,
    lastSeenAt: input.lastSeenAt,
  };
}

function toJsonArray(values: unknown[]): Prisma.InputJsonValue {
  return toJsonValue(values) ?? [];
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
