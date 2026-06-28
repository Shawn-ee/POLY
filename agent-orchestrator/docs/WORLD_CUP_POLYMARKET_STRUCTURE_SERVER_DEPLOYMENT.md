# World Cup Polymarket Structure Server Deployment Handoff

Updated: 2026-06-28

Branch: `agent/world-cup-polymarket-structure-refactor`

Scope: closed internal beta server deployment only. Do not enable real money, deposits, withdrawals, wallet custody, private-key workers, external-fund bots, auto import, or auto promotion.

## Pull Branch / Commit

```sh
cd /opt/poly/Poly
git fetch origin
git checkout agent/world-cup-polymarket-structure-refactor
git pull --ff-only origin agent/world-cup-polymarket-structure-refactor
git rev-parse HEAD
git status --short
```

Stop if the checkout is dirty or not on the expected branch/commit.

## Backup

```sh
BACKUP_DIR="agent-orchestrator/runs/server-rehearsal-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/env.backup" 2>/dev/null || true
git rev-parse HEAD > "$BACKUP_DIR/git-head-before.txt"
set -a
source .env
set +a
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/poly-db-before.sql"
```

Do not print secrets.

## Validate

```sh
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm exec prisma validate --schema=prisma/schema.prisma
npm exec prisma migrate status --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run build
```

Only deploy non-destructive migrations after review:

```sh
npm exec prisma migrate deploy --schema=prisma/schema.prisma
```

## Restart Web Only First

```sh
systemctl --user restart poly-web.service
systemctl --user status poly-web.service --no-pager
curl -sS http://127.0.0.1:3001/api/health
```

Verify:

- `/admin/runtime`
- World Cup listing
- World Cup event page
- no fake `50%`
- no unexplained `-- / --`
- draft/unlisted markets do not leak

## Runtime Status

```sh
npm run runtime:closed-beta:status
```

Expected:

- `REAL_MONEY_MODE=false`
- funding disabled
- no unsafe flags
- reference/MM counts visible
- public draft leak count is zero

## Reference And MM

Run reference once:

```sh
npm run reference:sync:once
```

Run MM dry-run:

```sh
npm run mm:polymarket:dry-run
```

Optional safe basket dry-run:

```sh
LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5
```

Only after reviewing output:

```sh
LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5 --confirm
```

This creates dry-run configs only.

## Guarded Live-Local Once

Only after dry-run passes and owner approves:

```sh
ALLOW_BOT_TRADING=true LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false POLYMARKET_MM_LIVE_LOCAL=true npm run mm:polymarket:live-local-once
```

Verify internal test balance only, no external orders, no wallet/private-key usage.

## Pause

```sh
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
systemctl --user stop poly-reference-market-maker.service
```

## Rollback

```sh
git fetch origin
git checkout <previous-known-good-commit>
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm run build
systemctl --user restart poly-web.service
```

If imported markets need disabling:

```sh
npm run polymarket:imports:rollback -- --batchId <batch> --dryRun
npm run polymarket:imports:rollback -- --batchId <batch> --confirmRollback true
```

