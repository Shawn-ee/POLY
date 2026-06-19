# UI Component Style Guide

Task id: UI-013

Assigned subagents: LeadAgent, FrontendAgent, DocsAgent, SecurityAgent

Risk level: Low for docs-only style guidance

Status: Active style guide

## Purpose

This guide defines how POLY should use existing UI primitives consistently while standardizing the app. It does not implement components, change UI code, add dependencies, alter behavior, or approve broad design-system rewrites.

## Existing Primitives

Prefer these existing components before adding new abstractions:

- `src/components/ui/PageContainer.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/States.tsx`
- `src/components/ui/OutcomeButton.tsx`

Prefer existing domain display components before creating replacements:

- `src/components/MarketCard.tsx`
- `src/components/EventCard.tsx`
- `src/components/sports/SportsEventCard.tsx`
- `src/components/sports/SportsEventsPage.tsx`
- `src/components/market/shared/MarketHeader.tsx`
- `src/components/market/shared/MarketStatusBadge.tsx`

## Page Header

Use a page header for every major page:

- Eyebrow: short category or beta state.
- H1: direct page purpose.
- Supporting copy: one or two short sentences.
- Primary CTA: one clear next action when appropriate.
- Secondary CTA: optional, visually quieter.

Avoid:

- Multiple competing CTAs.
- Admin or funding language on public discovery pages.
- Hero copy that implies real-money readiness.

## Cards

Use cards for:

- Repeated list items.
- Market summaries.
- Event summaries.
- Account summary blocks.
- Operational status summaries.

Avoid using cards as decorative wrappers around full page sections. Do not nest cards inside cards unless the inner card is a repeated item or a clearly framed tool.

## Buttons And Links

Primary buttons:

- One per page section when possible.
- Used for the next safe user action.

Secondary buttons:

- Used for alternate browsing or review actions.

Text links:

- Used for secondary navigation such as `All markets` or `View details`.

Danger buttons:

- Used only on admin or action-bearing pages.
- Must remain visually separated and copy must state the action clearly.

## Badges

Use badges for:

- Market status.
- Visibility: public/private.
- Mechanism: orderbook/pool.
- Beta/internal labels.
- Dry-run/live operational state.

Do not use badges as the only explanation for high-risk state. Pair high-risk badges with short supporting copy.

## Lists And Tables

Public and mobile-first pages should prefer cards. Dense tables are acceptable for admin and internal tools, but should have:

- Clear column names.
- Status badges.
- Empty states.
- Visible distinction between read-only rows and mutation controls.

## Outcome Display

Outcome controls should use existing `OutcomeButton` patterns where possible. Yes/No labels should be visually consistent and should not imply guaranteed results.

Trading behavior, order placement, and order cancellation must not be changed by style-only PRs.

## Beta Warnings

Use beta warnings when a page mentions:

- Funding.
- Wallet.
- Deposits.
- Withdrawals.
- Balances.
- Settlement.
- Admin operations.
- Bot/liquidity operations.

Beta warnings should be concise and contextual, not a global wall of text.

## Validation

Docs-only updates:

```bash
git diff --check
```

UI code using these rules:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- <changed-ui-files>
```

## Non-Goals

This guide does not:

- Replace the design system.
- Add dependencies.
- Change business logic.
- Change wallet, ledger, trading, auth, admin, bot, deployment, Prisma, package, workflow, script, or secret behavior.
