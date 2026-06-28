# Closed Internal Beta Server Deployment Rehearsal

Updated: 2026-06-28

Target commit: `3dc9ac0053273ce268175e99757b4146f87df147`

Deployment classification: Closed Internal Beta v1 server deployment rehearsal.

This is not a public production launch. Do not invite users yet.

## 1. Purpose and Safety Boundary

This runbook is for rehearsing deployment of Poly on the private server for Closed Internal Beta v1 with test/internal balances only.

Allowed:

- Allowlisted/internal users only
- Test/internal balances only
- Internal order matching
- Google login
- World Cup market browsing
- Polymarket reference price sync
- Two-tick-worse pricing
- Reference market maker dry-run
- Guarded live-local internal MM only after manual verification
- Discovery read-only
- Draft import/admin review only
- Admin monitoring
- Risk monitoring

Not allowed:

- Public production launch
- Public non-whitelisted trading
- Real deposits
- Real withdrawals
- Real cash-out execution
- Real wallet custody
- Private-key worker usage
- Real-money bot trading
- External-fund bot execution
- Automatic import/promotion at first
- Permanent loops before rehearsal passes

The first rehearsal should only start:

1. `poly-web.service`
2. `npm run reference:sync:once`
3. `npm run mm:polymarket:dry-run`
4. `npm run polymarket:discover:once` in read-only/admin-gated mode

Do not start all loop services initially.

## 2. Source Of Truth

The server repo/worktree must be synced to:

```sh
3dc9ac0053273ce268175e99757b4146f87df147
```

Before rehearsal, run:

```sh
git remote -v
git fetch origin
git branch --show-current
git rev-parse HEAD
git status --short
```

Verify:

```sh
git rev-parse HEAD
```

must equal:

```sh
3dc9ac0053273ce268175e99757b4146f87df147
```

Do not deploy from an older stale checkout. If another local checkout exists, treat it as stale unless synced and verified.

If `git status --short` is dirty, stop and report before proceeding unless the only changes are known safe local config files intentionally ignored by git.

## 3. Pre-Rehearsal Server Checks

Check server dependencies:

```sh
node -v
npm -v
psql --version
nginx -v || true
systemctl --user status || true
```

Expected infrastructure:

- Linux server
- Node.js compatible with the current app
- npm compatible with the lockfile
- PostgreSQL
- Prisma
- Nginx or equivalent reverse proxy
- systemd user services
- domain and SSL
- Google OAuth credentials
- env file
- optional Tailscale/SSH access

Do not continue if the server cannot run Node, npm, Prisma, PostgreSQL, or systemd user services.

## 4. Backup Procedure

Before changing anything on the server, back up:

1. current `.env`
2. current git commit
3. current database

Use a timestamped backup directory:

```sh
BACKUP_DIR="agent-orchestrator/runs/server-rehearsal-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/env.backup" 2>/dev/null || true
git rev-parse HEAD > "$BACKUP_DIR/git-head-before.txt"
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/poly-db-before.sql"
```

If `DATABASE_URL` is not loaded:

```sh
set -a
source .env
set +a
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/poly-db-before.sql"
```

Do not print secrets to logs. Do not cat the full `.env` into reports. Only report whether required env vars are present and whether safety flags are set correctly.

## 5. Required Safe Environment

Use real values only on the server. Do not commit or print secrets.

Minimum app/auth env:

```sh
DATABASE_URL=postgresql://poly_user:CHANGE_ME@127.0.0.1:5432/poly_dev?schema=public
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
ADMIN_EMAILS=admin@example.com
GOOGLE_CLIENT_ID=CHANGE_ME.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=CHANGE_ME
```

Closed beta trading safety:

```sh
REAL_MONEY_MODE=false
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
```

Funding disabled:

```sh
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Discovery/import safety:

```sh
POLYMARKET_DISCOVERY_FIXTURE_MODE=false
POLYMARKET_DISCOVERY_LIVE_SMOKE=true
POLYMARKET_DISCOVERY_SKIP_DB=false
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false
```

Reference sync:

```sh
POLYMARKET_REFERENCE_FIXTURE_MODE=false
REFERENCE_POLL_MS=10000
REFERENCE_SYNC_ONLY_MM_ENABLED=true
```

Market maker:

```sh
ALLOW_BOT_TRADING=true
LOCAL_BOT_TRADING_ONLY=true
POLYMARKET_MM_LIVE_LOCAL=false
POLYMARKET_MM_LOOP_FOREVER=false
POLYMARKET_MM_LOOP_MS=30000
POLYMARKET_MM_SKIP_DISCOVERY=false
```

Risk controls:

```sh
MAX_TRADE_SHARES=CHANGE_ME_SMALL_INTERNAL_LIMIT
TRADE_COOLDOWN_SECONDS=CHANGE_ME
WALLET_CAP=CHANGE_ME_TEST_ONLY_CAP
```

Rules:

- `POLYMARKET_MM_LIVE_LOCAL` must start as `false`.
- `POLYMARKET_MM_LOOP_FOREVER` must be `false` during rehearsal.
- Only set `POLYMARKET_MM_LIVE_LOCAL=true` for one tiny guarded live-local internal MM test after dry-run passes.
- Never set `REAL_MONEY_MODE=true`.
- Never set `INTERNAL_FUNDING_BETA_ENABLED=true` for this rehearsal.
- Never set `FUNDING_KILL_SWITCH=false` for this rehearsal.
- Never set `ALLOW_AUTO_DEPOSIT_CREDIT=true` for this rehearsal.

Env safety checklist:

- `REAL_MONEY_MODE=false`
- `INTERNAL_FUNDING_BETA_ENABLED=false`
- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`
- `POLYMARKET_AUTO_IMPORT_ENABLED=false`
- `POLYMARKET_AUTO_PROMOTE_ENABLED=false`
- `LOCAL_BOT_TRADING_ONLY=true`
- `POLYMARKET_MM_LIVE_LOCAL=false` initially

## 6. Package Script Inspection

Current package script inventory at target commit:

| Script | Exists? | Command |
|---|---:|---|
| `build` | yes | `next build` |
| `reference:sync:once` | yes | `tsx scripts/reference_sync_once.ts` |
| `reference:sync:loop` | yes | `tsx scripts/reference_sync_loop.ts` |
| `mm:polymarket:dry-run` | yes | `tsx scripts/mm_polymarket_dry_run.ts` |
| `mm:polymarket:live-local-once` | yes | `tsx scripts/mm_polymarket_live_local_once.ts` |
| `mm:polymarket:pause-all` | yes | `tsx scripts/mm_polymarket_pause_all.ts` |
| `polymarket-mm:stop` | yes | `tsx scripts/polymarket_mm_stop.ts` |
| `polymarket:discover:once` | yes | `tsx scripts/polymarket_discover_once.ts` |
| `polymarket:import:draft` | yes | `tsx scripts/polymarket_import_draft.ts` |
| `polymarket:mapping:validate` | yes | `tsx scripts/polymarket_mapping_validate.ts` |
| `polymarket:admin-review:report` | yes | `tsx scripts/polymarket_admin_review_report.ts` |
| `polymarket:promote:validated` | yes | `tsx scripts/polymarket_promote_validated.ts` |
| `risk:polymarket:once` | yes | `tsx scripts/polymarket_risk_monitor_once.ts` |
| risk loop command | no | gap: no dedicated risk loop script exists |

Do not invent missing scripts. Treat the missing risk loop command as an action item or run `risk:polymarket:once` manually/timer-gated only.

## 7. Build And Migration Rehearsal

Run:

```sh
npm ci
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx prisma migrate status --schema=prisma/schema.prisma
npm run build
```

Review pending migrations.

Rules:

- Do not apply destructive migrations.
- If migrations are pending and appear safe, server-side Codex may run:

```sh
npx prisma migrate deploy --schema=prisma/schema.prisma
```

- If migrations appear destructive, stop and report blocker.
- Always record migration status in the rehearsal report.

## 8. Rehearsal Service Startup Phases

### Phase 1: Web Only

Start or restart only:

```sh
systemctl --user restart poly-web.service
```

Do not restart all services.

Verify:

```sh
systemctl --user status poly-web.service --no-pager
curl -sS http://127.0.0.1:3001/api/health
curl -I https://your-domain.example
```

Manual/browser checks:

- public domain loads
- Google login works
- admin access works
- World Cup page loads
- no draft markets leak publicly

### Phase 2: Reference Sync Once

Run once only:

```sh
npm run reference:sync:once
```

Verify:

- `ReferenceQuoteSnapshot` rows are created/updated
- reference sync logs do not show fatal errors
- World Cup prices are available

Do not enable reference sync loop yet.

### Phase 3: MM Dry-Run

Run:

```sh
npm run mm:polymarket:dry-run
```

Verify:

- `BotOrderIntent` rows are created if expected
- no external orders are submitted
- no real-money trading occurs
- no real wallet/private-key code is used
- dry-run logs show two-tick-worse pricing behavior

Do not enable MM loop yet.

### Phase 4: Discovery Read-Only

Run with safe env inline:

```sh
POLYMARKET_DISCOVERY_FIXTURE_MODE=false \
POLYMARKET_DISCOVERY_LIVE_SMOKE=true \
POLYMARKET_DISCOVERY_SKIP_DB=false \
POLYMARKET_AUTO_IMPORT_ENABLED=false \
POLYMARKET_AUTO_PROMOTE_ENABLED=false \
npm run polymarket:discover:once
```

Verify:

- candidate report generated
- DB candidate queue updated if expected
- no auto import
- no auto promote
- no public draft leak

### Phase 5: Candidate/Admin Review Report

Run:

```sh
npm run polymarket:admin-review:report -- --fromDb=true
```

Verify:

- admin review report generated
- candidates are visible for admin review
- no promotion occurred automatically

### Phase 6: Rollback Dry-Run

Run rollback dry-run for a known batch:

```sh
npm run polymarket:imports:rollback -- --batchId <batch> --dryRun
```

If no batch exists yet, document that the rollback command exists but could not be exercised without a candidate/import batch.

At minimum, verify rollback plan exists:

- previous commit recorded
- DB backup exists
- imported/promoted market disable procedure documented
- MM pause commands available

### Phase 7: Pause Command Test

Run safe pause commands:

```sh
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
```

Also document systemd stops:

```sh
systemctl --user stop poly-reference-market-maker.service
systemctl --user stop poly-polymarket-discovery.timer
systemctl --user stop poly-reference-sync.service
```

For this rehearsal, do not leave loops enabled.

### Phase 8: Optional Tiny Guarded Live-Local Internal MM Once

Only after MM dry-run passes.

Only if all safety env is confirmed:

```sh
ALLOW_BOT_TRADING=true
LOCAL_BOT_TRADING_ONLY=true
REAL_MONEY_MODE=false
POLYMARKET_MM_LIVE_LOCAL=true
```

Run once:

```sh
ALLOW_BOT_TRADING=true \
LOCAL_BOT_TRADING_ONLY=true \
REAL_MONEY_MODE=false \
POLYMARKET_MM_LIVE_LOCAL=true \
npm run mm:polymarket:live-local-once
```

Verify:

- tiny internal bot order only
- test/internal balance only
- no external fund order
- no wallet/private-key use
- no real deposit/withdrawal
- order can match internally
- admin can see bot activity
- pause works afterward

If any doubt exists, skip this phase and report as not attempted.

Do not enable live-local loop permanently.

## 9. Services Allowed During First Closed Beta Rehearsal

| Service / command | Purpose | Mode during rehearsal | Writes DB? | Creates internal orders? | External real-fund risk? | Should run initially? | Notes |
|---|---|---|---:|---:|---:|---:|---|
| `poly-web.service` | web app, login, admin, markets | continuous | yes | no | no | yes | start first |
| `npm run reference:sync:once` | one-time reference quote sync | one-shot | yes | no | no | yes | run before loops |
| `npm run reference:sync:loop` | continuous reference sync | loop | yes | no | no | no | only after once passes |
| `npm run mm:polymarket:dry-run` | test MM pricing/intents | one-shot/dry-run | yes | no live orders | no | yes | should create intents only |
| `npm run mm:polymarket:live-local-once` | tiny guarded internal order test | one-shot | yes | yes | no if guarded | no | optional after dry-run |
| `npm run polymarket:discover:once` | read-only World Cup candidate discovery | one-shot | yes if DB persistence enabled | no | no | yes | auto import/promote false |
| `npm run polymarket:import:draft -- --confirmDraftImport true` | draft import | manual/admin-gated | yes | no | no | no | only reviewed candidates |
| `npm run polymarket:mapping:validate` | validate mappings | manual | yes with update flag | no | no | no | after draft import |
| `npm run polymarket:promote:validated` | promote validated markets | manual/guarded | yes | no | no | no | after all checks |
| `poly-agent-orchestrator.service` | engineering loop | optional | yes | no | no | no | keep disabled |
| `npm run risk:polymarket:once` | risk monitoring | one-shot | yes | no | no | one-shot only if needed | no risk loop script exists |

## 10. Services That Must Remain Disabled

These must remain disabled for this rehearsal:

- deposit listener
- withdrawal processor
- wallet/private-key worker
- auto deposit credit worker
- real cash-out worker
- real-money production market maker
- external-fund trading worker
- any worker requiring real wallet custody
- any worker submitting orders with real funds
- auto import worker
- auto promote worker
- permanent MM live loop
- permanent discovery/import/promotion loops

If any of these are active on the server, stop and report before proceeding.

## 11. Monitoring And Logs

Systemd:

```sh
systemctl --user status poly-web.service --no-pager
journalctl --user -u poly-web.service -f
journalctl --user -u poly-reference-sync.service -f
journalctl --user -u poly-reference-market-maker.service -f
journalctl --user -u poly-polymarket-discovery.service -f
journalctl --user -u poly-polymarket-discovery.timer --no-pager
```

App checks:

```sh
curl -sS http://127.0.0.1:3001/api/health
curl -I https://your-domain.example
```

DB inspection examples:

```sh
npx prisma studio
psql "$DATABASE_URL"
```

Do not print secrets. In `psql` or Prisma Studio, inspect relevant rows without dumping sensitive columns into logs.

Tables/entities to inspect if present:

- `User`
- `Market`
- `ReferenceQuoteSnapshot`
- `BotOrderIntent`
- `Order`
- `Trade`
- `Position`
- `PolymarketDiscoveryCandidate`
- admin review report output

Report/log locations:

- `agent-orchestrator/runs/`
- `agent-orchestrator/docs/`
- discovery/admin-review/import/promotion/rollback report outputs under `agent-orchestrator/runs/`
- harness output from `agent-orchestrator/harnesses/`

## 12. Rollback Procedure

### Level 1: Pause Runtime

```sh
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
systemctl --user stop poly-reference-market-maker.service
systemctl --user stop poly-polymarket-discovery.timer
```

Set env:

```sh
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false
POLYMARKET_MM_SKIP_DISCOVERY=true
POLYMARKET_MM_LIVE_LOCAL=false
REAL_MONEY_MODE=false
FUNDING_KILL_SWITCH=true
```

### Level 2: Roll Back App Code

```sh
git fetch origin
git checkout <previous-known-good-commit>
npm ci
npx prisma generate --schema=prisma/schema.prisma
npm run build
systemctl --user restart poly-web.service
```

### Level 3: Disable Imported/Promoted Markets

Use the dedicated dry-run-first rollback script:

```sh
npm run polymarket:imports:rollback -- --batchId <batch> --dryRun
npm run polymarket:imports:rollback -- --batchId <batch> --confirmRollback true
```

Expected behavior: markets are unlisted/disabled, outcomes are not tradable, MM eligibility is disabled, candidates are marked rollback-disabled, and data is not deleted.

### Level 4: Restore DB Backup

Use the DB backup created before rehearsal.

Only restore DB if necessary and after confirming data-loss impact.

## 13. Go / No-Go Criteria

### GO For 1 Test User Only

All must be true:

- target commit deployed
- git status clean
- env safety flags verified
- funding disabled
- real-money mode false
- no deposit/withdrawal/private-key workers active
- `npm ci` passes
- Prisma generate/validate passes
- migration status reviewed
- build passes
- `poly-web.service` healthy
- local `/api/health` passes
- public domain loads
- Google login works
- admin access works
- World Cup page loads
- reference sync once passes
- two-tick-worse pricing behavior verified by harness or MM dry-run evidence
- MM dry-run passes
- discovery read-only passes
- no auto import/promotion occurred
- pause commands tested
- rollback plan and backup exist

Optional but preferred before inviting 1 test user:

- one tiny guarded live-local internal MM once succeeds
- admin can see the tiny internal bot order
- test/internal matching works
- position/P&L updates correctly

### NO-GO

Any of these means do not invite users:

- wrong commit
- dirty/unknown server checkout
- env enables real money
- funding enabled
- deposits enabled
- withdrawals enabled
- wallet/private-key worker active
- external-fund bot active
- build fails
- migration unsafe
- health endpoint fails
- Google login fails
- admin access fails
- World Cup page fails
- reference sync fails
- MM dry-run submits external orders
- pause commands fail
- rollback backup missing

### Expansion Rule

If rehearsal passes:

GO for 1 test user only.

Not 10 users yet.

After 1 test user verifies:

- login
- market visible
- price visible
- test balance order placement
- bot liquidity match
- position/P&L visible
- admin visibility
- pause works

Then expand gradually:

1. 3 users
2. 10 users

## 14. Final Recommended First Runtime

Recommended first closed beta runtime:

Run:

- web
- reference sync once
- MM dry-run first
- discovery read-only report
- guarded live-local MM once only after manual verification

Do not initially run:

- reference sync loop
- MM live loop
- auto import
- auto promote
- real funding
- real withdrawal
- real cash-out
- real-money bots
- wallet/private-key workers
- deposit listener

The next real operational step after this document is created is to run the server deployment rehearsal on the private server using this runbook.

