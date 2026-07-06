import type { PolyApi } from "../api";
import { normalizeEventDetail } from "../adapters/worldCupAdapter";
import type { Event } from "../mocks/worldCup";
import { assertEventDetailRoutePayloadShape } from "./eventDetailRouteShapeService";

export type EventDetailHydrationLoader = Pick<PolyApi, "getEvent">;

export const eventDetailRouteKey = (event: Pick<Event, "id" | "backendSlug">) =>
  event.backendSlug?.trim() || event.id;

export const loadEventDetailBySlug = async (
  api: EventDetailHydrationLoader,
  slug: string,
) => {
  const detail = await api.getEvent(slug);
  assertEventDetailRoutePayloadShape(detail);
  return normalizeEventDetail(detail);
};

export const loadEventDetailForCard = async (
  api: EventDetailHydrationLoader,
  event: Pick<Event, "id" | "backendSlug">,
) => loadEventDetailBySlug(api, eventDetailRouteKey(event));
