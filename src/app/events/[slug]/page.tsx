"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import { formatDateTime, formatLeague, formatSport, formatStatus } from "@/components/sports/SportsEventCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import OutcomeButton from "@/components/ui/OutcomeButton";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import {
  buildWorldCupMarketSections,
  canAddWorldCupComboLeg,
  estimateWorldCupComboTicket,
  estimateWorldCupTicket,
  findWorldCupOutcomeSelection,
  formatWorldCupMarketRowTitle,
  getSelectedWorldCupLine,
  type WorldCupComboLeg,
  type WorldCupMarketLine,
  type WorldCupMarketBundle,
} from "@/lib/worldCupMarketStructure";
import WorldCupEventTradingPage from "@/components/sports/WorldCupEventTradingPage";
import { buildWorldCupEventPageModel } from "@/lib/sports/worldCupEventPageModel";

type SelectedTrade = {
  marketId: string;
  yesOutcomeId: string | null;
  noOutcomeId: string | null;
  outcomeLabel: string;
  tradeOutcome: "YES" | "NO";
  buyYesPrice: number | null;
  buyNoPrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  probability: number | null;
};

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
  liveStatus: string | null;
  period: string | null;
  clock: string | null;
  homeScore: number | null;
  awayScore: number | null;
  source: string | null;
  externalEventId: string | null;
  externalSlug: string | null;
  venue: string | null;
  image: string | null;
  icon: string | null;
  sourceUpdatedAt: string | null;
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
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  displayOrder?: number | null;
  line?: string | null;
  unit?: string | null;
  period?: string | null;
  participantType?: string | null;
  participantName?: string | null;
  participantId?: string | null;
  propCategory?: string | null;
  rulesText?: string | null;
  sourceUpdatedAt?: string | null;
  marketType?: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
  prices: { YES: number; NO: number } | null;
  pricesByOutcome?: Record<string, number | null>;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  outcomes: {
    id: string;
    name: string;
    label?: string | null;
    code?: string | null;
    side?: string | null;
    status?: string | null;
    displayOrder?: number | null;
    resolvedResult?: string | null;
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

type SelectedWorldCupOutcome = {
  market: EventMarket;
  outcome: EventMarket["outcomes"][number];
  price: number | null;
  line: string | null;
  bundleTitle: string;
  outcomeLabel: string;
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
  const [marketSearch, setMarketSearch] = useState("");
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
        />
      </PageContainer>
    );
  }

  if (event.category === "sports") {
    const model = buildWorldCupEventPageModel({
      event,
      markets,
      internalTradingEnabled: process.env.NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED === "true",
      tradingKillSwitch: process.env.NEXT_PUBLIC_TRADING_KILL_SWITCH === "true",
      realMoneyMode: process.env.NEXT_PUBLIC_REAL_MONEY_MODE === "true",
    });
    return (
      <WorldCupEventTradingPage model={model} />
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
}: {
  grouped: GroupedEventResponse;
  selectedRowId: string;
  onSelectRow: (marketId: string) => void;
  selectedTrade: SelectedTrade | null;
  onSelectTrade: (trade: SelectedTrade) => void;
  onCloseTrade: () => void;
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
            <GroupedOutcomePreview
              trade={selectedTrade}
              onClose={onCloseTrade}
            />
          ) : (
            <EmptyState title="Select an outcome" description="Choose Yes or No on an outcome to open the trade ticket." />
          )}
        </div>
      </div>
    </>
  );
}

function GroupedOutcomePreview({ trade, onClose }: { trade: SelectedTrade; onClose: () => void }) {
  const price =
    trade.tradeOutcome === "YES"
      ? trade.bestAsk ?? trade.plannedBotAsk ?? trade.buyYesPrice ?? trade.probability
      : trade.buyNoPrice ??
        (trade.bestBid != null
          ? 1 - trade.bestBid
          : trade.buyYesPrice != null
            ? 1 - trade.buyYesPrice
            : trade.probability != null
              ? 1 - trade.probability
              : null);
  const exampleStake = 10;
  const shares = price && price > 0 ? exampleStake / price : null;
  const maxPayout = shares;
  const maxProfit = maxPayout == null ? null : Math.max(maxPayout - exampleStake, 0);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Outcome preview</div>
          <h3 className="mt-1 text-lg font-semibold text-[var(--poly-text)]">{trade.outcomeLabel}</h3>
          <div className="mt-2">
            <Badge tone={trade.tradeOutcome === "YES" ? "positive" : "negative"}>Selected {trade.tradeOutcome}</Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-[var(--poly-muted)] transition hover:bg-[var(--poly-surface-muted)] hover:text-[var(--poly-text)]"
          aria-label="Close outcome preview"
        >
          x
        </button>
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--poly-muted)]">Display price</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatPriceShort(price)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--poly-muted)]">Example stake</span>
          <span className="font-semibold text-[var(--poly-text)]">$10.00</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--poly-muted)]">Est. shares</span>
          <span className="font-semibold text-[var(--poly-text)]">{shares == null ? "--" : shares.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--poly-muted)]">Max payout</span>
          <span className="font-semibold text-[var(--poly-text)]">{maxPayout == null ? "--" : `$${maxPayout.toFixed(2)}`}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--poly-muted)]">Max profit</span>
          <span className="font-semibold text-emerald-700">{maxProfit == null ? "--" : `$${maxProfit.toFixed(2)}`}</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Order submission is not enabled from this event page in Phase D.
      </div>
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--poly-muted)]"
      >
        Trading disabled
      </button>
    </Card>
  );
}

function SportsEventView({
  event,
  markets,
  marketGroup,
  onMarketGroupChange,
  marketSearch,
  onMarketSearchChange,
}: {
  event: EventSummary;
  markets: EventMarket[];
  marketGroup: string;
  onMarketGroupChange: (group: string) => void;
  marketSearch: string;
  onMarketSearchChange: (search: string) => void;
}) {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [selectedLineByBundle, setSelectedLineByBundle] = useState<Record<string, string>>({});
  const [ticketAmount, setTicketAmount] = useState("10");
  const [comboAmount, setComboAmount] = useState("10");
  const [comboLegs, setComboLegs] = useState<WorldCupComboLeg[]>([]);
  const [ticketSide, setTicketSide] = useState<"buy" | "sell">("buy");
  const marketSections = useMemo(() => buildWorldCupMarketSections(markets), [markets]);
  const visibleGroups = marketSections.filter((group) => group.marketCount > 0);
  const searchQuery = marketSearch.trim().toLowerCase();
  const filteredGroups = useMemo(
    () =>
      visibleGroups
        .map((group) => ({
          ...group,
          bundles: searchQuery
            ? group.bundles
                .map((bundle) => ({
                  ...bundle,
                  markets: bundle.markets.filter((market) => sportsMarketMatchesSearch(market, searchQuery)),
                  lines: bundle.lines.filter((line) => sportsMarketMatchesSearch(line.market, searchQuery)),
                }))
                .filter((bundle) => bundle.markets.length > 0)
            : group.bundles,
        }))
        .filter((group) => group.bundles.length > 0),
    [visibleGroups, searchQuery],
  );
  const activeGroups =
    marketGroup === "all" ? filteredGroups : filteredGroups.filter((group) => group.key === marketGroup);
  const scoreAvailable = event.homeScore != null || event.awayScore != null;
  const statusCounts = useMemo(() => summarizeMarketStatuses(markets), [markets]);
  const selectedOutcomePreview: SelectedWorldCupOutcome | null = useMemo(() => {
    const selected = findWorldCupOutcomeSelection(marketSections, selectedOutcomeId);
    if (!selected) return null;
    return {
      market: selected.selection.market,
      outcome: selected.selection.outcome as EventMarket["outcomes"][number],
      price: selected.selection.price,
      line: selected.line.line,
      bundleTitle: selected.bundle.title,
      outcomeLabel: selected.selection.label,
    };
  }, [marketSections, selectedOutcomeId]);
  const tradingUiEnabled = process.env.NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED === "true";

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
            <div className="mt-4 flex flex-wrap gap-2">
              {event.liveStatus ? <Badge tone="primary">{formatStatus(event.liveStatus)}</Badge> : null}
              {event.period ? <Badge>{event.period.replaceAll("_", " ")}</Badge> : null}
              {event.clock ? <Badge tone="teal">{event.clock}</Badge> : null}
              {event.venue ? <Badge>{event.venue}</Badge> : null}
            </div>
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
          <TeamPanel label="Home" name={event.homeTeamName ?? "Home team"} score={event.homeScore} />
          <div className="text-center text-xs font-semibold uppercase text-neutral-400">
            {scoreAvailable ? "score" : "vs"}
          </div>
          <TeamPanel label="Away" name={event.awayTeamName ?? "Away team"} score={event.awayScore} alignRight />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <EventMarketStat label="Open / live" value={statusCounts.tradable} helper="Markets visible for internal review" />
          <EventMarketStat label="Suspended" value={statusCounts.suspended} helper="Not available for orders" tone="warning" />
          <EventMarketStat label="Closed" value={statusCounts.closed} helper="Awaiting or past resolution" />
          <EventMarketStat label="Resolved" value={statusCounts.resolved} helper="Final state display only" />
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

        <div className="mb-6 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[{ key: "all", label: "All", count: markets.length }, ...marketSections.map((group) => ({
                key: group.key,
                label: group.label,
                count: group.marketCount,
              }))].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onMarketGroupChange(tab.key)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    marketGroup === tab.key
                      ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                      : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                  } ${tab.count === 0 ? "opacity-60" : ""}`}
                >
                  {tab.label} <span className="tabular-nums">{tab.count}</span>
                </button>
              ))}
            </div>
            <label className="w-full lg:w-80">
              <span className="sr-only">Search markets</span>
              <input
                type="search"
                value={marketSearch}
                onChange={(event) => onMarketSearchChange(event.target.value)}
                placeholder="Search markets, teams, players"
                className="w-full rounded-lg border border-[var(--poly-border)] bg-white px-3 py-2 text-sm text-[var(--poly-text)] outline-none transition placeholder:text-[var(--poly-muted)] focus:border-[var(--poly-primary)]"
              />
            </label>
          </div>
          {searchQuery ? (
            <div className="text-sm text-[var(--poly-muted)]">
              Showing {activeGroups.reduce((sum, group) => sum + group.bundles.reduce((count, bundle) => count + bundle.markets.length, 0), 0)} filtered markets for &quot;{marketSearch.trim()}&quot;.
            </div>
          ) : null}
        </div>

        {markets.length === 0 ? (
          <EmptyState title="Markets for this event are not ready yet" description="Check back when event markets are available." />
        ) : activeGroups.length === 0 ? (
          <EmptyState title="No markets match this view" description="Try another group or clear the market search." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-8">
              {activeGroups.map((group) => (
                <section key={group.key} className="space-y-4">
                  <SectionHeader
                    title={group.label}
                    description={formatWorldCupSectionDescription(group.bundles)}
                  />
                  <div className="space-y-3">
                    {group.bundles.map((bundle) => (
                      <WorldCupMarketBundlePanel
                        key={bundle.key}
                        bundle={bundle}
                        selectedLineKey={selectedLineByBundle[bundle.key]}
                        onSelectLine={(lineKey) => {
                          setSelectedLineByBundle((current) => ({ ...current, [bundle.key]: lineKey }));
                          const nextLine = bundle.lines.find((line) => line.key === lineKey);
                          const nextOutcome = nextLine?.selections.find((selection) => selection.outcome.status !== "inactive");
                          if (nextOutcome) setSelectedOutcomeId(nextOutcome.outcome.id);
                        }}
                        selectedOutcomeId={selectedOutcomeId}
                        onSelectOutcome={setSelectedOutcomeId}
                        comboLegs={comboLegs}
                        onToggleComboLeg={(leg) => {
                          setComboLegs((current) => {
                            if (current.some((item) => item.outcomeId === leg.outcomeId)) {
                              return current.filter((item) => item.outcomeId !== leg.outcomeId);
                            }
                            if (!canAddWorldCupComboLeg(current, leg)) return current;
                            return [...current, leg];
                          });
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <WorldCupTradeTicket
                event={event}
                selected={selectedOutcomePreview}
                amount={ticketAmount}
                onAmountChange={setTicketAmount}
                side={ticketSide}
                onSideChange={setTicketSide}
                tradingUiEnabled={tradingUiEnabled}
              />
              <WorldCupComboTicket
                legs={comboLegs}
                amount={comboAmount}
                onAmountChange={setComboAmount}
                onRemoveLeg={(outcomeId) => setComboLegs((current) => current.filter((leg) => leg.outcomeId !== outcomeId))}
                onClear={() => setComboLegs([])}
                tradingUiEnabled={tradingUiEnabled}
              />
            </div>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function TeamPanel({
  label,
  name,
  score,
  alignRight,
}: {
  label: string;
  name: string;
  score?: number | null;
  alignRight?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-4 ${alignRight ? "sm:text-right" : ""}`}>
      <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="min-w-0 text-2xl font-semibold text-[var(--poly-text)]">{name}</div>
        {score != null ? <div className="text-3xl font-semibold text-[var(--poly-primary)]">{score}</div> : null}
      </div>
    </div>
  );
}

function EventMarketStat({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number;
  helper: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3">
      <div className="text-xs font-semibold uppercase text-[var(--poly-muted)]">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "warning" ? "text-amber-700" : "text-[var(--poly-text)]"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--poly-muted)]">{helper}</div>
    </div>
  );
}

function WorldCupTradeTicket({
  event,
  selected,
  amount,
  onAmountChange,
  side,
  onSideChange,
  tradingUiEnabled,
}: {
  event: EventSummary;
  selected: SelectedWorldCupOutcome | null;
  amount: string;
  onAmountChange: (amount: string) => void;
  side: "buy" | "sell";
  onSideChange: (side: "buy" | "sell") => void;
  tradingUiEnabled: boolean;
}) {
  const parsedAmount = Number.parseFloat(amount);
  const estimate = estimateWorldCupTicket({
    amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    price: selected?.price ?? null,
  });

  if (!selected) {
    return (
      <Card className="border-dashed p-5">
        <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Trade ticket</div>
        <h3 className="mt-2 text-lg font-semibold text-[var(--poly-text)]">Select an outcome</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--poly-muted)]">
          Pick a market line and outcome to review price, cost, and payout estimates.
        </p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Event-page trading remains gated. Use market detail for the guarded internal beta ticket.
        </div>
      </Card>
    );
  }

  const inactive = ["PAUSED", "SUSPENDED", "CLOSED", "RESOLVED", "CANCELED"].includes(selected.market.status);
  const outcomeSide = [selected.outcome.side, selected.outcome.code].filter(Boolean).join(" / ");
  const submitDisabled = !tradingUiEnabled || inactive || !selected.price || estimate.cost <= 0;

  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Trade ticket</div>
      <h3 className="mt-2 text-lg font-semibold text-[var(--poly-text)]">{event.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--poly-muted)]">{selected.bundleTitle}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["buy", "sell"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSideChange(mode)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${
              side === mode
                ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)]"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Outcome</span>
          <span className="font-semibold text-[var(--poly-text)]">{selected.outcomeLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Line</span>
          <span className="font-semibold text-[var(--poly-text)]">{selected.line ?? "Default"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Price</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatProbability(selected.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Bid / ask</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatBidAsk(selected.outcome.bestBid, selected.outcome.bestAsk)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Code</span>
          <span className="font-semibold uppercase text-[var(--poly-text)]">{outcomeSide || "--"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Market status</span>
          <Badge tone={inactive ? "warning" : "primary"}>{formatStatus(selected.market.status)}</Badge>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-[var(--poly-muted)]">Amount</span>
        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={(inputEvent) => onAmountChange(inputEvent.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--poly-border)] bg-white px-3 py-2 text-sm text-[var(--poly-text)] outline-none transition focus:border-[var(--poly-primary)]"
        />
      </label>

      <div className="mt-4 space-y-2 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Estimated cost</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatUsd(estimate.cost)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Estimated shares</span>
          <span className="font-semibold text-[var(--poly-text)]">{estimate.shares.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Potential payout</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatUsd(estimate.potentialPayout)}</span>
        </div>
      </div>

      <Link
        href={`/markets/${selected.market.id}`}
        className="mt-4 block rounded-lg border border-[var(--poly-border)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--poly-primary)] transition hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary-hover)]"
      >
        Open market detail
      </Link>
      <button
        type="button"
        disabled={submitDisabled}
        className="mt-3 w-full cursor-not-allowed rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--poly-muted)]"
      >
        {tradingUiEnabled ? "Submit from market detail" : "Trading disabled"}
      </button>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Event-page ticket is preview-only. Server-side internal trading gates remain required for real orders.
      </div>
    </Card>
  );
}

function WorldCupComboTicket({
  legs,
  amount,
  onAmountChange,
  onRemoveLeg,
  onClear,
  tradingUiEnabled,
}: {
  legs: WorldCupComboLeg[];
  amount: string;
  onAmountChange: (amount: string) => void;
  onRemoveLeg: (outcomeId: string) => void;
  onClear: () => void;
  tradingUiEnabled: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [serverQuote, setServerQuote] = useState<{
    comboPrice: number;
    potentialPayout: number;
    potentialProfit: number;
    legs: Array<{ outcomeId: string; price: string | number }>;
  } | null>(null);
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const parsedAmount = Number.parseFloat(amount);
  const estimate = estimateWorldCupComboTicket({
    amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    legs,
  });
  const displayEstimate = serverQuote
    ? {
        comboPrice: serverQuote.comboPrice,
        cost: estimate.cost,
        potentialPayout: serverQuote.potentialPayout,
        potentialProfit: serverQuote.potentialProfit,
      }
    : estimate;
  const canPreview = estimate.valid && estimate.cost > 0;
  const canSubmit = canPreview && tradingUiEnabled && !submitting;

  useEffect(() => {
    const amountValue = Number.parseFloat(amount);
    if (!tradingUiEnabled || legs.length < 2 || !Number.isFinite(amountValue) || amountValue <= 0) {
      setServerQuote(null);
      setQuoteMessage(null);
      setQuoteLoading(false);
      return;
    }

    let canceled = false;
    setQuoteLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/combo-orders/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stakeUSDC: amount,
            legs: legs.map((leg) => ({
              marketId: leg.marketId,
              outcomeId: leg.outcomeId,
              line: leg.line,
              label: leg.label,
            })),
          }),
        });
        const body = await response.json().catch(() => null);
        if (!canceled && response.ok && body?.quote) {
          setServerQuote({
            comboPrice: Number(body.quote.comboPrice),
            potentialPayout: Number(body.quote.potentialPayout),
            potentialProfit: Number(body.quote.potentialProfit),
            legs: body.quote.legs ?? [],
          });
          setQuoteMessage(null);
        } else if (!canceled) {
          setServerQuote(null);
          const code = body?.error?.code ? `${body.error.code}: ` : "";
          setQuoteMessage(`${code}${body?.error?.message ?? "Combo quote unavailable."}`);
        }
      } catch {
        if (!canceled) {
          setServerQuote(null);
          setQuoteMessage("Combo quote unavailable.");
        }
      } finally {
        if (!canceled) setQuoteLoading(false);
      }
    }, 250);

    return () => {
      canceled = true;
      window.clearTimeout(timeout);
    };
  }, [amount, legs, tradingUiEnabled]);

  const serverLegPriceByOutcome = new Map(
    serverQuote?.legs.map((leg) => [leg.outcomeId, Number(leg.price)]) ?? [],
  );

  const submitCombo = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const response = await fetch("/api/combo-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `combo:${Date.now()}:${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          stakeUSDC: amount,
          legs: legs.map((leg) => ({
            marketId: leg.marketId,
            outcomeId: leg.outcomeId,
            line: leg.line,
            label: leg.label,
          })),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitMessage(body?.error?.message ?? "Combo order was rejected.");
        return;
      }
      setSubmitMessage(`Combo order placed: ${body?.comboOrder?.id ?? "pending"}`);
    } catch {
      setSubmitMessage("Combo order failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Combo slip</div>
          <h3 className="mt-2 text-lg font-semibold text-[var(--poly-text)]">{legs.length} {legs.length === 1 ? "leg" : "legs"}</h3>
        </div>
        {legs.length ? (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-[var(--poly-muted)] hover:text-[var(--poly-primary)]">
            Clear
          </button>
        ) : null}
      </div>

      {legs.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-[var(--poly-muted)]">
          Add outcomes from different markets to preview a combo payout.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {legs.map((leg) => (
            <div key={leg.outcomeId} className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--poly-text)]">{leg.label}</div>
                  <div className="mt-1 text-xs text-[var(--poly-muted)]">
                    {[leg.marketTitle, leg.line].filter(Boolean).join(" / ")}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-[var(--poly-text)]">
                  {formatProbability(serverLegPriceByOutcome.get(leg.outcomeId) ?? leg.price)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveLeg(leg.outcomeId)}
                className="mt-2 text-xs font-semibold text-[var(--poly-muted)] hover:text-[var(--poly-primary)]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-[var(--poly-muted)]">Combo amount</span>
        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--poly-border)] bg-white px-3 py-2 text-sm text-[var(--poly-text)] outline-none transition focus:border-[var(--poly-primary)]"
        />
      </label>

      <div className="mt-4 space-y-2 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Combined price</span>
          <span className="font-semibold text-[var(--poly-text)]">
            {quoteLoading ? "Updating..." : formatProbability(displayEstimate.comboPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Estimated cost</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatUsd(displayEstimate.cost)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Potential payout</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatUsd(displayEstimate.potentialPayout)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--poly-muted)]">Potential profit</span>
          <span className="font-semibold text-[var(--poly-text)]">{formatUsd(displayEstimate.potentialProfit)}</span>
        </div>
        <div className="text-xs text-[var(--poly-muted)]">
          {serverQuote ? "Calculated by server quote." : "Local estimate shown until server quote is available."}
        </div>
        {quoteMessage ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            {quoteMessage}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submitCombo}
        className={`mt-4 w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${
          canSubmit
            ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white hover:bg-[var(--poly-primary-hover)]"
            : "cursor-not-allowed border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-[var(--poly-muted)]"
        }`}
      >
        {submitting ? "Submitting combo" : canPreview && tradingUiEnabled ? "Place combo" : "Build a 2+ leg combo"}
      </button>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Combo placement is internal beta only. Server gates still enforce auth, allowlist, and kill switch.
      </div>
      {submitMessage ? <div className="mt-3 text-sm text-[var(--poly-muted)]">{submitMessage}</div> : null}
    </Card>
  );
}

function WorldCupMarketBundlePanel({
  bundle,
  selectedLineKey,
  onSelectLine,
  selectedOutcomeId,
  onSelectOutcome,
  comboLegs,
  onToggleComboLeg,
}: {
  bundle: WorldCupMarketBundle<EventMarket>;
  selectedLineKey?: string;
  onSelectLine: (lineKey: string) => void;
  selectedOutcomeId: string | null;
  onSelectOutcome: (outcomeId: string) => void;
  comboLegs: WorldCupComboLeg[];
  onToggleComboLeg: (leg: WorldCupComboLeg) => void;
}) {
  const statusSummary = summarizeMarketStatuses(bundle.markets);
  const unavailableCount = statusSummary.suspended + statusSummary.closed + statusSummary.resolved;
  const selectedLine = getSelectedWorldCupLine(bundle, selectedLineKey);
  const visibleLines = bundle.lineSelectable && selectedLine ? [selectedLine] : bundle.lines;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--poly-border)] bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--poly-text)]">{bundle.title}</h3>
          <p className="mt-1 text-sm text-[var(--poly-muted)]">{bundle.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">
            {bundle.markets.length} {bundle.markets.length === 1 ? "market" : "markets"}
          </Badge>
          {unavailableCount > 0 ? (
            <Badge tone="warning">{unavailableCount} unavailable</Badge>
          ) : (
            <Badge tone="positive">Open</Badge>
          )}
        </div>
      </div>

      {bundle.lineSelectable ? (
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--poly-border)] px-4 py-3">
          {bundle.lines.map((line) => (
            <button
              key={line.key}
              type="button"
              onClick={() => onSelectLine(line.key)}
              className={`min-w-14 rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition ${
                (selectedLine?.key ?? bundle.defaultLineKey) === line.key
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
        {visibleLines.map((line) => (
          <SportsMarketRow
            key={line.key}
            line={line}
            comboLegs={comboLegs}
            selectedOutcomeId={selectedOutcomeId}
            onSelectOutcome={onSelectOutcome}
            onToggleComboLeg={onToggleComboLeg}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--poly-surface-muted)] px-4 py-3 text-xs text-[var(--poly-muted)]">
        <span>Event-page trading is disabled in this display-only phase.</span>
        <span>Select a tile to preview, then open a market detail ticket if needed.</span>
      </div>
    </Card>
  );
}

function SportsMarketRow({
  line,
  comboLegs,
  selectedOutcomeId,
  onSelectOutcome,
  onToggleComboLeg,
}: {
  line: WorldCupMarketLine<EventMarket>;
  comboLegs: WorldCupComboLeg[];
  selectedOutcomeId: string | null;
  onSelectOutcome: (outcomeId: string) => void;
  onToggleComboLeg: (leg: WorldCupComboLeg) => void;
}) {
  const market = line.market;
  const isInactive = ["PAUSED", "SUSPENDED", "CLOSED", "RESOLVED", "CANCELED"].includes(market.status);
  const marketContext = [market.participantName, market.propCategory?.replaceAll("_", " "), market.period?.replaceAll("_", " ")]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(11rem,1fr)_minmax(18rem,1.6fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-semibold text-[var(--poly-text)]">{formatWorldCupMarketRowTitle(market)}</div>
          <Badge tone={isInactive ? "warning" : "neutral"}>{formatStatus(market.status)}</Badge>
        </div>
        <div className="mt-1 text-xs text-[var(--poly-muted)]">
          {marketContext || formatMarketType(market.marketType)}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {line.selections.map((selection) => {
          const selected = selectedOutcomeId === selection.outcome.id;
          const comboSelected = comboLegs.some((leg) => leg.outcomeId === selection.outcome.id);
          const comboBlocked = !comboSelected && comboLegs.some((leg) => leg.marketId === selection.market.id);
          const outcomeUnavailable = isInactive || selection.outcome.status === "inactive";
          return (
            <div
              key={selection.key}
              className={`rounded-lg border transition ${
                selected || comboSelected
                  ? "border-[var(--poly-primary)] bg-white shadow-[var(--poly-shadow-sm)]"
                  : "border-[var(--poly-border)] bg-[var(--poly-surface-muted)] hover:border-[var(--poly-primary)] hover:bg-white"
              } ${outcomeUnavailable ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelectOutcome(selection.outcome.id)}
                disabled={outcomeUnavailable}
                className="w-full px-3 py-2 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-[var(--poly-text)]">
                    {selection.label}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--poly-text)]">
                    {formatProbability(selection.price)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-[var(--poly-muted)]">
                  <span className="truncate uppercase">{[selection.outcome.side, selection.outcome.code].filter(Boolean).join(" / ") || "choice"}</span>
                  <span className="shrink-0 tabular-nums">{formatBidAsk(selection.outcome.bestBid, selection.outcome.bestAsk)}</span>
                </div>
              </button>
              <button
                type="button"
                disabled={outcomeUnavailable || comboBlocked}
                onClick={() =>
                  onToggleComboLeg({
                    marketId: selection.market.id,
                    outcomeId: selection.outcome.id,
                    label: selection.label,
                    marketTitle: formatWorldCupMarketRowTitle(selection.market),
                    line: line.line,
                    price: selection.price,
                  })
                }
                className={`w-full border-t border-[var(--poly-border)] px-3 py-2 text-xs font-semibold transition ${
                  comboSelected
                    ? "text-[var(--poly-primary)]"
                    : comboBlocked || outcomeUnavailable
                      ? "cursor-not-allowed text-[var(--poly-muted)] opacity-60"
                      : "text-[var(--poly-muted)] hover:text-[var(--poly-primary)]"
                }`}
              >
                {comboSelected ? "Remove from combo" : comboBlocked ? "One leg per market" : "Add to combo"}
              </button>
            </div>
          );
        })}
      </div>

      <Link
        href={`/markets/${market.id}`}
        className="justify-self-start rounded-lg border border-[var(--poly-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--poly-primary)] transition hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary-hover)] md:justify-self-end"
      >
        Detail
      </Link>
    </div>
  );
}

function formatWorldCupSectionDescription(bundles: WorldCupMarketBundle<EventMarket>[]) {
  const marketCount = bundles.reduce((sum, bundle) => sum + bundle.markets.length, 0);
  return `${marketCount} ${marketCount === 1 ? "market" : "markets"} organized into ${bundles.length} compact ${bundles.length === 1 ? "card" : "cards"}.`;
}

function formatMarketType(value: string | null | undefined) {
  if (!value) return "Market";
  return value.replaceAll("_", " ");
}

function formatProbability(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "--";
}

function formatUsd(value: number) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : "$0.00";
}

function formatBidAsk(bid: number | null | undefined, ask: number | null | undefined) {
  const left = typeof bid === "number" && Number.isFinite(bid) ? bid.toFixed(2) : "--";
  const right = typeof ask === "number" && Number.isFinite(ask) ? ask.toFixed(2) : "--";
  return `${left} / ${right}`;
}

function summarizeMarketStatuses(markets: EventMarket[]) {
  return markets.reduce(
    (counts, market) => {
      const status = market.status.toUpperCase();
      if (status === "ACTIVE" || status === "LIVE" || status === "OPEN") counts.tradable += 1;
      if (status === "PAUSED" || status === "SUSPENDED") counts.suspended += 1;
      if (status === "CLOSED") counts.closed += 1;
      if (status === "RESOLVED") counts.resolved += 1;
      return counts;
    },
    { tradable: 0, suspended: 0, closed: 0, resolved: 0 },
  );
}

function sportsMarketMatchesSearch(market: EventMarket, searchQuery: string) {
  const haystack = [
    market.title,
    market.description,
    market.marketGroupTitle,
    market.marketType,
    market.line,
    market.unit,
    market.period,
    market.participantName,
    market.propCategory,
    ...market.outcomes.flatMap((outcome) => [outcome.name, outcome.label, outcome.code, outcome.side]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchQuery);
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
