import type { PolyApi } from "../api";
import { normalizeEventSummary } from "../adapters/worldCupAdapter";
import type { Event } from "../mocks/worldCup";
import { assertEventListRoutePayloadShape } from "./eventListRouteShapeService";

export type LiveEventFeedLoader = Pick<PolyApi, "listWorldCupEvents">;

export const loadLiveEventFeed = async (
  api: LiveEventFeedLoader,
  limit = 10,
  cursor: string | null = null,
): Promise<{ events: Event[]; nextCursor: string | null; source: "events-route-statusGroup-live" }> => {
  const payload = await api.listWorldCupEvents({ limit, cursor, statusGroup: "live" });
  assertEventListRoutePayloadShape(payload);
  return {
    events: payload.events
      .map((event) => normalizeEventSummary(event, event.markets ?? []))
      .filter((event) => event.markets.length > 0),
    nextCursor: payload.nextCursor ?? payload.page?.nextCursor ?? null,
    source: "events-route-statusGroup-live",
  };
};
