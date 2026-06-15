"use client";

import Link from "next/link";

export type SportsEventSummary = {
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
  image: string | null;
  imageUrl?: string | null;
  icon: string | null;
  marketCount: number;
  activeMarketCount?: number | null;
};

export default function SportsEventCard({ event }: { event: SportsEventSummary }) {
  const href = event.slug ? `/events/${event.slug}` : "/events";
  const image = event.imageUrl ?? event.image ?? event.icon;

  return (
    <Link
      href={href}
      className="group flex h-full min-h-48 flex-col justify-between rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase text-neutral-500">
              {formatLeague(event.leagueKey) || formatSport(event.sportKey) || "Sports"}
            </div>
            <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-neutral-900">
              {event.title}
            </h3>
          </div>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-11 w-11 rounded-md object-cover" />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-semibold text-neutral-500">
              {event.sportKey?.slice(0, 3).toUpperCase() ?? "SPT"}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
          <div className="min-w-0 truncate font-medium text-neutral-800">
            {event.homeTeamName ?? "Home"}
          </div>
          <div className="text-xs uppercase text-neutral-400">vs</div>
          <div className="min-w-0 truncate text-right font-medium text-neutral-800">
            {event.awayTeamName ?? "Away"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
          <span className="rounded-full border border-neutral-200 px-2 py-1">
            {formatStatus(event.status)}
          </span>
          <span className="rounded-full border border-neutral-200 px-2 py-1">
            {formatDateTime(event.startTime)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-neutral-500">
        <span>{event.marketCount} markets</span>
        <span className="text-neutral-700 transition group-hover:text-neutral-950">Open event</span>
      </div>
    </Link>
  );
}

export function formatDateTime(value: string | null) {
  if (!value) return "Time TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatStatus(value: string | null) {
  if (!value) return "Scheduled";
  return value.toLowerCase().replaceAll("_", " ");
}

export function formatSport(value: string | null) {
  if (!value) return "";
  return value.replaceAll("_", " ");
}

export function formatLeague(value: string | null) {
  if (!value) return "";
  return value.replaceAll("_", " ");
}
