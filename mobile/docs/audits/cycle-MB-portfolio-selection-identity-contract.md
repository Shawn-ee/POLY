# Cycle MB Portfolio Selection Identity Contract

Date: 2026-07-06

Scope:

- Portfolio positions and open orders from `/api/portfolio`.
- Portfolio recent trades and canceled orders from `/api/portfolio/history`.
- Backend-provided market selection identity before visible Portfolio rows apply.

Out of scope:

- Portfolio visual redesign.
- Deposit/withdraw.
- New order lifecycle surfaces.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid snapshot selection identity is preserved | Pass | `docs/mobile/harness/cycle-MB-portfolio-selection-identity-contract/cycle-MB-portfolio-selection-identity-contract.json` |
| Valid history selection identity is preserved | Pass | MB proof `validHistorySelectionPreserved=true` |
| Unknown market types reject before visible apply | Pass | MB proof `unknownMarketTypeRejects=true` |
| Missing selection display labels reject before visible apply | Pass | MB proof `missingDisplayLabelRejects=true` |
| Invalid limit fields reject before visible apply | Pass | MB proof `invalidLimitFieldsReject=true` |

Implementation notes:

- Portfolio snapshot and history now share `portfolioSelectionFromBackend`.
- Selection objects must include a non-empty `displayLabel` and a known `marketType`.
- Optional limit fields must be valid when present; unknown market types are no longer coerced to `prop`.
- Legacy rows with no selection object still render without selected line identity.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSelectionService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_selection_identity_contract.ts`
- Full validation/gate: see latest Cycle MB validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional route-specific Portfolio selection error copy.
