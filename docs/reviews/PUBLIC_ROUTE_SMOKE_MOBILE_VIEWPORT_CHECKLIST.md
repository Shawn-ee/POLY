# Public Route Smoke Mobile Viewport Checklist

Task id: UI-020A

Phase: Phase UI/G - Public route smoke evidence preparation

Assigned subagents: TestingAgent, FrontendAgent, SecurityAgent

Risk level: Low for docs-only checklist

## Purpose

This checklist defines the desktop and mobile viewport observations to record during a future local-only anonymous public route smoke pass.

It does not start a dev server, open a browser, capture screenshots, add tests, change package scripts, change workflows, change UI, change APIs, deploy, approve public beta, or alter wallet, ledger, trading, admin, bot, Prisma, migration, secret, or production behavior.

## Required Preconditions

Before using this checklist, confirm:

- The prerequisites in `docs/reviews/PUBLIC_ROUTE_SMOKE_MANUAL_RUN_PREREQUISITES.md`.
- The anonymous route and stop-condition rules in `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md`.
- The app is running locally with local/dev data only.
- The tester remains anonymous and does not sign in.
- No production URL, production database, production account, production secret, real chain RPC, custody provider, payment provider, exchange credential, private key, wallet seed, or API token is used.

## Viewport Set

Use practical viewport sizes that represent common layout risks:

| Viewport | Suggested size | Purpose |
|---|---:|---|
| Desktop | 1440 x 900 | Verify headers, filters, cards, and calls to action are readable without excessive empty or crowded space. |
| Tablet/narrow desktop | 768 x 1024 | Verify two-column sections collapse cleanly and filter rows wrap without overlap. |
| Mobile | 390 x 844 | Verify the page is usable in one column and long labels, titles, buttons, and cards do not overflow. |

If the local browser or tooling cannot set an exact viewport, record the closest available size.

## Route-Specific Mobile Observations

| Route | Mobile observation to record | Stop or fail if |
|---|---|---|
| `/` | Header, primary sports entry points, beta context, featured sections, and cards fit in one column. | Admin, funding, wallet, bot, or internal controls appear; primary CTAs overlap or overflow. |
| `/markets` | Filter groups wrap cleanly, market cards remain readable, and no-price fallback copy fits. | Filters overlap cards, text clips, or private liquidity/admin/bot metadata appears. |
| `/events` | Event cards wrap long titles and status/timing copy remains readable. | Event title, timing, or action areas clip or expose admin/funding/internal controls. |
| `/sports` | Sport tiles, links, and empty states stack without horizontal scroll. | Links or cards overflow, or wallet/admin/bot controls appear. |
| `/sports/soccer` | Event groups and market links wrap without horizontal scroll. | Event groups require unsafe data, mutation steps, or expose private/internal notes. |
| `/sports/soccer/world-cup` | Header copy, route cards, and beta-safe framing remain readable. | Demo, fixture, admin, funding, bot, or internal operational details appear. |
| `/login` | Login buttons, copy, and error area have enough space to render. | Provider secrets, callback internals, admin paths, or production claims appear. |

## Common Layout Checks

For each route and viewport, record whether:

- There is horizontal overflow.
- Text is clipped or hidden.
- Buttons fit their labels.
- Cards maintain readable spacing.
- Filters or tab-like controls wrap predictably.
- Loading, empty, and error states have enough vertical room.
- Long event, market, sport, or provider names wrap without covering other content.
- Footer, nav, and primary content do not overlap.

## Evidence Recording

Use `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md` or a dated copy of that template. For each route, record:

- Viewport size.
- Result: pass, fail, partial, blocked, or not run.
- Layout notes.
- No-leak notes.
- Whether screenshots were captured, or `none` if no screenshots were captured.
- Any reason a route or viewport was deferred.

Screenshots remain optional. Capture them only when local data is safe and the artifact contains no secrets, production data, private customer data, raw custody details, wallet keys, tokens, sensitive admin information, or internal notes.

## Forbidden Actions

During this viewport pass, do not:

- sign in
- open wallet, portfolio, private pool, market-detail fixture, event-detail fixture, or admin routes
- submit forms
- click buy, sell, order, cancel, resolve, deposit, withdraw, faucet, rescan, complete, reject, import, quote, pause, reset, emergency-stop, or bot controls
- mutate local or remote data
- print environment variables or secrets
- capture screenshots containing sensitive data

## Outcome Boundary

Passing this checklist only supports local anonymous viewport evidence. It does not approve public beta, production deployment, real funding, wallet custody, trading, matching, settlement, ledger readiness, admin auth readiness, bot readiness, package-script changes, workflow changes, or production operations.

## Validation

This checklist is docs-only. Validation:

```bash
git diff --check
```
