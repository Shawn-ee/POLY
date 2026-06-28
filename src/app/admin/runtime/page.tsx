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
  worldCup: { events: number; mappedMarkets: number; verifiedMappings: number; unmappedMarkets: number; hiddenStaleEvents: number; publicDraftLeakCount: number };
  risk: { alerts: number; unsafeFlags: string[] };
  safety: Record<string, boolean>;
  ownerTesting: { canOwnerTrade: boolean; ownerTestBalanceRecords: number; activeLiquidityMarkets: number };
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
          <Row label="Unmapped markets" value={status.worldCup.unmappedMarkets} />
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
