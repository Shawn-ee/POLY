#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

LOCAL_DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/polymarket?schema=public}"

if [[ ! "$LOCAL_DATABASE_URL" =~ (localhost|127\.0\.0\.1|\[::1\]) ]]; then
  echo "Refusing to run candidate queue E2E against non-local DATABASE_URL." >&2
  exit 1
fi

POWERSHELL_DATABASE_URL="${LOCAL_DATABASE_URL//\'/\'\'}"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "\
\$ErrorActionPreference = 'Stop'; \
\$env:DATABASE_URL = '${POWERSHELL_DATABASE_URL}'; \
\$env:REAL_MONEY_MODE = 'false'; \
\$env:POLYMARKET_CANDIDATE_QUEUE_E2E = 'true'; \
\$env:POLYMARKET_REFERENCE_FIXTURE_MODE = 'true'; \
\$env:POLYMARKET_AUTO_IMPORT_ENABLED = 'false'; \
\$env:POLYMARKET_AUTO_PROMOTE_ENABLED = 'false'; \
\$env:NODE_OPTIONS = '--max-old-space-size=4096'; \
npm exec prisma generate --schema=prisma/schema.prisma; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }; \
npm exec prisma validate --schema=prisma/schema.prisma; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }; \
npm exec prisma migrate deploy --schema=prisma/schema.prisma; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }; \
npx tsx scripts/polymarket_candidate_queue_e2e.ts; if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }"
