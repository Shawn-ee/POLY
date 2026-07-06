import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { CanonicalApiError } from "@/lib/canonicalApi";

export type CanonicalRateLimitRouteId =
  | "orders:create"
  | "orders:cancel"
  | "orders:get"
  | "orders:list"
  | "combo-orders:create"
  | "combo-orders:quote"
  | "combo-orders:cancel"
  | "combo-orders:get"
  | "combo-orders:list"
  | "fills:list"
  | "account:profile"
  | "account:balance"
  | "account:navigation"
  | "account:positions"
  | "account:ledger"
  | "account:preferences";

export type CanonicalRateLimitRule = {
  windowMs: number;
  max: number;
};

export const CANONICAL_RATE_LIMITS: Record<CanonicalRateLimitRouteId, CanonicalRateLimitRule> = {
  "orders:create": { windowMs: 60_000, max: 20 },
  "orders:cancel": { windowMs: 60_000, max: 30 },
  "orders:get": { windowMs: 60_000, max: 120 },
  "orders:list": { windowMs: 60_000, max: 120 },
  "combo-orders:create": { windowMs: 60_000, max: 10 },
  "combo-orders:quote": { windowMs: 60_000, max: 60 },
  "combo-orders:cancel": { windowMs: 60_000, max: 20 },
  "combo-orders:get": { windowMs: 60_000, max: 120 },
  "combo-orders:list": { windowMs: 60_000, max: 120 },
  "fills:list": { windowMs: 60_000, max: 120 },
  "account:profile": { windowMs: 60_000, max: 120 },
  "account:balance": { windowMs: 60_000, max: 120 },
  "account:navigation": { windowMs: 60_000, max: 120 },
  "account:positions": { windowMs: 60_000, max: 120 },
  "account:ledger": { windowMs: 60_000, max: 120 },
  "account:preferences": { windowMs: 60_000, max: 120 },
};

type ConsumeParams = {
  apiCredentialId: string;
  routeId: CanonicalRateLimitRouteId;
  rule: CanonicalRateLimitRule;
};

export interface CanonicalRateLimitProvider {
  consume(params: ConsumeParams): Promise<void>;
}

const memoryBuckets = new Map<string, number[]>();

const getWindowStart = (now: Date, windowMs: number) =>
  new Date(Math.floor(now.getTime() / windowMs) * windowMs);

export class MemoryCanonicalRateLimitProvider implements CanonicalRateLimitProvider {
  async consume(params: ConsumeParams) {
    const now = Date.now();
    const bucketKey = `${params.apiCredentialId}:${params.routeId}`;
    const windowStart = now - params.rule.windowMs;
    const existing = memoryBuckets.get(bucketKey) ?? [];
    const recent = existing.filter((ts) => ts > windowStart);

    if (recent.length >= params.rule.max) {
      memoryBuckets.set(bucketKey, recent);
      throw new CanonicalApiError(
        "RATE_LIMIT_EXCEEDED",
        "Rate limit exceeded for this API key.",
        429
      );
    }

    recent.push(now);
    memoryBuckets.set(bucketKey, recent);
  }
}

export class DatabaseCanonicalRateLimitProvider implements CanonicalRateLimitProvider {
  async consume(params: ConsumeParams) {
    const windowStart = getWindowStart(new Date(), params.rule.windowMs);
    const rows = await prisma.$queryRaw<Array<{ requestCount: number }>>`
      INSERT INTO "ApiCredentialRateLimitBucket"
        ("id", "apiCredentialId", "routeId", "windowStart", "requestCount", "createdAt", "updatedAt")
      VALUES
        (${randomUUID()}, ${params.apiCredentialId}, ${params.routeId}, ${windowStart}, 1, NOW(), NOW())
      ON CONFLICT ("apiCredentialId", "routeId", "windowStart")
      DO UPDATE SET
        "requestCount" = "ApiCredentialRateLimitBucket"."requestCount" + 1,
        "updatedAt" = NOW()
      RETURNING "requestCount"
    `;

    const count = rows[0]?.requestCount ?? 0;
    if (count > params.rule.max) {
      throw new CanonicalApiError(
        "RATE_LIMIT_EXCEEDED",
        "Rate limit exceeded for this API key.",
        429
      );
    }
  }
}

let providerOverride: CanonicalRateLimitProvider | null = null;
const databaseProvider = new DatabaseCanonicalRateLimitProvider();
const memoryProvider = new MemoryCanonicalRateLimitProvider();
const DEFAULT_BUCKET_RETENTION_HOURS = 48;

export const getCanonicalRateLimitProvider = () => {
  if (providerOverride) {
    return providerOverride;
  }

  const configured = process.env.CANONICAL_RATE_LIMIT_BACKEND?.trim().toLowerCase();
  if (configured === "memory") {
    return memoryProvider;
  }

  return databaseProvider;
};

export const enforceCanonicalRateLimit = async (
  apiCredentialId: string,
  routeId: CanonicalRateLimitRouteId
) => {
  await getCanonicalRateLimitProvider().consume({
    apiCredentialId,
    routeId,
    rule: CANONICAL_RATE_LIMITS[routeId],
  });
};

export const __setCanonicalRateLimitProviderForTest = (provider: CanonicalRateLimitProvider | null) => {
  providerOverride = provider;
};

export const __clearMemoryCanonicalRateLimitStateForTest = () => {
  memoryBuckets.clear();
};

export const pruneExpiredCanonicalRateLimitBuckets = async (
  retentionHours = DEFAULT_BUCKET_RETENTION_HOURS
) => {
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
  return prisma.apiCredentialRateLimitBucket.deleteMany({
    where: {
      windowStart: { lt: cutoff },
    },
  });
};

export const getCanonicalRateLimitBucketRetentionHours = () => DEFAULT_BUCKET_RETENTION_HOURS;
