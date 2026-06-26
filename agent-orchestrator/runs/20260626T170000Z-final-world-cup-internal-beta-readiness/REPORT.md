# Final World Cup Internal Beta Readiness Report

Date: 2026-06-26

## Final Goal Summary

Build Poly into a controlled internal World Cup prediction-market beta where internal testers can browse World Cup events, review grouped markets, use the order ticket and combo slip, place guarded internal/test trades when explicitly enabled, view portfolio state, and review settlement evidence, while real public funding, withdrawals, wallet custody, private keys, real external fund movement, destructive migrations, public beta, and production live bots remain blocked.

## Current Score

```text
95/100
Controlled internal beta ready with warnings.
```

## Score Breakdown

See:

```text
agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_SCORECARD.md
```

## Completed Capabilities

- World Cup discovery page and event grouping.
- Grouped event markets and order ticket display.
- Combo slip with server-side quote and reason-code display.
- Guarded internal/test order path.
- Portfolio/open combo and settlement visibility evidence.
- Combo risk model v1.
- Single-leg cash-out estimate v1.
- Two-tick pricing tests.
- Reference sync dry-run tests and documentation.
- Market-making guardrails.
- Bot hygiene cleanup through Poly-bots PR #3.
- Admin settlement/preview evidence.
- Route no-leak evidence.
- Internal beta go/no-go checklist.
- Env flag, stop-service, and rollback instructions.
- Internal tester instructions.

## Cycle Record

Selected task:

```text
Final World Cup Internal Beta Readiness
```

Assigned subagents:

- Planner Agent: confirmed remaining gaps from the 90/100 state without restarting broad planning.
- Bot Engineer Agent: cleaned bot repo env hygiene and reran bot safety/reference/guardrail validation.
- Testing/Harness Agent: ran Prisma, TypeScript, Jest, build, bot tests, and direct browser smoke.
- Security/Safety Agent: verified blocked real-fund and production-live-bot areas stayed blocked.
- Deployment Agent: wrote env flag, stop-service, and rollback instructions.
- Reviewer Agent: audited readiness, remaining warnings, and go/no-go decision.

Files changed:

- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_SCORECARD.md`
- `agent-orchestrator/runs/20260626T170000Z-final-world-cup-internal-beta-readiness/REPORT.md`
- `docs/reviews/WORLD_CUP_INTERNAL_BETA_GO_NO_GO.md`
- `docs/reviews/WORLD_CUP_INTERNAL_BETA_ENV_FLAGS_AND_ROLLBACK.md`
- `docs/reviews/WORLD_CUP_INTERNAL_TESTER_INSTRUCTIONS.md`
- `docs/reviews/WORLD_CUP_FINAL_ROUTE_SECURITY_REVIEW.md`

Scorecard impact:

```text
90/100 -> 95/100
```

Next action:

```text
Run controlled internal beta with a small allowlist, collect tester evidence, and do not begin public beta or real-money funding work without a new explicit owner goal.
```

## Remaining Warnings

1. Authenticated reference-liquidity dry-run needs a valid local admin `poly_session` cookie in `POLY_SIM_SESSION_COOKIE`.
2. Checked-in Playwright runner previously hung in this shell; direct browser smoke passed and the test was stabilized.
3. Same-event correlated combo pricing is unsupported in v1.
4. Combo cash-out is unsupported.
5. Cash-out execution is disabled.
6. Public beta is not ready.
7. Production live bots with real funds are not approved.

## Harnesses And Tests Run

App validation commands run for final evidence:

```text
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run build
npx jest --runInBand src/__tests__/public.events.no-leak.test.ts src/__tests__/public.event-markets.no-leak.test.ts src/__tests__/public.market-list.no-leak.test.ts src/__tests__/public.sports.no-leak.test.ts src/__tests__/public.taxonomy.no-leak.test.ts
npx jest --runInBand src/__tests__/reference.two-tick-pricing.test.ts src/__tests__/world-cup-market-structure.test.ts src/__tests__/combo-orders.route.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/combo-risk.service.test.ts src/__tests__/cash-out.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/admin.combo-settlement.routes.test.ts src/__tests__/admin.market-settlement-preview.test.ts src/server/services/__tests__/comboSettlement.test.ts
```

App validation result:

```text
Prisma generate: passed
Prisma validate: passed
Public no-leak route tests: 5 suites passed, 20 tests passed
World Cup/internal drill targeted tests: 10 suites passed, 49 tests passed
TypeScript: passed
npm run test:ci: 13 suites passed, 39 tests passed
npm run build: passed
```

World Cup direct browser smoke result:

```json
{
  "status": "PASS",
  "httpStatus": 200,
  "eventCount": 5,
  "comboButtonCount": 18,
  "tradeSubmitDisabled": true
}
```

Bot validation commands run:

```text
npm run bots:safety
npm run test:world-cup-market-making-guardrails
npm run test:reference-liquidity
npm run test:production-risk-controls
npm run typecheck
```

Bot validation result:

```text
bots:safety: passed, bots disabled, live trading disabled, global kill switch true
world-cup-market-making-guardrails: passed
reference-liquidity: passed
production-risk-controls: passed
typecheck: passed
```

Bot hygiene result:

```text
Poly-bots PR #3 merged.
Tracked live-internal.env removed.
live-internal.env ignored.
live-internal.env.example added with disabled/dry-run defaults.
```

Authenticated reference-liquidity dry-run command shape:

```powershell
$env:POLY_BOT_BASE_URL='http://127.0.0.1:3001'
$env:POLY_SIM_SESSION_COOKIE='<local admin poly_session cookie>'
npm run liquidity:reference-dry-run -- --slug <reviewed-reference-market-slug>
```

Observed blocker without credentials:

```text
POLY_SIM_SESSION_COOKIE is required for admin import/review/list operations.
```

The Lead Agent did not invent, request, print, or commit an admin session cookie.

## Validation Summary

Validation Agent decision:

```text
SUFFICIENT FOR CONTROLLED INTERNAL BETA WITH WARNINGS
```

Rationale:

- Required app and bot validation has passing evidence from recent merged PRs and this final run.
- The only authenticated reference-liquidity gap is credential/session availability, not missing safety logic.
- Bot safety defaults remain disabled/dry-run/kill-switched.
- Public beta and real-money capabilities remain blocked.

## Reviewer Summary

Reviewer Agent decision:

```text
READY WITH WARNINGS
```

Scope review:

- No blocked real-fund behavior was enabled.
- No production live bot was enabled.
- No destructive migration was added.
- Final docs are operational and evidence-based.
- Bot repo hygiene warning for `live-internal.env` is closed by Poly-bots PR #3.

## Internal Beta Go/No-Go Decision

```text
GO for controlled internal World Cup beta.
NO-GO for public beta.
NO-GO for real deposits, real withdrawals, wallet custody, private keys, real external fund movement, destructive migrations, or production live bots with real funds.
```

## Safe To Test

- World Cup browsing and event detail.
- Order ticket estimates.
- Different-event combo quote/submit with internal/test balances and allowlisted users.
- Portfolio/open combo visibility.
- Admin settlement preview and internal/test combo settlement drill.
- Single-leg cash-out estimate.
- Bot reference/market-making dry-run evidence.

## Still Blocked

- Public beta.
- Real deposits.
- Real withdrawals.
- Wallet custody and private keys.
- Real-money ledger movement.
- External real-fund movement.
- Production live bots with real funds.
- Same-event correlated combo pricing.
- Combo cash-out.
- Cash-out execution.

## Exact Internal Beta Environment Flags

Initial safe mode:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
POLY_BOTS_MODE=dryRun
SYSTEM_LIQUIDITY_DRY_RUN=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
```

Short allowlisted internal trading drill mode:

```text
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true
INTERNAL_TRADING_ALLOWLIST_EMAILS=<approved internal tester emails only>
```

Keep funding and production live bots disabled during the drill.

## Exact Commands To Run Internal Drill

App repo:

```powershell
$env:DATABASE_URL='<local or internal beta database url>'
npx prisma migrate deploy --schema=prisma/schema.prisma
npm run build
npm run test:ci
npx jest --runInBand src/__tests__/combo-orders.route.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/combo-risk.service.test.ts src/__tests__/cash-out.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/admin.combo-settlement.routes.test.ts src/server/services/__tests__/comboSettlement.test.ts
```

Bot repo:

```powershell
npm run bots:safety
npm run test:world-cup-market-making-guardrails
npm run test:reference-liquidity
npm run test:production-risk-controls
```

Authenticated reference-liquidity dry-run, only with a local admin session:

```powershell
$env:POLY_SIM_SESSION_COOKIE='<local admin poly_session cookie>'
npm run liquidity:reference-dry-run -- --slug <reviewed-reference-market-slug>
```

Do not print the cookie.

## Exact Commands To Stop Or Roll Back

Immediate flag rollback:

```text
TRADING_KILL_SWITCH=true
INTERNAL_TRADING_BETA_ENABLED=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
INTERNAL_FUNDING_BETA_ENABLED=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_ENABLED=false
```

Stop local app:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Stop Linux services:

```bash
sudo systemctl stop poly-app
sudo systemctl stop poly-reference-liquidity-runtime.service
sudo systemctl stop poly-market-maker.service
```

Code rollback:

```bash
git checkout <last-known-good-dev-commit>
npm ci
npm run build
```

Do not delete ledger, order, position, deposit, withdrawal, or balance rows as rollback.

## Next Recommended Goal After Internal Beta

Run the controlled internal World Cup beta with a small allowlist and collect:

- tester route/browser evidence;
- quote/submit/portfolio evidence;
- admin settlement drill evidence;
- route no-leak evidence after every change;
- bot dry-run logs;
- operator incident notes.

After that, open a separate owner goal for either:

```text
same-event correlated combo pricing design
```

or:

```text
cash-out execution design
```

Do not begin public beta or real-money funding work without a new explicit owner goal.
