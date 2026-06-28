"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, StatCard } from "@/components/ui/PageHeader";

type View = "overview" | "imports" | "mappings" | "referencePrices" | "marketMaker" | "risk" | "ops";

type ReferenceMarket = {
  id: string;
  title: string;
  externalSlug: string | null;
  importStatus: string | null;
  mmEnabled: boolean | null;
  outcomes: Array<{ id: string; name: string; referenceTokenId: string | null; referenceOutcomeLabel: string | null }>;
};

type ReferencePrice = {
  marketId: string;
  marketTitle?: string;
  outcomeId: string;
  outcomeName?: string;
  bestBid?: string | number | null;
  bestAsk?: string | number | null;
  mid?: string | number | null;
  outcomePrice?: string | number | null;
  qualityStatus?: string | null;
  mmEligible?: boolean;
  fetchedAt?: string;
};

type MarketMakerSummary = {
  configs?: Array<Record<string, unknown>>;
  intents?: Array<Record<string, unknown>>;
  openOrders?: Array<Record<string, unknown>>;
};

type RiskSummary = {
  alertCount?: number;
  alerts?: Array<Record<string, unknown>>;
};

type OpsSummary = Record<string, unknown>;

const nav: Array<{ href: string; label: string; view: View }> = [
  { href: "/admin/polymarket", label: "Overview", view: "overview" },
  { href: "/admin/polymarket/imports", label: "Imports", view: "imports" },
  { href: "/admin/polymarket/mappings", label: "Mappings", view: "mappings" },
  { href: "/admin/reference-prices", label: "Reference Prices", view: "referencePrices" },
  { href: "/admin/market-maker", label: "Market Maker", view: "marketMaker" },
  { href: "/admin/bot-risk", label: "Bot Risk", view: "risk" },
  { href: "/admin/ops", label: "Ops", view: "ops" },
];

export default function PolymarketOpsDashboard({ view = "overview" }: { view?: View }) {
  const [markets, setMarkets] = useState<ReferenceMarket[]>([]);
  const [prices, setPrices] = useState<ReferencePrice[]>([]);
  const [mm, setMm] = useState<MarketMakerSummary>({});
  const [risk, setRisk] = useState<RiskSummary>({});
  const [ops, setOps] = useState<OpsSummary>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [marketsRes, pricesRes, mmRes, riskRes, opsRes] = await Promise.all([
        fetch("/api/admin/reference-markets?source=polymarket"),
        fetch("/api/admin/reference-prices?source=polymarket"),
        fetch("/api/admin/market-maker"),
        fetch("/api/admin/bot-risk"),
        fetch("/api/admin/ops"),
      ]);
      const [marketsJson, pricesJson, mmJson, riskJson, opsJson] = await Promise.all([
        marketsRes.json().catch(() => ({})),
        pricesRes.json().catch(() => ({})),
        mmRes.json().catch(() => ({})),
        riskRes.json().catch(() => ({})),
        opsRes.json().catch(() => ({})),
      ]);
      setMarkets((marketsJson.items ?? []) as ReferenceMarket[]);
      setPrices((pricesJson.items ?? []) as ReferencePrice[]);
      setMm(mmJson as MarketMakerSummary);
      setRisk(riskJson as RiskSummary);
      setOps(opsJson as OpsSummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const verified = markets.filter((market) => market.importStatus === "approved").length;
    const mappedOutcomes = markets.reduce(
      (sum, market) => sum + market.outcomes.filter((outcome) => outcome.referenceTokenId).length,
      0,
    );
    return {
      markets: markets.length,
      verified,
      mappedOutcomes,
      prices: prices.length,
      configs: mm.configs?.length ?? 0,
      intents: mm.intents?.length ?? 0,
      openOrders: mm.openOrders?.length ?? 0,
      riskAlerts: risk.alertCount ?? risk.alerts?.length ?? 0,
    };
  }, [markets, prices, mm, risk]);

  const refreshCandidates = async () => {
    setMessage("Refreshing candidates...");
    const response = await fetch("/api/admin/polymarket/import-candidates/refresh", { method: "POST" });
    setMessage(response.ok ? "Candidate refresh requested." : "Candidate refresh failed.");
    await load();
  };

  const runDryRun = async () => {
    setMessage("Running dry-run...");
    const response = await fetch("/api/admin/market-maker", { method: "POST" });
    setMessage(response.ok ? "Dry-run completed." : "Dry-run failed.");
    await load();
  };

  const pauseAll = async () => {
    setMessage("Pausing bot quotes...");
    const response = await fetch("/api/admin/market-maker/pause-all", { method: "POST" });
    setMessage(response.ok ? "Pause-all completed." : "Pause-all failed.");
    await load();
  };

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Polymarket Reference MM"
        title={titleFor(view)}
        description="Local and staging controls for reference market import, mapping, pricing, quote intents, bot orders, and safety status."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Button type="button" variant="secondary" onClick={() => void refreshCandidates()}>
              Discover
            </Button>
            <Button type="button" variant="outline" onClick={() => void runDryRun()}>
              Dry Run
            </Button>
            <Button type="button" variant="negative" onClick={() => void pauseAll()}>
              Pause All
            </Button>
          </>
        }
      >
        <BetaNotice title="Local/staging only" tone="warning">
          Live-local order placement remains behind server-side kill switches and demo-balance guards. No production deploy, real-money mode, or payout signing is enabled here.
        </BetaNotice>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              item.view === view
                ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                : "border-[var(--poly-border)] bg-white text-[var(--poly-text)] hover:border-[var(--poly-primary)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {message ? <Card className="mb-5 p-3 text-sm text-[var(--poly-muted)]">{message}</Card> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Reference Markets" value={stats.markets} />
        <StatCard label="Verified" value={stats.verified} tone={stats.verified > 0 ? "positive" : "neutral"} />
        <StatCard label="Mapped Outcomes" value={stats.mappedOutcomes} />
        <StatCard label="Risk Alerts" value={stats.riskAlerts} tone={stats.riskAlerts > 0 ? "warning" : "positive"} />
      </div>

      {(view === "overview" || view === "imports" || view === "mappings") ? (
        <Section title="Markets and Mappings">
          {markets.slice(0, view === "overview" ? 8 : 50).map((market) => (
            <Card key={market.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-semibold text-[var(--poly-text)]">{market.title}</div>
                  <div className="mt-1 text-xs text-[var(--poly-muted)]">{market.externalSlug ?? market.id}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {market.outcomes.map((outcome) => (
                      <Badge key={outcome.id} tone={outcome.referenceTokenId ? "positive" : "warning"}>
                        {outcome.name}: {outcome.referenceOutcomeLabel ?? "unmapped"}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge tone={market.importStatus === "approved" ? "positive" : "warning"}>{market.importStatus ?? "unknown"}</Badge>
                  <Badge tone={market.mmEnabled ? "teal" : "neutral"}>{market.mmEnabled ? "MM" : "MM off"}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </Section>
      ) : null}

      {(view === "overview" || view === "referencePrices") ? (
        <Section title="Reference Prices">
          <DataRows rows={prices.slice(0, view === "overview" ? 8 : 80)} fields={["marketTitle", "outcomeName", "bestBid", "bestAsk", "mid", "qualityStatus", "fetchedAt"]} />
        </Section>
      ) : null}

      {(view === "overview" || view === "marketMaker") ? (
        <Section title="Market Maker">
          <DataRows rows={mm.configs ?? []} fields={["marketTitle", "outcomeName", "enabled", "dryRun", "edgeTicks", "baseOrderSize", "staleAfterSeconds"]} />
          <DataRows rows={mm.intents ?? []} fields={["marketTitle", "outcomeName", "side", "price", "size", "status", "dryRun", "createdAt"]} />
          <DataRows rows={mm.openOrders ?? []} fields={["username", "marketTitle", "outcomeName", "side", "price", "remaining", "status"]} />
        </Section>
      ) : null}

      {(view === "overview" || view === "risk") ? (
        <Section title="Risk and Stale Quotes">
          <DataRows rows={risk.alerts ?? []} fields={["marketTitle", "outcomeName", "ageSeconds", "staleAfterSeconds", "qualityStatus", "reason"]} />
        </Section>
      ) : null}

      {(view === "overview" || view === "ops") ? (
        <Section title="Ops Status">
          <DataRows rows={[ops]} fields={["referenceMarkets", "verifiedMappings", "referenceSnapshots", "botConfigs", "dryRunIntents", "liveLocalIntents", "openOrders", "pendingResolutionMarkets"]} />
        </Section>
      ) : null}
    </PageContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-[var(--poly-text)]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DataRows({ rows, fields }: { rows: Array<Record<string, unknown>>; fields: string[] }) {
  if (rows.length === 0) {
    return <Card className="p-4 text-sm text-[var(--poly-muted)]">No rows.</Card>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--poly-border)] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--poly-surface-muted)] text-xs uppercase text-[var(--poly-muted)]">
          <tr>
            {fields.map((field) => (
              <th key={field} className="px-3 py-2">{field}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-t border-[var(--poly-border)]">
              {fields.map((field) => (
                <td key={field} className="max-w-[18rem] truncate px-3 py-2 text-[var(--poly-text)]">
                  {formatCell(row[field])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function titleFor(view: View) {
  if (view === "imports") return "Polymarket Imports";
  if (view === "mappings") return "Polymarket Mappings";
  if (view === "referencePrices") return "Reference Prices";
  if (view === "marketMaker") return "Market Maker";
  if (view === "risk") return "Bot Risk";
  if (view === "ops") return "Ops";
  return "Polymarket";
}
