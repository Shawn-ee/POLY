# Cycle LK - Sorted Event Cursor Contract

Gate status: Pass

## Scope

- Keep Home/Search/Live discovery pagination backend-driven in server mode.
- Prevent sorted mobile event pages from restarting at page one when a stale or filtered-out cursor is sent.
- Keep scope to `/api/events?includeMobileMarkets=1&sortBy=popular|live`; no UI redesign or orderbook work.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LK-sorted-event-cursor-contract/cycle-LK-sorted-event-cursor-contract.json`
- Proof script: `scripts/prove_mobile_sorted_event_cursor_contract.ts`
- Backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| First sorted page starts at index zero | Pass | Empty cursor returns `pageStart=0`. |
| Valid backend cursor advances the sorted page | Pass | Cursor present in the filtered/sorted list starts after that event id. |
| Filtered-out sorted cursor is rejected | Pass | Backend returns `400` instead of duplicating the first page. |
| Route error is stable for mobile handling | Pass | Error body is `{ error: "Invalid event cursor for filtered mobile page." }`. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused sorted mobile event cursor contract.
- Remaining P1/P2: none for this focused backend/data contract.
