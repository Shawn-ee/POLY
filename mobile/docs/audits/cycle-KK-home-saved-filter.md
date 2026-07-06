# Cycle KK - Home Saved Filter

## Scope

Backend/data-contract proof for visible Home `Saved` filtering.

This cycle does not add a new saved/followed-market product. It uses the existing saved ids from profile preferences and makes the Home Saved route request backend-filtered events instead of filtering only the current client page.

## Route/Data Dependencies

| Flow | Route | Required contract |
| --- | --- | --- |
| Home Saved filter | `GET /api/events?eventIds=...&includeMobileMarkets=1` | Backend filters explicit saved event ids before pagination and returns compact mobile markets. |
| Empty Saved state | App server-mode Home loader | Mobile shows empty Saved state without calling the route as an unfiltered fallback. |
| Mobile saved query | `PolyApi.listWorldCupEvents()` | Mobile can send comma-separated saved event ids through `eventIds`. |

## Evidence

- Harness proof: `docs/mobile/harness/cycle-KK-home-saved-filter/cycle-KK-home-saved-filter.json`
- Proof script: `scripts/prove_mobile_home_saved_filter.ts`
- Focused test:
  - `mobile/src/__tests__/api.test.ts`

## Proof Results

| Case | Expected | Result |
| --- | --- | --- |
| Saved event ids | Includes both selected saved events | Pass |
| Unsaved event | Excluded from saved route result | Pass |
| Compact markets | Saved route events include `markets[]` for mobile cards | Pass |
| Empty saved state | App handles empty Saved locally instead of stale route fallback | Pass |

## Gate Decision

Pass for focused backend/data-contract scope.

Remaining P1:

- First-class saved/followed market route if saved state moves beyond profile preferences.
