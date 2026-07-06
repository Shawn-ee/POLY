export const INVALID_FILTERED_MOBILE_CURSOR_ERROR = "Invalid event cursor for filtered mobile page.";

export const resolveSortedMobilePageStart = (orderedEventIds: string[], cursorId: string | null | undefined) => {
  const normalizedCursor = `${cursorId ?? ""}`.trim();
  if (!normalizedCursor) {
    return { pageStart: 0, error: null };
  }

  const cursorIndex = orderedEventIds.findIndex((eventId) => eventId === normalizedCursor);
  if (cursorIndex < 0) {
    return { pageStart: 0, error: INVALID_FILTERED_MOBILE_CURSOR_ERROR };
  }

  return { pageStart: cursorIndex + 1, error: null };
};
