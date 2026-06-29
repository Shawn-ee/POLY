"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import MarketHeader from "@/components/market/shared/MarketHeader";
import OrderTicket from "@/components/market/orderbook/OrderTicket";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import type {
  SubmitOrderDebug,
  SubmitOrderPayload,
} from "@/components/market/orderbook/orderTicketLogic";

type Market = {
  id: string;
  title: string;
  description: string;
  status: string;
  outcomes: { id: string; name: string }[];
  pricesByOutcome?: Record<string, number>;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  importStatus?: string | null;
  mmEnabled?: boolean | null;
  event?: {
    slug: string | null;
    title: string;
  } | null;
};

type ReferenceQuotePlanOutcome = {
  localMarketId: string;
  localOutcomeId: string;
  outcomeName: string;
  referenceSource: string;
  gammaOutcomePrice: number | null;
  gammaBestBid: number | null;
  gammaBestAsk: number | null;
  gammaSpread: number | null;
  lastTradePrice: number | null;
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  acceptingOrders: boolean;
  fetchedAt: string | null;
  ageMs: number | null;
  isFresh: boolean;
  hasSnapshot: boolean;
  qualityStatus: string | null;
  mmEligible: boolean;
  mmEnabled: boolean;
  reason: string | null;
  tickSize: string;
  quoteOffsetTicks: number;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  referenceBid: number | null;
  referenceAsk: number | null;
  activeBotBid?: number | null;
  activeBotAsk?: number | null;
  dryRun: boolean;
  liveOrdersEnabled: boolean;
  quotePlanEnabled: boolean;
  quotePreviewAvailable: boolean;
  formula: string;
};

type ReferencePlanResponse = {
  marketId: string;
  source: string | null;
  hasSnapshot: boolean;
  reason: string | null;
  dryRun: boolean;
  liveOrdersEnabled: boolean;
  botInitialization?: {
    status: string;
    lastCheckedAt: string | null;
    reason: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    riskProfile: string | null;
    capital?: {
      budgetCents: number | null;
      mintBudgetCents: number | null;
      mintedCompleteSets: number | null;
      cashReserveCents: number | null;
      autoReplenish: boolean;
      initializedAt: string | null;
      maxSingleOrderNotionalCents: number | null;
      maxOpenOrderNotionalCents: number | null;
      maxDailyLossCents: number | null;
      openOrderNotionalCents?: number | null;
      dailyLossCents?: number | null;
      availableCashUSDC?: number | null;
      lockedCashUSDC?: number | null;
    } | null;
    runtime?: {
      liveOrdersEnabled: boolean;
      emergencyStop: boolean;
      cancelRequestedAt: string | null;
      lastSeededAt: string | null;
      lastLiveRunAt: string | null;
      lastRuntimeSyncAt: string | null;
    } | null;
    readiness?: {
      ready: boolean;
      dryRun: boolean;
      liveRequested: boolean;
      reasons: string[];
      referenceBid: number | null;
      referenceAsk: number | null;
      plannedBotBid: number | null;
      plannedBotAsk: number | null;
      riskProfile: string | null;
      checkedAt: string | null;
    } | null;
  } | null;
  outcomes: ReferenceQuotePlanOutcome[];
};

type BookRow = {
  outcomeId: string;
  price: number;
  size: number;
};

type UserOrder = {
  id: string;
  outcomeId: string;
  outcomeName: string;
  side: "BUY" | "SELL";
  price: number;
  amount: number;
  remaining: number;
  status: string;
  createdAt: string;
};

type Trade = {
  id: string;
  executionId?: string;
  marketId?: string;
  outcomeId: string;
  outcomeName?: string;
  outcome: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  shares: number;
  cost: number;
  createdAt: string;
};

type Position = {
  id: string;
  outcomeId: string;
  outcomeName: string;
  shares: number;
  reservedShares: number;
  avgCost: number;
  realizedPnl?: number;
};

const MAX_LEVELS = 20;
const MAX_TRADES = 100;

export default function OrderbookMarketView({
  market: initialMarket,
}: {
  market: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
}) {
  const marketId = initialMarket.id;
  const [market, setMarket] = useState<Market | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [outcomeId, setOutcomeId] = useState<string>("");
  const [bids, setBids] = useState<BookRow[]>([]);
  const [asks, setAsks] = useState<BookRow[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [referencePlan, setReferencePlan] = useState<ReferenceQuotePlanOutcome[]>([]);
  const [botInitialization, setBotInitialization] = useState<ReferencePlanResponse["botInitialization"]>(null);
  const [message, setMessage] = useState("");

  const loadWallet = async () => {
    const res = await fetch("/api/wallet/balance");
    if (!res.ok) {
      setWalletBalance(null);
      return;
    }
    const data = await res.json();
    setWalletBalance(typeof data.balance === "number" ? data.balance : 0);
  };

  const loadMarket = async () => {
    const marketRes = await fetch(`/api/markets/${marketId}`);
    if (!marketRes.ok) return;
    const marketData = await marketRes.json();
    const nextMarket = marketData.market as Market;
    setMarket(nextMarket);
    if (!outcomeId && nextMarket.outcomes.length) {
      setOutcomeId(nextMarket.outcomes[0].id);
    }
  };

  const loadBook = async () => {
    const query = outcomeId ? `?outcomeId=${outcomeId}` : "";
    const res = await fetch(`/api/orderbook/${marketId}/book${query}`);
    if (!res.ok) return;
    const data = await res.json();
    setBids(data.bids ?? []);
    setAsks(data.asks ?? []);
  };

  const loadOrders = async () => {
    const res = await fetch(
      `/api/orders?marketId=${encodeURIComponent(marketId)}&status=OPEN,PARTIAL&limit=100`
    );
    if (!res.ok) return;
    const data = await res.json();
    setOrders(
      (data.items ?? []).map((item: {
        id: string;
        outcomeId: string;
        outcomeName: string;
        side: "BUY" | "SELL";
        price: string | number;
        size: string | number;
        remaining: string | number;
        status: string;
        createdAt: string;
      }) => ({
        id: item.id,
        outcomeId: item.outcomeId,
        outcomeName: item.outcomeName,
        side: item.side,
        price: Number(item.price),
        amount: Number(item.size),
        remaining: Number(item.remaining),
        status: item.status,
        createdAt: item.createdAt,
      }))
    );
  };

  const loadTrades = async () => {
    const res = await fetch(`/api/orderbook/${marketId}/trades`);
    if (!res.ok) return;
    const data = await res.json();
    setTrades(data.trades ?? []);
  };

  const loadPosition = async (nextOutcomeId: string) => {
    if (!nextOutcomeId) {
      setPosition(null);
      return;
    }
    const res = await fetch(`/api/markets/${marketId}/positions?outcomeId=${nextOutcomeId}`);
    if (!res.ok) {
      setPosition(null);
      return;
    }
    const data = await res.json();
    setPosition((data.positions?.[0] as Position | undefined) ?? null);
  };

  const loadAll = async () => {
    await Promise.all([loadMarket(), loadWallet(), loadOrders(), loadTrades()]);
    if (outcomeId) {
      await Promise.all([loadBook(), loadPosition(outcomeId)]);
    }
  };

  const loadReferencePlan = async () => {
    const res = await fetch(`/api/markets/${marketId}/reference`);
    if (!res.ok) {
      setReferencePlan([]);
      return;
    }
    const data = (await res.json()) as ReferencePlanResponse;
    setReferencePlan(Array.isArray(data.outcomes) ? data.outcomes : []);
    setBotInitialization(data.botInitialization ?? null);
  };

  useEffect(() => {
    loadAll();
  }, [marketId]);

  useEffect(() => {
    void loadReferencePlan();
    const timer = setInterval(() => {
      void loadReferencePlan();
    }, 5_000);
    return () => clearInterval(timer);
  }, [marketId]);

  useEffect(() => {
    if (!outcomeId) return;
    Promise.all([loadBook(), loadPosition(outcomeId)]);
  }, [outcomeId]);

  useEffect(() => {
    if (!outcomeId) return;

    const marketStream = new EventSource(
      `/api/stream/market/${marketId}?outcomeId=${encodeURIComponent(outcomeId)}`
    );
    const handleMarketEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data ?? "{}");
      const nextPayload = payload?.payload;
      if (!nextPayload) return;
      setBids(
        (nextPayload?.topLevels?.bids ?? []).map((row: { outcomeId: string; price: string | number; size: string | number }) => ({
          outcomeId: row.outcomeId,
          price: Number(row.price),
          size: Number(row.size),
        }))
      );
      setAsks(
        (nextPayload?.topLevels?.asks ?? []).map((row: { outcomeId: string; price: string | number; size: string | number }) => ({
          outcomeId: row.outcomeId,
          price: Number(row.price),
          size: Number(row.size),
        }))
      );
      setTrades(
        (nextPayload?.recentTrades ?? []).map(
          (trade: {
            id: string;
            executionId?: string;
            marketId?: string;
            outcomeId: string;
            outcomeName?: string;
            outcome?: string;
            side: "BUY" | "SELL";
            price: string | number;
            quantity: string | number;
            shares?: string | number;
            cost?: string | number;
            createdAt: string;
          }) => ({
            id: trade.id,
            executionId: trade.executionId,
            marketId: trade.marketId,
            outcomeId: trade.outcomeId,
            outcomeName: trade.outcomeName,
            outcome: trade.outcome ?? trade.outcomeName ?? "",
            side: trade.side,
            price: Number(trade.price),
            quantity: Number(trade.quantity),
            shares: Number(trade.shares ?? trade.quantity),
            cost: Number(trade.cost ?? trade.quantity),
            createdAt: trade.createdAt,
          })
        )
      );
    };
    marketStream.addEventListener("quote.snapshot", handleMarketEvent);
    marketStream.addEventListener("quote.updated", handleMarketEvent);

    const userStream = new EventSource(
      `/api/stream/me/orders?marketId=${encodeURIComponent(marketId)}`
    );
    const handleUserEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data ?? "{}");
      const nextPayload = payload?.payload;
      if (!nextPayload) return;
      setOrders(
        (nextPayload?.orders ?? []).map(
          (item: {
            id: string;
            outcomeId: string;
            outcomeName: string;
            side: "BUY" | "SELL";
            price: string | number;
            amount: string | number;
            remaining: string | number;
            status: string;
            createdAt: string;
          }) => ({
            id: item.id,
            outcomeId: item.outcomeId,
            outcomeName: item.outcomeName,
            side: item.side,
            price: Number(item.price),
            amount: Number(item.amount),
            remaining: Number(item.remaining),
            status: item.status,
            createdAt: item.createdAt,
          })
        )
      );
    };
    userStream.addEventListener("account.snapshot", handleUserEvent);
    userStream.addEventListener("account.updated", handleUserEvent);

    return () => {
      marketStream.removeEventListener("quote.snapshot", handleMarketEvent);
      marketStream.removeEventListener("quote.updated", handleMarketEvent);
      userStream.removeEventListener("account.snapshot", handleUserEvent);
      userStream.removeEventListener("account.updated", handleUserEvent);
      marketStream.close();
      userStream.close();
    };
  }, [marketId, outcomeId]);

  const submitOrder = async (request: { payload: SubmitOrderPayload; debug: SubmitOrderDebug }) => {
    const { payload, debug } = request;
    setMessage("");
    if (process.env.NODE_ENV !== "production") {
      console.debug("order_submit_debug", debug);
    }
    const res = await fetch(`/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ marketId, ...payload }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error?.message ?? data?.error ?? "Failed to place order");
    }
    const order = data?.order;
    const execution = data?.execution;
    const filledShares = Number(execution?.filledShares ?? 0);
    const averageFillPrice = Number(execution?.averageFillPrice ?? 0);
    const actualNotional = Number(execution?.actualNotionalUSDC ?? 0);
    const actualProceeds = Number(execution?.actualProceedsUSDC ?? 0);
    const priceImprovement = Number(execution?.priceImprovementUSDC ?? 0);
    const remainingUnfilled = Number(execution?.remainingUnfilledShares ?? 0);
    const fillText = filledShares > 0 && averageFillPrice > 0
      ? `${filledShares.toFixed(2)} filled @ ${averageFillPrice.toFixed(2)}`
      : `${Number(order?.size ?? payload.size).toFixed(2)} submitted`;
    const cashText = payload.side === "BUY"
      ? `Actual cost $${actualNotional.toFixed(2)}`
      : `Actual proceeds $${actualProceeds.toFixed(2)}`;
    const improvementText = priceImprovement > 0.000001
      ? `, price improvement $${priceImprovement.toFixed(2)}`
      : "";
    const partialText = remainingUnfilled > 0.000001
      ? `, ${remainingUnfilled.toFixed(2)} unfilled`
      : "";
    const successMessage =
      payload.type === "LIMIT" && filledShares <= 0
        ? `Order placed: ${payload.side} ${Number(order?.size ?? payload.size).toFixed(2)} @ ${Number(
            order?.price ?? payload.price ?? 0,
          ).toFixed(2)} (${order?.status ?? "OPEN"})`
        : `${payload.side} ${selectedOutcome?.name ?? ""}: ${fillText}. ${cashText}${improvementText}${partialText}.`;
    setMessage(successMessage);
    await loadAll();
    return successMessage;
  };

  const cancelOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error?.message ?? data?.error ?? "Failed to cancel order");
      return;
    }
    setMessage("Order canceled.");
    await loadAll();
  };

  const selectedOutcome = useMemo(
    () => market?.outcomes.find((outcome) => outcome.id === outcomeId) ?? null,
    [market, outcomeId]
  );
  const bidsToShow = useMemo(() => bids.slice(0, MAX_LEVELS), [bids]);
  const asksToShow = useMemo(() => asks.slice(0, MAX_LEVELS), [asks]);
  const tradesToShow = useMemo(() => trades.slice(0, MAX_TRADES), [trades]);
  const bidsTrimmed = bids.length > MAX_LEVELS;
  const asksTrimmed = asks.length > MAX_LEVELS;
  const tradesTrimmed = trades.length > MAX_TRADES;
  const selectedOutcomeTrades = useMemo(
    () => trades.filter((trade) => trade.outcomeId === outcomeId),
    [trades, outcomeId]
  );
  const bestBid = bids.length ? bids[0].price : null;
  const bestAsk = asks.length ? asks[0].price : null;
  const lastTradePrice =
    selectedOutcomeTrades.length
      ? selectedOutcomeTrades[0].price
      : null;
  const markPrice =
    bestBid !== null && bestAsk !== null
      ? (bestBid + bestAsk) / 2
      : lastTradePrice ?? bestBid ?? bestAsk ?? null;
  const netShares = position?.shares ?? 0;
  const reservedShares = position?.reservedShares ?? 0;
  const avgCost = position?.avgCost ?? 0;
  const marketValue = markPrice !== null ? netShares * markPrice : null;
  const unrealizedPnl = markPrice !== null ? (markPrice - avgCost) * netShares : null;
  const formatToken = (value: number | null) => (value === null || !Number.isFinite(value) ? "--" : value.toFixed(2));
  const selectedReferencePlan = useMemo(
    () => referencePlan.find((plan) => plan.localOutcomeId === outcomeId) ?? referencePlan[0] ?? null,
    [referencePlan, outcomeId]
  );

  if (!market) {
    return <PageContainer size="default"><div className="text-sm text-[var(--poly-muted)]">Loading market...</div></PageContainer>;
  }

  const referenceOnly = market.referenceOnly === true;
  const tradable = market.tradable !== false;
  const showTradingControls = !referenceOnly && tradable;
  const internalTradingEnabled = process.env.NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED === "true";

  return (
    <PageContainer size="default">
      <MarketHeader
        title={market.title}
        description={market.description}
        status={market.status}
        walletBalance={walletBalance}
        metaChips={[
          ...(referenceOnly ? ["Reference only"] : []),
          ...(market.importStatus === "approved" ? ["Approved reference"] : []),
        ]}
        notice={
          referenceOnly && !tradable
            ? "This market is visible for discovery only. Trading remains disabled until an admin explicitly enables tradability."
            : null
        }
        event={
          market.event?.slug
            ? {
                slug: market.event.slug,
                title: market.event.title,
              }
            : null
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-[var(--poly-text)]">Orderbook Depth</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {market.outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  onClick={() => setOutcomeId(outcome.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    outcome.id === outcomeId
                      ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                      : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                  }`}
                  type="button"
                >
                  {outcome.name}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-emerald-700">Bids</div>
                <div className="space-y-1 text-sm">
                  {bidsToShow.map((row, idx) => (
                    <div key={`${row.outcomeId}-${row.price}-${idx}`} className="flex justify-between rounded-md bg-emerald-50 px-2 py-1 text-emerald-900">
                      <span>{row.price.toFixed(2)}</span>
                      <span>{row.size.toFixed(2)}</span>
                    </div>
                  ))}
                  {!bidsToShow.length ? <div className="text-[var(--poly-muted)]">No bids</div> : null}
                  {bidsTrimmed ? (
                    <div className="text-xs text-[var(--poly-muted)]">Showing top 20 levels</div>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-red-700">Asks</div>
                <div className="space-y-1 text-sm">
                  {asksToShow.map((row, idx) => (
                    <div key={`${row.outcomeId}-${row.price}-${idx}`} className="flex justify-between rounded-md bg-red-50 px-2 py-1 text-red-900">
                      <span>{row.price.toFixed(2)}</span>
                      <span>{row.size.toFixed(2)}</span>
                    </div>
                  ))}
                  {!asksToShow.length ? <div className="text-[var(--poly-muted)]">No asks</div> : null}
                  {asksTrimmed ? (
                    <div className="text-xs text-[var(--poly-muted)]">Showing top 20 levels</div>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold text-[var(--poly-text)]">Recent Trades</h2>
            <div className="mt-1 text-xs text-[var(--poly-muted)]">Recent trades (max 100)</div>
            <div className="mt-3 max-h-[22rem] overflow-y-auto space-y-2 pr-1 text-sm">
              {tradesToShow.map((trade) => (
                <div key={trade.id} className="flex justify-between border-b border-[var(--poly-border)] pb-2">
                  <span>
                    {trade.side.toLowerCase()} {trade.quantity.toFixed(2)} {trade.outcome} @
                    {trade.price.toFixed(2)}
                  </span>
                  <span>{new Date(trade.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {!tradesToShow.length ? <div className="text-[var(--poly-muted)]">No trades yet.</div> : null}
              {tradesTrimmed ? <div className="text-xs text-[var(--poly-muted)]">Showing latest 100 trades</div> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {referenceOnly ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Reference Market Data</h2>
              {selectedReferencePlan ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Source</span>
                    <span className="capitalize">{selectedReferencePlan.referenceSource}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reference bid / ask</span>
                    <span>{formatToken(selectedReferencePlan.referenceBid)} / {formatToken(selectedReferencePlan.referenceAsk)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Spread</span>
                    <span>{formatToken(selectedReferencePlan.gammaSpread)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last trade</span>
                    <span>{formatToken(selectedReferencePlan.lastTradePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Updated</span>
                    <span>{formatReferenceAge(selectedReferencePlan.ageMs, selectedReferencePlan.hasSnapshot)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quality</span>
                    <span>{formatReferenceQuality(selectedReferencePlan.qualityStatus, selectedReferencePlan.hasSnapshot)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>MM eligible</span>
                    <span>{selectedReferencePlan.mmEligible ? "Yes" : "No"}</span>
                  </div>
                  {!selectedReferencePlan.hasSnapshot ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                      No live reference snapshot yet. Run the reference snapshot updater.
                    </div>
                  ) : null}
                  {selectedReferencePlan.hasSnapshot && !selectedReferencePlan.isFresh ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                      Reference data stale
                    </div>
                  ) : null}
                  {selectedReferencePlan.reason === "reference_spread_too_wide" ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                      Reference spread too wide
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--poly-muted)]">No reference snapshot yet.</div>
              )}
            </Card>
          ) : null}

          {referenceOnly ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Bot Initialization Status</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span>{formatBotInitializationStatus(botInitialization?.status ?? null)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Checked</span>
                  <span>{formatReferenceTimestamp(botInitialization?.lastCheckedAt ?? null)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Risk profile</span>
                  <span>{botInitialization?.riskProfile ?? "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Seeded</span>
                  <span>{botInitialization?.capital?.initializedAt ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Capital budget</span>
                  <span>
                    {botInitialization?.capital?.budgetCents != null
                      ? `$${(botInitialization.capital.budgetCents / 100).toFixed(2)}`
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Minted</span>
                  <span>
                    {botInitialization?.capital?.mintBudgetCents != null
                      ? `$${(botInitialization.capital.mintBudgetCents / 100).toFixed(2)}`
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cash reserve</span>
                  <span>
                    {botInitialization?.capital?.cashReserveCents != null
                      ? `$${(botInitialization.capital.cashReserveCents / 100).toFixed(2)}`
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Open order notional</span>
                  <span>
                    {botInitialization?.capital?.openOrderNotionalCents != null
                      ? `$${(botInitialization.capital.openOrderNotionalCents / 100).toFixed(2)}`
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily loss</span>
                  <span>
                    {botInitialization?.capital?.dailyLossCents != null
                      ? `$${(botInitialization.capital.dailyLossCents / 100).toFixed(2)}`
                      : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dry run ready</span>
                  <span>{botInitialization?.readiness?.ready ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Live orders enabled</span>
                  <span>{botInitialization?.runtime?.liveOrdersEnabled ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Emergency stop</span>
                  <span>{botInitialization?.runtime?.emergencyStop ? "Yes" : "No"}</span>
                </div>
                {botInitialization?.reason ? (
                  <div
                    className={`rounded-md px-3 py-2 ${
                      botInitialization?.status === "paused" || botInitialization?.status === "blocked"
                        ? "border border-amber-200 bg-amber-50 text-amber-900"
                        : "border border-neutral-200 bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    {botInitialization.reason}
                  </div>
                ) : null}
                {botInitialization?.readiness?.reasons?.length ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    {botInitialization.readiness.reasons.join(", ")}
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          {referenceOnly ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold">System Liquidity Plan</h2>
              {selectedReferencePlan ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Offset</span>
                    <span>{selectedReferencePlan.quoteOffsetTicks} ticks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Planned bid</span>
                    <span className={selectedReferencePlan.quotePreviewAvailable ? "" : "text-neutral-400"}>
                      {formatToken(selectedReferencePlan.plannedBotBid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Planned ask</span>
                    <span className={selectedReferencePlan.quotePreviewAvailable ? "" : "text-neutral-400"}>
                      {formatToken(selectedReferencePlan.plannedBotAsk)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active bot bid</span>
                    <span>{formatToken(selectedReferencePlan.activeBotBid ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active bot ask</span>
                    <span>{formatToken(selectedReferencePlan.activeBotAsk ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>MM enabled</span>
                    <span>{selectedReferencePlan.mmEnabled ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mode</span>
                    <span>{selectedReferencePlan.dryRun ? "Dry run" : "Live"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Live orders</span>
                    <span>{selectedReferencePlan.liveOrdersEnabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-900">
                    {selectedReferencePlan.liveOrdersEnabled
                      ? "System liquidity active. This is not a user simulation bot."
                      : "Bot quote plan only. No live orders."}
                  </div>
                  {!selectedReferencePlan.mmEnabled ? (
                    <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700">
                      Quote preview only. MM disabled.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--poly-muted)]">Quote plan unavailable until reference data arrives.</div>
              )}
            </Card>
          ) : null}

          {showTradingControls ? (
            <OrderTicket
              market={market}
              selectedOutcomeId={outcomeId}
              onSelectedOutcomeIdChange={setOutcomeId}
              walletBalance={walletBalance}
              position={
                position
                  ? {
                      shares: position.shares,
                      reservedShares: position.reservedShares,
                    }
                  : null
              }
              bestBid={bestBid}
              bestAsk={bestAsk}
              onSubmitOrder={submitOrder}
              marketOrdersSupported
              submissionEnabled={internalTradingEnabled}
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Trading controls are disabled for this approved reference market.
            </div>
          )}

          {message ? (
            <div className="rounded-lg border border-[var(--poly-border)] bg-white px-4 py-3 text-sm text-[var(--poly-muted)]">
              {message}
            </div>
          ) : null}

          <Card className="p-4">
            <h2 className="text-lg font-semibold text-[var(--poly-text)]">My Position</h2>
            {netShares === 0 && reservedShares === 0 ? (
              <div className="mt-3 text-sm text-[var(--poly-muted)]">No position yet.</div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Shares</span>
                  <span>{formatToken(netShares)}</span>
                </div>
                {reservedShares > 0 ? (
                  <div className="flex items-center justify-between">
                    <span>Reserved</span>
                    <span>{formatToken(reservedShares)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>Avg Cost</span>
                  <span>{formatToken(avgCost)} / share</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mark Price</span>
                  <span>{formatToken(markPrice)} / share</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Position Value</span>
                  <span>{formatToken(marketValue)} U</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unrealized P&L</span>
                  <span
                    className={
                      unrealizedPnl !== null
                        ? unrealizedPnl > 0
                          ? "text-emerald-700"
                          : unrealizedPnl < 0
                            ? "text-rose-700"
                            : ""
                        : ""
                    }
                  >
                    {formatToken(unrealizedPnl)} U
                  </span>
                </div>
              </div>
            )}
          </Card>

          {showTradingControls ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-[var(--poly-text)]">My Open Orders</h2>
              <div className="mt-3 space-y-2 text-sm">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-2">
                    <div className="flex items-center justify-between">
                      <span>
                        {order.side} {order.outcomeName} {order.remaining.toFixed(2)}/{order.amount.toFixed(2)} @
                        {order.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="rounded-lg border border-[var(--poly-border)] bg-white px-2 py-1 text-xs text-[var(--poly-text)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
                {!orders.length ? <div className="text-[var(--poly-muted)]">No open orders.</div> : null}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

function formatReferenceAge(ageMs: number | null, hasSnapshot: boolean) {
  if (!hasSnapshot || ageMs == null) {
    return "Never";
  }
  if (ageMs < 1000) {
    return "<1s ago";
  }
  return `${Math.round(ageMs / 1000)}s ago`;
}

function formatReferenceQuality(qualityStatus: string | null, hasSnapshot: boolean) {
  if (!hasSnapshot) {
    return "No snapshot";
  }
  return qualityStatus ?? "--";
}

function formatReferenceTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

function formatBotInitializationStatus(status: string | null) {
  if (!status) {
    return "Not started";
  }
  return status.replaceAll("_", " ");
}

