# Portfolio Display Implementation Scope

Task id: UI-009

Assigned subagents: LeadAgent, FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent

Risk level: Medium/High because `/portfolio` displays balances, locked funds, positions, PnL, history, and order-adjacent account state.

Status: Planning-only. This document does not change portfolio UI code, APIs, wallet behavior, ledger, matching, settlement, orders, fills, trades, positions, auth, admin, bot behavior, deployment, Prisma, migrations, package scripts, workflows, secrets, or production behavior.

## Purpose

The portfolio page should become a simple account home that explains:

- Available account balance.
- Locked funds.
- Open positions.
- Realized and unrealized outcomes.
- Resolved market history.
- Empty states for new users.

Because those values are financially meaningful, future autonomous UI changes must not reinterpret calculations or change account semantics.

## Current Surface

`src/app/portfolio/page.tsx` currently:

- Fetches `/api/portfolio`.
- Fetches `/api/portfolio/history`.
- Redirects unauthenticated users to `/login`.
- Displays available, locked, total, position value, cost basis, realized PnL, and unrealized PnL.
- Filters active and resolved positions.
- Searches position/history rows.
- Displays merged open and resolved account items.

## Safe Future UI Scope

Future autonomous PRs may be considered if they are strictly display-only:

- Page header copy and beta-safe account explanation.
- Summary card grouping and visual hierarchy.
- Empty state for no positions.
- Empty state for no resolved history.
- Search/filter label clarity.
- Mobile card layout for already-computed values.
- Links to sports/markets as safe next browsing actions.
- Copy that says values are account estimates when appropriate.

## Forbidden Future UI Scope Without Human Approval

Future autonomous work must not:

- Change `/api/portfolio` or `/api/portfolio/history`.
- Change balance, locked balance, total balance, position value, cost basis, PnL, winnings, refunds, or settlement calculations.
- Change order cancellation behavior.
- Change wallet funding, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, or position behavior.
- Change auth redirect/session behavior.
- Add funding CTAs.
- Add withdrawal claims.
- Hide materially important locked-balance or PnL information.

## Recommended First Code PR

The safest first portfolio code PR should be:

`UI-009A - Portfolio header and empty-state copy polish`

Allowed:

- Header copy.
- Beta-safe supporting copy.
- Empty state text and safe browse links.
- Section labels.

Forbidden:

- Summary number calculations.
- Data loading logic.
- Filters/search behavior.
- Position/history row semantics.
- Wallet/funding actions.

Auto-merge default: no by default because portfolio is account-state-adjacent, but it may be eligible for display-only auto-merge only if the diff is extremely small, validation passes, and LedgerWalletReviewerAgent confirms no calculation or financial semantics changed.

## Suggested Split PRs

| Task | Scope | Files likely affected | Auto-merge default |
|---|---|---|---|
| UI-009A | Header and empty-state copy polish | `src/app/portfolio/page.tsx` | Maybe, strict review |
| UI-009B | Summary card visual hierarchy only | `src/app/portfolio/page.tsx` | Human review by default |
| UI-009C | Mobile card layout for position/history rows | `src/app/portfolio/page.tsx` | Human review by default |
| UI-009D | Portfolio route screenshot/smoke checklist | `docs/reviews/` | Docs-only yes |
| ACC-* | Any balance/PnL/position semantics | API, ledger, tests, UI | Not autonomous |

## Acceptance Criteria For Future Portfolio UI PRs

Future portfolio display PRs must:

- State that they are display-only.
- Preserve all fetch endpoints and state calculations.
- Preserve every displayed value unless copy-only labels change.
- Preserve auth redirect behavior.
- Avoid deposit/withdraw/funding CTAs.
- Run full validation and focused lint.
- Include LedgerWalletReviewerAgent review.
- Include desktop/mobile visual evidence when practical and safe.

## Validation Commands For Future Code PRs

```bash
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- src/app/portfolio/page.tsx
```

## Non-Goals

This scope does not:

- Implement portfolio UI changes.
- Change balances, PnL, positions, orders, history, wallet, deposit, withdrawal, ledger, matching, settlement, auth, admin, bot, deployment, Prisma, migrations, package scripts, workflows, secrets, or production behavior.
- Approve public beta or real-money account features.
