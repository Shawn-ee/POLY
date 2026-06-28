# WC-DISC-014 Optional Live Polymarket Discovery Smoke

Status: done

Objective: Add a safe live Polymarket API smoke that runs only when explicitly enabled.

Completed evidence:

- Harness: `agent-orchestrator/harnesses/world_cup_market_discovery_check.sh`
- Report: `agent-orchestrator/runs/20260628T013500-WC-DISC-014-optional-live-polymarket-discovery-smoke/REPORT.md`

Validation:

- `bash agent-orchestrator/harnesses/world_cup_market_discovery_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass in default safe skip mode. Optional live API smoke was not executed because `POLYMARKET_DISCOVERY_LIVE_SMOKE=true` was not set.
