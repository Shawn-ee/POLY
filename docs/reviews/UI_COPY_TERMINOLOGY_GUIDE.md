# UI Copy And Terminology Guide

Task id: UI-015

Assigned subagents: LeadAgent, FrontendAgent, DocsAgent, SecurityAgent

Risk level: Low for docs-only copy guidance

Status: Active terminology guide

## Purpose

This guide standardizes user-facing POLY terminology so future UI work is clear, beta-safe, and consistent. It does not implement copy changes, legal disclosures, wallet behavior, trading behavior, or production launch decisions.

## Core Product Language

Use:

- `Sports prediction markets`
- `Events`
- `Markets`
- `Yes` / `No`
- `Price`
- `Probability`
- `Positions`
- `Open orders`
- `Portfolio`
- `Wallet`
- `Internal beta`
- `Test credits`

Avoid:

- Claims that deposits or withdrawals are public-ready.
- Claims that prices are guarantees.
- Exchange jargon as the first explanation for normal users.
- Admin, bot, reference-market, invariant, or reconciliation terms on public pages.

## Price And Probability

Preferred copy:

- `Yes price`
- `No price`
- `Implied probability`
- `Market price`

Support copy:

- `Prices can move and are not guarantees.`
- `A Yes or No price reflects current market expectations.`

Avoid:

- `Guaranteed odds`
- `Sure thing`
- `Risk-free`

## Beta And Funding

Preferred copy:

- `Internal beta`
- `Test credits only`
- `Funding is not enabled for public use yet`
- `Deposits and withdrawals are gated until approved`

Avoid:

- `Instant deposits`
- `Withdraw now`
- `Production wallet`
- `Real-money launch`
- Any copy implying custody, chain funding, or withdrawals are ready without approval.

## Market Status

Use consistent labels:

- `Open`
- `Paused`
- `Scheduled`
- `Resolved`
- `Canceled`
- `Final`
- `Upcoming`
- `Live`

When status affects trading, do not change behavior through copy-only PRs. The UI may explain the state, but the backend remains the source of truth.

## Calls To Action

Public discovery:

- Primary: `Browse sports`
- Secondary: `View markets` or `All markets`
- Event card: `Open event`
- Market card: `Open market`

Account:

- `View portfolio`
- `Review wallet`
- `Sign in`

Avoid public CTAs such as:

- `Create in admin`
- `Start bot`
- `Fund account`
- `Withdraw now`

unless a human-approved route/task explicitly allows them.

## Admin And Internal Copy

Admin pages should use operational language:

- `Internal admin`
- `Review required`
- `Dry run`
- `Live controls disabled`
- `Reconciliation`
- `Invariant check`
- `Pending review`

Dangerous actions must name the action and target clearly. Display-only PRs must not alter confirmations, handlers, payloads, auth, or mutations.

## Empty State Copy

Public pages:

- Explain what is missing.
- Offer a safe next browse action.
- Avoid admin-only instructions.

Account pages:

- Explain signed-out or no-activity states.
- Do not imply funding is enabled.

Admin pages:

- State whether no data means healthy, not configured, or unavailable.

## Non-Goals

This guide does not:

- Replace legal review.
- Approve risk disclosures.
- Change wallet, ledger, trading, admin auth, bot, deployment, Prisma, package, workflow, script, or secret behavior.

## Validation

This guide is docs-only. Validation:

```bash
git diff --check
```
