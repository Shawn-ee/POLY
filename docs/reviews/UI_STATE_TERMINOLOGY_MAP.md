# UI State Terminology Map

Task id: UI-010

Assigned subagents: LeadAgent, FrontendAgent, DocsAgent, SecurityAgent

Risk level: Low for docs-only terminology mapping

Status: Active route-level state terminology map

## Purpose

This map standardizes loading, empty, error, signed-out, unavailable, and beta-gated wording by route group before future UI work changes page copy.

It does not change UI code, tests, API behavior, auth behavior, wallet behavior, ledger, matching, settlement, orders, positions, admin operations, bot runtime, deployment, Prisma, migrations, package scripts, workflows, secrets, or production behavior.

## Shared Rules

- Prefer plain user-facing language over implementation terms.
- Explain the state and give one safe next action when possible.
- Public route states should point users toward sports, events, markets, or sign-in, not admin setup.
- Account route states should distinguish missing data from zero balances or zero positions.
- Funding, withdrawal, order, admin, bot, and deployment states must not imply readiness before human approval.
- Error copy may say retry when retry behavior already exists, but copy-only PRs must not add new retry behavior.

## Public Discovery Routes

Routes:

- `/`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/events`
- `/markets`
- `/login`

| State | Preferred wording | Safe next action | Avoid |
|---|---|---|---|
| Loading events | `Loading events` | None unless already present. | `Fetching admin events`, debug details. |
| Loading markets | `Loading markets` | None unless already present. | `Loading orderbook engine`, bot/reference terms. |
| Empty events | `No events are ready yet` | `Browse markets` or `Check back soon`. | `Create an event in admin`. |
| Empty markets | `No markets are ready yet` | `Browse sports` or `Check back soon`. | `Fund your account`, `Start trading now`. |
| Error loading public data | `Could not load this page` or `Could not load markets` | Existing retry or route back to sports/markets. | Stack traces, endpoint paths, Prisma errors. |
| Login unavailable/error | `Sign-in could not start` | Existing sign-in retry or return to public browsing. | OAuth internals, callback URLs, secrets. |

Public pages may mention `Internal beta` and `Test credits only`. They must not imply deposits, withdrawals, production trading, or admin access are ready for public users.

## Event Detail Route

Route:

- `/events/[slug]`

| State | Preferred wording | Safe next action | Boundary |
|---|---|---|---|
| Loading event | `Loading event` | None unless already present. | Do not change fetch behavior. |
| Event not found | `Event not found` | `Back to sports` or `View events`. | Do not expose hidden/internal event details. |
| No related markets | `Markets for this event are not ready yet` | `View all markets` or `Back to sports`. | Do not add trading CTAs. |
| Error loading event | `Could not load this event` | Existing retry or back link. | Do not change grouped market parsing. |
| Resolved/canceled event | `Event resolved` or `Event canceled` | Read-only context only. | Do not change `GroupedTradeTicket` or order callbacks. |

Autonomous code PRs for this route must avoid `GroupedTradeTicket`, selected trade state, order callbacks, polling, request parameters, and response parsing unless explicitly human-reviewed.

## Market Detail Route

Route:

- `/markets/[id]`

| State | Preferred wording | Safe next action | Boundary |
|---|---|---|---|
| Loading market | `Loading market` | None unless already present. | Do not change Prisma/API behavior. |
| Market not found | `Market not found` | `View markets`. | Do not expose hidden market internals. |
| No liquidity or no price | `Price unavailable` or `No price available yet` | Read-only explanation. | Do not change orderbook, quote, or bot/reference behavior. |
| Coming soon/scheduled | `Market scheduled` or `Market opens later` | Read-only explanation. | Do not enable order entry. |
| Error loading market | `Could not load this market` | Existing retry or back link. | Do not change route contract. |

Market detail work remains review-gated around order tickets, orderbook, pool actions, positions, wallet-adjacent data, reference data, and bot controls.

## Account Routes

Routes:

- `/portfolio`
- `/wallet`

| State | Preferred wording | Safe next action | Avoid |
|---|---|---|---|
| Signed out | `Sign in to view your account` | `Sign in` or return to sports/markets. | Claiming account data is missing or zero. |
| Empty portfolio | `No positions yet` | `Browse sports` or `View markets`. | Funding CTAs, `Deposit to begin`. |
| Empty history | `No resolved history yet` | Keep browsing action optional. | Hiding locked balances or PnL context. |
| Balance unavailable | `Balance unavailable` | Existing reload if present. | Showing `$0.00` unless the value is truly zero. |
| Funding gated | `Funding is not enabled for public use yet` | None, or existing beta-safe faucet if already present. | `Deposit now`, `Withdraw now`, production wallet claims. |
| Withdrawal unavailable | `Withdrawals are gated until approved` | None unless human-approved. | Suggesting automated payouts are live. |

Portfolio and wallet copy must not reinterpret balances, locked funds, PnL, positions, withdrawals, deposits, or external wallet balances.

## Private Pool Routes

Routes:

- `/my-pools`
- `/create`
- `/pool/[id]`

| State | Preferred wording | Safe next action | Boundary |
|---|---|---|---|
| Empty private pools | `No private pools yet` | Existing create/browse action if already available. | Do not make private pools the public MVP path. |
| Pool unavailable | `Pool unavailable` | Return to private pools. | Do not expose invite or owner internals. |
| Loading pool data | `Loading pool` | None unless already present. | Do not change join, bet, cancel, or resolve behavior. |
| Pool action error | Existing specific action error. | Existing retry path only. | Do not change request payloads or confirmations. |

Private pool copy can be display-only, but action-bearing routes remain review-gated when owner controls, invites, bets, cancellation, or resolution are nearby.

## Admin And Internal Routes

Routes:

- `/admin`
- `/admin/deposits`
- `/admin/withdrawals`
- `/admin/reference-markets`
- `/admin/bots`
- `/admin/agents`
- `/admin/system`
- `/admin/markets/[marketId]/invariants`

| State | Preferred wording | Safe next action | Avoid |
|---|---|---|---|
| No pending items | `No pending items` | None. | Treating healthy empty queues as failures. |
| Review required | `Review required` | Existing admin action only. | Making dangerous actions easier to trigger. |
| Data unavailable | `Data unavailable` | Existing reload if present. | Raw SQL, stack traces, secrets, credentials. |
| System degraded | `System degraded` | Existing internal runbook link only if already present. | Deployment instructions in public UI. |
| Bot disabled/dry run | `Dry run` or `Live controls disabled` | None unless human-approved. | `Start live bot`, credential hints. |
| Invariant issue | `Invariant check needs review` | Existing admin review flow only. | Changing financial operation semantics. |

Admin states must preserve auth checks, polling, endpoints, payloads, confirmations, disabled states, and mutation behavior.

## Future PR Checklist

Use this checklist before changing UI state copy:

- The route group is listed in this map or a new docs-only scope is added first.
- The copy does not imply production funding, withdrawal, trading, bot, admin, or deployment readiness.
- The copy does not expose admin-only setup instructions on public routes.
- Zero, empty, unavailable, and error states are distinct.
- Any code PR states whether it touched action-bearing components.
- Validation follows the relevant scope document for that route.

## Validation

This map is docs-only. Validation:

```bash
git diff --check
```
