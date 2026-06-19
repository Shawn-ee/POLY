"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import PageContainer from "@/components/ui/PageContainer";
import { EmptyState, LoadingState } from "@/components/ui/States";

type EventSummary = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  source: string | null;
  externalEventId: string | null;
  externalSlug: string | null;
  image: string | null;
  icon: string | null;
  marketCount: number;
  activeMarketCount?: number | null;
  groupedSummary?: { title: string; slug: string } | null;
  topOutcomes?: string[] | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/events");
      const data = await res.json().catch(() => null);
      setEvents((data?.events ?? []).filter((event: EventSummary) => Boolean(event.slug)));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <PageContainer>
      <div className="mb-8 rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)]">
        <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">
          Event discovery
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--poly-text)]">Events</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--poly-muted)]">
          Start with an event, then compare the related Yes/No markets attached to it.
        </p>
      </div>

      {loading ? (
        <LoadingState label="Loading events" count={6} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events are ready yet"
          description="Check sports and markets again soon while beta events are being prepared."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      )}
    </PageContainer>
  );
}
