# Admin Display Implementation Scope

Task id: UI-025

Assigned subagents: LeadAgent, FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent, BotAgent, DeploymentAgent

Risk level: High because admin pages include market mutations, finance operations, bot/reference controls, system readiness, agent monitoring, and invariant checks.

Status: Planning-only. This document does not change admin UI code, admin auth, API behavior, finance operations, market resolution, bot behavior, deployment, Prisma, migrations, package scripts, workflows, secrets, or production behavior.

## Purpose

Admin UI should become easier to scan without making dangerous actions easier to trigger accidentally.

Future admin display work must separate:

- Read-only monitoring.
- Content operations.
- Financial operations.
- Market resolution/invariant operations.
- Bot/reference operations.
- System/deployment readiness.
- Agent/orchestrator monitoring.

## Current Admin Surfaces

Routes in scope:

- `/admin`
- `/admin/deposits`
- `/admin/withdrawals`
- `/admin/reference-markets`
- `/admin/bots`
- `/admin/agents`
- `/admin/system`
- `/admin/markets/[marketId]/invariants`

Observed high-risk behavior adjacency:

- `/admin` includes market create/edit, pause, and resolve paths.
- `/admin/deposits` includes deposit rescan.
- `/admin/withdrawals` includes complete/reject paths and tx hash input.
- `/admin/reference-markets` includes import, review, bot lifecycle, quote, pause, reset, cancel, and emergency-stop controls.
- `/admin/bots` and bot monitor components include bot status, balances, orders, fills, limits, exposure, errors, and recent activity.
- `/admin/system` shows reconciliation and readiness data.
- `/admin/agents` shows agent and bot operational status and logs.

## Safe Future UI Scope

Future autonomous admin UI work may be considered only for read-only display surfaces:

- Section headers and labels.
- Read-only dashboard grouping.
- Empty/loading/error copy.
- Status badge styling and wording.
- Read-only table spacing.
- Read-only help text that clarifies risk.
- Visual separation between monitor-only and mutation controls.
- Docs-only screenshot/evidence requirements.

## Forbidden Future UI Scope Without Human Approval

Future autonomous work must not change:

- Admin authentication or authorization.
- Market create, edit, pause, resolve, close, or cancel behavior.
- Deposit rescan behavior.
- Withdrawal complete or reject behavior.
- Tx hash requirements.
- Reference market import/review behavior.
- Bot lifecycle actions, live/dry-run behavior, quote actions, emergency stop, risk limits, or credentials.
- System readiness calculations or deployment behavior.
- Agent/orchestrator execution behavior.
- API endpoints, request payloads, polling intervals, or response interpretation.
- Prisma schema, migrations, package scripts, workflows, executable scripts, deployment config, secrets, or production settings.

## Recommended First Admin UI PRs

Any future code PR should be small and likely human-reviewed by default:

| Task | Scope | Files likely affected | Auto-merge default |
|---|---|---|---|
| UI-025A | Admin landing page section labels only | `src/app/admin/page.tsx` | Human review by default |
| UI-025B | Admin system read-only status grouping | `src/app/admin/system/page.tsx` | Human review by default |
| UI-025C | Admin agents read-only copy/status labels | `src/app/admin/agents/page.tsx` | Human review by default |
| UI-025D | Admin bots read-only monitor labels | `src/app/admin/bots/page.tsx`, `src/components/admin/BotMonitorDashboard.tsx` | Human review by default |
| UI-025E | Admin finance screenshot/evidence checklist | `docs/reviews/` | Docs-only yes |

Do not start with deposits, withdrawals, market resolution, reference-market bot controls, or invariant action surfaces unless a human-approved scope exists.

## Acceptance Criteria For Future Admin UI PRs

Future admin display PRs must:

- State whether the page is read-only, content-mutating, finance-mutating, resolution-mutating, bot-mutating, deployment-adjacent, or agent-operation-adjacent.
- Preserve all auth checks and API calls.
- Preserve all mutation handlers and payloads.
- Preserve confirmation prompts and disabled states.
- Run full validation and focused lint.
- Include SecurityAgent review.
- Include LedgerWalletReviewerAgent, BotAgent, or DeploymentAgent review when relevant.
- Include screenshot or visual QA notes only with non-sensitive local data.

## Validation Commands For Future Code PRs

```bash
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- <changed-admin-ui-files>
```

## Non-Goals

This scope does not:

- Implement admin UI changes.
- Change admin auth.
- Change market operations.
- Change deposit, withdrawal, wallet, ledger, matching, settlement, order, fill, trade, position, bot, agent execution, deployment, Prisma, migration, package, workflow, script, secret, or production behavior.
- Approve public beta or production operations.
