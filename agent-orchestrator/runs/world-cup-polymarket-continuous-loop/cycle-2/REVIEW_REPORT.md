# Cycle 2 Review Report

Timestamp: 2026-06-28T16:04:00-05:00

## Reviewer Input

Cycle 2 started from independent reviewer/auditor findings after cycle 1 overclaimed merge readiness.

## Files Inspected

- `src/app/events/[slug]/page.tsx`
- `src/app/api/events/[slug]/world-cup-model/route.ts`
- `src/lib/sports/worldCupEventPageModel.ts`
- `src/components/sports/WorldCupEventTradingPage.tsx`
- `scripts/mm_polymarket_enable_safe_basket.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`

## Blockers Found

- `BLOCKER_BEFORE_MERGE`: World Cup grouped events could bypass the Polymarket-style UI because grouped-event rendering happened before World Cup rendering.
- `BLOCKER_BEFORE_MERGE`: public `/api/events/[slug]/world-cup-model` model shape included an `externalSlug` key.
- `BLOCKER_BEFORE_MERGE`: safe-basket `--confirm` could mutate with fewer than three selected markets.
- `BLOCKER_BEFORE_MERGE`: line selector changed rows but did not update the right-side ticket selection.

## Fixes Reviewed

- World Cup events now fetch `/api/events/[slug]/world-cup-model` before grouped-market routing.
- Public model replaced `eventHeader.externalSlug` with `eventHeader.mappedEvent`.
- Safe-basket confirm refuses mutation when coverage blockers exist.
- Line selector updates the selected ticket outcome to the selected line's first outcome.
- Total/team total outcome labels include the line value.
- Public no-leak tests now cover `/world-cup-model`.

## Reviewer Verdict

`NEEDS_REAUDIT`

Cycle 2 fixes address the found blockers, but a fresh reviewer/auditor pass is required before changing the loop back to merge-ready.
