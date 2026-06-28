# Server Runtime Services Playbook

Updated: 2026-06-28

Target: Closed Internal Beta v1 with internal/test balances only.

## A. Deployment Target

Allowed:

- Allowlisted/internal users
- Test balances
- Internal order matching
- Polymarket reference price sync
- World Cup market discovery reports
- DB-backed discovery candidate queue
- Manual/admin-gated draft import
- Manual/admin-gated promotion
- Market maker dry-run
- Guarded internal live-local bot orders
- Admin monitoring

Not allowed:

- Real deposits
- Real withdrawals
- Real wallet custody/private-key usage
- Real-money ledger movement
- Real cash-out execution
- Production live bots with real external funds
- Public non-whitelisted trading

## B. Required Repo / Worktree

Source of truth:

```sh
C:\Users\hecto\projects\agent-workspaces\Poly-polymarket-mm-runtime
```

Use the current `origin/main` / `origin/dev` commit after this run.

Warning: `C:\Users\hecto\Desktop\projects\PolyProj\Poly` may be stale unless explicitly synced.

Verification commands:

```sh
git remote -v
git branch --show-current
git rev-parse HEAD
git status
```

## C. Required Infrastructure

- Linux server
- Node.js
- npm
- PostgreSQL
- Prisma
- Nginx or equivalent reverse proxy
- systemd user services/timers
- Google OAuth credentials
- Environment file with safe internal-beta flags
- Domain and SSL
- SSH or Tailscale optional for private administration

## D. Required Env Variables

Use placeholders only. Do not store real secrets in repo.

```sh
DATABASE_URL="postgresql://poly:<password>@127.0.0.1:5432/poly"
NEXTAUTH_URL="https://<internal-beta-domain>"
NEXTAUTH_SECRET="<generated-secret>"
ADMIN_EMAILS="owner@example.com,admin@example.com"
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-client-secret>"

INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
REAL_MONEY_MODE=false

INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false

POLYMARKET_DISCOVERY_FIXTURE_MODE=false
POLYMARKET_DISCOVERY_LIVE_SMOKE=true
POLYMARKET_DISCOVERY_SKIP_DB=false
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false

POLYMARKET_REFERENCE_FIXTURE_MODE=false
REFERENCE_POLL_MS=10000
REFERENCE_SYNC_ONLY_MM_ENABLED=true

ALLOW_BOT_TRADING=true
LOCAL_BOT_TRADING_ONLY=true
POLYMARKET_MM_LIVE_LOCAL=false
POLYMARKET_MM_LOOP_FOREVER=true
POLYMARKET_MM_LOOP_MS=30000
POLYMARKET_MM_SKIP_DISCOVERY=false

MAX_TRADE_SHARES=10
TRADE_COOLDOWN_SECONDS=5
WALLET_CAP=100
```

Risk/exposure variables should stay low for closed beta. If additional max exposure variables exist in the runtime config, set them to small internal-test values before enabling live-local MM.

## E. Runtime Service Inventory

| Service | Purpose | Command | Mode | Writes DB? | Creates internal bot orders? | Safe default? | Frequency | First beta? |
|---|---|---|---|---:|---:|---:|---|---:|
| `poly-web.service` | Web/API app | `npm start` | continuous | yes | no | yes | always on | yes |
| `poly-reference-sync.service` | Sync verified reference prices | `npm run reference:sync:loop` | continuous | yes | no | yes | 5-15 sec | yes |
| `poly-polymarket-discovery.timer` / `.service` | Read-only/live-smoke discovery and candidate persistence | `npm run polymarket:discover:once` | timer | yes if DB persistence enabled | no | yes | 5-15 min | yes |
| `poly-polymarket-import.service` | Draft import from reviewed candidates | `npm run polymarket:import:draft -- --fromDb=true --confirmDraftImport true` | one-shot | yes | no | no, manual gated | after review | no automatic |
| `poly-polymarket-mapping-validation.service` | Validate imported mappings | `npm run polymarket:mapping:validate -- --fromDb=true --confirmUpdate=true` | one-shot | yes | no | no, manual gated | after import | manual |
| `poly-polymarket-promotion.service` | Promote validated markets | `npm run polymarket:promote:validated` | one-shot | yes | no | no, manual gated | after validation | manual |
| `poly-reference-market-maker.service` | Dry-run or live-local internal MM | `npm run mm:polymarket:dry-run`, `npm run mm:polymarket:live-local-once`, or `npm run polymarket-mm:loop` | one-shot/continuous | yes | live-local only | dry-run yes | 5-30 sec | dry-run first |
| `poly-risk-monitor.service` | Stale/risk checks | `npm run risk:polymarket:once` | timer | yes | no | yes | 15-60 sec | yes |
| `poly-agent-orchestrator.service` | Loop Engineer maintenance | `npm run agent:orchestrator:loop` | continuous | yes | no | no | as needed | no |

## F. Startup Phases

### Phase 0: Build Validation

```sh
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm exec prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run build
```

Harnesses:

```sh
bash agent-orchestrator/harnesses/world_cup_reference_sync_check.sh
bash agent-orchestrator/harnesses/world_cup_two_tick_pricing_check.sh
bash agent-orchestrator/harnesses/world_cup_market_making_bot_check.sh
bash agent-orchestrator/harnesses/internal_beta_trading_check.sh
bash agent-orchestrator/harnesses/deployment_check.sh
bash agent-orchestrator/harnesses/world_cup_discovery_candidate_queue_e2e_check.sh
```

Run the candidate-queue harness only after it exists in the checked-out commit.

### Phase 1: Web Only

Start `poly-web.service`.

Verify:

```sh
curl http://127.0.0.1:3001/api/health
```

Then check public domain, Google login, admin access, and World Cup page.

### Phase 2: Reference Sync

```sh
npm run reference:sync:once
npm run reference:sync:loop
```

Verify `ReferenceQuoteSnapshot` rows.

### Phase 3: MM Dry-Run

```sh
npm run mm:polymarket:dry-run
```

Verify `BotOrderIntent` rows and no live internal orders unless live-local was explicitly enabled.

### Phase 4: Guarded Internal Live-Local MM

Only after dry-run passes:

```sh
ALLOW_BOT_TRADING=true
LOCAL_BOT_TRADING_ONLY=true
REAL_MONEY_MODE=false
npm run mm:polymarket:live-local-once
```

Verify internal bot orders, locked demo balance, and test-user matching.

### Phase 5: Discovery Read-Only / DB Candidate Persistence

```sh
npm run polymarket:discover:once
```

Verify DB candidates or report output.

### Phase 6: Admin Review / Import / Validate

```sh
npm run polymarket:admin-review:report -- --fromDb=true
npm run polymarket:import:draft -- --fromDb=true --confirmDraftImport true
npm run polymarket:mapping:validate -- --fromDb=true --confirmUpdate=true
```

### Phase 7: Promotion

Manual/guarded only:

```sh
npm run polymarket:promote:validated
```

Verify no draft leak, reference sync, two-tick pricing, and MM dry-run before quoting.

## G. Disabled Services

Keep these disabled for closed beta:

- Deposit listener
- Withdrawal processor
- Wallet/private-key worker
- Auto deposit credit worker
- Real cash-out worker
- Production real-money market maker
- Any external real-fund trading worker

## H. Pause Commands

MM:

```sh
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
```

Discovery/import/promotion:

```sh
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false
POLYMARKET_MM_SKIP_DISCOVERY=true
```

Systemd:

```sh
systemctl --user stop poly-reference-sync.service
systemctl --user stop poly-reference-market-maker.service
systemctl --user stop poly-polymarket-discovery.timer
```

## I. Rollback Procedure

1. Stop MM.
2. Stop discovery/import/promotion.
3. Run rollback dry-run.
4. Confirm the scoped candidates/markets are correct.
5. Run rollback confirm if scope is correct.
6. Disable mapping via admin API if needed.
7. Revert app commit if code rollback is needed.
8. Restore DB backup if data rollback is needed.

Commands:

```sh
npm run polymarket:imports:rollback -- --batchId <batch> --dryRun
npm run polymarket:imports:rollback -- --batchId <batch> --confirmRollback true
```

## J. Monitoring / Logs

```sh
systemctl --user status poly-web.service
journalctl --user -u poly-web.service -f
journalctl --user -u poly-reference-sync.service -f
journalctl --user -u poly-reference-market-maker.service -f
```

Review artifacts:

- Discovery reports
- Admin review reports
- Import reports
- Mapping validation reports
- Promotion reports
- Rollback reports
- Harness reports
- Scorecards

## K. Readiness Checklist

Before inviting closed-beta users:

- Latest commit deployed
- Env reviewed
- `REAL_MONEY_MODE=false`
- Funding disabled
- Google login works
- Admin access works
- World Cup page works
- Reference sync works
- Two-tick pricing harness passes
- MM dry-run passes
- Guarded live-local MM tested with tiny internal order
- Test user can place internal trade
- Position/P&L visible
- Public draft markets do not leak
- Discovery candidate queue works
- Rollback dry-run works
- Pause commands tested
- DB backup exists
- Deployment rollback plan exists

