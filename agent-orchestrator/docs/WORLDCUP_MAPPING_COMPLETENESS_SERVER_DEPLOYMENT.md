# World Cup Mapping Completeness Server Deployment Handoff

This handoff is for a future server-side Codex run. Do not deploy from the local loop.

## Safety Boundary

Closed Internal Beta only:

- `REAL_MONEY_MODE=false`
- `INTERNAL_FUNDING_BETA_ENABLED=false`
- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`
- `LOCAL_BOT_TRADING_ONLY=true`
- `POLYMARKET_AUTO_IMPORT_ENABLED=false`
- `POLYMARKET_AUTO_PROMOTE_ENABLED=false`

Do not enable deposits, withdrawals, wallet/private-key workers, external-fund bots, production real-money MM, auto-import, or auto-promotion.

## Pull And Verify

```bash
git fetch origin
git checkout agent/worldcup-mapping-completeness-loop
git rev-parse HEAD
git status --short
```

Stop if the checkout is dirty for unknown reasons.

## Backup

```bash
mkdir -p agent-orchestrator/runs/server-mapping-completeness-backups/$(date +%Y%m%d-%H%M%S)
cp .env agent-orchestrator/runs/server-mapping-completeness-backups/$(date +%Y%m%d-%H%M%S)/env.backup 2>/dev/null || true
git rev-parse HEAD > agent-orchestrator/runs/server-mapping-completeness-backups/$(date +%Y%m%d-%H%M%S)/git-head-before.txt
set -a
source .env
set +a
pg_dump "$DATABASE_URL" > agent-orchestrator/runs/server-mapping-completeness-backups/$(date +%Y%m%d-%H%M%S)/poly-db-before.sql
```

Do not print `.env` contents.

## Validation

```bash
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm exec prisma validate --schema=prisma/schema.prisma
npm exec prisma migrate status --schema=prisma/schema.prisma
npm run build
npm run test:jest -- src/__tests__/world-cup-market-eligibility.test.ts src/__tests__/world-cup-event-page-model.test.ts src/__tests__/polymarket-mm-safe-basket.test.ts src/__tests__/public.sports.no-leak.test.ts src/__tests__/admin-runtime-safety.test.ts
npm run worldcup:mapping:audit
npm run runtime:closed-beta:status
```

Review migration status before running any migration. Stop if any migration looks destructive.

## Safe Service Restart

Restart web only first:

```bash
systemctl --user restart poly-web.service
systemctl --user status poly-web.service --no-pager
curl -sS http://127.0.0.1:3001/api/health
```

Then verify:

- World Cup browsing hides zero-eligible events.
- Event pages only show approved mapped markets with fresh reference state.
- Reference-only markets say `Reference only` and are not tradeable.
- Local-book markets show bid/ask.
- `/admin/runtime` shows hidden unmapped/no-reference/draft counts.
- `npm run worldcup:mapping:audit` reports no user-facing mapping violations.

Reference/MM services should be restarted only after web validation passes.

## Pause And Rollback

```bash
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
systemctl --user stop poly-reference-market-maker.service
systemctl --user stop poly-polymarket-discovery.timer
```

Set:

```bash
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false
POLYMARKET_MM_LIVE_LOCAL=false
REAL_MONEY_MODE=false
FUNDING_KILL_SWITCH=true
```

To roll back app code:

```bash
git checkout <previous-known-good-commit>
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm run build
systemctl --user restart poly-web.service
```

Use the pre-run database backup only if disabling imported/promoted markets is insufficient.
