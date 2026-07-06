import { Prisma } from "@prisma/client";

export const LIVE_EVENT_STATUSES = ["live", "LIVE"];
export const LIVE_EVENT_LIVE_STATUSES = ["live", "LIVE", "in_progress", "IN_PROGRESS"];
export const TODAY_EVENT_STATUSES = ["today", "TODAY"];
export const UPCOMING_EVENT_STATUSES = ["upcoming", "UPCOMING", "scheduled", "SCHEDULED"];
export const TERMINAL_EVENT_STATUSES = [
  "closed",
  "CLOSED",
  "ended",
  "ENDED",
  "finished",
  "FINISHED",
  "complete",
  "COMPLETE",
  "completed",
  "COMPLETED",
  "resolved",
  "RESOLVED",
  "settled",
  "SETTLED",
  "canceled",
  "CANCELED",
  "cancelled",
  "CANCELLED",
];

export const eventStatusGroupFilter = (statusGroup: string, now = new Date()): Prisma.EventWhereInput =>
  statusGroup === "live"
    ? {
        OR: [
          { status: { in: LIVE_EVENT_STATUSES } },
          { liveStatus: { in: LIVE_EVENT_LIVE_STATUSES } },
        ],
      }
    : statusGroup === "today"
      ? {
          OR: [
            { status: { in: TODAY_EVENT_STATUSES } },
            {
              startTime: {
                gte: new Date(new Date(now).setUTCHours(0, 0, 0, 0)),
                lt: new Date(new Date(now).setUTCHours(24, 0, 0, 0)),
              },
            },
          ],
        }
      : statusGroup === "upcoming"
        ? {
            AND: [
              {
                NOT: {
                  OR: [
                    { status: { in: [...LIVE_EVENT_STATUSES, ...TODAY_EVENT_STATUSES, ...TERMINAL_EVENT_STATUSES] } },
                    { liveStatus: { in: LIVE_EVENT_LIVE_STATUSES } },
                  ],
                },
              },
              {
                OR: [
                  { status: { in: UPCOMING_EVENT_STATUSES } },
                  { startTime: { gt: now } },
                ],
              },
            ],
          }
        : {};
