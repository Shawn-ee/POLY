"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import GroupedTradeTicket, { type SelectedTrade } from "@/components/GroupedTradeTicket";
import { formatDateTime, formatLeague, formatSport, formatStatus } from "@/components/sports/SportsEventCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import OutcomeButton from "@/components/ui/OutcomeButton";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";

type EventSummary = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  sportKey: string | null;
  leagueKey: string | null;
  eventType: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  startTime: string | null;
  status: string | null;
  source: string | null;
  externalEventId: string | null;
  externalSlug: string | null;
  image: string | null;
  icon: string | null;
  marketCount: number;
  activeMarketCount: number;
  closedMarketCount: number;
  hasGroupedMarkets?: boolean;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
};

type EventMarket = {
  id: string;
  title: string;
  description: string;
  status: string;
  marketType?: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
  prices: { YES: number; NO: number } | null;
  pricesByOutcome?: Record<string, number>;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  outcomes: {
    id: string;
    name: string;
    label?: string | null;
    code?: string | null;
    price?: number | null;
    bestBid?: number | null;
    bestAsk?: number | null;
  }[];
  resolveTime: string | null;
  referenceSummary?: {
    source: string;
    referenceBid: number | null;
    referenceAsk: number | null;
    plannedBotBid: number | null;
    plannedBotAsk: number | null;
    qualityStatus: string | null;
    isFresh: boolean;
    mmEligible: boolean;
    dryRun: boolean;
    quotePlanEnabled: boolean;
  } | null;
};

type GroupedEventResponse = {
  event: EventSummary;
  marketGroup: {
    title: string;
    slug: string;
    groupType: string;
    resolutionMode: string;
    source: string;
    externalSlug: string | null;
    expectedSumYesAround: number | null;
    negativeRiskLike: boolean;
    note: string | null;
  };
  rows: Array<{
    marketId: string;
    yesOutcomeId: string | null;
    noOutcomeId: string | null;
    outcomeLabel: string;
    icon: string | null;
    question: string;
    probability: number | null;
    bestBid: number | null;
    bestAsk: number | null;
    buyYesPrice: number | null;
    buyNoPrice: number | null;
    plannedBotBid: number | null;
    plannedBotAsk: number | null;
    mmEligible: boolean;
    botInitializationStatus: string | null;
    tradable: boolean;
    referenceOnly: boolean;
    volume24hr: number | null;
    liquidity: number | null;
    isFresh: boolean;
    qualityStatus: string | null;
    teamSlug: string;
    externalSlug: string | null;
  }>;
  sumYes: number;
  importedOutcomeCount: number;
  allOutcomesImported: boolean;
  freshnessSummary: {
    freshCount: number;
    staleCount: number;
    averageAgeMs: number | null;
  };
  groupStatus: "healthy" | "incomplete" | "stale" | "overpriced" | "underpriced";
};

export default function EventPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [markets, setMarkets] = useState<EventMarket[]>([]);
  const [grouped, setGrouped] = useState<GroupedEventResponse | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string>("");
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade | null>(null);
  const [marketGroup, setMarketGroup] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasGroupedEvent = grouped !== null;

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      const eventRes = await fetch(`/api/events/${encodeURIComponent(slug)}`);
      const eventData = await eventRes.json().catch(() => null);
      if (!eventRes.ok) {
        setError(eventData?.error ?? "Failed to load event.");
        setLoading(false);
        return;
      }

      const nextEvent = eventData.event as EventSummary;
      setEvent(nextEvent);

      if (nextEvent.hasGroupedMarkets) {
        const groupedRes = await fetch(`/api/events/${encodeURIComponent(slug)}/grouped-markets`);
        const groupedData = await groupedRes.json().catch(() => null);
        if (!groupedRes.ok) {
          setError(groupedData?.error ?? "Failed to load grouped markets.");
          setLoading(false);
          return;
        }
        setGrouped(groupedData as GroupedEventResponse);
        setSelectedRowId((groupedData.rows?.[0]?.marketId as string | undefined) ?? "");
        setSelectedTrade(null);
        setMarkets([]);
      } else {
        const marketsRes = await fetch(`/api/events/${encodeURIComponent(slug)}/markets`);
        const marketsData = await marketsRes.json().catch(() => null);
        if (!marketsRes.ok) {
          setError(marketsData?.error ?? "Failed to load event markets.");
          setLoading(false);
          return;
        }
        setMarkets(marketsData.markets ?? []);
        setGrouped(null);
      }
      setLoading(false);
    };

    load();
  }, [slug]);

  // Auto-refresh grouped data every 10s while viewing a grouped event
  useEffect(() => {
    if (!slug || !hasGroupedEvent) return;
    const timer = setInterval(async () => {
      const groupedRes = await fetch(`/api/events/${encodeURIComponent(slug)}/grouped-markets`);
      const groupedData = await groupedRes.json().catch(() => null);
      if (groupedRes.ok && groupedData) {
        setGrouped(groupedData as GroupedEventResponse);
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [slug, hasGroupedEvent]);

  const [binaryMarkets, nonBinaryMarkets] = useMemo(() => {
    const binary: EventMarket[] = [];
    const other: EventMarket[] = [];
    for (const market of markets) {
      if (market.prices && market.outcomes.length === 2) {
        binary.push(market);
      } else {
        other.push(market);
      }
    }
    return [binary, nonBinaryMarketsSort(other)];
  }, [markets]);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Event"
          title="Loading event"
          description="Preparing the event summary and related markets."
        />
        <LoadingState label="Loading event" count={4} />
      </PageContainer>
    );
  }

  if (error || !event) {
    return (
      <PageContainer>
        <ErrorState>
          <div className="space-y-3">
            <p>{error ?? "Event not found."}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sports" className="font-semibold text-red-800 underline-offset-4 hover:underline">
                Back to sports
              </Link>
              <Link href="/events" className="font-semibold text-red-800 underline-offset-4 hover:underline">
                View events
              </Link>
            </div>
          </div>
        </ErrorState>
      </PageContainer>
    );
  }

  if (grouped) {
    return (
      <PageContainer>
        <GroupedEventView
          grouped={grouped}
          selectedRowId={selectedRowId}
          onSelectRow={setSelectedRowId}
          selectedTrade={selectedTrade}
          onSelectTrade={setSelectedTrade}
          onCloseTrade={() => setSelectedTrade(null)}
          onRefreshGrouped={async () => {
            const groupedRes = await fetch(`/api/events/${encodeURIComponent(slug)}/grouped-markets`);
            const groupedData = await groupedRes.json().catch(() => null);
            if (groupedRes.ok && groupedData) {
              setGrouped(groupedData as GroupedEventResponse);
            }
          }}
        />
      </PageContainer>
    );
  }

  if (event.category === "sports") {
    return (
      <SportsEventView
        event={event}
        markets={markets}
        marketGroup={marketGroup}
        onMarketGroupChange={setMarketGroup}
      />
    );
  }

  return (
    <PageContainer size="default">
      <PageHeader
        eyebrow="Event"
        title={event.title}
        description={event.description ?? "Compare the related markets attached to this event."}
      >
        <div className="mb-4 text-sm text-[var(--poly-muted)]">
          <Link href="/events" className="hover:text-[var(--poly-primary)] hover:underline">
            All events
          </Link>
        </div>
        <div className="flex items-start gap-4">
          {event.image || event.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image ?? event.icon ?? ""} alt={event.title} className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-cyan-50 text-xs font-bold text-cyan-700">EVT</div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--poly-text)]">Event summary</h2>
            {event.description ? <p className="mt-2 text-sm text-[var(--poly-muted)]">{event.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {event.category ? <Badge>{event.category}</Badge> : null}
              {event.source ? <Badge tone="teal">{event.source}</Badge> : null}
              {event.status ? <Badge tone="primary">{event.status}</Badge> : null}
            </div>
          </div>
        </div>
        <BetaNotice tone="info" className="mt-5">
          Event markets are grouped for discovery. Trading controls remain inside each market or the review-gated trade area.
        </BetaNotice>
      </PageHeader>

      {binaryMarkets.length ? (
        <section>
          <SectionHeader title="Yes/No markets" description="Open a market to inspect details before trading." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {binaryMarkets.map((market) => (
            <MarketCard
              key={market.id}
              id={market.id}
              title={market.title}
              status={market.status}
              resolveTime={market.resolveTime}
              outcomes={market.outcomes}
              prices={market.prices ?? { YES: 0.5, NO: 0.5 }}
              visibility={market.visibility}
              mechanism={market.mechanism}
              referenceOnly={market.referenceOnly}
              tradable={market.tradable}
              referenceSummary={market.referenceSummary}
            />
          ))}
        </div>
        </section>
      ) : null}

      {nonBinaryMarkets.length ? (
        <div className="mt-8 space-y-4">
          <SectionHeader title="Other event markets" description="Additional markets connected to this event." />
          {nonBinaryMarkets.map((market) => (
            <Link key={market.id} href={`/markets/${market.id}`} className="block rounded-lg border border-[var(--poly-border)] bg-white p-4 shadow-[var(--poly-shadow-sm)] transition hover:border-[var(--poly-border-strong)] hover:shadow-[var(--poly-shadow-md)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[var(--poly-text)]">{market.title}</h3>
                  <p className="mt-1 text-sm text-[var(--poly-muted)]">{market.description}</p>
                </div>
                <div className="text-xs text-[var(--poly-muted)]">{market.referenceOnly && market.tradable === false ? "Coming soon" : market.status}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {!binaryMarkets.length && !nonBinaryMarkets.length ? (
        <EmptyState
          title="Markets for this event are not ready yet"
          description="View all markets or check back when more event markets are available."
        />
      ) : null}
    </PageContainer>
  );
}

function GroupedEventView({
  grouped,
  selectedRowId,
  onSelectRow,
  selectedTrade,
  onSelectTrade,
  onCloseTrade,
  onRefreshGrouped,
}: {
  grouped: GroupedEventResponse;
  selectedRowId: string;
  onSelectRow: (marketId: string) => void;
  selectedTrade: SelectedTrade | null;
  onSelectTrade: (trade: SelectedTrade) => void;
  onCloseTrade: () => void;
  onRefreshGrouped: () => Promise<void>;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Grouped event"
        title={grouped.event.title}
        description={grouped.event.description ?? "Compare grouped outcomes before selecting a Yes or No side."}
      >
        <div className="mb-4 text-sm text-[var(--poly-muted)]">
          <Link href="/events" className="hover:text-[var(--poly-primary)] hover:underline">
            All events
          </Link>
        </div>
        <div className="flex items-start gap-4">
          {grouped.event.image || grouped.event.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={grouped.event.image ?? grouped.event.icon ?? ""} alt={grouped.event.title} className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-cyan-50 text-xs font-bold text-cyan-700">WC</div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--poly-text)]">Grouped market summary</h2>
            {grouped.event.description ? <p className="mt-2 text-sm text-[var(--poly-muted)]">{grouped.event.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{grouped.marketGroup.groupType}</Badge>
              <Badge tone="primary">{grouped.marketGroup.resolutionMode}</Badge>
              <Badge tone="teal">{grouped.marketGroup.source}</Badge>
              <Badge tone="positive">
                Sum YES {(grouped.sumYes * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--poly-muted)]">
              <span>{grouped.rows.length} outcomes</span>
              <span>{grouped.freshnessSummary.freshCount} fresh</span>
              <span>Status: {grouped.groupStatus}</span>
              {!grouped.allOutcomesImported ? <span>Partial list</span> : null}
            </div>
          </div>
        </div>
        <BetaNotice tone="info" className="mt-5">
          Grouped prices refresh for discovery. The trade ticket remains separate so order review stays explicit.
        </BetaNotice>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-[var(--poly-muted)]">
                <tr>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Prob</th>
                  <th className="px-3 py-2">Bid / Ask</th>
                  <th className="px-3 py-2 text-right">Trade</th>
                </tr>
              </thead>
              <tbody>
                {grouped.rows.map((row) => (
                  <tr
                    key={row.marketId}
                    className={`border-t border-[var(--poly-border)] transition ${
                      selectedRowId === row.marketId ? "bg-[var(--poly-surface-muted)]" : ""
                    }`}
                    onClick={() => onSelectRow(row.marketId)}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {row.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.icon} alt={row.outcomeLabel} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                            {row.outcomeLabel.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[var(--poly-text)]">{row.outcomeLabel}</div>
                          <div className="text-xs text-[var(--poly-muted)]">
                            {row.referenceOnly && !row.tradable ? "Reference only" : "Tradable"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium">{formatPct(row.probability)}</td>
                    <td className="px-3 py-3 text-xs">
                      <div>{formatMaybe(row.bestBid)} / {formatMaybe(row.bestAsk)}</div>
                      <div className="text-[var(--poly-muted)]">{formatCompact(row.volume24hr)} vol</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <OutcomeButton
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row.marketId);
                            onSelectTrade({
                              marketId: row.marketId,
                              yesOutcomeId: row.yesOutcomeId,
                              noOutcomeId: row.noOutcomeId,
                              outcomeLabel: row.outcomeLabel,
                              tradeOutcome: "YES",
                              buyYesPrice: row.buyYesPrice,
                              buyNoPrice: row.buyNoPrice,
                              bestBid: row.bestBid,
                              bestAsk: row.bestAsk,
                              plannedBotBid: row.plannedBotBid,
                              plannedBotAsk: row.plannedBotAsk,
                              probability: row.probability,
                            });
                          }}
                          disabled={!row.tradable}
                          tone={row.tradable ? "yes" : "neutral"}
                          label="Yes"
                          price={formatPriceShort(row.buyYesPrice ?? row.bestAsk ?? row.plannedBotAsk ?? row.probability)}
                          className="min-h-9 px-3 py-1.5 text-xs"
                        />
                        <OutcomeButton
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row.marketId);
                            onSelectTrade({
                              marketId: row.marketId,
                              yesOutcomeId: row.yesOutcomeId,
                              noOutcomeId: row.noOutcomeId,
                              outcomeLabel: row.outcomeLabel,
                              tradeOutcome: "NO",
                              buyYesPrice: row.buyYesPrice,
                              buyNoPrice: row.buyNoPrice,
                              bestBid: row.bestBid,
                              bestAsk: row.bestAsk,
                              plannedBotBid: row.plannedBotBid,
                              plannedBotAsk: row.plannedBotAsk,
                              probability: row.probability,
                            });
                          }}
                          disabled={!row.tradable}
                          tone={row.tradable ? "no" : "neutral"}
                          label="No"
                          price={formatPriceShort(row.buyNoPrice ?? (row.bestBid != null ? 1 - row.bestBid : (row.buyYesPrice != null ? 1 - row.buyYesPrice : (row.probability != null ? 1 - row.probability : null))))}
                          className="min-h-9 px-3 py-1.5 text-xs"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="sticky top-6 h-fit">
          {selectedTrade ? (
            <GroupedTradeTicket
              trade={selectedTrade}
              onClose={onCloseTrade}
              onOrderPlaced={onRefreshGrouped}
            />
          ) : (
            <EmptyState title="Select an outcome" description="Choose Yes or No on an outcome to open the trade ticket." />
          )}
        </div>
      </div>
    </>
  );
}

function SportsEventView({
  event,
  markets,
  marketGroup,
  onMarketGroupChange,
}: {
  event: EventSummary;
  markets: EventMarket[];
  marketGroup: string;
  onMarketGroupChange: (group: string) => void;
}) {
  const filteredMarkets = useMemo(() => {
    if (marketGroup === "all") return markets;
    return markets.filter((market) => getSportsMarketGroup(market.marketType) === marketGroup);
  }, [marketGroup, markets]);

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const market of markets) {
      const group = getSportsMarketGroup(market.marketType);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
    return counts;
  }, [markets]);

  return (
    <PageContainer>
      <div className="mb-6 text-sm text-[var(--poly-muted)]">
        <Link href="/sports" className="hover:text-[var(--poly-primary)] hover:underline">
          Sports
        </Link>
        <span className="mx-2">/</span>
        <Link href="/sports/soccer" className="hover:text-[var(--poly-primary)] hover:underline">
          Soccer
        </Link>
      </div>

      <section className="mb-8 rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">
              {formatSport(event.sportKey) || "Sports"}
              {event.leagueKey ? ` / ${formatLeague(event.leagueKey)}` : ""}
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[var(--poly-text)]">
              {event.title}
            </h1>
            {event.description ? (
              <p className="mt-3 text-base text-[var(--poly-muted)]">{event.description}</p>
            ) : null}
          </div>
          <div className="grid gap-2 text-sm text-[var(--poly-text)] sm:grid-cols-2 lg:min-w-80">
            <div className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3">
              <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">Status</div>
              <div className="mt-1 font-medium capitalize">{formatStatus(event.status)}</div>
            </div>
            <div className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3">
              <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">Start</div>
              <div className="mt-1 font-medium">{formatDateTime(event.startTime)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <TeamPanel label="Home" name={event.homeTeamName ?? "Home team"} />
          <div className="hidden text-center text-xs font-semibold uppercase text-neutral-400 sm:block">
            vs
          </div>
          <TeamPanel label="Away" name={event.awayTeamName ?? "Away team"} alignRight />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Event markets"
          description="Multiple orderbook markets grouped under one sports event."
          action={<Link href="/markets" className="text-sm font-semibold text-[var(--poly-primary)] hover:text-[var(--poly-primary-hover)]">
            General markets
          </Link>}
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "all", label: "All", count: markets.length },
            { key: "match", label: "Match", count: groupCounts.get("match") ?? 0 },
            { key: "goals", label: "Goals", count: groupCounts.get("goals") ?? 0 },
            { key: "qualify", label: "Qualify", count: groupCounts.get("qualify") ?? 0 },
            { key: "score", label: "Score", count: groupCounts.get("score") ?? 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onMarketGroupChange(tab.key)}
              className={`rounded-full border px-3 py-1 text-sm ${
                marketGroup === tab.key
                  ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                  : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {filteredMarkets.length === 0 ? (
          <EmptyState title="No markets in this group" description="Choose another event market filter." />
        ) : (
          <div className="space-y-4">
            {filteredMarkets.map((market) => (
              <SportsMarketPanel key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function TeamPanel({
  label,
  name,
  alignRight,
}: {
  label: string;
  name: string;
  alignRight?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-4 ${alignRight ? "sm:text-right" : ""}`}>
      <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--poly-text)]">{name}</div>
    </div>
  );
}

function SportsMarketPanel({ market }: { market: EventMarket }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--poly-text)]">{market.title}</h3>
          {market.description ? (
            <p className="mt-1 text-sm text-[var(--poly-muted)]">{market.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{formatMarketType(market.marketType)}</Badge>
          <Badge tone="primary">{formatStatus(market.status)}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {market.outcomes.map((outcome) => {
          const price = outcome.price ?? market.pricesByOutcome?.[outcome.id] ?? null;
          return (
            <Link
              key={outcome.id}
              href={`/markets/${market.id}?outcomeId=${outcome.id}`}
              className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-4 transition hover:border-[var(--poly-primary)] hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--poly-text)]">
                    {outcome.label ?? outcome.name}
                  </div>
                  {outcome.code ? (
                    <div className="mt-1 text-xs uppercase text-[var(--poly-muted)]">{outcome.code}</div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--poly-text)]">{formatProbability(price)}</div>
                  <div className="mt-1 text-xs text-[var(--poly-muted)]">
                    {formatBidAsk(outcome.bestBid, outcome.bestAsk)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function getSportsMarketGroup(marketType: string | null | undefined) {
  switch (marketType) {
    case "match_winner_1x2":
    case "both_teams_to_score":
    case "yes_no":
    case "generic":
      return "match";
    case "total_goals":
      return "goals";
    case "team_to_qualify":
      return "qualify";
    case "correct_score":
      return "score";
    default:
      return "match";
  }
}

function formatMarketType(value: string | null | undefined) {
  if (!value) return "Market";
  return value.replaceAll("_", " ");
}

function formatProbability(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "--";
}

function formatBidAsk(bid: number | null | undefined, ask: number | null | undefined) {
  const left = typeof bid === "number" && Number.isFinite(bid) ? bid.toFixed(2) : "--";
  const right = typeof ask === "number" && Number.isFinite(ask) ? ask.toFixed(2) : "--";
  return `${left} / ${right}`;
}

function formatPct(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "--";
}

function formatMaybe(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") : "--";
}

function formatPriceShort(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(0)}c` : "--";
}

function formatCompact(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function nonBinaryMarketsSort(markets: EventMarket[]) {
  return [...markets].sort((left, right) => right.title.localeCompare(left.title));
}
