import type { PolyApi } from "../api";
import { normalizeEventDetail } from "../adapters/worldCupAdapter";
import type { Event } from "../mocks/worldCup";

export type EventDetailHydrationLoader = Pick<PolyApi, "getEvent">;

export const eventDetailRouteKey = (event: Pick<Event, "id" | "backendSlug">) =>
  event.backendSlug?.trim() || event.id;

export const loadEventDetailForCard = async (
  api: EventDetailHydrationLoader,
  event: Pick<Event, "id" | "backendSlug">,
) => normalizeEventDetail(await api.getEvent(eventDetailRouteKey(event)));
