# Cycle KJ - Home Status Filters

## Scope

Backend/data-contract proof for visible Home `Live` and `Today` filters.

This cycle does not redesign Home, add new sports, or work on saved/followed backend state. It ensures Home server mode requests filtered backend pages instead of filtering only whatever event page was already loaded on-device.

## Route/Data Dependencies

| Flow | Route | Required contract |
| --- | --- | --- |
| Home Live filter | `GET /api/events?statusGroup=live&includeMobileMarkets=1` | Backend filters live events before pagination and returns compact mobile markets. |
| Home Today filter | `GET /api/events?statusGroup=today&includeMobileMarkets=1` | Backend returns events explicitly marked today or starting inside the current UTC day. |
| Home Load more | `GET /api/events?...&cursor=...` | Cursor pagination remains tied to the selected visible filter. |
| Mobile filter state | `PolyApi.listWorldCupEvents()` | Mobile sends `statusGroup=live` or `statusGroup=today` when Home filter is selected. |

## Evidence

- Harness proof: `docs/mobile/harness/cycle-KJ-home-status-filters/cycle-KJ-home-status-filters.json`
- Proof script: `scripts/prove_mobile_home_status_filters.ts`
- Focused test:
  - `mobile/src/__tests__/api.test.ts`

## Proof Results

| Case | Expected | Result |
| --- | --- | --- |
| Unfiltered Home | Includes seeded live, today, and future events | Pass |
| Live filter | Includes only seeded live event | Pass |
| Today filter | Includes seeded live/today-starting events and excludes tomorrow | Pass |
| Compact markets | Filtered route events include `markets[]` for mobile cards | Pass |

## Gate Decision

Pass for focused backend/data-contract scope.

Remaining P1:

- Backend-owned Saved filter.
- Optional user-local timezone semantics for Today if product requires it.
