# WC-DISC-OPS-006 Bulk Disable/Rollback Tooling

Objective: Add safe rollback tooling for imported/promoted World Cup markets.

Required script:

`npm run polymarket:imports:rollback`

Requirements:

- Accept batchId or source/import batch selector.
- Dry-run by default.
- With confirm flag, disable imported/promoted markets from that batch.
- Set isListed=false, status disabled/hidden as appropriate, Outcome.isTradable=false, mmEnabled=false, tradable=false.
- Pause/cancel MM quote eligibility.
- Do not delete data by default.
- Write rollback report.
- Add tests.

