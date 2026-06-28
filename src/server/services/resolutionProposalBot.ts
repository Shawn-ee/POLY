import { CanonicalEventStream, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const SUPPORTED_PROPOSAL_TYPES = new Set(["match_winner_1x2", "total_goals", "both_teams_to_score"]);
const FINAL_STATUSES = new Set(["final", "finished", "complete", "completed", "closed"]);

export type ResolutionProposalRisk = "low_risk" | "needs_review" | "conflict";
export type ResolutionProposalAction = "resolve" | "push" | "unsupported" | "needs_review";

export type ResolutionProposalOutcome = {
  id: string;
  name: string;
  code?: string | null;
  side?: string | null;
  metadata?: unknown;
  resolvedResult?: string | null;
};

export type ResolutionProposalMarket = {
  id: string;
  title: string;
  marketType: string;
  line?: number | null;
  resolvedOutcomeId?: string | null;
  settlementStatus?: string | null;
  outcomes: ResolutionProposalOutcome[];
  event?: {
    id: string;
    title: string;
    homeTeamName?: string | null;
    awayTeamName?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    status?: string | null;
    liveStatus?: string | null;
    source?: string | null;
    sourceUpdatedAt?: string | Date | null;
  } | null;
};

export type ResolutionProposal = {
  marketId: string;
  marketTitle: string;
  marketType: string;
  eventId?: string | null;
  eventTitle?: string | null;
  action: ResolutionProposalAction;
  risk: ResolutionProposalRisk;
  resultCode?: string | null;
  proposedOutcomeId?: string | null;
  proposedOutcomeName?: string | null;
  evidence: {
    homeTeamName?: string | null;
    awayTeamName?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    status?: string | null;
    liveStatus?: string | null;
    source?: string | null;
    sourceUpdatedAt?: string | Date | null;
  };
  reasons: string[];
};

export type ResolutionProposalBotResult = {
  generatedAt: string;
  proposalCount: number;
  storedCount: number;
  proposals: ResolutionProposal[];
};

export function buildResolutionProposal(market: ResolutionProposalMarket): ResolutionProposal {
  const base = baseProposal(market);
  if (!SUPPORTED_PROPOSAL_TYPES.has(market.marketType)) {
    return {
      ...base,
      action: "unsupported",
      risk: "needs_review",
      reasons: [`unsupported_market_type:${market.marketType}`],
    };
  }

  const event = market.event;
  if (event?.homeScore == null || event.awayScore == null) {
    return {
      ...base,
      action: "needs_review",
      risk: "needs_review",
      reasons: ["missing_final_score"],
    };
  }

  const finalStatus = isFinalStatus(event.status) || isFinalStatus(event.liveStatus);
  const result = deriveResultCode(market, event.homeScore, event.awayScore);
  if (result.action === "unsupported" || !result.resultCode) {
    return {
      ...base,
      action: "needs_review",
      risk: "needs_review",
      reasons: [result.reason ?? "unable_to_derive_result"],
    };
  }

  const outcome = result.action === "push" ? null : findOutcomeForResult(market.outcomes, result.resultCode);
  const reasons = [...(finalStatus ? [] : ["event_not_marked_final"])];
  if (result.action === "resolve" && !outcome) {
    return {
      ...base,
      action: "needs_review",
      risk: "conflict",
      resultCode: result.resultCode,
      reasons: [...reasons, "no_matching_outcome"],
    };
  }
  if (market.resolvedOutcomeId && outcome && market.resolvedOutcomeId !== outcome.id) {
    return {
      ...base,
      action: "needs_review",
      risk: "conflict",
      resultCode: result.resultCode,
      proposedOutcomeId: outcome.id,
      proposedOutcomeName: outcome.name,
      reasons: [...reasons, "market_already_resolved_to_different_outcome"],
    };
  }

  return {
    ...base,
    action: result.action,
    risk: reasons.length === 0 ? "low_risk" : "needs_review",
    resultCode: result.resultCode,
    proposedOutcomeId: outcome?.id ?? null,
    proposedOutcomeName: outcome?.name ?? null,
    reasons,
  };
}

export async function generateResolutionProposalsOnce(options: { store?: boolean } = {}): Promise<ResolutionProposalBotResult> {
  const markets = await prisma.market.findMany({
    where: {
      marketType: { in: Array.from(SUPPORTED_PROPOSAL_TYPES) },
      status: { notIn: ["RESOLVED", "CANCELED"] },
      event: { isNot: null },
    },
    include: {
      event: true,
      outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });
  const proposals = markets.map((market) => buildResolutionProposal({
    id: market.id,
    title: market.title,
    marketType: market.marketType,
    line: decimalToNumber(market.line),
    resolvedOutcomeId: market.resolvedOutcomeId,
    settlementStatus: market.settlementStatus,
    outcomes: market.outcomes.map((outcome) => ({
      id: outcome.id,
      name: outcome.name,
      code: outcome.code,
      side: outcome.side,
      metadata: outcome.metadata,
      resolvedResult: outcome.resolvedResult,
    })),
    event: market.event ? {
      id: market.event.id,
      title: market.event.title,
      homeTeamName: market.event.homeTeamName,
      awayTeamName: market.event.awayTeamName,
      homeScore: market.event.homeScore,
      awayScore: market.event.awayScore,
      status: market.event.status,
      liveStatus: market.event.liveStatus,
      source: market.event.source,
      sourceUpdatedAt: market.event.sourceUpdatedAt,
    } : null,
  }));

  let storedCount = 0;
  if (options.store !== false && proposals.length > 0) {
    const existingKeys = await loadExistingProposalKeys(proposals.map((proposal) => proposal.marketId));
    const newProposals = proposals.filter((proposal) => {
      const key = proposalKey(proposal);
      return key == null || !existingKeys.has(key);
    });
    if (newProposals.length > 0) {
      await prisma.canonicalEvent.createMany({
        data: newProposals.map((proposal) => ({
          stream: CanonicalEventStream.MARKET,
          topicKey: `market:${proposal.marketId}`,
          eventType: "resolution_proposal",
          marketId: proposal.marketId,
          outcomeId: proposal.proposedOutcomeId ?? null,
          userId: null,
          payload: proposal as unknown as Prisma.InputJsonValue,
        })),
      });
    }
    storedCount = newProposals.length;
  }

  return {
    generatedAt: new Date().toISOString(),
    proposalCount: proposals.length,
    storedCount,
    proposals,
  };
}

export async function listResolutionProposals(limit = 50) {
  return prisma.canonicalEvent.findMany({
    where: { eventType: "resolution_proposal" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      marketId: true,
      outcomeId: true,
      payload: true,
      createdAt: true,
    },
  });
}

async function loadExistingProposalKeys(marketIds: string[]) {
  if (marketIds.length === 0) return new Set<string>();
  const rows = await prisma.canonicalEvent.findMany({
    where: { eventType: "resolution_proposal", marketId: { in: Array.from(new Set(marketIds)) } },
    select: { payload: true },
    take: 1000,
    orderBy: { createdAt: "desc" },
  });
  return new Set(rows.map((row) => proposalKey(row.payload)).filter((key): key is string => key != null));
}

function proposalKey(value: unknown) {
  const object = asObject(value);
  const reasons = Array.isArray(object.reasons) ? object.reasons.map((reason) => `${reason}`).sort().join(",") : "";
  const keyParts = [
    object.marketId,
    object.action,
    object.resultCode,
    object.proposedOutcomeId,
    reasons,
  ];
  if (!keyParts[0]) return null;
  return keyParts.map((part) => `${part ?? ""}`).join("|");
}

function baseProposal(market: ResolutionProposalMarket): ResolutionProposal {
  return {
    marketId: market.id,
    marketTitle: market.title,
    marketType: market.marketType,
    eventId: market.event?.id ?? null,
    eventTitle: market.event?.title ?? null,
    action: "needs_review",
    risk: "needs_review",
    resultCode: null,
    proposedOutcomeId: null,
    proposedOutcomeName: null,
    evidence: {
      homeTeamName: market.event?.homeTeamName ?? null,
      awayTeamName: market.event?.awayTeamName ?? null,
      homeScore: market.event?.homeScore ?? null,
      awayScore: market.event?.awayScore ?? null,
      status: market.event?.status ?? null,
      liveStatus: market.event?.liveStatus ?? null,
      source: market.event?.source ?? null,
      sourceUpdatedAt: market.event?.sourceUpdatedAt ?? null,
    },
    reasons: [],
  };
}

function deriveResultCode(market: ResolutionProposalMarket, homeScore: number, awayScore: number) {
  if (market.marketType === "match_winner_1x2") {
    if (homeScore > awayScore) return { action: "resolve" as const, resultCode: "home_win" };
    if (awayScore > homeScore) return { action: "resolve" as const, resultCode: "away_win" };
    return { action: "resolve" as const, resultCode: "draw" };
  }
  if (market.marketType === "both_teams_to_score") {
    return { action: "resolve" as const, resultCode: homeScore > 0 && awayScore > 0 ? "yes" : "no" };
  }
  if (market.marketType === "total_goals") {
    if (market.line == null || !Number.isFinite(market.line)) {
      return { action: "unsupported" as const, resultCode: null, reason: "missing_total_goals_line" };
    }
    const totalGoals = homeScore + awayScore;
    if (totalGoals > market.line) return { action: "resolve" as const, resultCode: "over" };
    if (totalGoals < market.line) return { action: "resolve" as const, resultCode: "under" };
    return { action: "push" as const, resultCode: "push" };
  }
  return { action: "unsupported" as const, resultCode: null, reason: "unsupported_market_type" };
}

function findOutcomeForResult(outcomes: ResolutionProposalOutcome[], resultCode: string) {
  const normalizedResult = normalize(resultCode);
  return outcomes.find((outcome) => {
    const metadata = asObject(outcome.metadata);
    const candidates = [
      outcome.code,
      outcome.side,
      outcome.name,
      metadata.result,
      metadata.outcome,
      metadata.side,
    ];
    return candidates.some((candidate) => normalize(candidate) === normalizedResult);
  }) ?? null;
}

function isFinalStatus(status: string | null | undefined) {
  return status ? FINAL_STATUSES.has(status.toLowerCase()) : false;
}

function normalize(value: unknown) {
  return `${value ?? ""}`.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}
