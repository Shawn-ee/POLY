"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import GroupedTradeTicket, { type SelectedTrade } from "@/components/GroupedTradeTicket";
import { formatDateTime, formatLeague, formatSport, formatStatus } from "@/components/sports/SportsEventCard";

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
    return <main className="mx-auto max-w-7xl px-6 py-10 text-sm text-neutral-600">Loading event...</main>;
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          {error ?? "Event not found."}
        </div>
      </main>
    );
  }

  if (grouped) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
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
      </main>
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm text-neutral-500">
          <Link href="/events" className="hover:text-neutral-700 hover:underline">
            All events
          </Link>
        </div>
        <div className="flex items-start gap-4">
          {event.image || event.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image ?? event.icon ?? ""} alt={event.title} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-500">EVT</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-neutral-900">{event.title}</h1>
            {event.description ? <p className="mt-2 text-sm text-neutral-600">{event.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              {event.category ? <span className="rounded-full border border-neutral-200 px-2 py-1">{event.category}</span> : null}
              {event.source ? <span className="rounded-full border border-neutral-200 px-2 py-1">{event.source}</span> : null}
              {event.status ? <span className="rounded-full border border-neutral-200 px-2 py-1">{event.status}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {binaryMarkets.length ? (
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
      ) : null}

      {nonBinaryMarkets.length ? (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Other Event Markets</h2>
          {nonBinaryMarkets.map((market) => (
            <Link key={market.id} href={`/markets/${market.id}`} className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">{market.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{market.description}</p>
                </div>
                <div className="text-xs text-neutral-500">{market.referenceOnly && market.tradable === false ? "Coming soon" : market.status}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </main>
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
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm text-neutral-500">
          <Link href="/events" className="hover:text-neutral-700 hover:underline">
            All events
          </Link>
        </div>
        <div className="flex items-start gap-4">
          {grouped.event.image || grouped.event.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={grouped.event.image ?? grouped.event.icon ?? ""} alt={grouped.event.title} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-500">WC</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-neutral-900">{grouped.event.title}</h1>
            {grouped.event.description ? <p className="mt-2 text-sm text-neutral-600">{grouped.event.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span className="rounded-full border border-neutral-200 px-2 py-1">{grouped.marketGroup.groupType}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1">{grouped.marketGroup.resolutionMode}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1">{grouped.marketGroup.source}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1">
                Sum YES {(grouped.sumYes * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-500">
              <span>{grouped.rows.length} outcomes</span>
              <span>{grouped.freshnessSummary.freshCount} fresh</span>
              <span>Status: {grouped.groupStatus}</span>
              {!grouped.allOutcomesImported ? <span>Partial list</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
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
                    className={`border-t border-neutral-100 transition ${
                      selectedRowId === row.marketId ? "bg-neutral-50" : ""
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
                          <div className="font-medium text-neutral-900">{row.outcomeLabel}</div>
                          <div className="text-xs text-neutral-500">
                            {row.referenceOnly && !row.tradable ? "Reference only" : "Tradable"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium">{formatPct(row.probability)}</td>
                    <td className="px-3 py-3 text-xs">
                      <div>{formatMaybe(row.bestBid)} / {formatMaybe(row.bestAsk)}</div>
                      <div className="text-neutral-400">{formatCompact(row.volume24hr)} vol</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
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
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            row.tradable
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          Yes {formatPriceShort(row.buyYesPrice ?? row.bestAsk ?? row.plannedBotAsk ?? row.probability)}
                        </button>
                        <button
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
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            row.tradable
                              ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          No {formatPriceShort(row.buyNoPrice ?? (row.bestBid != null ? 1 - row.bestBid : (row.buyYesPrice != null ? 1 - row.buyYesPrice : (row.probability != null ? 1 - row.probability : null))))}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sticky top-6 h-fit">
          {selectedTrade ? (
            <GroupedTradeTicket
              trade={selectedTrade}
              onClose={onCloseTrade}
              onOrderPlaced={onRefreshGrouped}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
              Click <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Yes</span> or{" "}
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">No</span>{" "}
              on an outcome to trade.
            </div>
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
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 text-sm text-neutral-500">
        <Link href="/sports" className="hover:text-neutral-700 hover:underline">
          Sports
        </Link>
        <span className="mx-2">/</span>
        <Link href="/sports/soccer" className="hover:text-neutral-700 hover:underline">
          Soccer
        </Link>
      </div>

      <section className="mb-8 border-b border-neutral-200 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase text-neutral-500">
              {formatSport(event.sportKey) || "Sports"}
              {event.leagueKey ? ` / ${formatLeague(event.leagueKey)}` : ""}
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950">
              {event.title}
            </h1>
            {event.description ? (
              <p className="mt-3 text-base text-neutral-600">{event.description}</p>
            ) : null}
          </div>
          <div className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2 lg:min-w-80">
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="text-xs uppercase text-neutral-500">Status</div>
              <div className="mt-1 font-medium capitalize">{formatStatus(event.status)}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="text-xs uppercase text-neutral-500">Start</div>
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
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950">Event Markets</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Multiple orderbook markets grouped under one sports event.
            </p>
          </div>
          <Link href="/markets" className="text-sm text-neutral-600 hover:text-neutral-950">
            General markets
          </Link>
        </div>

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
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white text-neutral-700"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {filteredMarkets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
            No markets in this group.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMarkets.map((market) => (
              <SportsMarketPanel key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>
    </main>
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
    <div className={`rounded-lg border border-neutral-200 bg-white p-4 ${alignRight ? "sm:text-right" : ""}`}>
      <div className="text-xs font-medium uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-950">{name}</div>
    </div>
  );
}

function SportsMarketPanel({ market }: { market: EventMarket }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">{market.title}</h3>
          {market.description ? (
            <p className="mt-1 text-sm text-neutral-600">{market.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
          <span className="rounded-full border border-neutral-200 px-2 py-1">
            {formatMarketType(market.marketType)}
          </span>
          <span className="rounded-full border border-neutral-200 px-2 py-1">
            {formatStatus(market.status)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {market.outcomes.map((outcome) => {
          const price = outcome.price ?? market.pricesByOutcome?.[outcome.id] ?? null;
          return (
            <Link
              key={outcome.id}
              href={`/markets/${market.id}?outcomeId=${outcome.id}`}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition hover:border-neutral-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-950">
                    {outcome.label ?? outcome.name}
                  </div>
                  {outcome.code ? (
                    <div className="mt-1 text-xs uppercase text-neutral-500">{outcome.code}</div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-950">{formatProbability(price)}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {formatBidAsk(outcome.bestBid, outcome.bestAsk)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
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
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(0)}¢` : "--";
}

function formatCompact(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function nonBinaryMarketsSort(markets: EventMarket[]) {
  return [...markets].sort((left, right) => right.title.localeCompare(left.title));
}
