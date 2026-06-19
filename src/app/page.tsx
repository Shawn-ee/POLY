"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarketCard from "@/components/MarketCard";
import EventCard from "@/components/EventCard";
import PageContainer from "@/components/ui/PageContainer";
import { EmptyState } from "@/components/ui/States";

type Market = {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
  prices: { YES: number; NO: number } | null;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  category: { id: string; name: string; slug: string } | null;
  tags: { id: string; name: string; slug: string; group: string | null }[];
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

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [topTags, setTopTags] = useState<TagSummary[]>([]);
  const [sportsTags, setSportsTags] = useState<TagSummary[]>([]);
  const [activeTopTag, setActiveTopTag] = useState<string>("sports");
  const [activeSportsTag, setActiveSportsTag] = useState<string>("nba");

  useEffect(() => {
    const loadWallet = async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) {
        setWalletBalance(null);
        return;
      }
      const data = await res.json();
      setWalletBalance(typeof data.balance === "number" ? data.balance : 0);
    };
    loadWallet();

    const loadUser = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setIsAdmin(false);
        return;
      }
      const data = await res.json();
      setIsAdmin(Boolean(data.user?.isAdmin));
    };
    loadUser();

    const loadTags = async () => {
      const [topRes, sportsRes] = await Promise.all([
        fetch("/api/tags?group=top-nav"),
        fetch("/api/tags?group=sports"),
      ]);
      if (topRes.ok) {
        const data = await topRes.json();
        const base = data.tags ?? [];
        const sportsFirst = base.find((tag: TagSummary) => tag.slug === "sports");
        const rest = base.filter((tag: TagSummary) => tag.slug !== "sports");
        setTopTags(sportsFirst ? [sportsFirst, ...rest] : rest);
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
      setEvents((data.events ?? []).filter((event: EventSummary) => Boolean(event.slug)).slice(0, 4));
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (activeTopTag !== "all") {
        params.set("category", activeTopTag);
      }
      if (activeTopTag === "sports" && activeSportsTag) {
        params.set("tags", activeSportsTag);
      }
      const res = await fetch(`/api/markets?${params.toString()}`);
      const data = await res.json();
      setMarkets(data.markets ?? []);
    };
    load();
  }, [activeTopTag, activeSportsTag]);

  return (
    <PageContainer>
      <div className="mb-8 flex flex-col gap-5 rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Internal beta</div>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--poly-text)]">
            Sports prediction markets
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--poly-muted)]">
            Browse events, compare Yes/No prices, and track markets with test credits while
            POLY is still in beta.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-[var(--poly-muted)] sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/sports"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--poly-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--poly-primary-hover)]"
            >
              Browse sports
            </Link>
            <Link
              href="/markets"
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--poly-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--poly-text)] transition hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
            >
              View markets
            </Link>
          </div>
          <div className="text-xs">
            Wallet:{" "}
            {walletBalance === null ? "--" : walletBalance.toFixed(2)} U
          </div>
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--poly-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--poly-text)] transition hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
            >
              Admin tools
            </Link>
          ) : null}
        </div>
      </div>

      {events.length ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--poly-text)]">Featured events</h2>
              <p className="text-sm text-[var(--poly-muted)]">
                Start with the event, then choose the market question that matches your view.
              </p>
            </div>
            <Link href="/events" className="text-sm font-semibold text-[var(--poly-primary)] hover:text-[var(--poly-primary-hover)]">
              View all events
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActiveTopTag("all");
            setActiveSportsTag("");
          }}
          className={`rounded-full border px-3 py-1 text-sm ${
            activeTopTag === "all"
              ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
              : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
          }`}
          type="button"
        >
          All
        </button>
        {topTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => {
              setActiveTopTag(tag.slug);
              if (tag.slug !== "sports") {
                setActiveSportsTag("");
              }
            }}
            className={`rounded-full border px-3 py-1 text-sm ${
              activeTopTag === tag.slug
                ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
            }`}
            type="button"
          >
            {tag.name}
          </button>
        ))}
      </div>

      {activeTopTag === "sports" && sportsTags.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {sportsTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                setActiveSportsTag((current) =>
                  current === tag.slug ? "" : tag.slug
                )
              }
              className={`rounded-full border px-3 py-1 text-xs ${
                activeSportsTag === tag.slug
                  ? "border-[var(--poly-teal)] bg-[var(--poly-teal)] text-white"
                  : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-teal)] hover:text-[var(--poly-teal)]"
              }`}
              type="button"
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}

      {markets.length === 0 ? (
        <EmptyState
          title="No markets are ready yet"
          description="Check sports and events again soon while beta markets are being prepared."
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
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="group flex h-full flex-col justify-between rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)] transition hover:border-[var(--poly-border-strong)] hover:shadow-[var(--poly-shadow-md)]"
              >
                <div>
                  <h3 className="line-clamp-2 text-base font-semibold text-[var(--poly-text)]">{market.title}</h3>
                  <div className="mt-2 text-xs text-[var(--poly-muted)]">
                    {market.referenceOnly && market.tradable === false ? "Coming soon" : market.status}
                  </div>
                </div>
                <div className="mt-6 text-xs text-[var(--poly-muted)]">
                  Outcomes: {market.outcomes.map((outcome) => outcome.name).join(" / ")}
                </div>
              </Link>
            )
          ))}
        </div>
      )}
    </PageContainer>
  );
}

