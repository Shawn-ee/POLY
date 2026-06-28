# WC-DISC-LIVE-001 Read-Only Polymarket Live Smoke

Status: done

Report:

`agent-orchestrator/runs/20260628T015000-WC-DISC-LIVE-001-read-only-polymarket-live-smoke/REPORT.md`

Validation:

```sh
bash -lc "cd /mnt/c/Users/hecto/Desktop/projects/PolyProj/Poly && POLYMARKET_DISCOVERY_LIVE_SMOKE=true bash agent-orchestrator/harnesses/world_cup_market_discovery_check.sh"
```

Result:

- PASS.
- Live path returned `source=polymarket`, `fixtureMode=false`, `liveSmoke=true`, `dryRun=true`.
- DB was skipped.
- No import, promotion, trade, or order placement occurred.
