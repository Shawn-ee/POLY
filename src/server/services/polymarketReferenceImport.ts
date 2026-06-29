import { MarketStatus, MarketType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PolymarketImportOutcomeInput = {
  name: string;
  displayOrder?: number | null;
  isTradable?: boolean | null;
  referenceTokenId?: string | null;
  referenceOutcomeLabel?: string | null;
  referenceMetadata?: Prisma.InputJsonValue | null;
};

export type PolymarketImportEventInput = {
  title: string;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  sportKey?: string | null;
  leagueKey?: string | null;
  eventType?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  startTime?: string | null;
  liveStatus?: string | null;
  status?: string | null;
  source?: string | null;
  externalEventId?: string | null;
  externalSlug?: string | null;
  image?: string | null;
  icon?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export type PolymarketImportMarketInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  resolveTime?: string | null;
  type?: "BINARY" | "MULTI_WINNER";
  marketType?: string | null;
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  displayOrder?: number | null;
  line?: number | string | null;
  unit?: string | null;
  period?: string | null;
  participantType?: string | null;
  participantName?: string | null;
  propCategory?: string | null;
  desiredStatus?: "draft" | "paused" | "live";
  visibility?: "PUBLIC" | "PRIVATE";
  externalMarketId?: string | null;
  conditionId?: string | null;
  externalSlug?: string | null;
  referenceSource?: string | null;
  referenceMetadata?: Prisma.InputJsonValue | null;
  outcomes: PolymarketImportOutcomeInput[];
};

export type PolymarketImportRequest = {
  createEvents?: boolean;
  event?: PolymarketImportEventInput | null;
  market: PolymarketImportMarketInput;
};

export type PolymarketImportResult = {
  eventId: string | null;
  eventCreated: boolean;
  marketId: string;
  marketCreated: boolean;
  outcomeIds: string[];
};

type ReferenceReviewMetadata = {
  importedFrom: "polymarket";
  importStatus: "pending_review" | "approved" | "rejected";
  referenceOnly: boolean;
  tradable: boolean;
  mmEnabled: boolean;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
};

export async function upsertPolymarketReferenceMarket(
  input: PolymarketImportRequest,
  actorUserId: string,
): Promise<PolymarketImportResult> {
  const createEvents = input.createEvents !== false;
  const marketType = normalizeMarketType(input.market.type, input.market.outcomes.length);
  const desiredStatus = normalizeImportedMarketStatus(input.market.desiredStatus);

  return prisma.$transaction(async (tx) => {
    let eventId: string | null = null;
    let eventCreated = false;

    if (createEvents && input.event) {
      const event = await findExistingEvent(tx, input.event);
      if (event) {
        const updated = await tx.event.update({
          where: { id: event.id },
          data: {
            slug: input.event.slug ?? event.slug,
            title: input.event.title,
            description: input.event.description ?? null,
            category: input.event.category ?? null,
            sportKey: input.event.sportKey ?? null,
            leagueKey: input.event.leagueKey ?? null,
            eventType: input.event.eventType ?? null,
            homeTeamName: input.event.homeTeamName ?? null,
            awayTeamName: input.event.awayTeamName ?? null,
            startTime: parseOptionalDate(input.event.startTime),
            status: input.event.status ?? null,
            liveStatus: input.event.liveStatus ?? null,
            source: input.event.source ?? "polymarket",
            externalEventId: input.event.externalEventId ?? null,
            externalSlug: input.event.externalSlug ?? null,
            image: input.event.image ?? null,
            icon: input.event.icon ?? null,
            metadata: input.event.metadata ?? Prisma.JsonNull,
          },
        });
        eventId = updated.id;
      } else {
        const created = await tx.event.create({
          data: {
            slug: input.event.slug ?? null,
            title: input.event.title,
            description: input.event.description ?? null,
            category: input.event.category ?? null,
            sportKey: input.event.sportKey ?? null,
            leagueKey: input.event.leagueKey ?? null,
            eventType: input.event.eventType ?? null,
            homeTeamName: input.event.homeTeamName ?? null,
            awayTeamName: input.event.awayTeamName ?? null,
            startTime: parseOptionalDate(input.event.startTime),
            status: input.event.status ?? null,
            liveStatus: input.event.liveStatus ?? null,
            source: input.event.source ?? "polymarket",
            externalEventId: input.event.externalEventId ?? null,
            externalSlug: input.event.externalSlug ?? null,
            image: input.event.image ?? null,
            icon: input.event.icon ?? null,
            metadata: input.event.metadata ?? Prisma.JsonNull,
            createdBy: actorUserId,
          },
        });
        eventId = created.id;
        eventCreated = true;
      }
    }

    const existingMarket = await findExistingMarket(tx, input.market);
    const resolveTime = parseResolveTime(input.market.resolveTime);
    const mergedReferenceMetadata = buildImportedReferenceMetadata(
      existingMarket?.referenceMetadata ?? null,
      input.market.referenceMetadata,
    );

    const market =
      existingMarket
        ? await tx.market.update({
            where: { id: existingMarket.id },
            data: {
              title: input.market.title,
              description: input.market.description ?? existingMarket.description,
              categoryLegacy: input.market.category ?? existingMarket.categoryLegacy,
              type: marketType,
              marketType: input.market.marketType ?? existingMarket.marketType,
              marketGroupKey: input.market.marketGroupKey ?? existingMarket.marketGroupKey,
              marketGroupTitle: input.market.marketGroupTitle ?? existingMarket.marketGroupTitle,
              displayOrder: input.market.displayOrder ?? existingMarket.displayOrder,
              line: parseOptionalDecimal(input.market.line),
              unit: input.market.unit ?? existingMarket.unit,
              period: input.market.period ?? existingMarket.period,
              participantType: input.market.participantType ?? existingMarket.participantType,
              participantName: input.market.participantName ?? existingMarket.participantName,
              propCategory: input.market.propCategory ?? existingMarket.propCategory,
              status: desiredStatus,
              ...(input.market.visibility ? { visibility: input.market.visibility } : {}),
              ...(input.market.visibility === "PRIVATE" ? { isListed: false } : {}),
              resolveTime,
              eventId,
              externalMarketId: input.market.externalMarketId ?? null,
              conditionId: input.market.conditionId ?? null,
              referenceSource: input.market.referenceSource ?? "polymarket",
              externalSlug: input.market.externalSlug ?? null,
              referenceMetadata: mergedReferenceMetadata,
            },
          })
        : await tx.market.create({
            data: {
              slug: uniqueImportSlug(input.market.externalSlug, input.market.title),
              title: input.market.title,
              description: input.market.description ?? input.market.title,
              categoryLegacy: input.market.category ?? null,
              type: marketType,
              marketType: input.market.marketType ?? "generic",
              marketGroupKey: input.market.marketGroupKey ?? null,
              marketGroupTitle: input.market.marketGroupTitle ?? null,
              displayOrder: input.market.displayOrder ?? 0,
              line: parseOptionalDecimal(input.market.line),
              unit: input.market.unit ?? null,
              period: input.market.period ?? null,
              participantType: input.market.participantType ?? null,
              participantName: input.market.participantName ?? null,
              propCategory: input.market.propCategory ?? null,
              visibility: input.market.visibility ?? "PUBLIC",
              mechanism: "ORDERBOOK",
              status: desiredStatus,
              isListed: false,
              resolveTime,
              createdBy: actorUserId,
              eventId,
              externalMarketId: input.market.externalMarketId ?? null,
              conditionId: input.market.conditionId ?? null,
              referenceSource: input.market.referenceSource ?? "polymarket",
              externalSlug: input.market.externalSlug ?? null,
              referenceMetadata: mergedReferenceMetadata,
            },
          });

    const marketCreated = !existingMarket;
    const existingOutcomes = await tx.outcome.findMany({
      where: { marketId: market.id },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        referenceTokenId: true,
        referenceOutcomeLabel: true,
      },
    });

    const usedOutcomeIds = new Set<string>();
    const outcomeIds: string[] = [];
    for (const [index, outcomeInput] of input.market.outcomes.entries()) {
      const existingOutcome = findExistingOutcome(existingOutcomes, outcomeInput, usedOutcomeIds, marketType, index);
      const localName = normalizeLocalOutcomeName(outcomeInput.name, marketType);
      const outcomeSlug = buildImportedOutcomeSlug(market.slug, localName, outcomeInput.referenceTokenId, index);
      if (existingOutcome) {
        const updated = await tx.outcome.update({
          where: { id: existingOutcome.id },
          data: {
            name: existingOutcome.name,
            displayOrder: outcomeInput.displayOrder ?? index,
            isTradable: outcomeInput.isTradable ?? false,
            referenceTokenId: outcomeInput.referenceTokenId ?? null,
            referenceOutcomeLabel: outcomeInput.referenceOutcomeLabel ?? outcomeInput.name,
            referenceMetadata: outcomeInput.referenceMetadata ?? Prisma.JsonNull,
            slug: existingOutcome.slug ?? outcomeSlug,
          },
        });
        usedOutcomeIds.add(updated.id);
        outcomeIds.push(updated.id);
      } else {
        const created = await tx.outcome.create({
          data: {
            marketId: market.id,
            name: localName,
            slug: outcomeSlug,
            displayOrder: outcomeInput.displayOrder ?? index,
            isTradable: outcomeInput.isTradable ?? false,
            referenceTokenId: outcomeInput.referenceTokenId ?? null,
            referenceOutcomeLabel: outcomeInput.referenceOutcomeLabel ?? outcomeInput.name,
            referenceMetadata: outcomeInput.referenceMetadata ?? Prisma.JsonNull,
          },
        });
        usedOutcomeIds.add(created.id);
        outcomeIds.push(created.id);
      }
    }

    return {
      eventId,
      eventCreated,
      marketId: market.id,
      marketCreated,
      outcomeIds,
    };
  });
}

export function buildImportedReferenceMetadata(
  existing: Prisma.JsonValue | null | undefined,
  incoming: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue {
  const currentObject = asJsonObject(existing);
  const nextObject = asJsonObject(incoming);
  const currentReview = parseReferenceReview(currentObject);
  const incomingReview = parseReferenceReview(nextObject);

  return {
    ...currentObject,
    ...nextObject,
    importedFrom: "polymarket",
    importStatus: incomingReview.importStatus ?? currentReview.importStatus ?? "pending_review",
    referenceOnly: incomingReview.referenceOnly ?? currentReview.referenceOnly ?? true,
    tradable: incomingReview.tradable ?? currentReview.tradable ?? false,
    mmEnabled: incomingReview.mmEnabled ?? currentReview.mmEnabled ?? false,
    reviewedAt: incomingReview.reviewedAt ?? currentReview.reviewedAt ?? null,
    reviewedBy: incomingReview.reviewedBy ?? currentReview.reviewedBy ?? null,
    reviewNotes: incomingReview.reviewNotes ?? currentReview.reviewNotes ?? null,
  };
}

export function parseReferenceReview(
  value: Prisma.JsonValue | Prisma.InputJsonValue | Record<string, unknown> | null | undefined,
): Partial<ReferenceReviewMetadata> {
  const object = asJsonObject(value);
  return {
    importedFrom: object.importedFrom === "polymarket" ? "polymarket" : undefined,
    importStatus:
      object.importStatus === "pending_review" ||
      object.importStatus === "approved" ||
      object.importStatus === "rejected"
        ? object.importStatus
        : undefined,
    referenceOnly: typeof object.referenceOnly === "boolean" ? object.referenceOnly : undefined,
    tradable: typeof object.tradable === "boolean" ? object.tradable : undefined,
    mmEnabled: typeof object.mmEnabled === "boolean" ? object.mmEnabled : undefined,
    reviewedAt: typeof object.reviewedAt === "string" ? object.reviewedAt : null,
    reviewedBy: typeof object.reviewedBy === "string" ? object.reviewedBy : null,
    reviewNotes: typeof object.reviewNotes === "string" ? object.reviewNotes : null,
  };
}

function asJsonObject(
  value: Prisma.JsonValue | Prisma.InputJsonValue | Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
}

async function findExistingEvent(
  tx: Prisma.TransactionClient,
  input: PolymarketImportEventInput,
) {
  if (input.externalEventId) {
    const byExternalId = await tx.event.findFirst({
      where: {
        source: input.source ?? "polymarket",
        externalEventId: input.externalEventId,
      },
    });
    if (byExternalId) {
      return byExternalId;
    }
  }

  if (input.externalSlug) {
    const byExternalSlug = await tx.event.findFirst({
      where: {
        source: input.source ?? "polymarket",
        externalSlug: input.externalSlug,
      },
    });
    if (byExternalSlug) {
      return byExternalSlug;
    }
  }

  if (input.slug) {
    return tx.event.findUnique({ where: { slug: input.slug } });
  }

  return null;
}

async function findExistingMarket(
  tx: Prisma.TransactionClient,
  input: PolymarketImportMarketInput,
) {
  if (input.conditionId) {
    const byConditionId = await tx.market.findFirst({
      where: {
        referenceSource: input.referenceSource ?? "polymarket",
        conditionId: input.conditionId,
      },
    });
    if (byConditionId) {
      return byConditionId;
    }
  }

  if (input.externalMarketId) {
    const byExternalMarketId = await tx.market.findFirst({
      where: {
        referenceSource: input.referenceSource ?? "polymarket",
        externalMarketId: input.externalMarketId,
      },
    });
    if (byExternalMarketId) {
      return byExternalMarketId;
    }
  }

  if (input.externalSlug) {
    return tx.market.findFirst({
      where: {
        referenceSource: input.referenceSource ?? "polymarket",
        externalSlug: input.externalSlug,
      },
    });
  }

  return null;
}

function findExistingOutcome(
  outcomes: Array<{
    id: string;
    name: string;
    slug: string | null;
    referenceTokenId: string | null;
    referenceOutcomeLabel: string | null;
  }>,
  input: PolymarketImportOutcomeInput,
  usedOutcomeIds: Set<string>,
  marketType: MarketType,
  index: number,
) {
  if (input.referenceTokenId) {
    const byToken = outcomes.find(
      (outcome) =>
        !usedOutcomeIds.has(outcome.id) &&
        outcome.referenceTokenId === input.referenceTokenId,
    );
    if (byToken) {
      return byToken;
    }
  }

  const normalizedName = normalizeLocalOutcomeName(input.name, marketType);
  const byName = outcomes.find(
    (outcome) =>
      !usedOutcomeIds.has(outcome.id) &&
      outcome.name.toLowerCase() === normalizedName.toLowerCase(),
  );
  if (byName) {
    return byName;
  }

  const byReferenceLabel = outcomes.find(
    (outcome) =>
      !usedOutcomeIds.has(outcome.id) &&
      typeof outcome.referenceOutcomeLabel === "string" &&
      outcome.referenceOutcomeLabel.toLowerCase() === input.name.toLowerCase(),
  );
  if (byReferenceLabel) {
    return byReferenceLabel;
  }

  return outcomes[index] && !usedOutcomeIds.has(outcomes[index].id)
    ? outcomes[index]
    : null;
}

function normalizeMarketType(type: string | undefined, outcomeCount: number): MarketType {
  if (type === "MULTI_WINNER" || outcomeCount > 2) {
    return "MULTI_WINNER";
  }
  return "BINARY";
}

function normalizeImportedMarketStatus(status: string | undefined): MarketStatus {
  if (status === "live") {
    return "LIVE";
  }
  return "UPCOMING";
}

function parseResolveTime(value: string | null | undefined) {
  return parseOptionalDate(value);
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalDecimal(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return null;
  }
  const decimal = new Prisma.Decimal(value);
  return decimal.isFinite() ? decimal : null;
}

function uniqueImportSlug(externalSlug: string | null | undefined, title: string) {
  if (externalSlug && externalSlug.trim().length > 0) {
    return externalSlug.trim().toLowerCase();
  }
  return `pm-${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLocalOutcomeName(name: string, marketType: MarketType) {
  const trimmed = name.trim();
  if (marketType === "BINARY") {
    if (trimmed.toLowerCase() === "yes") {
      return "YES";
    }
    if (trimmed.toLowerCase() === "no") {
      return "NO";
    }
  }
  return trimmed;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildImportedOutcomeSlug(
  marketSlug: string | null,
  outcomeName: string,
  referenceTokenId: string | null | undefined,
  index: number,
) {
  const marketBase = marketSlug && marketSlug.trim().length > 0 ? marketSlug.trim().toLowerCase() : `market-${index + 1}`;
  const outcomeBase = slugify(outcomeName);
  const tokenSuffix =
    referenceTokenId && referenceTokenId.trim().length >= 6
      ? referenceTokenId.trim().slice(-6).toLowerCase()
      : `${index + 1}`;
  return `${marketBase}-${outcomeBase}-${tokenSuffix}`;
}
