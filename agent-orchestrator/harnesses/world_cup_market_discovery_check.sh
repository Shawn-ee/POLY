#!/usr/bin/env bash
set -u

failures=0
section(){ printf '\n== %s ==\n' "$1"; }
run(){ section "$*"; "$@"; s=$?; [ "$s" -eq 0 ] || { echo "FAILED exit=$s: $*"; failures=$((failures+1)); }; }
require_file(){ [ -f "$1" ] || { echo "missing required file: $1"; failures=$((failures+1)); }; }
require_token(){ file="$1"; token="$2"; grep -F -n "$token" "$file" >/dev/null 2>&1 || { echo "missing token in $file: $token"; failures=$((failures+1)); }; }

script_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1
to_bash_path(){ case "$1" in [A-Za-z]:/*) printf '/mnt/%s/%s' "$(printf '%s' "${1:0:1}" | tr '[:upper:]' '[:lower:]')" "${1:3}" ;; *) printf '%s' "$1" ;; esac; }
has_discovery_fixture(){ [ -f "$1/src/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json" ] && [ -f "$1/src/__tests__/polymarket.discovery-fixture.test.ts" ]; }

app_root="$(to_bash_path "${POLY_APP_ROOT:-$script_root}")"
if ! has_discovery_fixture "$app_root"; then
  for candidate in "/mnt/c/Users/hecto/projects/agent-workspaces/Poly-polymarket-mm-runtime" "/c/Users/hecto/projects/agent-workspaces/Poly-polymarket-mm-runtime"; do
    if has_discovery_fixture "$candidate"; then app_root="$candidate"; break; fi
  done
fi

cd "$app_root" || exit 1
echo "APP_ROOT=$app_root"
live_smoke_requested="${POLYMARKET_DISCOVERY_LIVE_SMOKE:-false}"

require_file src/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json
require_file src/__tests__/polymarket.discovery-fixture.test.ts
require_file src/server/services/polymarket/parser.ts
require_file src/server/services/polymarket/discoveryClient.ts
require_file src/server/services/polymarket/types.ts
require_file src/server/services/polymarket/discoveryReport.ts
require_file scripts/polymarket_discover_once.ts

for token in \
  "pm-worldcup-france-win" \
  "pm-worldcup-usa-mexico-1x2" \
  "pm-worldcup-tbd-quarterfinal" \
  "pm-worldcup-player-prop" \
  "pm-non-worldcup-cricket" \
  "pm-worldcup-closed" \
  "pm-worldcup-missing-token" \
  "malformed-world-cup-entry"; do
  require_token src/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json "$token"
done

for token in \
  "player_prop_unsupported" \
  "tbd_team" \
  "missing_token_mapping" \
  "not_world_cup_soccer" \
  "inactive_or_closed" \
  "unsupported_market_type"; do
  require_token src/server/services/polymarket/parser.ts "$token"
done

for token in \
  "buildWorldCupDiscoveryReport" \
  "autoImportEnabled: false" \
  "autoPromoteEnabled: false"; do
  require_token src/server/services/polymarket/discoveryReport.ts "$token"
done

require_token package.json "\"polymarket:discover:once\""
require_token scripts/polymarket_discover_once.ts "POLYMARKET_DISCOVERY_LIVE_SMOKE"
require_token scripts/polymarket_discover_once.ts "POLYMARKET_DISCOVERY_SKIP_DB"

run npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.discovery-fixture.test.ts src/__tests__/polymarket.discovery-report.test.ts src/__tests__/polymarket.importer-foundation.test.ts

export POLYMARKET_DISCOVERY_FIXTURE_MODE=true
export POLYMARKET_DISCOVERY_SKIP_DB=true
export POLYMARKET_DISCOVERY_LIVE_SMOKE=false
output_path="test-logs/world-cup-market-discovery-harness.json"
run powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "\
\$env:POLYMARKET_DISCOVERY_FIXTURE_MODE = 'true'; \
\$env:POLYMARKET_DISCOVERY_SKIP_DB = 'true'; \
\$env:POLYMARKET_DISCOVERY_LIVE_SMOKE = 'false'; \
npm run polymarket:discover:once -- --output '$output_path'; \
if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }"
require_file "$output_path"
require_token "$output_path" '"candidateCount": 5'
require_token "$output_path" '"ignoredCount": 2'
require_token "$output_path" '"autoImportEnabled": false'
require_token "$output_path" '"autoPromoteEnabled": false'

if [ "$live_smoke_requested" = "true" ]; then
  section "optional live read-only Polymarket discovery smoke"
  live_output_path="test-logs/world-cup-market-discovery-live-smoke.json"
  run powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "\
\$env:POLYMARKET_DISCOVERY_FIXTURE_MODE = 'false'; \
\$env:POLYMARKET_DISCOVERY_SKIP_DB = 'true'; \
\$env:POLYMARKET_DISCOVERY_LIVE_SMOKE = 'true'; \
npm run polymarket:discover:once -- --limit 5 --output '$live_output_path'; \
if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }"
  require_file "$live_output_path"
  require_token "$live_output_path" '"source": "polymarket"'
  require_token "$live_output_path" '"fixtureMode": false'
  require_token "$live_output_path" '"liveSmoke": true'
  require_token "$live_output_path" '"dryRun": true'
  require_token "$live_output_path" '"autoImportEnabled": false'
  require_token "$live_output_path" '"autoPromoteEnabled": false'
else
  section "optional live read-only Polymarket discovery smoke"
  echo "SKIP: set POLYMARKET_DISCOVERY_LIVE_SMOKE=true to run read-only live smoke"
fi

[ "$failures" -eq 0 ] && echo "PASS world_cup_market_discovery_check" || echo "FAIL world_cup_market_discovery_check failures=$failures"
exit "$failures"
