# Review Report - Cycle 004

## Scope

Final reviewer pass requested after adding direct order and combo trading gates.

## Reviewer Questions

- Is the mapping gate actually enforced in code?
- Are unmapped markets truly hidden from user-facing pages?
- Are hidden markets still available to admin diagnostics?
- Are tests meaningful?
- Did the builder only hide labels, or actually filter data?
- Does this break legitimate reference-only markets?
- Does this preserve closed-beta safety?

## Current Evidence

- Filtering is applied at the Prisma public eligibility layer, event model layer, grouped markets layer, direct market access layer, order placement path, combo path, and MM safe-basket path.
- Admin/runtime and CLI diagnostics expose hidden counts and reason categories.
- Focused test coverage includes eligibility, public routes, model filtering, MM safe basket, combo path, direct access, no-leak behavior, and admin runtime.

## Verdict

MERGE READY.

Reviewer evidence:

- Shared public market gate requires an open World Cup parent event, public/listed market, approved Polymarket mapping, `LIVE`/`UPCOMING` status, and fresh Polymarket `ReferenceQuoteSnapshot`.
- Public event/list/market routes use the shared event/market predicates.
- Grouped event service gates parent event and rows by approved mapping plus fresh price.
- Direct market detail/subresources inherit the gate through `assertMarketVisibleToUser`.
- Single-order trading calls `assertMarketVisibleToUser` before `ensurePublicOrderbookLive`.
- Combo quote/order validation checks World Cup leg eligibility before pricing.
