#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

LOCAL_DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/polymarket?schema=public}"
POWERSHELL_DATABASE_URL="${LOCAL_DATABASE_URL//\'/\'\'}"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "\
\$ErrorActionPreference = 'Stop'; \
\$env:DATABASE_URL = '${POWERSHELL_DATABASE_URL}'; \
\$env:REAL_MONEY_MODE = 'false'; \
\$env:POLYMARKET_DB_E2E = 'true'; \
\$env:POLYMARKET_LOCAL_DB_PROMOTION = 'true'; \
\$env:POLYMARKET_AUTO_PROMOTE_ENABLED = 'true'; \
\$env:POLYMARKET_REFERENCE_FIXTURE_MODE = 'true'; \
\$env:NODE_OPTIONS = '--max-old-space-size=4096'; \
npm exec prisma generate --schema=prisma/schema.prisma; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }; \
npm exec prisma validate --schema=prisma/schema.prisma; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }; \
npm exec prisma migrate deploy --schema=prisma/schema.prisma; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }; \
npm run polymarket:e2e:local-db; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }"
