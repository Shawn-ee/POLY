# Server Codex Prompt - Polymarket Football Trading Page

You are server-side Codex for Poly/Holiwyn closed internal beta.

Do not enable real money, deposits, withdrawals, wallet/private-key workers, auto import, auto promote, or external-fund bots.

## Safety env
Required:

```bash
REAL_MONEY_MODE=false
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
LOCAL_BOT_TRADING_ONLY=true
POLYMARKET_AUTO_IMPORT_ENABLED=false
POLYMARKET_AUTO_PROMOTE_ENABLED=false
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
```

Start with `POLYMARKET_MM_LIVE_LOCAL=false`. Only set it true for a single guarded local internal MM run after dry-run passes.

## Rehearsal sequence
1. Back up `.env` without printing secrets.
2. Back up the database.
3. Fetch and checkout the approved commit.
4. Run:

```bash
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm exec prisma validate --schema=prisma/schema.prisma
npm exec prisma migrate status --schema=prisma/schema.prisma
npm run build
```

5. Import or verify Brazil vs Japan:

```bash
npm run polymarket:import-event -- --eventSlug fifwc-bra-jpn-2026-06-29 --dryRun true
npm run polymarket:import-event -- --eventSlug fifwc-bra-jpn-2026-06-29 --dryRun false --confirmImport true
```

6. Sync references:

```bash
npm run reference:sync:once -- --eventSlug brazil-vs-japan
```

7. Enable and verify local-only MM:

```bash
ALLOW_BOT_TRADING=true LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false npm run mm:polymarket:enable-safe-basket -- --maxMarkets=1 --allowBelowTarget --confirmDryRun
ALLOW_BOT_TRADING=true LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false POLYMARKET_MM_LIVE_LOCAL=true npm run mm:polymarket:enable-safe-basket -- --maxMarkets=1 --allowBelowTarget --replaceExisting --confirm
ALLOW_BOT_TRADING=true LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false npm run mm:polymarket:seed-bot-inventory -- --eventSlug=brazil-vs-japan --quantity=3
ALLOW_BOT_TRADING=true LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false POLYMARKET_MM_LIVE_LOCAL=true npm run mm:polymarket:live-local-once
```

8. Verify order flow:

```bash
ALLOW_BOT_TRADING=true LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false INTERNAL_FUNDING_BETA_ENABLED=false ALLOW_AUTO_DEPOSIT_CREDIT=false npm run test:football:e2e:internal-trade
```

9. Runtime checks:

```bash
npm run runtime:closed-beta:status
npm run worldcup:mapping:audit
```

10. Restart only safe services:
- `poly-web.service`
- reference sync only after one-shot passes
- MM dry-run/live-local only after manual verification

Do not start deposit, withdrawal, wallet/private-key, external-fund, auto-import, or auto-promote workers.

## Browser checks
- `/events/brazil-vs-japan` shows Brazil vs Japan.
- Match Winner has Brazil, Draw, Japan.
- Prices are real/local book or reference-derived.
- Chart appears.
- Trade ticket updates on selection.
- No debug clutter, no fake 50, no `-- / --`, no `No live price`, no `No local book`.
- Authenticated internal test order succeeds with test balance only.

## Rollback
Pause MM first:

```bash
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
```

Disable imported/promoted batch if needed:

```bash
npm run polymarket:imports:rollback -- --batchId <batch> --dryRun
npm run polymarket:imports:rollback -- --batchId <batch> --confirmRollback true
```
