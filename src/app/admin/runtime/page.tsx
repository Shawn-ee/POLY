"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/States";

type RuntimeStatus = {
  generatedAt: string;
  serviceHealth: { referenceSyncHeartbeat: string | null; status: string };
  referenceSync: { latestSnapshotAt: string | null; totalSnapshots: number; freshSnapshots: number; staleSnapshots: number };
  marketMaker: { enabledConfigCount: number; dryRunConfigCount: number; openInternalOrders: number; dryRunIntentCount: number; liveLocalIntentCount: number };
  worldCup: {
    events: number;
    mappedMarkets: number;
    verifiedMappings: number;
    unmappedMarkets: number;
    eligibleUserFacingMarkets: number;
    hiddenUnmappedMarkets: number;
    hiddenNoReferenceMarkets: number;
    hiddenDraftMarkets: number;
    eventsWithEligibleMarkets: number;
    eventsWithZeroEligibleMarkets: number;
    hiddenStaleEvents: number;
    publicDraftLeakCount: number;
  };
  risk: { alerts: number; unsafeFlags: string[] };
  safety: Record<string, boolean>;
  ownerTesting: { canOwnerTrade: boolean; ownerTestBalanceRecords: number; activeLiquidityMarkets: number };
  execution: {
    recent: Array<{
      fillId: string;
      createdAt: string;
      marketTitle: string;
      outcomeName: string;
      taker: string;
      maker: string;
      makerIsBot: boolean;
      side: "BUY" | "SELL";
      submittedLimit: string;
      actualFillPrice: string;
      shares: string;
      notionalUSDC: string;
      feeUSDC: string;
      priceImprovementUSDC: string;
      ledgerEntryCount: number;
    }>;
  };
  quoteExplanations: Array<{
    marketTitle: string;
    outcomeName: string;
    referenceBid: string | null;
    referenceAsk: string | null;
    referenceMid: string | null;
    localBotBid: string | null;
    localBotAsk: string | null;
    bidSize: string | null;
    askSize: string | null;
    lastReferenceAt: string | null;
    lastBotRefreshAt: string;
    stale: boolean;
    riskStatus: string;
    skipReason: string | null;
  }>;
};

export default function AdminRuntimePage() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    fetch("/api/admin/runtime")
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message ?? body?.error ?? "Runtime status unavailable.");
        if (!canceled) setStatus(body as RuntimeStatus);
      })
      .catch((err) => {
        if (!canceled) setError(err instanceof Error ? err.message : "Runtime status unavailable.");
      });
    return () => {
      canceled = true;
    };
  }, []);

  if (error) {
    return (
      <PageContainer>
        <ErrorState>{error}</ErrorState>
      </PageContainer>
    );
  }

  if (!status) {
    return (
      <PageContainer>
        <PageHeader eyebrow="Admin" title="Runtime" description="Closed beta runtime status." />
        <LoadingState label="Loading runtime status" count={4} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin"
        title="Runtime"
        description="Closed beta service health, World Cup mapping, reference sync, MM, and safety status."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Runtime" value={status.serviceHealth.status} />
        <Metric title="Reference snapshots" value={`${status.referenceSync.freshSnapshots} fresh / ${status.referenceSync.staleSnapshots} stale`} />
        <Metric title="MM configs" value={`${status.marketMaker.enabledConfigCount} enabled`} />
        <Metric title="Owner can trade" value={status.ownerTesting.canOwnerTrade ? "Yes" : "No"} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RuntimeCard title="World Cup">
          <Row label="Events" value={status.worldCup.events} />
          <Row label="Mapped markets" value={status.worldCup.mappedMarkets} />
          <Row label="Verified mappings" value={status.worldCup.verifiedMappings} />
          <Row label="User-facing eligible markets" value={status.worldCup.eligibleUserFacingMarkets} />
          <Row label="Events with eligible markets" value={status.worldCup.eventsWithEligibleMarkets} />
          <Row label="Events with zero eligible markets" value={status.worldCup.eventsWithZeroEligibleMarkets} />
          <Row label="Unmapped markets" value={status.worldCup.unmappedMarkets} />
          <Row label="Hidden unmapped markets" value={status.worldCup.hiddenUnmappedMarkets} />
          <Row label="Hidden no-reference markets" value={status.worldCup.hiddenNoReferenceMarkets} />
          <Row label="Hidden draft/admin markets" value={status.worldCup.hiddenDraftMarkets} />
          <Row label="Hidden stale events" value={status.worldCup.hiddenStaleEvents} />
          <Row label="Public draft leak count" value={status.worldCup.publicDraftLeakCount} />
        </RuntimeCard>
        <RuntimeCard title="Market Maker">
          <Row label="Dry-run configs" value={status.marketMaker.dryRunConfigCount} />
          <Row label="Open internal orders" value={status.marketMaker.openInternalOrders} />
          <Row label="Dry-run intents" value={status.marketMaker.dryRunIntentCount} />
          <Row label="Live-local intents" value={status.marketMaker.liveLocalIntentCount} />
        </RuntimeCard>
        <RuntimeCard title="Safety Flags">
          {Object.entries(status.safety).map(([key, value]) => (
            <Row key={key} label={key} value={String(value)} />
          ))}
        </RuntimeCard>
        <RuntimeCard title="Risk">
          <Row label="Risk alerts" value={status.risk.alerts} />
          <Row label="Unsafe flags" value={status.risk.unsafeFlags.length ? status.risk.unsafeFlags.join(", ") : "none"} />
        </RuntimeCard>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <RuntimeCard title="Recent Executions">
          {status.execution.recent.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-[var(--poly-muted)]">
                  <tr>
                    <th className="px-2 py-2">Time</th>
                    <th className="px-2 py-2">Market</th>
                    <th className="px-2 py-2">Side</th>
                    <th className="px-2 py-2">Limit</th>
                    <th className="px-2 py-2">Fill</th>
                    <th className="px-2 py-2">Improve</th>
                    <th className="px-2 py-2">Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {status.execution.recent.map((fill) => (
                    <tr key={fill.fillId} className="border-t border-[var(--poly-border)]">
                      <td className="px-2 py-2">{formatTime(fill.createdAt)}</td>
                      <td className="px-2 py-2">
                        <div className="font-semibold">{fill.outcomeName}</div>
                        <div className="text-[var(--poly-muted)]">{fill.marketTitle}</div>
                        <div className="text-[var(--poly-muted)]">Maker: {fill.makerIsBot ? "local bot" : fill.maker}</div>
                      </td>
                      <td className="px-2 py-2">{fill.side}</td>
                      <td className="px-2 py-2">{formatPrice(fill.submittedLimit)}</td>
                      <td className="px-2 py-2">
                        {fill.shares} @ {formatPrice(fill.actualFillPrice)}
                        <div className="text-[var(--poly-muted)]">${Number(fill.notionalUSDC).toFixed(2)}</div>
                      </td>
                      <td className="px-2 py-2">${Number(fill.priceImprovementUSDC).toFixed(2)}</td>
                      <td className="px-2 py-2">{fill.ledgerEntryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-[var(--poly-muted)]">No recent fills.</div>
          )}
        </RuntimeCard>
        <RuntimeCard title="MM Quote Explanation">
          {status.quoteExplanations.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-[var(--poly-muted)]">
                  <tr>
                    <th className="px-2 py-2">Outcome</th>
                    <th className="px-2 py-2">Reference</th>
                    <th className="px-2 py-2">Local bot</th>
                    <th className="px-2 py-2">Size</th>
                    <th className="px-2 py-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {status.quoteExplanations.map((quote) => (
                    <tr key={`${quote.marketTitle}:${quote.outcomeName}`} className="border-t border-[var(--poly-border)]">
                      <td className="px-2 py-2">
                        <div className="font-semibold">{quote.outcomeName}</div>
                        <div className="text-[var(--poly-muted)]">{quote.marketTitle}</div>
                      </td>
                      <td className="px-2 py-2">
                        {formatPrice(quote.referenceBid)} / {formatPrice(quote.referenceAsk)}
                        <div className="text-[var(--poly-muted)]">mid {formatPrice(quote.referenceMid)}</div>
                      </td>
                      <td className="px-2 py-2">
                        {formatPrice(quote.localBotBid)} / {formatPrice(quote.localBotAsk)}
                        <div className="text-[var(--poly-muted)]">{formatTime(quote.lastBotRefreshAt)}</div>
                      </td>
                      <td className="px-2 py-2">{quote.bidSize ?? "-"} / {quote.askSize ?? "-"}</td>
                      <td className="px-2 py-2">{quote.riskStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-[var(--poly-muted)]">No active local bot quotes.</div>
          )}
        </RuntimeCard>
      </div>
    </PageContainer>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">{title}</div>
      <div className="mt-2 text-lg font-semibold text-[var(--poly-text)]">{value}</div>
    </Card>
  );
}

function RuntimeCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="text-base font-semibold text-[var(--poly-text)]">{title}</h2>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--poly-muted)]">{label}</span>
      <span className="text-right font-semibold text-[var(--poly-text)]">{value}</span>
    </div>
  );
}

function formatPrice(value: string | number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 100)}c` : "-";
}

function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleTimeString() : "-";
}
