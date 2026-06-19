"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SportsEventCard, { type SportsEventSummary, formatLeague } from "@/components/sports/SportsEventCard";
import PageContainer from "@/components/ui/PageContainer";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";

type SportsEventsPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  showHeroLinks?: boolean;
  showTabs?: boolean;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "scheduled", label: "Upcoming" },
  { key: "final", label: "Final" },
];

export default function SportsEventsPage({
  title,
  eyebrow,
  description,
  endpoint,
  showHeroLinks,
  showTabs,
}: SportsEventsPageProps) {
  const [events, setEvents] = useState<SportsEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(endpoint);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load sports events.");
        }
        if (!cancelled) {
          setEvents((data?.events ?? []).filter((event: SportsEventSummary) => Boolean(event.slug)));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load sports events.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const filteredEvents = useMemo(() => {
    if (activeTab === "all") return events;
    return events.filter((event) => event.status?.toLowerCase() === activeTab);
  }, [activeTab, events]);

  const leagueCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const key = event.leagueKey ?? "sports";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [events]);

  return (
    <PageContainer>
      <section className="mb-8 rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)]">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">{eyebrow}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[var(--poly-text)]">{title}</h1>
          <p className="mt-3 text-base text-[var(--poly-muted)]">{description}</p>
        </div>

        {showHeroLinks ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/sports/soccer"
              className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-5 transition hover:border-[var(--poly-primary)] hover:bg-white"
            >
              <div className="text-sm font-semibold text-[var(--poly-text)]">Soccer</div>
              <div className="mt-1 text-sm text-[var(--poly-muted)]">Match and tournament event markets.</div>
            </Link>
            <Link
              href="/sports/soccer/world-cup"
              className="rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-5 transition hover:border-[var(--poly-primary)] hover:bg-white"
            >
              <div className="text-sm font-semibold text-[var(--poly-text)]">World Cup</div>
              <div className="mt-1 text-sm text-[var(--poly-muted)]">Tournament markets grouped by fixture.</div>
            </Link>
          </div>
        ) : null}
      </section>

      {leagueCounts.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2 text-xs text-[var(--poly-muted)]">
          {leagueCounts.map(([league, count]) => (
            <span key={league} className="rounded-full border border-[var(--poly-border)] bg-white px-3 py-1">
              {formatLeague(league)}: {count}
            </span>
          ))}
        </div>
      ) : null}

      {showTabs ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-3 py-1 text-sm ${
                activeTab === tab.key
                  ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                  : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--poly-text)]">Events</h2>
            <p className="mt-1 text-sm text-[var(--poly-muted)]">
              Open an event to compare related Yes/No markets.
            </p>
          </div>
          <Link href="/markets" className="text-sm font-semibold text-[var(--poly-primary)] hover:text-[var(--poly-primary-hover)]">
            All markets
          </Link>
        </div>

        {loading ? (
          <LoadingState label="Loading sports events" count={6} />
        ) : error ? (
          <ErrorState>{error}</ErrorState>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No sports events found"
            description="Try another status filter, or check back as beta markets are prepared."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <SportsEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
