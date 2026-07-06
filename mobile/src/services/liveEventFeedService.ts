import type { PolyApi } from "../api";
import { normalizeEventSummary } from "../adapters/worldCupAdapter";
import type { Event } from "../mocks/worldCup";

export type LiveEventFeedLoader = Pick<PolyApi, "listWorldCupEvents">;

export const loadLiveEventFeed = async (
  api: LiveEventFeedLoader,
  limit = 10,
): Promise<{ events: Event[]; nextCursor: string | null; source: "events-route-statusGroup-live" }> => {
  const payload = await api.listWorldCupEvents({ limit, statusGroup: "live" });
  return {
    events: payload.events
      .map((event) => normalizeEventSummary(event, event.markets ?? []))
      .filter((event) => event.markets.length > 0),
    nextCursor: payload.nextCursor ?? payload.page?.nextCursor ?? null,
    source: "events-route-statusGroup-live",
  };
};
