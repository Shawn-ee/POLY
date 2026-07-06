# Cycle LM - Mobile Event Status Group Contract

Gate status: Pass

## Scope

- Tighten backend-owned status filters used by visible Home, Live, and Search event lists.
- Ensure `statusGroup=live` can use `liveStatus=in_progress`.
- Ensure `statusGroup=upcoming` does not include live, today, closed, resolved, canceled, or other terminal events.
- Keep scope to `/api/events`; no visual redesign, chat, orderbook, or live-stats product work.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LM-mobile-event-status-group-contract/cycle-LM-mobile-event-status-group-contract.json`
- Proof script: `scripts/prove_mobile_event_status_group_contract.ts`
- Backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Live group includes status and liveStatus | Pass | Backend filter matches `status=live` or `liveStatus=live/in_progress`. |
| Today group uses UTC day window | Pass | Today remains `status=today` or `startTime` inside the current UTC day. |
| Upcoming group includes scheduled or future events | Pass | Backend filter matches scheduled/upcoming statuses or future `startTime`. |
| Upcoming group excludes terminal state | Pass | Backend filter excludes live, today, closed, ended, resolved, settled, canceled, and related terminal statuses. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused mobile event status group contract.
- Remaining P1/P2: optional user-local timezone semantics for Today remain outside this focused contract.
