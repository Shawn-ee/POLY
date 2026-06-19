"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import EventCard from "@/components/EventCard";
import PageContainer from "@/components/ui/PageContainer";
import { EmptyState, LoadingState } from "@/components/ui/States";

type Market = {
  id: string;
  title: string;
  status: string;
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
  prices: { YES: number; NO: number } | null;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  outcomes: { id: string; name: string }[];
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

type EventSummary = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  source: string | null;
  marketCount: number;
  activeMarketCount?: number | null;
  image: string | null;
  icon: string | null;
  groupedSummary?: { title: string; slug: string } | null;
  topOutcomes?: string[] | null;
};

type TagSummary = { id: string; name: string; slug: string };

function MarketsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [topTags, setTopTags] = useState<TagSummary[]>([]);
  const [sportsTags, setSportsTags] = useState<TagSummary[]>([]);
  const [showAllLeagues, setShowAllLeagues] = useState(false);

  const activeCategory = searchParams.get("category") ?? "";
  const activeLeague = searchParams.get("league") ?? "";
  const activeView = searchParams.get("view") ?? "live";

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("view")) {
      params.set("view", "live");
    }
    if (!params.get("category") && !params.get("league")) {
      params.set("category", "sports");
      params.set("league", "nba");
      router.replace(`/markets?${params.toString()}`);
      return;
    }

    if (params.get("category") !== "sports" && params.get("league")) {
      params.delete("league");
      router.replace(`/markets?${params.toString()}`);
      return;
    }

    if (params.get("category") === "sports" && !params.get("league")) {
      params.set("league", "nba");
      router.replace(`/markets?${params.toString()}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== "all") {
        params.set("category", activeCategory);
      }
      if (activeLeague) {
        params.set("tags", activeLeague);
      }
      params.set("view", activeView);
      const res = await fetch(`/api/markets?${params.toString()}`);
      const data = await res.json();
      setMarkets(data.markets ?? []);
      setLoading(false);
    };
    load();
  }, [activeCategory, activeLeague, activeView]);

  useEffect(() => {
    const loadTags = async () => {
      const [topRes, sportsRes] = await Promise.all([
        fetch("/api/tags?group=top-nav"),
        fetch("/api/tags?group=sports"),
      ]);
      if (topRes.ok) {
        const data = await topRes.json();
        const base = data.tags ?? [];
        const ordered = [
          "sports",
          "politics",
          "crypto",
          "finance",
          "tech",
          "world",
          "elections",
        ];
        const bySlug = new Map(base.map((tag: TagSummary) => [tag.slug, tag]));
        const list = [
          { id: "all", name: "All", slug: "all" },
          ...ordered.map((slug) => bySlug.get(slug)).filter(Boolean),
        ];
        setTopTags(list as TagSummary[]);
      }
      if (sportsRes.ok) {
        const data = await sportsRes.json();
        setSportsTags(data.tags ?? []);
      }
    };
    loadTags();

    const loadEvents = async () => {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      const data = await res.json();
      setEvents((data.events ?? []).filter((event: EventSummary) => Boolean(event.slug)).slice(0, 3));
    };
    loadEvents();
  }, []);

  const sportsChipOrder = useMemo(() => {
    if (!sportsTags.length) return [];
    const nba = sportsTags.find((tag) => tag.slug === "nba");
    const rest = sportsTags.filter((tag) => tag.slug !== "nba");
    return nba ? [nba, ...rest] : rest;
  }, [sportsTags]);

  const visibleSportsChips = showAllLeagues
    ? sportsChipOrder
    : sportsChipOrder.slice(0, 3);

  const setFilters = (category: string, league: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    if (league) {
      params.set("league", league);
    } else {
      params.delete("league");
    }
    if (!params.get("view")) {
      params.set("view", "live");
    }
    router.replace(`/markets?${params.toString()}`);
  };

  return (
    <PageContainer>
      <div className="mb-6 rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)]">
        <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Market board</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--poly-text)]">Find a market</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--poly-muted)]">
          Start with live sports markets, compare Yes/No prices, and open an event when you want more context.
        </p>
        <div className="mt-4 rounded-md border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-3 py-2 text-xs text-[var(--poly-muted)]">
          POLY is in beta. Market prices are shown for discovery; funding and trading safeguards stay separate.
        </div>
      </div>

      <section className="mb-8 rounded-lg border border-[var(--poly-border)] bg-white p-4 shadow-[var(--poly-shadow-sm)]">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--poly-text)]">Browse markets</h2>
            <p className="text-xs text-[var(--poly-muted)]">Filter by status, category, and league.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "live", label: "Live" },
              { key: "resolved", label: "Resolved" },
              { key: "all", label: "All" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("view", tab.key);
                  router.replace(`/markets?${params.toString()}`);
                }}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeView === tab.key
                    ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                    : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {topTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                if (tag.slug === "all") {
                  setFilters("all", "");
                  return;
                }
                if (tag.slug === "sports") {
                  setFilters("sports", activeLeague || "nba");
                  return;
                }
                setFilters(tag.slug, "");
              }}
              className={`rounded-full border px-3 py-1 text-xs ${
                (tag.slug === "all" && (!activeCategory || activeCategory === "all")) ||
                (tag.slug !== "all" && activeCategory === tag.slug)
                  ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                  : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
              }`}
              type="button"
            >
              {tag.name}
            </button>
          ))}
          {activeCategory === "sports" ? (
            <button
              onClick={() => setShowAllLeagues((prev) => !prev)}
              className="rounded-full border border-[var(--poly-border)] bg-white px-3 py-1 text-xs text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
              type="button"
            >
              {showAllLeagues ? "Less" : "Leagues"}
            </button>
          ) : null}
        </div>

        {activeCategory === "sports" ? (
          <div className="mt-3 border-t border-[var(--poly-border)] pt-3">
            <div className="mb-2 text-xs font-semibold uppercase text-[var(--poly-muted)]">Leagues</div>
            <div className="flex flex-wrap gap-1">
              {visibleSportsChips.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setFilters("sports", tag.slug)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    activeLeague === tag.slug
                      ? "border-[var(--poly-teal)] bg-[var(--poly-teal)] text-white"
                      : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-teal)] hover:text-[var(--poly-teal)]"
                  }`}
                  type="button"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {events.length ? (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--poly-text)]">Active events</h2>
              <p className="text-sm text-[var(--poly-muted)]">
                Use events to compare related markets before drilling into one contract.
              </p>
            </div>
            <button
              onClick={() => router.push("/events")}
              className="text-sm font-semibold text-[var(--poly-primary)] hover:text-[var(--poly-primary-hover)]"
              type="button"
            >
              All events
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) =>
              event.slug ? (
                <EventCard
                  key={event.id}
                  slug={event.slug}
                  title={event.title}
                  description={event.description}
                  category={event.category}
                  source={event.source}
                  marketCount={event.marketCount}
                  activeMarketCount={event.activeMarketCount ?? null}
                  image={event.image}
                  icon={event.icon}
                  groupedLabel={event.groupedSummary?.title ?? null}
                  topOutcomes={event.topOutcomes ?? null}
                />
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      {loading ? (
        <LoadingState label="Loading markets" count={8} />
      ) : markets.length === 0 ? (
        <EmptyState
          title="No markets match this view"
          description="Try Live sports, another league, or All markets while beta markets are being prepared."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((market) => (
            market.prices ? (
              <MarketCard
                key={market.id}
                id={market.id}
                title={market.title}
                status={market.status}
                resolveTime={market.resolveTime}
                outcomes={market.outcomes}
                prices={market.prices}
                visibility={market.visibility}
                mechanism={market.mechanism}
                referenceOnly={market.referenceOnly}
                tradable={market.tradable}
                referenceSummary={market.referenceSummary}
              />
            ) : (
              <a
                key={market.id}
                href={`/markets/${market.id}`}
                className="group flex h-full flex-col justify-between rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)] transition hover:border-[var(--poly-border-strong)] hover:shadow-[var(--poly-shadow-md)]"
              >
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-[var(--poly-surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--poly-muted)]">
                    {market.referenceOnly && market.tradable === false ? "Coming soon" : market.status}
                  </div>
                  <h3 className="line-clamp-2 text-base font-semibold text-[var(--poly-text)]">{market.title}</h3>
                  <p className="mt-2 text-sm text-[var(--poly-muted)]">
                    Price display is not ready for this market yet.
                  </p>
                </div>
                <div className="mt-6 text-xs text-[var(--poly-muted)]">
                  Outcomes: {market.outcomes.map((outcome) => outcome.name).join(" / ")}
                </div>
              </a>
            )
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default function MarketsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="text-sm text-[var(--poly-muted)]">Loading markets...</div>
        </PageContainer>
      }
    >
      <MarketsPageInner />
    </Suspense>
  );
}

