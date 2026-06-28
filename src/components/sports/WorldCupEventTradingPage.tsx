"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { BetaNotice, PageHeader } from "@/components/ui/PageHeader";
import type { WorldCupEventPageModel, WorldCupEventGroup, WorldCupEventOutcome } from "@/lib/sports/worldCupEventPageModel";

const SOURCE_LABEL: Record<WorldCupEventOutcome["source"], string> = {
  local_bot_book: "Local book",
  reference_price: "Reference",
  no_live_price: "No live price",
  unmapped: "Not mapped",
  stale: "Stale",
};

export default function WorldCupEventTradingPage({ model }: { model: WorldCupEventPageModel }) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedOutcome, setSelectedOutcome] = useState<WorldCupEventOutcome | null>(() => firstOutcome(model));
  const [selectedLines, setSelectedLines] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(model.groups.map((group) => [group.id, group.selectedLine])),
  );

  const visibleGroups = useMemo(
    () => model.groups.filter((group) => selectedTab === "all" || group.category === selectedTab),
    [model.groups, selectedTab],
  );

  function handleSelectLine(group: WorldCupEventGroup, lineId: string) {
    setSelectedLines((current) => ({ ...current, [group.id]: lineId }));
    const selectedLine = group.lines.find((line) => line.id === lineId) ?? group.lines[0] ?? null;
    setSelectedOutcome(selectedLine?.outcomes[0] ?? group.outcomes[0] ?? null);
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <main className="min-w-0 space-y-5">
        <PageHeader
          eyebrow="World Cup"
          title={model.eventHeader.title}
          description={model.eventHeader.description ?? "Polymarket-style event view for internal beta trading."}
        >
          <div className="mb-4 text-sm text-[var(--poly-muted)]">
            <Link href="/sports/soccer/world-cup" className="hover:text-[var(--poly-primary)] hover:underline">
              World Cup
            </Link>
          </div>
          <div className="grid gap-4 rounded-lg border border-[var(--poly-border)] bg-white p-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{model.eventHeader.status}</Badge>
                {model.eventHeader.source ? <Badge tone="teal">{model.eventHeader.source}</Badge> : null}
                {model.eventHeader.mappedEvent ? <Badge>Mapped event</Badge> : <Badge tone="warning">No event mapping</Badge>}
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[var(--poly-muted)] sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-[var(--poly-text)]">Teams: </span>
                  {[model.eventHeader.homeTeamName, model.eventHeader.awayTeamName].filter(Boolean).join(" vs ") || "TBD"}
                </div>
                <div>
                  <span className="font-semibold text-[var(--poly-text)]">Start: </span>
                  {formatDateTime(model.eventHeader.startTime)}
                </div>
                <div>
                  <span className="font-semibold text-[var(--poly-text)]">Venue: </span>
                  {model.eventHeader.venue ?? "TBD"}
                </div>
                <div>
                  <span className="font-semibold text-[var(--poly-text)]">Volume: </span>
                  {formatCompact(model.volume)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4 md:grid-cols-2">
              <Diagnostic label="Mapped" value={model.diagnostics.mappedMarketsCount} />
              <Diagnostic label="Fresh refs" value={model.diagnostics.freshReferenceCount} />
              <Diagnostic label="Bot books" value={model.diagnostics.localBotLiquidityMarkets} />
              <Diagnostic label="Stale hidden" value={model.diagnostics.hiddenStaleMarkets} />
            </div>
          </div>
          <BetaNotice tone="info" className="mt-4">
            Closed internal beta: test balances only. Prices are labeled by source; unavailable outcomes explain why trading is disabled.
          </BetaNotice>
        </PageHeader>

        <section className="rounded-lg border border-[var(--poly-border)] bg-white">
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--poly-border)] px-3 py-3">
            {model.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={!tab.enabled}
                onClick={() => setSelectedTab(tab.id)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  selectedTab === tab.id
                    ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                    : tab.enabled
                      ? "border-[var(--poly-border)] bg-white text-[var(--poly-text)] hover:border-[var(--poly-primary)]"
                      : "cursor-not-allowed border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-[var(--poly-muted)]"
                }`}
              >
                {tab.label} <span className="ml-1 opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </section>

        {model.combos.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2">
            {model.combos.map((combo) => (
              <Card key={combo.id} className="p-4">
                <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Combo</div>
                <h3 className="mt-1 text-base font-semibold text-[var(--poly-text)]">{combo.title}</h3>
              </Card>
            ))}
          </section>
        ) : null}

        <section className="space-y-4">
          {visibleGroups.map((group) => (
            <MarketFamilyCard
              key={group.id}
              group={group}
              selectedLineId={selectedLines[group.id] ?? group.selectedLine}
              selectedOutcomeId={selectedOutcome?.outcomeId ?? null}
              onSelectLine={(lineId) => handleSelectLine(group, lineId)}
              onSelectOutcome={setSelectedOutcome}
            />
          ))}
        </section>
      </main>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <TradeTicket outcome={selectedOutcome} />
      </aside>
    </div>
  );
}

function MarketFamilyCard({
  group,
  selectedLineId,
  selectedOutcomeId,
  onSelectLine,
  onSelectOutcome,
}: {
  group: WorldCupEventGroup;
  selectedLineId: string | null;
  selectedOutcomeId: string | null;
  onSelectLine: (lineId: string) => void;
  onSelectOutcome: (outcome: WorldCupEventOutcome) => void;
}) {
  const selectedLine = group.lines.find((line) => line.id === selectedLineId) ?? group.lines[0] ?? null;
  const showLineSelector = group.displayType === "line_selector" && group.lines.length > 1;
  const outcomes = showLineSelector ? selectedLine?.outcomes ?? [] : group.outcomes;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--poly-border)] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--poly-text)]">{group.title}</h2>
            <Badge tone={group.tradeability.tradeable ? "positive" : "warning"}>
              {group.tradeability.tradeable ? "Tradeable" : group.tradeability.reasonIfDisabled ?? "Disabled"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--poly-muted)]">
            {group.displayType.replaceAll("_", " ")} / {SOURCE_LABEL[group.sourceStatus]}
          </p>
        </div>
        <div className="text-sm text-[var(--poly-muted)]">{group.outcomes.length} outcomes</div>
      </div>

      {showLineSelector ? (
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--poly-border)] px-4 py-3">
          {group.lines.map((line) => (
            <button
              key={line.id}
              type="button"
              onClick={() => onSelectLine(line.id)}
              className={`min-w-14 rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition ${
                selectedLine?.id === line.id
                  ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                  : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)]"
              }`}
            >
              {line.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="divide-y divide-[var(--poly-border)]">
        {outcomes.map((outcome) => (
          <button
            key={outcome.outcomeId}
            type="button"
            onClick={() => onSelectOutcome(outcome)}
            className={`grid w-full gap-3 px-4 py-3 text-left transition sm:grid-cols-[minmax(0,1fr)_150px_130px] sm:items-center ${
              selectedOutcomeId === outcome.outcomeId ? "bg-[var(--poly-surface-muted)]" : "hover:bg-[var(--poly-surface-muted)]"
            }`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--poly-text)]">{outcome.label}</div>
              <div className="mt-1 text-xs text-[var(--poly-muted)]">{outcome.reasonIfDisabled ?? "Internal orderbook trading available"}</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold tabular-nums text-[var(--poly-text)]">{formatOutcomePrice(outcome)}</div>
              <div className="text-xs text-[var(--poly-muted)]">{SOURCE_LABEL[outcome.source]}</div>
            </div>
            <div className="text-sm tabular-nums text-[var(--poly-muted)]">
              {formatBidAsk(outcome.bid, outcome.ask)}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function TradeTicket({ outcome }: { outcome: WorldCupEventOutcome | null }) {
  const [amount, setAmount] = useState("10");
  const numericAmount = Number(amount);
  const price = outcome?.ask ?? outcome?.price ?? null;
  const shares = price && Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount / price : 0;
  const potentialProfit = shares > 0 ? Math.max(0, shares - numericAmount) : 0;

  return (
    <Card className="p-5">
      <h2 className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Trade Ticket</h2>
      {outcome ? (
        <>
          <div className="mt-2 text-xl font-semibold text-[var(--poly-text)]">{outcome.label}</div>
          <div className="mt-3 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3 text-sm">
            <Row label="Source" value={SOURCE_LABEL[outcome.source]} />
            <Row label="Price" value={formatOutcomePrice(outcome)} />
            <Row label="Bid / Ask" value={formatBidAsk(outcome.bid, outcome.ask)} />
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase text-[var(--poly-muted)]">Amount</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-[var(--poly-border)] px-3 py-3 text-sm focus:border-[var(--poly-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)]"
            />
          </label>
          <div className="mt-4 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3 text-sm">
            <Row label="Estimated shares" value={shares ? shares.toFixed(2) : "Unavailable"} />
            <Row label="Potential profit" value={shares ? `$${potentialProfit.toFixed(2)}` : "Unavailable"} />
          </div>
          {outcome.tradeable ? (
            <Link
              href={`/markets/${outcome.marketId}`}
              className="mt-4 block w-full rounded-lg border border-[var(--poly-primary)] bg-[var(--poly-primary)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--poly-primary-hover)]"
            >
              Open internal order ticket
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--poly-muted)]"
            >
              Trading unavailable
            </button>
          )}
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {outcome.tradeable
              ? "Closed beta: test credits only. Final order review remains gated by server checks."
              : outcome.reasonIfDisabled ?? "Trading is disabled for this outcome."}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--poly-muted)]">Select an outcome to preview source, price, and tradeability.</p>
      )}
    </Card>
  );
}

function Diagnostic({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-3 py-2">
      <div className="text-lg font-semibold text-[var(--poly-text)]">{value}</div>
      <div className="text-[var(--poly-muted)]">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--poly-muted)]">{label}</span>
      <span className="font-semibold text-[var(--poly-text)]">{value}</span>
    </div>
  );
}

function firstOutcome(model: WorldCupEventPageModel) {
  return model.groups[0]?.outcomes[0] ?? null;
}

function formatOutcomePrice(outcome: WorldCupEventOutcome) {
  const price = outcome.price ?? outcome.referencePrice;
  if (price == null) return SOURCE_LABEL[outcome.source];
  return `${Math.round(price * 100)}c`;
}

function formatBidAsk(bid: number | null, ask: number | null) {
  if (bid == null && ask == null) return "No local book";
  const left = bid == null ? "No bid" : `${Math.round(bid * 100)}c`;
  const right = ask == null ? "No ask" : `${Math.round(ask * 100)}c`;
  return `${left} / ${right}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "TBD";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "TBD";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatCompact(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
