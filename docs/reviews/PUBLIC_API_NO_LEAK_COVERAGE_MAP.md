# Public API No-Leak Coverage Map

Task id: DOC-007
Assigned subagents: TestingAgent, SecurityAgent, DocsAgent
Risk level: Low
Status: Docs-only coverage map

## Purpose

This map records the current public API no-leak coverage added during the agent testing wave and identifies remaining route groups. It helps future agents select the next safe test without guessing.

This document does not add tests, change CI, change route behavior, change API contracts, or modify wallet, ledger, matching, settlement, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Current Covered Route Groups

| Route group | Current evidence | Coverage status | Notes |
|---|---|---|---|
| Taxonomy reads | `src/__tests__/public.taxonomy.no-leak.test.ts` | Expanded mocked coverage | Covers `/api/categories` and `/api/tags` no-leak, response-shape, and empty-state paths. |
| Event reads | `src/__tests__/public.events.no-leak.test.ts` | Expanded mocked coverage | Covers `/api/events` and `/api/events/[slug]` with mocked Prisma, including not-found/error response paths. |
| Sports reads | `src/__tests__/public.sports.no-leak.test.ts` | Expanded mocked coverage | Covers `/api/sports`, `/api/sports/soccer/events`, and `/api/sports/soccer/world-cup/events`, including empty-state paths. |
| Market list reads | `src/__tests__/public.market-list.no-leak.test.ts` | Expanded mocked coverage | Covers `/api/markets` filter/query response shape, no-leak assertions, empty-list behavior, and grouped reference market filtering. |
| Event market reads | `src/__tests__/public.event-markets.no-leak.test.ts` | Expanded mocked coverage | Covers `/api/events/[slug]/markets` and `/api/events/[slug]/grouped-markets`, including not-found/error response paths. |
| Market chart reads | `src/__tests__/public.market-chart.no-leak.test.ts` | Expanded mocked coverage | Covers `/api/markets/[id]/chart` success, empty-series, hidden-market guard, and missing-market paths. |

## Current No-Leak Pattern

The current tests:

- Import route handlers directly.
- Mock Prisma and helper services.
- Use local fixture data.
- Avoid real databases, secrets, external APIs, chain RPC, production data, and money movement.
- Assert forbidden sensitive field names are not present in public response bodies.

These tests are targeted and are not yet automatically included in `npm run test:ci` because package scripts were intentionally not changed in the current wave.

## Remaining Public Read Route Groups

| Route group | Candidate routes | Risk | Recommended next action | Auto-merge default |
|---|---|---:|---|---|
| Market detail reads | `/api/markets/[id]` | Medium | Review auth/visibility guard and owner fields before testing. | No, unless explicitly scoped low-risk |
| Event market reads | `/api/events/[slug]/markets`, `/api/events/[slug]/grouped-markets` | Low/Medium | Keep coverage current as contracts stabilize; add edge cases only if mocked/local. | Maybe |
| Market chart reads | `/api/markets/[id]/chart` | Low/Medium | Keep empty/error coverage current; add target-contract cases only after contract changes are reviewed. | Maybe |
| Market quote reads | `/api/markets/[id]/quote` | Medium | Follow `docs/reviews/QUOTE_ORDERBOOK_NO_LEAK_TEST_SCOPE.md`. | No by default |
| Market trade tape reads | `/api/markets/[id]/trades` | Medium | Follow quote/orderbook scope. | No by default |
| Orderbook book reads | `/api/orderbook/[marketId]/book` | Medium | Follow quote/orderbook scope. | No by default |
| Orderbook trade tape reads | `/api/orderbook/[marketId]/trades` | Medium | Follow quote/orderbook scope. | No by default |
| Reference boundary reads | `/api/markets/[id]/reference` | Medium/High | Planning/review first because reference/liquidity internals can leak bot details. | No by default |

## Routes Excluded From Public No-Leak Auto-Merge

Do not treat these as low-risk public no-leak tests:

- Account balance, positions, ledger, portfolio, or API key routes.
- Wallet, deposit, withdrawal, faucet, or chain balance routes.
- Order placement, cancellation, fills, and trading mutation routes.
- Admin routes.
- Bot mutation or live-control routes.
- Agent logs/files routes.
- Deployment/system/config routes.

These route groups require specialist review and often human review even when tests are read-only.

## Recommended Next Safe Tests

1. Add a market detail current-gap test only if it remains mocked/local and is opened for review rather than auto-merged by default.
2. Add target-contract tests for market detail only after the route contract is approved.
3. Keep event market, market list, chart, taxonomy, sports, and event tests aligned with any future public response-shape decisions.
4. Keep the market-list grouped reference filter test aligned with future event-first and grouped-market routing decisions.
5. Leave quote, orderbook, and trade-tape tests behind `docs/reviews/QUOTE_ORDERBOOK_NO_LEAK_TEST_SCOPE.md`.
6. Leave reference/liquidity routes blocked behind public/admin split approval and specialist review.

## Promotion Question

The current no-leak tests are targeted, not part of `npm run test:ci`. A future low-risk planning PR should decide whether to:

- Add selected no-leak tests to `npm run test:ci`.
- Create a new package script such as `test:public-api`.
- Keep them as targeted evidence until the broader test lane is stable.

Do not change package scripts in the same PR as route coverage expansion unless the task explicitly allows workflow/package-script changes.

## Validation Commands For Future Test PRs

Use:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Non-Goals

This map does not:

- Add tests.
- Change CI.
- Change package scripts.
- Change public route behavior.
- Change auth, wallet, ledger, matching, settlement, admin, bot, deployment, Prisma, migrations, or production behavior.

## Validation For This Map

This map is docs-only. Validation for this PR should be:

```bash
git diff --check
```
