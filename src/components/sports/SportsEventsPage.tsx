"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SportsEventCard, { type SportsEventSummary, formatLeague } from "@/components/sports/SportsEventCard";

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
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="mb-8 border-b border-neutral-200 pb-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase text-neutral-500">{eyebrow}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950">{title}</h1>
          <p className="mt-3 text-base text-neutral-600">{description}</p>
        </div>

        {showHeroLinks ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/sports/soccer"
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300"
            >
              <div className="text-sm font-semibold text-neutral-900">Soccer</div>
              <div className="mt-1 text-sm text-neutral-600">Match and tournament event markets.</div>
            </Link>
            <Link
              href="/sports/soccer/world-cup"
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300"
            >
              <div className="text-sm font-semibold text-neutral-900">World Cup</div>
              <div className="mt-1 text-sm text-neutral-600">Demo event markets grouped by fixture.</div>
            </Link>
          </div>
        ) : null}
      </section>

      {leagueCounts.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2 text-xs text-neutral-600">
          {leagueCounts.map(([league, count]) => (
            <span key={league} className="rounded-full border border-neutral-200 px-3 py-1">
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
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white text-neutral-700"
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
            <h2 className="text-xl font-semibold text-neutral-950">Events</h2>
            <p className="mt-1 text-sm text-neutral-600">Open an event to see its markets and outcomes.</p>
          </div>
          <Link href="/markets" className="text-sm text-neutral-600 hover:text-neutral-950">
            General markets
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`sports-event-skeleton-${index}`}
                className="h-48 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
            No sports events found.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <SportsEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
