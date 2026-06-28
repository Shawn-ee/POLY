# Server-Side Codex Prompt: World Cup Polymarket Structure Deployment

You are operating on the private Poly server.

Deploy/rehearse branch `agent/world-cup-polymarket-structure-refactor` for Closed Internal Beta only.

Do not enable real money, deposits, withdrawals, wallet custody, private-key workers, external-fund bots, public non-whitelisted trading, auto import, or auto promotion.

Read first:

- `agent-orchestrator/docs/WORLD_CUP_POLYMARKET_STRUCTURE_SERVER_DEPLOYMENT.md`
- `agent-orchestrator/docs/CLOSED_INTERNAL_BETA_SERVER_DEPLOYMENT_REHEARSAL.md`

Tasks:

1. Verify repo, branch, commit, and clean status.
2. Back up `.env`, git HEAD, and DB.
3. Verify safety env:
   - `REAL_MONEY_MODE=false`
   - `INTERNAL_FUNDING_BETA_ENABLED=false`
   - `FUNDING_KILL_SWITCH=true`
   - `ALLOW_AUTO_DEPOSIT_CREDIT=false`
   - `LOCAL_BOT_TRADING_ONLY=true`
   - `POLYMARKET_AUTO_IMPORT_ENABLED=false`
   - `POLYMARKET_AUTO_PROMOTE_ENABLED=false`
4. Run:

```sh
npm ci
npm exec prisma generate --schema=prisma/schema.prisma
npm exec prisma validate --schema=prisma/schema.prisma
npm exec prisma migrate status --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run build
```

5. Review migrations. Apply only non-destructive migrations if needed.
6. Restart web only:

```sh
systemctl --user restart poly-web.service
curl -sS http://127.0.0.1:3001/api/health
```

7. Verify `/admin/runtime`, World Cup listing, and a World Cup event page.
8. Run:

```sh
npm run runtime:closed-beta:status
npm run reference:sync:once
npm run mm:polymarket:dry-run
LOCAL_BOT_TRADING_ONLY=true REAL_MONEY_MODE=false npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5
```

9. Do not confirm safe basket or live-local MM until the owner reviews dry-run output.
10. Write a server rehearsal report with pass/fail, blockers, screenshots if available, and GO/NO-GO for owner-only testing.

