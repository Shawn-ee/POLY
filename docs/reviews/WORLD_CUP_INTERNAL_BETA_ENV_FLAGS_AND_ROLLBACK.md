# World Cup Internal Beta Env Flags And Rollback

Date: 2026-06-26

## First Deployment Mode

Use the safest controlled internal mode first:

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

This mode allows browsing, UI smoke, admin review, and dry-run evidence without public trading, funding, or live bot orders.

## Controlled Internal Trading Drill Mode

Only for a short allowlisted drill:

```text
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true
INTERNAL_TRADING_ALLOWLIST_EMAILS=<approved internal tester emails only>
```

Keep funding disabled unless a separate funding drill has been approved:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Keep production live bots disabled:

```text
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
POLY_BOTS_MODE=dryRun
```

## Authenticated Reference-Liquidity Dry-Run

The bot command requires a local admin session cookie. Do not print or commit the cookie.

PowerShell shape:

```powershell
$env:POLY_BOT_BASE_URL='http://127.0.0.1:3001'
$env:POLY_SIM_SESSION_COOKIE='<local admin poly_session cookie>'
npm run liquidity:reference-dry-run -- --slug <reviewed-reference-market-slug>
```

Observed blocker without credentials:

```text
POLY_SIM_SESSION_COOKIE is required for admin import/review/list operations.
```

## Stop Commands

Local app:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Windows service or process:

```powershell
Get-Process node | Stop-Process -Force
```

Linux service examples:

```bash
sudo systemctl stop poly-app
sudo systemctl stop poly-reference-liquidity-runtime.service
sudo systemctl stop poly-market-maker.service
```

Bot hard stop:

```bash
POLY_BOTS_GLOBAL_KILL_SWITCH=true
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_ENABLED=false
```

Funding hard stop:

```bash
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
INTERNAL_FUNDING_BETA_ENABLED=false
```

Trading hard stop:

```bash
TRADING_KILL_SWITCH=true
INTERNAL_TRADING_BETA_ENABLED=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
```

## Rollback Rules

- Prefer code rollback by checking out the last known good `dev` commit and rebuilding.
- Do not delete ledger, order, position, deposit, withdrawal, or balance rows as a shortcut.
- Database rollback requires a reviewed backup and owner approval.
- If internal trading was briefly enabled, export evidence first: order IDs, combo IDs, ledger entries, balances, and admin actions.
- After rollback, rerun health, route no-leak tests, internal trading gate tests, and bot safety checks.
