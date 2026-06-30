import { CanonicalEventStream, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isPolymarketMappingEnabled } from "@/server/services/polymarket";
import { pauseAllReferenceMarketMakerQuotes } from "@/server/services/referenceMarketMaker";

const SUPPORTED_REFERENCE_MARKET_TYPES = new Set([
  "yes_no",
  "match_winner_1x2",
  "total_goals",
  "both_teams_to_score",
  "team_to_qualify",
  "spread",
]);

const DEFAULT_BOT_USERNAME = "system-liquidity-bot";
const DEFAULT_KICKOFF_PAUSE_MINUTES = 60;
const DEFAULT_RAPID_MOVE_TICKS = 10;
const DEFAULT_REPEATED_ERROR_THRESHOLD = 2;

export type ReferenceRiskAlertType =
  | "stale_reference"
  | "disabled_mapping"
  | "unsupported_market_type"
  | "kickoff_proximity"
  | "live_market"
  | "exposure_exceeded"
  | "rapid_reference_move"
  | "repeated_reference_error";

export type ReferenceRiskAlertSeverity = "info" | "warn" | "critical";
export type ReferenceRiskAction = "skip" | "pause";

export type ReferenceRiskAlert = {
  type: ReferenceRiskAlertType;
  severity: ReferenceRiskAlertSeverity;
  action: ReferenceRiskAction;
  marketId: string;
  marketTitle?: string | null;
  outcomeId?: string | null;
  outcomeName?: string | null;
  message: string;
  details?: Record<string, unknown>;
};

export type ReferenceRiskMonitorConfig = {
  id: string;
  marketId: string;
  marketTitle?: string | null;
  outcomeId?: string | null;
  outcomeName?: string | null;
  enabled: boolean;
  source: string;
  marketType: string;
  mappingEnabled: boolean;
  staleAfterSeconds: number;
  tickSize: number;
  maxOutcomeExposure: number;
  maxMarketExposure: number;
  eventStartTime?: string | Date | null;
  eventStatus?: string | null;
  eventLiveStatus?: string | null;
  betCloseTime?: string | Date | null;
  closeTime?: string | Date | null;
};

export type ReferenceRiskSnapshot = {
  marketId: string;
  outcomeId: string;
  outcomeName?: string | null;
  fetchedAt?: string | Date | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  outcomePrice?: number | null;
  lastTradePrice?: number | null;
  acceptingOrders?: boolean | null;
  mmEligible?: boolean | null;
  qualityStatus?: string | null;
  reason?: string | null;
};

export type ReferenceRiskOpenOrder = {
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  remaining: number;
  price: number;
};

export type ReferenceRiskEvaluationInput = {
  now: Date;
  configs: ReferenceRiskMonitorConfig[];
  snapshots: ReferenceRiskSnapshot[];
  openOrders: ReferenceRiskOpenOrder[];
  kickoffPauseMinutes?: number;
  rapidMoveTicks?: number;
  repeatedErrorThreshold?: number;
};

export type ReferenceRiskMonitorResult = {
  generatedAt: string;
  alertCount: number;
  pauseRequired: boolean;
  paused: boolean;
  eventsLogged: number;
  alerts: ReferenceRiskAlert[];
  pauseResult?: unknown;
};

export function evaluateReferenceRiskState(input: ReferenceRiskEvaluationInput): ReferenceRiskAlert[] {
  const kickoffPauseMinutes = input.kickoffPauseMinutes ?? DEFAULT_KICKOFF_PAUSE_MINUTES;
  const rapidMoveTicks = input.rapidMoveTicks ?? DEFAULT_RAPID_MOVE_TICKS;
  const repeatedErrorThreshold = input.repeatedErrorThreshold ?? DEFAULT_REPEATED_ERROR_THRESHOLD;
  const snapshotsByMarket = groupBy(input.snapshots, (snapshot) => snapshot.marketId);
  const snapshotsByOutcome = new Map(input.snapshots.map((snapshot) => [`${snapshot.marketId}:${snapshot.outcomeId}`, snapshot]));
  const openExposure = calculateOpenExposure(input.openOrders);
  const alerts: ReferenceRiskAlert[] = [];

  for (const config of input.configs) {
    if (!config.enabled || config.source !== "polymarket") continue;

    if (!config.mappingEnabled) {
      alerts.push({
        type: "disabled_mapping",
        severity: "critical",
        action: "pause",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: "Polymarket mapping is disabled or unverified.",
      });
    }

    if (!SUPPORTED_REFERENCE_MARKET_TYPES.has(config.marketType)) {
      alerts.push({
        type: "unsupported_market_type",
        severity: "warn",
        action: "skip",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: `Reference market maker does not support ${config.marketType}.`,
        details: { marketType: config.marketType },
      });
    }

    const liveStatus = `${config.eventLiveStatus ?? config.eventStatus ?? ""}`.toLowerCase();
    if (["live", "in_play", "in-progress", "in_progress", "started"].includes(liveStatus)) {
      alerts.push({
        type: "live_market",
        severity: "critical",
        action: "pause",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: "Live betting is disabled for the first Polymarket reference MM version.",
        details: { eventStatus: config.eventStatus, eventLiveStatus: config.eventLiveStatus },
      });
    }

    const startTime = firstValidTime(config.eventStartTime, config.betCloseTime, config.closeTime);
    if (startTime != null) {
      const minutesUntilStart = (startTime - input.now.getTime()) / 60000;
      if (minutesUntilStart >= 0 && minutesUntilStart <= kickoffPauseMinutes) {
        alerts.push({
          type: "kickoff_proximity",
          severity: "critical",
          action: "pause",
          marketId: config.marketId,
          marketTitle: config.marketTitle,
          outcomeId: config.outcomeId,
          outcomeName: config.outcomeName,
          message: "Market is inside the pre-match quote pause window.",
          details: { minutesUntilStart: Number(minutesUntilStart.toFixed(2)), kickoffPauseMinutes },
        });
      }
    }

    const marketSnapshots = (snapshotsByMarket.get(config.marketId) ?? []).filter(
      (snapshot) => !config.outcomeId || snapshot.outcomeId === config.outcomeId,
    );
    if (marketSnapshots.length === 0) {
      alerts.push({
        type: "stale_reference",
        severity: "critical",
        action: "pause",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: "No current Polymarket reference snapshot is available.",
      });
    }

    for (const snapshot of marketSnapshots) {
      const staleAgeSeconds = ageSeconds(snapshot.fetchedAt, input.now);
      const stale = staleAgeSeconds == null || staleAgeSeconds > config.staleAfterSeconds || snapshot.mmEligible === false;
      if (stale) {
        alerts.push({
          type: "stale_reference",
          severity: "critical",
          action: "pause",
          marketId: config.marketId,
          marketTitle: config.marketTitle,
          outcomeId: snapshot.outcomeId,
          outcomeName: snapshot.outcomeName,
          message: "Polymarket reference price is stale or ineligible for quoting.",
          details: {
            ageSeconds: staleAgeSeconds,
            staleAfterSeconds: config.staleAfterSeconds,
            mmEligible: snapshot.mmEligible,
            qualityStatus: snapshot.qualityStatus,
            reason: snapshot.reason,
          },
        });
      }

      const mid = calculateMid(snapshot);
      if (mid != null && snapshot.lastTradePrice != null) {
        const moveTicks = Math.abs(mid - snapshot.lastTradePrice) / config.tickSize;
        if (moveTicks >= rapidMoveTicks) {
          alerts.push({
            type: "rapid_reference_move",
            severity: "critical",
            action: "pause",
            marketId: config.marketId,
            marketTitle: config.marketTitle,
            outcomeId: snapshot.outcomeId,
            outcomeName: snapshot.outcomeName,
            message: "Reference mid moved too far from the latest trade price.",
            details: {
              mid,
              lastTradePrice: snapshot.lastTradePrice,
              moveTicks: Number(moveTicks.toFixed(2)),
              rapidMoveTicks,
            },
          });
        }
      }
    }

    const repeatedErrorCount = marketSnapshots.filter((snapshot) => isReferenceError(snapshot)).length;
    if (repeatedErrorCount >= repeatedErrorThreshold) {
      alerts.push({
        type: "repeated_reference_error",
        severity: "critical",
        action: "pause",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: "Repeated Polymarket reference errors exceeded the risk threshold.",
        details: { repeatedErrorCount, repeatedErrorThreshold },
      });
    }

    const marketExposure = openExposure.byMarket.get(config.marketId) ?? 0;
    const outcomeExposure = config.outcomeId
      ? openExposure.byOutcome.get(`${config.marketId}:${config.outcomeId}`) ?? 0
      : Math.max(0, ...Array.from(openExposure.byOutcome.entries())
          .filter(([key]) => key.startsWith(`${config.marketId}:`))
          .map(([, value]) => value));
    if (marketExposure > config.maxMarketExposure || outcomeExposure > config.maxOutcomeExposure) {
      alerts.push({
        type: "exposure_exceeded",
        severity: "critical",
        action: "pause",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: "Open bot order exposure exceeds configured limits.",
        details: {
          marketExposure: Number(marketExposure.toFixed(6)),
          maxMarketExposure: config.maxMarketExposure,
          outcomeExposure: Number(outcomeExposure.toFixed(6)),
          maxOutcomeExposure: config.maxOutcomeExposure,
        },
      });
    }

    if (config.outcomeId && !snapshotsByOutcome.has(`${config.marketId}:${config.outcomeId}`)) {
      alerts.push({
        type: "stale_reference",
        severity: "critical",
        action: "pause",
        marketId: config.marketId,
        marketTitle: config.marketTitle,
        outcomeId: config.outcomeId,
        outcomeName: config.outcomeName,
        message: "Configured outcome has no matching Polymarket reference snapshot.",
      });
    }
  }

  return dedupeAlerts(alerts);
}

export async function runReferenceRiskMonitorOnce(options: {
  pauseOnRisk?: boolean;
  logEvents?: boolean;
  now?: Date;
  botUsername?: string;
} = {}): Promise<ReferenceRiskMonitorResult> {
  const now = options.now ?? new Date();
  const configs = await loadRiskConfigs();
  const marketIds = Array.from(new Set(configs.map((config) => config.marketId)));
  const snapshots = await loadRiskSnapshots(marketIds);
  const openOrders = await loadOpenBotOrders(options.botUsername ?? process.env.REFERENCE_MM_BOT_USERNAME ?? DEFAULT_BOT_USERNAME);
  const alerts = evaluateReferenceRiskState({ now, configs, snapshots, openOrders });
  const pauseRequired = alerts.some((alert) => alert.action === "pause");
  let pauseResult: unknown = undefined;
  let paused = false;

  if (options.logEvents !== false && alerts.length > 0) {
    await logRiskAlerts(alerts);
  }

  if (options.pauseOnRisk === true && pauseRequired) {
    pauseResult = await pauseAllReferenceMarketMakerQuotes({ botUsername: options.botUsername });
    paused = true;
  }

  return {
    generatedAt: now.toISOString(),
    alertCount: alerts.length,
    pauseRequired,
    paused,
    eventsLogged: options.logEvents === false ? 0 : alerts.length,
    alerts,
    pauseResult,
  };
}

async function loadRiskConfigs(): Promise<ReferenceRiskMonitorConfig[]> {
  const configs = await prisma.botQuoteConfig.findMany({
    where: { source: "polymarket" },
    include: {
      market: {
        include: {
          event: true,
        },
      },
      outcome: true,
    },
    orderBy: [{ marketId: "asc" }, { outcomeId: "asc" }],
  });

  return configs.map((config) => ({
    id: config.id,
    marketId: config.marketId,
    marketTitle: config.market.title,
    outcomeId: config.outcomeId,
    outcomeName: config.outcome?.name ?? null,
    enabled: config.enabled,
    source: config.source,
    marketType: deriveRiskMarketType(config.market.marketType),
    mappingEnabled: isPolymarketMappingEnabled(config.market.referenceMetadata),
    staleAfterSeconds: config.staleAfterSeconds,
    tickSize: Number(config.tickSize),
    maxOutcomeExposure: Number(config.maxOutcomeExposure),
    maxMarketExposure: Number(config.maxMarketExposure),
    eventStartTime: config.market.event?.startTime ?? null,
    eventStatus: config.market.event?.status ?? null,
    eventLiveStatus: config.market.event?.liveStatus ?? null,
    betCloseTime: config.market.betCloseTime,
    closeTime: config.market.closeTime,
  }));
}

async function loadRiskSnapshots(marketIds: string[]): Promise<ReferenceRiskSnapshot[]> {
  if (marketIds.length === 0) return [];
  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: { source: "polymarket", marketId: { in: marketIds } },
    include: { outcome: true },
  });
  return snapshots.map((snapshot) => ({
    marketId: snapshot.marketId,
    outcomeId: snapshot.outcomeId,
    outcomeName: snapshot.outcome.name,
    fetchedAt: snapshot.fetchedAt,
    bestBid: decimalToNumber(snapshot.bestBid),
    bestAsk: decimalToNumber(snapshot.bestAsk),
    outcomePrice: decimalToNumber(snapshot.outcomePrice),
    lastTradePrice: decimalToNumber(snapshot.lastTradePrice),
    acceptingOrders: snapshot.acceptingOrders,
    mmEligible: snapshot.mmEligible,
    qualityStatus: snapshot.qualityStatus,
    reason: snapshot.reason,
  }));
}

async function loadOpenBotOrders(username: string): Promise<ReferenceRiskOpenOrder[]> {
  const bot = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!bot) return [];
  const orders = await prisma.order.findMany({
    where: {
      userId: bot.id,
      status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] },
      remaining: { gt: new Prisma.Decimal(0) },
    },
    select: { marketId: true, outcomeId: true, side: true, remaining: true, price: true },
  });
  return orders.map((order) => ({
    marketId: order.marketId,
    outcomeId: order.outcomeId,
    side: order.side,
    remaining: Number(order.remaining),
    price: Number(order.price),
  }));
}

async function logRiskAlerts(alerts: ReferenceRiskAlert[]) {
  if (alerts.length === 0) return;
  await prisma.canonicalEvent.createMany({
    data: alerts.slice(0, 50).map((alert) => ({
      stream: CanonicalEventStream.MARKET,
      topicKey: `market:${alert.marketId}`,
      eventType: "reference_risk_alert",
      marketId: alert.marketId,
      outcomeId: alert.outcomeId ?? null,
      userId: null,
      payload: alert as unknown as Prisma.InputJsonValue,
    })),
  });
}

function calculateOpenExposure(openOrders: ReferenceRiskOpenOrder[]) {
  const byMarket = new Map<string, number>();
  const byOutcome = new Map<string, number>();
  for (const order of openOrders) {
    const exposure = order.side === "BUY" ? order.remaining * order.price : order.remaining * Math.max(0, 1 - order.price);
    byMarket.set(order.marketId, (byMarket.get(order.marketId) ?? 0) + exposure);
    const outcomeKey = `${order.marketId}:${order.outcomeId}`;
    byOutcome.set(outcomeKey, (byOutcome.get(outcomeKey) ?? 0) + exposure);
  }
  return { byMarket, byOutcome };
}

function calculateMid(snapshot: ReferenceRiskSnapshot) {
  if (snapshot.bestBid != null && snapshot.bestAsk != null) return (snapshot.bestBid + snapshot.bestAsk) / 2;
  return snapshot.outcomePrice ?? null;
}

function isReferenceError(snapshot: ReferenceRiskSnapshot) {
  const reason = `${snapshot.reason ?? ""}`.toLowerCase();
  return snapshot.acceptingOrders === false || snapshot.mmEligible === false || reason.includes("api") || reason.includes("missing");
}

function ageSeconds(fetchedAt: string | Date | null | undefined, now: Date) {
  if (!fetchedAt) return null;
  const time = fetchedAt instanceof Date ? fetchedAt.getTime() : Date.parse(fetchedAt);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.floor((now.getTime() - time) / 1000));
}

function firstValidTime(...values: Array<string | Date | null | undefined>) {
  for (const value of values) {
    if (!value) continue;
    const time = value instanceof Date ? value.getTime() : Date.parse(value);
    if (Number.isFinite(time)) return time;
  }
  return null;
}

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFor(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return grouped;
}

function deriveRiskMarketType(marketType: string) {
  if (SUPPORTED_REFERENCE_MARKET_TYPES.has(marketType)) return marketType;
  if (marketType === "binary" || marketType === "generic") return "yes_no";
  return marketType || "unknown";
}

function dedupeAlerts(alerts: ReferenceRiskAlert[]) {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = [alert.type, alert.marketId, alert.outcomeId ?? "", alert.message].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}
