# Server Codex Prompt: World Cup Mapping Completeness

You are running on the private Poly server for Closed Internal Beta only.

Do not enable real money, deposits, withdrawals, wallet/private-key workers, external-fund bots, auto-import, or auto-promotion.

1. Back up `.env`, current git commit, and database.
2. Pull the final `agent/worldcup-mapping-completeness-loop` commit.
3. Verify safety env:
   - `REAL_MONEY_MODE=false`
   - `INTERNAL_FUNDING_BETA_ENABLED=false`
   - `FUNDING_KILL_SWITCH=true`
   - `ALLOW_AUTO_DEPOSIT_CREDIT=false`
   - `LOCAL_BOT_TRADING_ONLY=true`
   - `POLYMARKET_AUTO_IMPORT_ENABLED=false`
   - `POLYMARKET_AUTO_PROMOTE_ENABLED=false`
4. Run:
   ```bash
   npm ci
   npm exec prisma generate --schema=prisma/schema.prisma
   npm exec prisma validate --schema=prisma/schema.prisma
   npm exec prisma migrate status --schema=prisma/schema.prisma
   npm run build
   npm run worldcup:mapping:audit
   npm run runtime:closed-beta:status
   ```
5. Restart only `poly-web.service` first.
6. Verify `/admin/runtime`, World Cup browsing, and a World Cup event page.
7. Confirm unmapped/no-reference markets are hidden from normal user pages and visible only in admin diagnostics.
8. Confirm reference-only rows are non-tradeable and local-book rows show bid/ask.
9. Keep all unsafe workers stopped.
10. Write a server report with pass/fail and do not invite users unless every GO criterion passes.
