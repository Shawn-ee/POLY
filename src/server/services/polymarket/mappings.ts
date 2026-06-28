import { Prisma } from "@prisma/client";
import { buildImportedReferenceMetadata, parseReferenceReview } from "@/server/services/polymarketReferenceImport";

export function isPolymarketMappingEnabled(metadata: Prisma.JsonValue | null | undefined) {
  const review = parseReferenceReview(metadata);
  const object = asObject(metadata);
  return (
    review.importStatus === "approved" &&
    review.referenceOnly === true &&
    object.mappingDisabled !== true
  );
}

export function buildVerifiedPolymarketMappingMetadata(params: {
  current: Prisma.JsonValue | null;
  actorUserId: string;
  reviewNotes?: string | null;
}) {
  return buildImportedReferenceMetadata(params.current, {
    importStatus: "approved",
    referenceOnly: true,
    tradable: false,
    mmEnabled: false,
    reviewedAt: new Date().toISOString(),
    reviewedBy: params.actorUserId,
    reviewNotes: params.reviewNotes ?? null,
    mappingDisabled: false,
  } as Prisma.InputJsonObject);
}

export function buildDisabledPolymarketMappingMetadata(params: {
  current: Prisma.JsonValue | null;
  actorUserId: string;
  reviewNotes?: string | null;
}) {
  const current = asObject(params.current);
  return buildImportedReferenceMetadata(params.current, {
    ...current,
    importStatus: "rejected",
    referenceOnly: true,
    tradable: false,
    mmEnabled: false,
    reviewedAt: new Date().toISOString(),
    reviewedBy: params.actorUserId,
    reviewNotes: params.reviewNotes ?? "Mapping disabled.",
    mappingDisabled: true,
  } as Prisma.InputJsonObject);
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
