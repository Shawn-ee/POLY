# Closed Internal Beta Deployment Rehearsal

Updated: 2026-06-28

Scope: private server deployment rehearsal for closed internal beta with test/internal balances only.

Do not deploy from this checklist until the owner explicitly starts the deployment step. Do not enable real-money mode, deposits, withdrawals, wallet custody, private-key workers, public trading, or production live bots with external funds.

## 1. Source Of Truth

Use:

```sh
C:\Users\hecto\projects\agent-workspaces\Poly-polymarket-mm-runtime
```

Target commit:

```sh
3dc9ac0053273ce268175e99757b4146f87df147
```

The older checkout at `C:\Users\hecto\Desktop\projects\PolyProj\Poly` may be stale unless explicitly synced to `origin/main` at this commit.

Server sync rehearsal commands:

```sh
cd /opt/poly/Poly
git remote -v
git fetch origin
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
test "$(git rev-parse HEAD)" = "3dc9ac0053273ce268175e99757b4146f87df147"
git status --short
```

Expected: HEAD equals `3dc9ac0053273ce268175e99757b4146f87df147` and worktree is clean.

## 2. Required Safe Environment

Use real server secrets only on the server. Do not commit or print values.

```sh
DATABASE_URL=<postgres-url>
NEXTAUTH_URL=https://<closed-beta-domain>
NEXTAUTH_SECRET=<secret>
ADMIN_EMAILS=<admin-email-list>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

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

Safe posture checks:

```sh
test "$REAL_MONEY_MODE" = "false"
test "$INTERNAL_FUNDING_BETA_ENABLED" = "false"
test "$FUNDING_KILL_SWITCH" = "true"
test "$ALLOW_AUTO_DEPOSIT_CREDIT" = "false"
test "$POLYMARKET_AUTO_IMPORT_ENABLED" = "false"
test "$POLYMARKET_AUTO_PROMOTE_ENABLED" = "false"
```

## 3. Local Build And DB Rehearsal

Install and validate:

```sh
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm exec prisma validate --schema=prisma/schema.prisma
npm exec prisma migrate status --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run build
```

Migration rule: review `npm exec prisma migrate status --schema=prisma/schema.prisma` before applying migrations. Only run non-destructive migrations:

```sh
npm exec prisma migrate deploy --schema=prisma/schema.prisma
```

Do not run destructive database operations against production data.

Available harnesses in this worktree:

```sh
bash agent-orchestrator/harnesses/world_cup_market_discovery_check.sh
bash agent-orchestrator/harnesses/world_cup_db_lifecycle_check.sh
bash agent-orchestrator/harnesses/world_cup_discovery_candidate_queue_e2e_check.sh
```

## 4. Web And Auth Checks

Start web only:

```sh
npm start
```

Health check:

```sh
curl -fsS http://127.0.0.1:3001/api/health
```

Google login check:

```sh
curl -I https://<closed-beta-domain>/api/auth/signin/google
```

Then verify interactively in a browser:

- Google OAuth redirects back to the closed-beta domain.
- Admin user can sign in.
- Non-allowlisted users are blocked if allowlisting is enabled.

Admin check:

```sh
curl -fsS -H "Cookie: <admin-session-cookie>" https://<closed-beta-domain>/admin
curl -fsS -H "Cookie: <admin-session-cookie>" https://<closed-beta-domain>/api/admin/polymarket/discovery-candidates
```

World Cup page check:

```sh
curl -fsS https://<closed-beta-domain>/sports/soccer/world-cup
```

Verify draft/private imported markets do not appear publicly.

## 5. Reference Sync And MM Rehearsal

Reference sync once, writes reference snapshot rows only:

```sh
npm run reference:sync:once
```

Reference sync loop:

```sh
npm run reference:sync:loop
```

Market maker dry-run, writes intents but should not create live internal orders:

```sh
npm run mm:polymarket:dry-run
```

Guarded live-local internal MM once, only after dry-run passes and with tiny limits:

```sh
ALLOW_BOT_TRADING=true \
LOCAL_BOT_TRADING_ONLY=true \
REAL_MONEY_MODE=false \
POLYMARKET_MM_LIVE_LOCAL=true \
npm run mm:polymarket:live-local-once
```

Expected: internal bot orders can be created only inside local/staging closed beta with test balances. No external orders or real funds are touched.

## 6. Discovery, Candidate Queue, Import, And Promotion

Read-only/live-smoke discovery with DB candidate persistence:

```sh
POLYMARKET_DISCOVERY_FIXTURE_MODE=false \
POLYMARKET_DISCOVERY_LIVE_SMOKE=true \
POLYMARKET_DISCOVERY_SKIP_DB=false \
POLYMARKET_AUTO_IMPORT_ENABLED=false \
POLYMARKET_AUTO_PROMOTE_ENABLED=false \
npm run polymarket:discover:once
```

Candidate queue review:

```sh
npm run polymarket:admin-review:report -- --fromDb=true
```

Draft import from approved/import-ready DB candidates, manual-gated:

```sh
npm run polymarket:import:draft -- --fromDb=true --confirmDraftImport true
```

Mapping validation from imported DB records:

```sh
npm run polymarket:mapping:validate -- --fromDb=true --confirmUpdate=true
```

Promotion is manual/guarded only:

```sh
npm run polymarket:promote:validated
```

Promotion must remain blocked for unsupported, TBD, player prop, closed, duplicate, stale, missing-token, missing-reference, low-confidence, or no-leak-failing markets.

## 7. Rollback And Pause

Pause MM:

```sh
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
```

Pause discovery/import/promotion by environment:

```sh
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false
POLYMARKET_MM_SKIP_DISCOVERY=true
```

Rollback dry-run:

```sh
npm run polymarket:imports:rollback -- --batchId <batch> --dryRun
```

Confirmed rollback, only after dry-run scope is correct:

```sh
npm run polymarket:imports:rollback -- --batchId <batch> --confirmRollback true
```

Expected rollback behavior: do not delete data; disable listed/tradable/MM eligibility and mark candidates rollback-disabled.

## 8. Systemd Recommendations

Use user services where possible. Keep import, validation, promotion, and live-local MM manual-gated during first rehearsal.

### poly-web.service

```ini
[Unit]
Description=Poly web app
After=network-online.target

[Service]
WorkingDirectory=/opt/poly/Poly
EnvironmentFile=/opt/poly/Poly/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### poly-reference-sync.service

```ini
[Unit]
Description=Poly reference price sync loop
After=poly-web.service

[Service]
WorkingDirectory=/opt/poly/Poly
EnvironmentFile=/opt/poly/Poly/.env
ExecStart=/usr/bin/npm run reference:sync:loop
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### poly-reference-market-maker.service

Start in dry-run mode first:

```ini
[Unit]
Description=Poly reference market maker dry-run loop
After=poly-reference-sync.service

[Service]
WorkingDirectory=/opt/poly/Poly
EnvironmentFile=/opt/poly/Poly/.env
Environment=REAL_MONEY_MODE=false
Environment=LOCAL_BOT_TRADING_ONLY=true
Environment=POLYMARKET_MM_LIVE_LOCAL=false
ExecStart=/usr/bin/npm run mm:polymarket:dry-run
Restart=on-failure
RestartSec=30

[Install]
WantedBy=default.target
```

Do not switch this service to live-local until dry-run, orderbook, balance lock, cancel, and user trade checks pass.

### poly-polymarket-discovery.service

```ini
[Unit]
Description=Poly Polymarket World Cup discovery once

[Service]
Type=oneshot
WorkingDirectory=/opt/poly/Poly
EnvironmentFile=/opt/poly/Poly/.env
Environment=POLYMARKET_AUTO_IMPORT_ENABLED=false
Environment=POLYMARKET_AUTO_PROMOTE_ENABLED=false
ExecStart=/usr/bin/npm run polymarket:discover:once
```

### poly-polymarket-discovery.timer

```ini
[Unit]
Description=Run Poly Polymarket discovery every 10 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=10min
Unit=poly-polymarket-discovery.service

[Install]
WantedBy=timers.target
```

### Optional poly-risk-monitor.service

```ini
[Unit]
Description=Poly Polymarket risk monitor once

[Service]
Type=oneshot
WorkingDirectory=/opt/poly/Poly
EnvironmentFile=/opt/poly/Poly/.env
ExecStart=/usr/bin/npm run risk:polymarket:once
```

Run via timer every 15-60 seconds only after reference sync is stable.

### Optional poly-agent-orchestrator.service

Not required for user-facing beta. Keep disabled unless doing supervised engineering loops.

```ini
[Unit]
Description=Poly agent orchestrator

[Service]
WorkingDirectory=/opt/poly/Poly
EnvironmentFile=/opt/poly/Poly/.env
ExecStart=/usr/bin/npm run agent:orchestrator:loop
Restart=on-failure
RestartSec=30
```

## 9. Services To Keep Disabled Initially

- Deposit listener
- Withdrawal processor
- Wallet/private-key worker
- Auto deposit credit worker
- Real cash-out worker
- Production real-money market maker
- Auto import service
- Auto promotion service
- Public/non-whitelisted trading
- Agent orchestrator service

## 10. Go / No-Go For One Test User

Current decision before server rehearsal: no-go for inviting a test user.

Go is allowed only after:

- Server runs commit `3dc9ac0053273ce268175e99757b4146f87df147`.
- Env review confirms `REAL_MONEY_MODE=false` and funding disabled.
- Web health, Google login, and admin access pass.
- World Cup page loads.
- Reference sync once and loop pass.
- MM dry-run passes.
- Candidate queue report works.
- Rollback dry-run works.
- Pause commands are tested.
- A tiny guarded live-local bot order is tested with internal/test balances only.

