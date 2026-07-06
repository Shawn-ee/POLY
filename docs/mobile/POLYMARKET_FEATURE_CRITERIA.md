# Polymarket Feature Criteria

Purpose: convert same-cycle Polymarket audits into pass/fail Holiwyn criteria.

Rule: every completed Holiwyn feature must have criteria here or in a focused audit file linked from this file. Every P0 must be objectively auditable.

## Priority Definitions

P0: required for parity baseline. If any P0 fails, the feature is not complete.

P1: required for near parity. May remain open only when explicitly tracked and accepted for a later cycle.

P2: polish. May remain open when tracked and not confusing or blocking.

## Universal P0 Criteria

These apply to every page, feature, button, and interaction:

| ID | Criterion | Audit method |
| --- | --- | --- |
| U-P0-01 | Same-cycle Polymarket reference audit exists for the exact feature. | Audit file and reference screenshot/hierarchy path. |
| U-P0-02 | Holiwyn Android device proof exists for the exact feature. | Screenshot/hierarchy/proof log path. |
| U-P0-03 | Every visible button/control either performs the expected Polymarket-equivalent action, opens the correct Holiwyn equivalent, or is explicitly disabled with a clear reason. | Device smoke and UI hierarchy. |
| U-P0-04 | Selected market, line, outcome, and tab state persist through navigation/ticket/portfolio flows when Polymarket preserves them. | Device smoke, route test, or state test. |
| U-P0-05 | Holiwyn does not use copied Polymarket logos, trademarks, protected text, proprietary images, or private assets. | Review. |
| U-P0-06 | Empty, loading, disabled, and error states are not static placeholders when Polymarket has meaningful behavior. | Device smoke and screenshots. |
| U-P0-07 | Visual hierarchy is not meaningfully worse or confusing compared with the Polymarket reference for the selected feature. | Audit Gate comparison. |
| U-P0-08 | Audit Gate Agent marks the feature pass with 0 unresolved P0 gaps. | Audit Gate report. |

## Feature Criteria Register

| Feature | Criteria owner file | P0 status | P1/P2 status | Latest gate |
| --- | --- | --- | --- | --- |
| Portfolio open-order status contract | `mobile/docs/audits/cycle-NM-portfolio-open-order-status-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio openOrders must contain active statuses and positive remaining shares before visible Orders state applies. | P2 optional stale-row copy for terminal rows returned in openOrders | Cycle NM audit gate |
| Position re-trade availability contract | `mobile/docs/audits/cycle-NL-position-retrade-availability-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio market availability must override local market state before opening Buy/Sell re-trade tickets. | P2 optional Portfolio row copy for backend-disabled re-trade markets | Cycle NL audit gate |
| Cashout status contract | `mobile/docs/audits/cycle-NK-cashout-status-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout must reject explicit terminal failed statuses before Portfolio refresh treats close as accepted. | P2 optional Portfolio-specific rejected-cashout copy | Cycle NK audit gate |
| Order submit status contract | `mobile/docs/audits/cycle-NJ-order-submit-status-contract.md` | Pass for focused backend/data-contract scope. Server-mode Trade Ticket submit must reject explicit terminal failed statuses before visible submitted-order state applies. | P2 optional Trade Ticket-specific rejected-status copy | Cycle NJ audit gate |
| Event Detail period market support contract | `mobile/docs/audits/cycle-NI-event-detail-period-market-support-contract.md` | Pass for focused backend/data-contract scope. Route-backed first-half/second-half winner rows must render only when backend declares period support and returns matching backend markets. | P2 optional disabled-row explanation copy for omitted backend-disabled period markets | Cycle NI audit gate |
| Event Detail supported line-family contract | `mobile/docs/audits/cycle-NH-event-detail-supported-line-family-contract.md` | Pass for focused backend/data-contract scope. Route-backed Game Lines must render only backend-declared line families with matching backend markets. | P2 optional disabled-row explanation copy for omitted backend-disabled families | Cycle NH audit gate |
| Event Detail route-backed line ticket identity contract | `mobile/docs/audits/cycle-NG-event-detail-line-ticket-route-backed-contract.md` | Pass for focused backend/data-contract scope. Route-backed Game Lines must open tickets only with matching backend market/outcome identity, not deterministic synthetic identity. | P2 optional disabled-row copy when backend identity is missing | Cycle NG audit gate |
| Account profile link consistency contract | `mobile/docs/audits/cycle-NF-account-profile-link-consistency-contract.md` | Pass for focused backend/data-contract scope. Server-mode Account profile must reject contradictory linked wallet/Google metadata before visible Account profile state applies. | P2 optional Account profile-specific linked-state error copy | Cycle NF audit gate |
| Profile preferences numeric defaults contract | `mobile/docs/audits/cycle-NE-profile-preferences-numeric-defaults-contract.md` | Pass for focused backend/data-contract scope. Server-mode profile preferences must reject malformed ticket default amount/slippage strings before visible Account settings state applies. | P2 optional Account settings-specific malformed preference copy | Cycle NE audit gate |
| Account navigation consistency contract | `mobile/docs/audits/cycle-ND-account-navigation-consistency-contract.md` | Pass for focused backend/data-contract scope. Server-mode Account navigation must reject contradictory enabled/status/kind/destination metadata before visible Account menu state applies. | P2 optional item-specific Account navigation error copy | Cycle ND audit gate |
| Selection limit price bounds contract | `mobile/docs/audits/cycle-NC-selection-limit-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Shared selected-market snapshots must reject `limitPrice` outside `0` to `1` before visible Portfolio, History, or submitted-order state applies. | P2 optional selected-market snapshot-specific malformed price copy | Cycle NC audit gate |
| Order submit price bounds contract | `mobile/docs/audits/cycle-NB-order-submit-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Trade Ticket submit must derive `/api/orders` price and size from a validated contract probability in `1..100` cents. | P2 optional Trade Ticket-specific invalid-price copy | Cycle NB audit gate |
| Portfolio open-order price bounds contract | `mobile/docs/audits/cycle-NA-portfolio-open-order-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio open-order prices must be contract prices from `0` to `1` before visible Orders rows or cancel activity state applies. | P2 optional Portfolio Orders-specific malformed price copy | Cycle NA audit gate |
| Portfolio history price bounds contract | `mobile/docs/audits/cycle-MZ-portfolio-history-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio History activity prices must be contract prices from `0` to `1` before visible activity state applies. | P2 optional Portfolio History-specific malformed price copy | Cycle MZ audit gate |
| Portfolio position price bounds contract | `mobile/docs/audits/cycle-MY-portfolio-position-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio position prices must be contract prices from `0` to `1` before visible Portfolio rows or cashout state apply. | P2 optional Portfolio-specific malformed price copy | Cycle MY audit gate |
| Portfolio value history total contract | `mobile/docs/audits/cycle-MX-portfolio-value-history-total-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio value-history point totals must match cash plus positions value before visible chart state applies. | P2 optional Portfolio value-history-specific total mismatch copy | Cycle MX audit gate |
| Quote price bounds contract | `mobile/docs/audits/cycle-MW-quote-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode quote route price fields must be contract prices from `0` to `1` before visible ticket/card odds apply. | P2 optional quote-specific retry/error copy | Cycle MW audit gate |
| Market chart price bounds contract | `mobile/docs/audits/cycle-MV-market-chart-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail/Futures chart history prices must be contract prices from `0` to `1` before visible chart state applies. | P2 optional field-specific chart price error copy | Cycle MV audit gate |
| Portfolio open order lifecycle contract | `mobile/docs/audits/cycle-MU-portfolio-open-order-lifecycle-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio open orders must reject `remaining > size` before visible Orders state applies. | P2 optional field-specific Portfolio open-order lifecycle error copy | Cycle MU audit gate |
| Order lifecycle consistency contract | `mobile/docs/audits/cycle-MT-order-lifecycle-consistency-contract.md` | Pass for focused backend/data-contract scope. Server-mode Trade Ticket submit confirmations must reject negative or internally impossible lifecycle totals before visible order state applies. | P2 optional richer inline order lifecycle error copy | Cycle MT audit gate |
| Event list quote price bounds contract | `mobile/docs/audits/cycle-MS-event-list-quote-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Home/Search/Live/Futures compact outcome quote prices must be probability values from `0` to `1` before visible cards apply. | P2 optional field-specific event-list quote error copy | Cycle MS audit gate |
| Cashout fill plus remaining contract | `mobile/docs/audits/cycle-MR-cashout-fill-remaining-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout confirmation must reject `sum(fills[].size) + remaining > size` before Portfolio refresh. | P2 optional richer cashout lifecycle mismatch copy | Cycle MR audit gate |
| Event Detail quote price bounds contract | `mobile/docs/audits/cycle-MQ-event-detail-quote-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail outcome quote prices must be probability values from `0` to `1` before visible game-page markets apply. | P2 optional field-specific Event Detail quote error copy | Cycle MQ audit gate |
| Cashout fill size contract | `mobile/docs/audits/cycle-MP-cashout-fill-size-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout confirmation must reject total `fills[].size > size` before Portfolio refresh. | P2 optional richer cashout fill mismatch copy | Cycle MP audit gate |
| Cashout remaining size contract | `mobile/docs/audits/cycle-MO-cashout-remaining-size-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout confirmation must reject `remaining > size` before Portfolio refresh. | P2 optional richer cashout lifecycle mismatch copy | Cycle MO audit gate |
| Event Detail required rules contract | `mobile/docs/audits/cycle-MN-event-detail-required-rules-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail must include backend-owned game-rule fields before visible market selection applies. | P2 optional missing-rule-field error copy | Cycle MN audit gate |
| Cashout price bounds contract | `mobile/docs/audits/cycle-MM-cashout-price-bounds-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout current price must be finite and within `(0, 1]` before submit. | P2 optional richer invalid-price row copy | Cycle MM audit gate |
| Cashout current price contract | `mobile/docs/audits/cycle-ML-cashout-current-price-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout must use finite positive current price and must not fall back to entry probability. | P2 optional richer unavailable-price row copy | Cycle ML audit gate |
| Cashout confirmation size contract | `mobile/docs/audits/cycle-MK-cashout-confirmation-size-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout confirmation size must match the requested sell-all full-position size when the backend returns size. | P2 optional richer cashout confirmation mismatch copy | Cycle MK audit gate |
| Event Detail rule consistency contract | `mobile/docs/audits/cycle-MJ-event-detail-rule-consistency-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail game-rule fields must be internally consistent before visible primary/regulation market selection applies. | P2 optional Event Detail rule-specific error copy | Cycle MJ audit gate |
| Event Detail market count contract | `mobile/docs/audits/cycle-MI-event-detail-market-count-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail market-count fields must be finite non-negative integers and internally consistent before visible game page state applies. | P2 optional Event Detail count-specific error copy | Cycle MI audit gate |
| Event Detail score contract | `mobile/docs/audits/cycle-MH-event-detail-score-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail score fields must be finite and non-negative when present before visible game page state applies. | P2 optional Event Detail score-specific error copy | Cycle MH audit gate |
| Event list non-negative quote contract | `mobile/docs/audits/cycle-MG-event-list-nonnegative-quote-contract.md` | Pass for focused backend/data-contract scope. Server-mode event-list quote/depth fields must be finite and non-negative before Home/Search/Live/Futures visible cards apply. | P2 optional surface-specific event-list quote error copy | Cycle MG audit gate |
| Portfolio history economics contract | `mobile/docs/audits/cycle-MF-portfolio-history-economics-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio history/activity economics must be non-negative before visible activity state applies, while realized P/L may be negative. | P2 optional field-specific Portfolio history error copy | Cycle MF audit gate |
| Portfolio snapshot economics contract | `mobile/docs/audits/cycle-ME-portfolio-snapshot-economics-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio snapshot wallet, position, and open-order economics must be non-negative before visible Portfolio state applies, while P/L may be negative. | P2 optional field-specific Portfolio snapshot error copy | Cycle ME audit gate |
| Account balance shape contract | `mobile/docs/audits/cycle-MD-account-balance-shape-contract.md` | Pass for focused backend/data-contract scope. Server-mode Account balance values must be non-negative and internally consistent before visible Account state applies. | P2 optional field-specific Account balance error copy | Cycle MD audit gate |
| Order selection echo contract | `mobile/docs/audits/cycle-MC-order-selection-echo-contract.md` | Pass for focused backend/data-contract scope. Server-mode Trade Ticket order submit must validate backend selection echoes and reject malformed selected-market identity before visible submitted-order state applies. | P2 optional route-specific Trade Ticket order selection error copy | Cycle MC audit gate |
| Portfolio selection identity contract | `mobile/docs/audits/cycle-MB-portfolio-selection-identity-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio selection objects must preserve backend market identity and reject unknown market types, missing display labels, or malformed limit fields before visible Portfolio rows apply. | P2 optional route-specific Portfolio selection error copy | Cycle MB audit gate |
| Portfolio value history route shape contract | `mobile/docs/audits/cycle-MA-portfolio-value-history-route-shape-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio value history must match requested range and validate route metadata plus point values before visible chart state applies. | P2 optional route-specific retry/error copy | Cycle MA audit gate |
| Account navigation enabled contract | `mobile/docs/audits/cycle-LZ-account-navigation-enabled-contract.md` | Pass for focused backend/data-contract scope. Server-mode Account navigation `enabled` fields must be real booleans before visible Account menu state applies. | P2 optional field-specific Account navigation error copy | Cycle LZ audit gate |
| Account profile boolean contract | `mobile/docs/audits/cycle-LY-account-profile-boolean-contract.md` | Pass for focused backend/data-contract scope. Server-mode Account profile linked fields must be real booleans before visible Account state applies. | P2 optional field-specific Account profile error copy | Cycle LY audit gate |
| Cashout submit confirmation contract | `mobile/docs/audits/cycle-LX-cashout-submit-confirmation-contract.md` | Pass for focused backend/data-contract scope. Server-mode cashout must submit full held shares and receive backend order confirmation before Portfolio refresh treats close as accepted. | P2 optional richer cashout submit error copy | Cycle LX audit gate |
| Cancel route shape contract | `mobile/docs/audits/cycle-LW-cancel-route-shape-contract.md` | Pass for focused backend/data-contract scope. Server-mode Portfolio cancel must confirm the same visible order id with `CANCELED` status before visible cancel state is applied. | P2 optional richer inline cancel-race copy/action | Cycle LW audit gate |
| Event Detail route shape contract | `mobile/docs/audits/cycle-LV-event-detail-route-shape-contract.md` | Pass for focused backend/data-contract scope. Server-mode Event Detail detail payloads must validate event rule fields, supported market types, market rows, and outcome quote fields before visible route-backed detail state is applied. | P2 optional Event Detail route-specific retry/error copy | Cycle LV audit gate |
| Route-backed lifecycle breadth after EN | `docs/mobile/audits/cycle-eo-c-route-lifecycle-breadth-gate.md` | Fail-until-integrated-breadth-proof for EO. EN passed one selected route-backed provider-depth Spread ask lifecycle, so EO requires same-cycle backend or route-shaped proof plus Holiwyn Android proof for a materially broader selected identity: bid-side/Sell and/or another provider-backed market family. Repeating only EN's ask-side Spread path fails. | P1/P2 remaining: fresh S23 production order lifecycle recapture, more provider-backed families and both sides, production HTTP order route proof, first-class immutable selection snapshots, and lifecycle label/visual polish | EO-C docs gate; PM-GAP-089 open |
| Route-backed provider-depth Book-staged limit lifecycle EN | `docs/mobile/audits/cycle-en-c-route-limit-lifecycle-gate.md` | Fail-until-integrated-proof for EN route-backed provider-depth lifecycle. EL proves a route-backed Book row can stage ask 55c and bid 50c into tickets, and EM proves a selected fake-token lifecycle, but EN requires the same route-backed provider-depth selected Book row through ticket amount/submit, order snapshot, open order, Portfolio, activity, and history. Backend JSON, arbitrary local UI-only mocks, or fake provider-depth rows without Android-visible route-backed proof fail. | P1/P2 remaining: fresh S23 production ticket/order/history recapture, multi-family/both-side route-backed breadth, durable DB-backed snapshots after provider refresh/metadata drift, and lifecycle label/visual polish | EN-C docs gate; PM-GAP-088 open |
| Book-staged selected limit lifecycle after EL | `docs/mobile/audits/cycle-em-c-limit-lifecycle-gate.md` | Fail-until-integrated-proof for EM selected Book limit lifecycle. Fresh EL integrated Holiwyn proof preserves ask 55c and bid 50c into Buy/Sell tickets, but EM requires the same selected limit fields through amount entry, order snapshot, open order, Portfolio, activity, and history. Backend JSON without Android Holiwyn lifecycle proof fails. | P1/P2 remaining: repeat across multiple market families and both sides, recapture official Polymarket production order/history when gates allow, prove durability after refresh/metadata drift, and polish lifecycle labels | EM-C docs gate; PM-GAP-087 open |
| Live event detail depth after EK | `docs/mobile/audits/cycle-el-c-live-event-depth-gate.md` | Fail-until-integrated-proof for EL live event detail depth. Partial fresh S23 official Polymarket reference exists for chart/top, swiped market sections, Game/Chat, line controls, Book/orderbook, and grouped selector; ticket Buy/Sell remains stale-context only. Agent B is blocked without Android-visible Holiwyn proof. | P1/P2 remaining: fresh S23 ticket Buy/Sell recapture, multi-family provider breadth, Book row-to-ticket price/side carry-through, Player Props/lower-section breadth, and visual/chart/orderbook polish | EL-C docs gate; PM-GAP-086 open |
| Route-backed provider transition breadth after EJ | `docs/mobile/audits/cycle-ek-c-provider-transition-gate.md` | Fail-until-integrated-proof for EK transition breadth. EJ selected mixed route-backed Android path remains regression coverage, but EK requires visible route-backed unavailable/not-ready state, full same-selected-market stale -> refreshing/loading -> ready transition, selected identity preservation across live page/chart/Book/ticket, no fallback/default/generic market behavior, and real-provider family breadth if available. | P1/P2 remaining: expand transition proof to every real provider-backed family when available, repeat transitions across more than one family, fresh official S23 recapture, and status/density polish | EK-C docs gate; PM-GAP-085 open |
| Route-backed provider status breadth after EI | `docs/mobile/audits/cycle-ej-c-provider-status-breadth-gate.md` | Fail-until-integrated-proof for EJ breadth. EI selected route-backed ready/Book/ticket path remains verified, but EJ requires new Agent A/B/Lead proof for real provider-backed family breadth, route-backed stale/refresh-due, route-backed unavailable/not-ready, full stale -> refreshing/loading -> ready transition, and no fallback/default proof substitutes. | P1/P2 remaining: expand to every real provider-backed family when available, fresh official S23 recapture, repeated transition breadth, and status/density polish | EJ-C docs gate; PM-GAP-085 open |
| Live event route-backed provider lifecycle/status parity EI | `docs/mobile/audits/cycle-ei-c-route-backed-status-gate.md` | Pass for selected EI integrated route-backed tablet status proof. The selected path proves backend health/reachability, route-backed ready live page, Book refreshing/loading, route-backed ready depth, ticket provider identity, server mode, and no deterministic fixture/mock-ready/default fallback. | P1/P2 remaining moved to EJ breadth: fresh official S23 recapture, broader real provider-backed line-family status matrix, actual route-backed stale -> refreshing/loading -> ready transition proof, and status visual polish | EI integrated selected pass; PM-GAP-084 verified for selected path |
| Live event visible provider lifecycle/status parity EH | `docs/mobile/audits/cycle-eh-c-provider-status-gate.md` | Partial for selected EH integrated proof. Android proof now shows ready, refresh-due, refreshing, and not-ready states through live page, chart, Book/orderbook, and ticket handoff, and backend proof shows route status fields. P0 remains open for tablet-visible status rendering sourced from the live backend route rather than deterministic contract fixture status UI. | P1/P2 remaining: fresh official S23 recapture, broader real provider-backed line-family status matrix, actual stale -> refreshing/loading -> ready transition proof, and status visual polish | EH integrated partial; PM-GAP-084 remains open |
| Live event visible provider behavior and structural parity EG | `docs/mobile/audits/cycle-eg-c-live-event-visible-provider-gate.md` | Partial for selected EG integrated proof. Android proof now covers chart touch, line selector changes, chart-to-Book, and chart-to-ticket identity for the selected Spread path, and backend proof covers provider refresh lifecycle. P0 remains open for same-run visible ready/stale/refreshing/unavailable status proof tied to the backend route, no-fallback status handling, and prior-gate non-regression in the same build. | P1/P2 remaining: fresh official S23 recapture, broader real provider-backed line-family breadth, visible stale/refreshing/ready lifecycle, and live-page visual/status polish | EG integrated partial; PM-GAP-084 remains open |
| Book-origin snapshot durability after metadata drift EF | `docs/mobile/audits/cycle-ef-c-snapshot-durability-gate.md` | Pass for selected EF integrated gate. P0 proof preserves order-time/fill-time selected Book identity after mutable market/outcome/provider metadata drift in backend routes and Android Portfolio/activity, with no fallback/default reconstruction and explicit fake-token labels | P1/P2 remaining: repeat across real provider-backed line families, provider-refresh drift regression, official production history recapture, and Portfolio/history visual clarity | EF integrated gate pass; PM-GAP-083 verified for selected lifecycle |
| Book-origin order status breadth and selection snapshots EE | `docs/mobile/audits/cycle-ee-c-book-order-status-gate.md` | Pass for selected EE integrated gate. P0 proof preserves the same Book-origin Spread identity across open order, cancel/canceled status, filled position, recent activity/history, Android-visible fake-token status labels, backend route/data proof, guarded selection snapshots, and no fallback | P1/P2 remaining: real provider-backed line-family status matrix, official production confirmation/cancel/fill recapture, durability checks after metadata changes, and Portfolio/history visual status polish | EE integrated gate pass; PM-GAP-082 verified for selected lifecycle |
| Book-selected order to Portfolio/history ED lifecycle | `docs/mobile/audits/cycle-ed-c-book-order-portfolio-gate.md` | Pass for selected ED integrated gate. P0 proof starts on the live game page Book surface, selects Spread `1.5` regulation Yes, opens the matching ticket, submits a fake-token order, and preserves the same selected identity through Android-visible Portfolio open order/open position/activity plus backend order/portfolio/history route proof | P1/P2 remaining: real provider-backed line-family lifecycle breadth, open/cancel/fill status breadth, production confirmation recapture, immutable selection snapshots, and Portfolio/history visual polish | ED integrated gate pass; PM-GAP-081 verified for selected lifecycle |
| Line-market lifecycle DX | `docs/mobile/audits/cycle-dx-c-line-lifecycle-gate.md`; `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md`; `docs/mobile/audits/cycle-dw-c-book-selector-ticket-gate.md` | Pass for focused lifecycle gate. Backend proof preserves provider-shaped Spread identity through order request, order response, open order, canceled activity, filled position, and recent trade; Android proof preserves visible `MEX -2.5 1H` through row, ticket, order, Portfolio activity, and open order | P1/P2 remaining: repeat visible lifecycle on real provider-backed line market, official amount/swipe confirmation recapture, every line family, and production immutable selection storage | DX focused gate pass |
| Orderbook family/depth selector DW grouped selector/state breadth | `docs/mobile/audits/cycle-dw-c-book-selector-ticket-gate.md`; `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md` | Pass for focused DW gate. Android proof shows a grouped Book selector sheet with Moneyline/Totals/Spreads selection and Spread ticket carry-through; backend proof shows unavailable/empty, stale, and ready provider orderbook states are distinct and fallback rows are not counted as ready | P1/P2 remaining: real-provider selector breadth for every line family, full settings sheet, phone visual density, and selector identity through order/portfolio/history | DW focused gate pass |
| Orderbook family/depth selector DV provider-ready UI | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Verified for the focused same-market provider-ready Book path. DV ties backend `provider-orderbook-depth` JSON for market `d08da13e-80b8-4452-9067-f91d08f6fba4` to the Android-visible Book UI with selector key `spreads:first-half:1.5`, ready route status, Spread line/period state, Cents/Decimal setting preservation, and ticket carry-through to `Japan -1.5` | P1/P2 remaining: broader selector sheet coverage, richer settings sheet behavior, server non-ready recapture in the provider-specific harness, and phone-density/visual polish | DV focused gate pass |
| Orderbook family/depth selector DU integrated | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Superseded by DV. DU was partial because provider-ready backend depth and visible Book UI proof were separate evidence bundles | Keep DU evidence as background for settings/selector/ticket behavior; use DV as the same-market provider-ready regression proof | Superseded by DV |
| Orderbook family/depth selector DU-C final gate | `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md`; `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Passed for the focused same-market provider-ready path after DV proof. OB-DU-C-P0-01/02/03/04/05/06/09 now have Android-visible evidence; OB-DU-C-P0-07 remains covered by DT/DU regression evidence; OB-DU-C-P0-08 remains documented by non-ready/fallback evidence rather than recaptured in the DV ready-only server run | Remaining P1/P2 polish: complete Polymarket selector/settings parity and tighter phone visuals | DV focused gate pass |
| Orderbook family/depth selector DT integrated | `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`; `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` | Partial. DT integrated proof exists for Yes/No tab switching, selector carry-through into a Totals ticket, side-labelled ladder markers, and backend provider-backed ready depth route; PM-GAP-075 remains open | Required remaining proof: provider-backed ready depth visible in the same UI run, Spread/period/line selector carry-through, and Decimalize/equivalent Book setting. P1 broader selector coverage, row-to-ticket carry-through polish, and P2 visual polish remain open after gate pass | DT integrated partial; not parity-pass |
| Line-market ticket target parity DR-C | `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md` | Focused P0 pass after integrated Samsung tablet proof for selected market family, line, period, side/outcome, odds/probability, and ticket target identity | DQ-C production ticket amount/swipe recapture remains P1 due to location gate; Book/order/portfolio/history coupling stays under PM-GAP-074 | Pass for focused ticket-target gate |
| Live football / World Cup game detail DQ-C | `docs/mobile/audits/live-football-world-cup-dq-c.md` | Fresh S23 reference P0 criteria added for full page hierarchy, chart press, line-state coupling, Book/depth ladder, active buttons/actions, tab behavior, and scroll behavior; Holiwyn not marked complete | P1 ticket amount/swipe confirmation recapture remains blocked by Polymarket location gate; P1 full Book market-selector parity and P2 visual/motion polish remain open | Reference audit only |
| Live event detail | `docs/mobile/audits/live-event-detail.md`; `docs/mobile/audits/live-event-detail-super-round-dm.md` | DN super-round P0 criteria are documented for Polymarket-first match-winner provider mapping, CLOB chart history, route-backed depth, Buy/Sell ticket identity, and honest stale/closed state handling | P1 exact line-family provider markets, filled-order/history lifecycle proof, and scheduled refresh remain open; P2 visual density/motion polish remains deferred | Pass for Cycles DK-DM evidence; Agent A/B must re-run final device proof against implementation build |
| Game page | `docs/mobile/audits/game-page.md` | Verified for Cycle AJ focused logged-in game-page P0; Cycle AL sticky market-tab criterion passed; Cycle AM Player Props unavailable-state criterion passed | P1/P2 phone density and backend-backed market data remain tracked | Pass |
| Trade ticket | `docs/mobile/audits/trade-ticket.md` | Verified for Cycle AI focused logged-in/tall ticket-surface P0 | P1/P2 deferred in focused audit; production eligibility/location gates remain deferred for fake-token mode | Pass |
| Binary side ticket | `docs/mobile/audits/binary-side.md` | Verified for Cycle AH focused Buy No contract-side P0 | P1 full-page/native swipe confirmation deferred | Pass |
| Line adjustment | `docs/mobile/audits/line-adjustment.md` | Verified for Cycle Y focused Spreads/Totals P0 | P1/P2 deferred in focused audit | Pass |
| Portfolio | `docs/mobile/audits/portfolio.md` | Verified for Cycle AA focused fake-token P0 | P1/P2 deferred in focused audit | Pass |
| Search | `docs/mobile/audits/search.md` | Verified for Cycle AB focused Search/Explore P0 | P1/P2 deferred in focused audit | Pass |
| Account/settings | `docs/mobile/audits/account.md` | Verified for Cycle AC focused account/settings P0 | P1/P2 deferred in focused audit | Pass |
| Chart behavior | `docs/mobile/audits/chart-behavior.md` | Verified for Cycle AD focused chart P0 | P1/P2 deferred in focused audit | Pass |
| Market page | `docs/mobile/audits/market-page.md` | Verified for Cycle AE focused market-page P0 | P1/P2 deferred in focused audit | Pass |
| Event page top shell | `docs/mobile/audits/event-page-top-shell.md` | Verified for Cycle U focused P0 | P1/P2 deferred in focused audit | Pass |
| Futures market rows | `docs/mobile/audits/futures-market-rows.md` | Verified for Cycle AK focused logged-in catalog expansion P0 | P1/P2 backend-owned catalog/live pricing and visual density remain tracked | Pass |
| Futures chart range | `docs/mobile/audits/futures-chart-range.md` | Verified for Cycle W focused P0 | P1/P2 deferred in focused audit | Pass |
| Match market tabs/cards | `docs/mobile/audits/match-market-tabs-cards.md` | Verified for Cycle X focused P0 | P1/P2 deferred in focused audit | Pass |
| Navigation | `docs/mobile/audits/navigation.md` | Verified for Cycle T P0 | P1/P2 deferred in focused audit | Pass |

## Required Special Coverage

Adjustable line markets:

- Spreads.
- Totals.
- Team totals.
- Corners.
- Halves.
- Other discovered line-based markets.

Chart behavior:

- Probability movement.
- Selected outcome state.
- Time range if present.
- Tooltip or press behavior if present.
- Empty/loading behavior.

Trade ticket:

- Buy/Sell switching.
- Amount entry.
- Odds/probability updates.
- Payout/cost calculation.
- Line selection carry-through.
- Confirmation/error state.

Live event detail DN super-round required checks:

- Chart source must be `polymarket-clob-prices-history` or an explicitly documented unavailable/stale state for provider-backed markets.
- Line selectors must be provider-backed for the selected line/outcome, or explicitly unavailable/stale/unsupported when current Polymarket reference exposes no line-family market.
- Orderbook/depth must use route-backed provider data and expose best bid, best ask, spread, price, shares, and total.
- Buy/Sell ticket must preserve selected provider source, external market, condition, outcome token, outcome label, market type, group, period, line, and side.
- Closed/resolved events must not be shown as current-live ready; stale/ended state is acceptable and required when the provider says so.

## Cycle EO-C Route-Backed Lifecycle Breadth Gate Criteria

The focused EO-C gate in `docs/mobile/audits/cycle-eo-c-route-lifecycle-breadth-gate.md` opens PM-GAP-089 for route-backed lifecycle breadth after EN. EN integrated is the selected baseline for one ask-side Spread route-backed lifecycle; EO must prove a broader route-backed identity and cannot pass by repeating only that path.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EO-BREADTH-P0-01 | P0 | Fresh/stale/reference-only evidence status must be explicit and no fresh S23 production lifecycle parity may be claimed without fresh capture. | Docs label EN as fresh Holiwyn baseline, EL as fresh first-hop support, EL-C S23 Book context as partial fresh reference, DQ-C/AG/AI as stale/reference-only, and no fresh EO production lifecycle reference as collected. |
| EO-BREADTH-P0-02 | P0 | Same-cycle backend or route-shaped proof must exist for the new selected breadth identity. | Route/backend proof with matching route status/source, provider/source, market id or selector key, side, price, shares/value, lifecycle ids, and no fallback rows. |
| EO-BREADTH-P0-03 | P0 | Holiwyn Android proof must exist for the same selected identity. | Android screenshots/XML/proof JSON for the same event, family/type, line, period, side/outcome, provider/source, market id or selector key, row price/side, and lifecycle ids. |
| EO-BREADTH-P0-04 | P0 | EO must materially broaden EN. | Proof covers bid-side/Sell lifecycle and/or another provider-backed market family beyond EN's selected ask-side Spread lifecycle. |
| EO-BREADTH-P0-05 | P0 | Repeating only EN's ask-side Spread path fails. | Lead matrix explicitly compares EO against EN and shows at least one new side/family. |
| EO-BREADTH-P0-06 | P0 | Ticket, submit, order, open order, Portfolio/open position, activity, history, and status transitions must preserve the selected breadth snapshot. | Backend/route proof paired with Android-visible proof for the same order/fill/cancel/status ids, selected price/side, market/outcome/line/period/provider/source, and fake-token label when applicable. |
| EO-BREADTH-P0-07 | P0 | Fallback/default labels, midpoint/default price reversion, id/provider drift, backend-only proof, and UI-only mocks fail. | Negative assertions reject event-only, moneyline, first-row, generic team, generic Yes/No, default probability, fake provider-depth rows, stale metadata, missing provider, and backend JSON without Android proof. |
| EO-BREADTH-P1-01 | P1 | Recapture fresh official S23 production order lifecycle when gates allow. | Fresh Samsung S23 official-app Book row -> ticket -> production order/open order/history proof, or documented blocked state. |
| EO-BREADTH-P1-02 | P1 | Continue breadth across more provider-backed families and both sides. | Route-backed Android/backend proof for Spread plus more available families, covering ask->Buy and bid->Sell. |
| EO-BREADTH-P1-03 | P1 | Capture production HTTP order route proof. | HTTP route proof for order submit/open/cancel/history paired to the Android-visible selected identity. |
| EO-BREADTH-P1-04 | P1 | Add first-class immutable selection snapshots. | Database-backed selection snapshots survive provider refresh, metadata drift, cancel/fill, and app relaunch. |
| EO-BREADTH-P2-01 | P2 | Polish lifecycle labels and visual scan clarity. | Side-by-side visual QA after P0 breadth proof passes. |

## Cycle EN-C Route-Backed Book-Staged Limit Lifecycle Gate Criteria

The focused EN-C gate in `docs/mobile/audits/cycle-en-c-route-limit-lifecycle-gate.md` opens PM-GAP-088 for the route-backed provider-depth version of the Book-staged limit lifecycle. EM integrated remains a selected fake-token lifecycle pass, and EL integrated remains first-hop route-backed Book-to-ticket support; neither passes EN without route-backed Android proof through order, Portfolio, activity, and history.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EN-ROUTE-LIMIT-P0-01 | P0 | Fresh/stale/reference-only evidence status must be explicit and no fresh S23 production order parity may be claimed without fresh capture. | Docs label EL/EM Holiwyn proof as fresh support, EL-C S23 Book context as partial fresh reference, and DQ-C/AG/AI ticket/order context as stale/reference-only. |
| EN-ROUTE-LIMIT-P0-02 | P0 | The selected Book row must be route-backed provider depth, not arbitrary local UI-only mock data. | Backend route proof plus Android Book proof with matching route status/source, provider/source, market id or selector key, row side, price, shares, value, and depth source. |
| EN-ROUTE-LIMIT-P0-03 | P0 | The selected route-backed Book row must stage the exact price and side into ticket. | Android proof for ask->Buy and bid->Sell, or documented same-run side unavailability, with no midpoint/outcome probability/default price reversion. |
| EN-ROUTE-LIMIT-P0-04 | P0 | Ticket amount/ready/submit state must preserve selected route-backed identity. | Android ticket proof after amount entry plus proof JSON showing price, side, row shares/value, market/outcome/line/period/provider/source, route depth source, and fake-token label when applicable. |
| EN-ROUTE-LIMIT-P0-05 | P0 | Order request/response must snapshot selected route-backed Book limit fields. | Backend order JSON paired with Android submit proof for the same order id and selected row. |
| EN-ROUTE-LIMIT-P0-06 | P0 | Open order, Portfolio/open position, activity, and history must render the order-time selected route-backed snapshot. | Android screenshots/XML plus backend route proof showing unchanged price, side, selected id/line/outcome/provider, order/fill/cancel/status ids, and fake-token/test labels. |
| EN-ROUTE-LIMIT-P0-07 | P0 | Selected identity must not change across the lifecycle. | Lead matrix maps Book -> ticket -> order -> open order -> Portfolio -> activity/history by order id plus event, market id/selector key, outcome id, line, period, side, provider/source, condition/token, price, and shares/value. |
| EN-ROUTE-LIMIT-P0-08 | P0 | Portfolio/history fallback/default labels fail visible parity. | Negative assertions reject event-only, moneyline, first-row, generic team, generic Yes/No, default probability, stale metadata, missing provider, and missing selected id labels. |
| EN-ROUTE-LIMIT-P0-09 | P0 | Backend JSON alone cannot pass visible parity. | Backend proof must be paired to Holiwyn Android screenshots/XML/proof JSON for the same selected row and ids. |
| EN-ROUTE-LIMIT-P0-10 | P0 | Proof using arbitrary local UI-only mocks or fake provider-depth rows fails. | Negative assertions reject UI-only mocks, deterministic fake rows presented as route-backed provider depth, stale-as-ready route behavior, and backend-unreachable fallback. |
| EN-ROUTE-LIMIT-P1-01 | P1 | Recapture fresh official S23 production order lifecycle when gates allow. | Fresh Samsung S23 official-app Book row -> ticket -> production order/open order/history proof, or documented blocked state. |
| EN-ROUTE-LIMIT-P1-02 | P1 | Repeat across multiple route-backed market families and both sides. | Android/backend proof for Spread plus another available family, covering ask->Buy and bid->Sell. |
| EN-ROUTE-LIMIT-P1-03 | P1 | Prove durable DB-backed snapshots after provider refresh/metadata drift. | Database-backed selection snapshots stay unchanged through refresh, drift, cancel/fill, and app relaunch. |
| EN-ROUTE-LIMIT-P2-01 | P2 | Polish order/Portfolio/history lifecycle labels and visual scan clarity. | Side-by-side visual QA after P0 route-backed lifecycle proof passes. |

## Cycle EM-C Book-Staged Limit Lifecycle Gate Criteria

The focused EM-C gate in `docs/mobile/audits/cycle-em-c-limit-lifecycle-gate.md` opens PM-GAP-087 for the next Book/orderbook lifecycle milestone after EL. EL integrated proof is fresh Holiwyn support for selected Book ask/bid price preservation into the ticket; Polymarket ticket/order/Portfolio/history reference remains stale or blocked and must be labeled as such.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EM-LIMIT-P0-01 | P0 | Fresh-vs-stale evidence status is explicit and no Polymarket production parity is claimed without Android Holiwyn proof. | Docs label partial fresh EL-C S23 Book reference, fresh EL Holiwyn ticket-price proof, and stale DQ-C/AG/AI ticket/order support. |
| EM-LIMIT-P0-02 | P0 | A tapped Book ask/bid row must stage the exact selected limit price into the ticket. | Android proof showing tapped row price/side/shares and ticket price for ask->Buy and bid->Sell, with no midpoint/outcome probability reversion. |
| EM-LIMIT-P0-03 | P0 | Amount entry and ready/submit state must preserve limit price, limit side, row shares/value, selected market/outcome, and provider/source identity. | Android ticket proof after amount entry plus proof JSON for the same selected row. |
| EM-LIMIT-P0-04 | P0 | Order request/response must snapshot selected Book limit fields. | Backend support proof paired with Android submit proof for the same order id. |
| EM-LIMIT-P0-05 | P0 | Open order, Portfolio/open position, activity, and history must render the order-time selected limit snapshot. | Android screenshots/XML plus backend route proof for the same order/fill/cancel ids. |
| EM-LIMIT-P0-06 | P0 | Status changes such as open, canceled, filled, or partially filled must not drop limit fields. | Lifecycle proof showing unchanged limit snapshot across status transitions. |
| EM-LIMIT-P0-07 | P0 | Fallback/default labels fail the lifecycle. | Negative assertions reject event-only, first-row, moneyline, generic team, generic Yes/No, fallback market, default probability, stale metadata, or missing provider/source labels. |
| EM-LIMIT-P0-08 | P0 | Backend JSON without Android-visible Holiwyn proof cannot pass. | Lead proof matrix maps backend JSON to visible Android ticket/order/Portfolio/activity/history markers for the same ids. |
| EM-LIMIT-P1-01 | P1 | Repeat across multiple market families and both Book sides. | Spread plus another family where provider-backed depth exists; ask->Buy and bid->Sell covered. |
| EM-LIMIT-P1-02 | P1 | Recapture official Polymarket production order/history behavior when location/trading gates allow. | Fresh S23 screenshots/XML or documented blocked state. |
| EM-LIMIT-P1-03 | P1 | Prove selected limit snapshot durability after provider refresh or metadata drift. | Before/after Android and backend proof with unchanged historical selected limit fields. |
| EM-LIMIT-P2-01 | P2 | Improve visual scan clarity for limit price/side/status in lifecycle surfaces. | Side-by-side Android visual QA after P0 passes. |

## Cycle EL-C Live Event Detail Depth Gate Criteria

The focused EL-C gate in `docs/mobile/audits/cycle-el-c-live-event-depth-gate.md` opens PM-GAP-086 for the next live event page depth milestone after EK. Agent C confirmed connected S23 official Polymarket app access and captured partial fresh reference observations for chart/top context, swipe depth, Game/Chat, line controls, Book/orderbook, and grouped selector. Ticket Buy/Sell fresh reference remains incomplete and stale DQ-C/AG/AI ticket evidence is support-only.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EL-DEPTH-P0-01 | P0 | Same-build Android-visible Holiwyn proof must exist for live event detail depth. | Screenshots/XML/proof JSON from one device session covering live page, chart, market sections, Book/orderbook, selector, and ticket. |
| EL-DEPTH-P0-02 | P0 | Fresh/stale reference status must be stated honestly. | Audit notes identify partial fresh S23 reference and stale ticket support as stale context only. |
| EL-DEPTH-P0-03 | P0 | Page swipes must preserve event context and selected identity. | Before/after proof showing same event, market family/type, line, period, side/outcome, provider/source, and market id or selector key after scrolling. |
| EL-DEPTH-P0-04 | P0 | Chart behavior must be selected-market aware and interactive. | Chart tap proof showing selected event/outcome/market context, visible movement or press/selected state, and no unintended ticket/Book/share/chat navigation. |
| EL-DEPTH-P0-05 | P0 | Live game sections must behave like real product surfaces, not placeholders. | Game/Chat proof plus live preview/section behavior, persistent event header, and outcome actions where present; deposit/location/notification pages are skipped. |
| EL-DEPTH-P0-06 | P0 | Market sections must expose real page depth comparable to Polymarket. | Regulation Time Winner, Spread, Totals, and at least one lower section or unavailable Player Props state are visible and interactive/explicit. |
| EL-DEPTH-P0-07 | P0 | Line and period controls must update one coherent selected identity. | Spread or Totals proof showing line value, period, subject/team/outcome, odds/probabilities, selected row styling, and provider/source identity update together. |
| EL-DEPTH-P0-08 | P0 | Book/orderbook must open from the selected live event and preserve identity. | Android proof of Book title/event, Yes/No tabs, grouped selector, selected family/line/period/side, provider/source/status, Price/Shares/Value columns, bid/ask rows, and spread/ask/bid distinction when depth exists. |
| EL-DEPTH-P0-09 | P0 | Book grouped selector must preserve market family identity. | Selector proof showing Moneyline plus Spread/Totals or available families, visible selected check, and no reset to a default market after selection. |
| EL-DEPTH-P0-10 | P0 | Ticket handoff must preserve selected page or Book identity. | Ticket proof from page row and Book action/row showing event, family/type, line, period, side/outcome, provider/source, market id/selector key, price/odds, Buy/Sell or side state, and fake-token/test labels if applicable. |
| EL-DEPTH-P0-11 | P0 | Non-ready/loading/unavailable states must be explicit. | Android proof or documented same-run reason showing stale/loading/unavailable states do not render as ready chart/depth/ticket placeholders. |
| EL-DEPTH-P0-12 | P0 | No fallback/default/static-placeholder evidence may pass. | Proof rejects backend-only pass, static placeholders, default moneyline, first visible row, event-only ticket labels, generic Team to Advance, mock-ready rows, stale-as-ready status, and fallback depth. |
| EL-DEPTH-P0-13 | P0 | Agent B cannot pass without Android-visible proof. | Audit Gate entry lists Android visible proof as a blocker; backend JSON can support but cannot replace Agent B proof. |
| EL-DEPTH-P1-01 | P1 | Repeat the full depth path across at least two real provider-backed market families when available. | Android proof for Moneyline plus Spread/Totals/halves or documented provider unavailability. |
| EL-DEPTH-P1-02 | P1 | Fresh S23 ticket Buy/Sell reference should be recaptured when non-confirming access allows. | Same-cycle official Polymarket ticket screenshots/XML through Buy/Sell or side switch, stopping before deposit/location/confirmation. |
| EL-DEPTH-P1-03 | P1 | Book row tap should carry row price/side into ticket. | Android proof from a specific orderbook row to ticket showing selected price, side, shares/value context where supported. |
| EL-DEPTH-P1-04 | P1 | Player Props and lower sections should cover unavailable and available states. | Android proof for Player Props tab/section behavior and lower-page sections. |
| EL-DEPTH-P1-05 | P1 | Repeat live-section behavior with a current in-play event when available. | Android proof where live time/status changes while preserving selected market identity. |
| EL-DEPTH-P2-01 | P2 | Visual density, spacing, and hierarchy should feel close to the official app without copying brand assets. | Side-by-side review after P0 pass. |
| EL-DEPTH-P2-02 | P2 | Chart touch feel and Book row styling should be polished. | Visual QA for touch feedback, row bars, red/green or equivalent side styling, and scroll smoothness. |
| EL-DEPTH-P2-03 | P2 | Live chat preview and section transitions should feel native. | Device review for tab switching, chat preview updates, and return-to-game state. |

## Cycle EK-C Provider Transition Breadth Gate Criteria

The focused EK-C gate in `docs/mobile/audits/cycle-ek-c-provider-transition-gate.md` tracks the remaining route-backed provider-status transition breadth after EJ. EJ remains selected mixed-path regression coverage; EK is fail-until-integrated-proof for visible unavailable/not-ready, full transition, selected identity preservation, no fallback/default/generic behavior, and real-provider family breadth if available.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EK-TRANSITION-P0-01 | P0 | EK proof must be same-build and integrated across Agent A backend proof, Agent B Android proof, and Lead proof summary. | One committed EK bundle pairing backend route state with Android-visible markers for the same event and selected market identities. |
| EK-TRANSITION-P0-02 | P0 | Visible unavailable/not-ready state must be route-backed. | Backend route unavailable/empty/not-ready fields match Android-visible unavailable/not-ready labels, disabled or explicit Book/ticket behavior, and reason text for the same selected market. |
| EK-TRANSITION-P0-03 | P0 | Full stale or refresh-due -> refreshing/loading -> ready transition must be route-backed. | One selected market begins stale or refresh-due, triggers route-backed refresh, shows Android-visible refreshing/loading, and resolves ready with matching backend route fields. |
| EK-TRANSITION-P0-04 | P0 | Selected identity must be preserved across the whole transition. | Proof matrix maps event slug, market id or selector key, family/type, line, period, side/outcome, provider/source, condition/token when available, chart status, Book/orderbook status, and ticket state before/during/after refresh. |
| EK-TRANSITION-P0-05 | P0 | Stale/refreshing/loading/ready states must not silently change the selected market. | Before/during/after Android XML and proof JSON show the same selected market identity, not a default moneyline, first row, generic market, event-only label, or generic Team to Advance target. |
| EK-TRANSITION-P0-06 | P0 | Book/orderbook must reflect selected route status honestly. | Ready cases show route-backed depth/source/status; non-ready cases show explicit loading/stale/unavailable state and no fallback depth counted as ready. |
| EK-TRANSITION-P0-07 | P0 | Ticket handoff must preserve selected identity or block honestly when not ready. | Ready tickets preserve selected identity and odds/price; stale/unavailable/not-ready tickets are disabled or explicit while preserving identity. |
| EK-TRANSITION-P0-08 | P0 | No fallback/default/generic market behavior may satisfy the gate. | Proof rejects fixture status source, mock-ready labels, backend-unreachable fallback, stale-as-ready labels, default moneyline, first-row, event-only, generic market, generic Team to Advance, fallback depth, source inspection, compile checks, and backend-only JSON. |
| EK-TRANSITION-P0-09 | P0 | Real-provider family breadth must be attempted and proven when available. | Lead includes real provider-backed family inventory. If two or more families are available, Android-visible proof covers Spread plus at least one of Totals, Moneyline, halves, team totals, corners, or props; otherwise Lead documents why breadth remains unavailable. |
| EK-TRANSITION-P0-10 | P0 | EJ selected proof remains regression evidence and cannot be used as the EK pass by substitution. | Lead summary separates EJ progress from EK pass evidence and names which EK P0 rows are newly proven. |
| EK-TRANSITION-P0-11 | P0 | Fresh S23 reference must not be claimed unless newly captured. | Audit notes, proof log, and Lead summary label DQ-C/S23 evidence stale/reference-only when reused. |
| EK-TRANSITION-P1-01 | P1 | Expand transition proof to every real provider-backed family exposed by current Polymarket data. | Additional transition/non-ready proof for Spread, Totals, Moneyline, halves, team totals, corners, and props when available. |
| EK-TRANSITION-P1-02 | P1 | Repeat the full transition for more than one provider-backed family. | At least two stale -> refreshing/loading -> ready transitions with Android-visible route-backed markers. |
| EK-TRANSITION-P1-03 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, selector/status states, and ticket/gated sheet. |
| EK-TRANSITION-P2-01 | P2 | Polish density, status language, chart touch feel, non-ready affordances, and Book/orderbook state styling. | Side-by-side review against fresh or reused Polymarket reference after P0 transition proof passes. |

## Cycle EJ-C Provider Status Breadth Gate Criteria

The focused EJ-C gate in `docs/mobile/audits/cycle-ej-c-provider-status-breadth-gate.md` tracks the remaining route-backed provider-status breadth after EI. EI remains a selected pass; EJ is fail-until-integrated-proof for breadth.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EJ-BREADTH-P0-01 | P0 | EJ proof must be same-build and integrated across Agent A backend proof, Agent B Android proof, and Lead proof summary. | One committed EJ bundle pairing backend route state with Android-visible markers for the same selected event/market identities. |
| EJ-BREADTH-P0-02 | P0 | Real provider-backed family breadth must be proven beyond the single EI disposable ready path. | Route-backed proof for at least two real provider-backed families when available, including Spread and one of Totals, Moneyline, halves, team totals, corners, or props. |
| EJ-BREADTH-P0-03 | P0 | Stale or refresh-due state must be route-backed and visible, not fixture-derived. | Backend route stale/refresh-due fields match Android-visible stale/refresh-due markers for the selected market with no silent conversion to ready. |
| EJ-BREADTH-P0-04 | P0 | Unavailable, empty, or not-ready state must be route-backed and visible. | Backend route unavailable/empty/not-ready fields match Android-visible state and messaging, with no default moneyline, first-row, or event-only fallback. |
| EJ-BREADTH-P0-05 | P0 | Full transition stale -> refreshing/loading -> ready must be proven route-backed. | One selected market begins stale or refresh-due, shows Android-visible refreshing/loading during route-backed refresh, and resolves ready with the same identity. |
| EJ-BREADTH-P0-06 | P0 | Selected identity must survive the whole breadth matrix. | Proof matrix maps event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, status, chart, Book/orderbook, and ticket state. |
| EJ-BREADTH-P0-07 | P0 | Book/orderbook state must match the route-backed selected status for ready and non-ready cases. | Ready cases show route-backed depth/source/status; non-ready cases show explicit loading/stale/unavailable state and no fallback depth counted as ready. |
| EJ-BREADTH-P0-08 | P0 | Ticket handoff must preserve route-backed selected status or block honestly when not ready. | Ready tickets preserve selected identity and odds/price; stale/unavailable/not-ready tickets are disabled or explicit while preserving identity. |
| EJ-BREADTH-P0-09 | P0 | Negative assertions must reject fallback and proof-only substitutes. | Proof rejects fixture status source, mock-ready labels, backend-unreachable fallback, stale-as-ready labels, default moneyline, first-row, event-only, fallback depth, backend-only JSON, source inspection, compile checks, and smoke logs without visible markers. |
| EJ-BREADTH-P0-10 | P0 | Fresh S23 reference must not be claimed unless newly captured. | Audit notes, proof log, and Lead summary label DQ-C/S23 evidence stale/reference-only when reused. |
| EJ-BREADTH-P0-11 | P0 | EI selected pass must stay regression coverage and must not be used as breadth proof. | Lead summary separates EI selected route-backed ready path from EJ breadth evidence. |
| EJ-BREADTH-P1-01 | P1 | Expand family breadth to every real provider-backed line family exposed by current Polymarket data. | Additional Spread, Totals, halves, team totals, corners, and props proof when available. |
| EJ-BREADTH-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, selector/status states, and ticket/gated sheet. |
| EJ-BREADTH-P1-03 | P1 | Repeat full transition proof across more than one provider-backed family. | At least two stale -> refreshing/loading -> ready transitions with Android-visible route-backed markers. |
| EJ-BREADTH-P2-01 | P2 | Polish density, status language, chart touch feel, non-ready affordances, and Book/orderbook state styling. | Side-by-side review against fresh or reused Polymarket reference after P0 breadth proof passes. |

## Cycle EI-C Route-Backed Provider Status Gate Criteria

The focused EI-C gate in `docs/mobile/audits/cycle-ei-c-route-backed-status-gate.md` tracked the remaining PM-GAP-084 blocker after EH: tablet-visible provider lifecycle/status had to be sourced from the live backend route. Current status is pass for the selected EI integrated route-backed ready/Book/ticket path; broader status breadth moved to EJ.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EI-ROUTE-STATUS-P0-01 | P0 | Backend health and route reachability must be proven from the tablet launch context before visible status can count. | Same-run proof JSON records backend base URL, health/reachability result, live-detail/status route URL or route id, HTTP success, and no tablet-side backend unavailable condition. |
| EI-ROUTE-STATUS-P0-02 | P0 | Tablet XML and proof JSON must contain route-backed status markers, not only fixture-compatible labels. | Android XML/proof includes route/source/status/freshness/provider markers matched to backend route response fields for the selected market. |
| EI-ROUTE-STATUS-P0-03 | P0 | Ready status must be live-route-backed and tied to the selected market identity. | Backend ready fields match tablet-visible ready markers plus event, family/type, line, period, side/outcome, provider/source, market id or selector key, and visible labels. |
| EI-ROUTE-STATUS-P0-04 | P0 | Stale or refresh-due status must be live-route-backed and tied to the same selected market identity. | Backend stale/refresh-due fields match tablet-visible stale/refresh-due markers without silent conversion to ready. |
| EI-ROUTE-STATUS-P0-05 | P0 | Refreshing or loading status must be live-route-backed and tied to the same selected market identity. | Backend refresh/loading state or documented refresh trigger is paired with tablet-visible loading/refreshing state while selected identity is preserved or explicitly disabled. |
| EI-ROUTE-STATUS-P0-06 | P0 | Unavailable, empty, or not-ready status must be live-route-backed and tied to the selected market identity. | Backend unavailable/not-ready fields match tablet-visible unavailable/not-ready state, with explicit messaging and no default ready ladder. |
| EI-ROUTE-STATUS-P0-07 | P0 | The same selected market identity must carry through live page, chart, Book/orderbook, and ticket while preserving route-backed status context. | A proof matrix maps the same selected event, family/type, line, period, side/outcome, provider/source, market id or selector key, and condition/token where available across every surface. |
| EI-ROUTE-STATUS-P0-08 | P0 | Book/orderbook ready depth or unavailable state must be tied to the same route-backed selected status. | Book/orderbook XML/proof shows selected market id or selector key, route-backed provider/status markers, Price/Shares/Value rows only when ready, explicit loading/unavailable states otherwise, side labels, spread when available, and no fallback rows counted as ready. |
| EI-ROUTE-STATUS-P0-09 | P0 | Ticket handoff must preserve the selected route-backed status context. | Ticket XML/proof shows matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, route-backed status marker, visible odds/price when ready, and disabled/loading/unavailable behavior when not ready. |
| EI-ROUTE-STATUS-P0-10 | P0 | Fixture, mock-ready, deterministic contract UI, default moneyline reconstruction, first-row fallback, and event-only labels must fail. | Proof-level assertions reject fixture status source, mock-ready labels, backend-unreachable tablet fallback, moneyline/default reconstruction, first visible row fallback, event-only labels, and stale labels counted as ready. |
| EI-ROUTE-STATUS-P0-11 | P0 | Backend-only route JSON is insufficient. | Backend proof may support the gate only when paired with matching Android-visible route-backed markers and selected market identity in the same proof bundle. |
| EI-ROUTE-STATUS-P0-12 | P0 | The EI proof must be same-build and cannot be replaced by prior EC/ED/EE/EF/EG/EH proof bundles. | Same-build proof matrix for the EI selected identity plus prior-gate regression references or rerun markers. |
| EI-ROUTE-STATUS-P0-13 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. |
| EI-ROUTE-STATUS-P1-01 | P1 | Repeat the route-backed status matrix across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. |
| EI-ROUTE-STATUS-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, and ticket/gated sheet. |
| EI-ROUTE-STATUS-P1-03 | P1 | Prove an actual route-backed transition stale -> refreshing/loading -> ready without losing selected market identity. | Android-visible transition proof plus backend route proof for the same selected market identity. |
| EI-ROUTE-STATUS-P2-01 | P2 | Polish status messaging, density, chart touch feel, and Book/orderbook state styling after P0 route-backed status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. |

Market page:

- Tabs.
- Grouped markets.
- Expanded/collapsed rows.
- Nested market options.
- Line selectors.
- Liquidity/depth display.

Portfolio:

- Positions.
- Open orders.
- Cancel behavior.
- Activity/history.
- Sell/close/retrade behavior.

Navigation:

- Back behavior.
- Tab persistence.
- Scroll position.
- Deep links if applicable.

## Cycle EH-C Provider Status Gate Criteria

The focused EH-C gate in `docs/mobile/audits/cycle-eh-c-provider-status-gate.md` tracks the remaining PM-GAP-084 blocker after EG: Android-visible provider lifecycle/status parity. Current status is partial after integrated Android proof; route-backed tablet status rendering remains open.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EH-STATUS-P0-01 | P0 | Same-cycle Holiwyn Android visible proof must exist for provider lifecycle/status on the exact live event detail feature. | Committed EH screenshots, XML, and proof JSON from one integrated Android run. |
| EH-STATUS-P0-02 | P0 | Ready state must be Android-visible and tied to the selected market identity. | Live page, chart, Book/orderbook, and ticket proof showing ready provider/source/status plus the same event, family/type, line, period, side/outcome, market id or selector key, and visible labels. |
| EH-STATUS-P0-03 | P0 | Stale or refresh-due state must be Android-visible and tied to the same selected market identity. | Android proof showing stale or refresh-due status on the selected market path, with no silent conversion to ready and no loss of chart, Book/orderbook, or ticket identity. |
| EH-STATUS-P0-04 | P0 | Refreshing or loading state must be Android-visible and tied to the same selected market identity. | Android proof showing refresh in progress or loading status for the selected market path while chart, Book/orderbook, and ticket either preserve identity or show an explicit disabled/loading state. |
| EH-STATUS-P0-05 | P0 | Unavailable, empty, or not-ready state must be Android-visible and tied to the selected market identity. | Android proof showing unavailable/not-ready status for the selected market path, with explicit messaging and without defaulting to a moneyline, first row, event-only label, or mock-ready ladder. |
| EH-STATUS-P0-06 | P0 | Backend-only lifecycle proof is insufficient. | Backend route/provider fields may support the gate only when paired with matching Android-visible status markers and selected market identity in the same proof bundle. |
| EH-STATUS-P0-07 | P0 | Generic fallback, fixture rows, mock-ready data, or default reconstructed status must fail. | Proof-level assertions and visible UI labels reject fallback/default reconstruction, including moneyline fallback, first-row fallback, event-only labels, stale labels counted as ready, and mock-ready provider rows. |
| EH-STATUS-P0-08 | P0 | Chart status must be tied to the selected market/outcome, not a generic chart placeholder. | Chart touch/context proof showing selected outcome or market context, provider/source/status, and no unintended navigation or ticket/Book side effect. |
| EH-STATUS-P0-09 | P0 | Book/orderbook status must be tied to the selected market identity when ready, stale, refreshing/loading, or unavailable/not-ready. | Book/orderbook proof showing selected market id or selector key, provider/status markers, Price/Shares/Value rows only when ready, explicit loading/unavailable states otherwise, side labels, spread when available, and no fallback rows counted as ready. |
| EH-STATUS-P0-10 | P0 | Ticket status handoff must preserve selected identity and status context from the selected row/line/orderbook action. | Ticket proof showing matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, visible odds/price when ready, disabled/loading/unavailable behavior when not ready, and fake-token/test labeling if applicable. |
| EH-STATUS-P0-11 | P0 | The EH proof must be integrated, same-build, and cannot be replaced by prior EC/ED/EE/EF/EG proof bundles. | Same-build proof matrix for the selected EH identity plus prior-gate regression references or rerun markers. |
| EH-STATUS-P0-12 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. |
| EH-STATUS-P1-01 | P1 | Repeat the visible provider lifecycle/status matrix across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. |
| EH-STATUS-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same status/interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book/orderbook, and ticket/gated sheet. |
| EH-STATUS-P1-03 | P1 | Prove an actual provider refresh transition stale -> refreshing/loading -> ready without losing selected market identity. | Android-visible transition proof plus backend proof for the same selected market identity. |
| EH-STATUS-P2-01 | P2 | Polish status messaging, density, chart touch feel, and Book/orderbook state styling after P0 status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. |

## Cycle EG-C Live Event Visible Provider Gate Criteria

The focused EG-C gate in `docs/mobile/audits/cycle-eg-c-live-event-visible-provider-gate.md` opens PM-GAP-084 for structural live event detail parity and provider-backed visible behavior. Current status is fail until same-cycle integrated Android proof exists.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EG-LV-P0-01 | P0 | Same-cycle Holiwyn Android visible proof must exist for the exact live event detail feature. | Committed screenshots, XML, and proof JSON from an EG integrated Android run. |
| EG-LV-P0-02 | P0 | Backend-only proof is not sufficient. | Backend/provider fields must be paired to visible Android markers in the same selected flow; route JSON, compile checks, smoke logs, or source inspection cannot pass alone. |
| EG-LV-P0-03 | P0 | The live event page must visibly expose provider-backed ready, stale, refreshing, and unavailable/empty states honestly. | Android proof showing ready provider source/status and at least one stale/refreshing/unavailable state or a documented same-run reason it cannot be triggered. |
| EG-LV-P0-04 | P0 | Selected market identity must carry through live page, chart, Book/orderbook, and ticket. | One proof maps event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, and visible labels across each surface. |
| EG-LV-P0-05 | P0 | Chart state must be tied to the selected market/outcome and status, not a generic placeholder. | Chart screenshot/XML/proof showing selected outcome or market context, provider/source/status, and no unintended ticket/book/share/chat/navigation side effect after chart touch. |
| EG-LV-P0-06 | P0 | Book/orderbook must render provider-backed visible depth for the same selected market identity when claiming ready status. | Android Book proof showing event identity, selected market id or selector key, provider/status markers, Price/Shares/Value rows, side labels, spread, and no fallback rows counted as ready. |
| EG-LV-P0-07 | P0 | Ticket handoff must preserve selected identity from the selected row/line/orderbook action. | Android ticket proof showing matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, visible odds/price, and fake-token/test labeling if applicable. |
| EG-LV-P0-08 | P0 | Non-ready states must not silently fall back to moneyline, first visible row, event-only labels, or mock-ready rows. | Proof assertions and visible labels reject fallback/default reconstruction. |
| EG-LV-P0-09 | P0 | EC/ED/EE/EF regression markers must remain intact but cannot substitute for EG. | Same-build non-regression references or rerun markers for prior selected gates, plus separate EG live-event visible provider proof. |
| EG-LV-P0-10 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. |
| EG-LV-P1-01 | P1 | Repeat the integrated visible provider proof across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. |
| EG-LV-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same live event and interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book, selector, and ticket/gated sheet. |
| EG-LV-P1-03 | P1 | Prove provider refresh changing stale -> refreshing -> ready without losing selected market identity. | Android-visible refresh lifecycle plus backend proof for the same selected identity. |
| EG-LV-P2-01 | P2 | Polish live-page density, chart touch feel, orderbook row styling, and status messaging after P0 identity/status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. |

## Cycle EF-C Snapshot Durability Gate Criteria

The focused EF-C gate in `docs/mobile/audits/cycle-ef-c-snapshot-durability-gate.md` opens PM-GAP-083 for immutable Book-origin selection durability after current metadata drift. Current status is pass for the selected EF integrated proof.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| EF-SD-P0-01 | P0 | Backend proof must create or select a Book-origin fake-token order and fill with complete order-time/fill-time selected snapshot fields before drift. | Backend proof JSON with event, market family/type, market id or selector key, line, period, side/outcome, provider/source, provider market/condition/token identity, amount, order id, fill id, and fake-token/test labels. |
| EF-SD-P0-02 | P0 | Current market, outcome, selector, and provider metadata must change after the order/fill exists. | Backend proof JSON listing drift mutations, including labels/default selector/provider freshness or source-display changes. |
| EF-SD-P0-03 | P0 | Backend Portfolio/history/order routes must still return the original Book identity from order-time/fill-time selected snapshots after drift. | Before/after route proof showing selected fields unchanged and no fallback/default reconstruction. |
| EF-SD-P0-04 | P0 | Android Portfolio and history/activity must render the original selected Book identity after drift. | Android screenshots/XML/proof JSON after drift showing the same Book identity as the pre-drift order/fill snapshot. |
| EF-SD-P0-05 | P0 | Fallback/default reconstruction is not acceptable pass evidence. | Assertions reject moneyline fallback, event-only labels, first-row/default selector identity, stale provider label substitution, missing snapshot fields, and fixture-only display reconstruction. |
| EF-SD-P0-06 | P0 | Fake-token/test labeling must survive drift in backend and Android evidence. | Backend and Android proof showing fake-token/test labels on order, position, and history/activity rows after metadata drift. |
| EF-SD-P0-07 | P0 | Agent A backend evidence and Agent B Android evidence must be integrated by Lead for the same selected identity and same drift scenario. | Lead-integrated bundle pairing backend before/after proof with Android post-drift recapture, including matching order/fill ids or deterministic proof ids. |
| EF-SD-P1-01 | P1 | Repeat metadata-drift durability across multiple real provider-backed line families when available. | Backend and Android before/after drift proof for Spread, Totals, halves, and other provider-backed families. |
| EF-SD-P1-02 | P1 | Add a regression that covers provider refresh replacing stale/ready/freshness labels after order creation. | Route proof and Android recapture after provider refresh state changes. |
| EF-SD-P1-03 | P1 | Recapture official Polymarket history behavior if production account/location gates allow completed order/cancel/fill history. | Fresh official-app reference screenshots/XML paired with Holiwyn comparison. |
| EF-SD-P2-01 | P2 | Historical Portfolio/activity visual treatment should make immutable order identity easy to scan after current metadata changes. | Side-by-side visual review after P0 durability passes. |

## Cycle DQ-C Live Football / World Cup Detail Criteria

The focused DQ-C S23 reference audit adds these criteria from `docs/mobile/audits/live-football-world-cup-dq-c.md`:

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| LD-DQ-C-P0-01 | P0 | Same-cycle S23 Polymarket reference exists for the World Cup game detail and core interactions. | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`; `docs/mobile/harness/cycle-DQ-C-polymarket-reference/` |
| LD-DQ-C-P0-02 | P0 | Holiwyn must preserve full page hierarchy: header actions, Game/Chat, teams/time, chart, chat preview, primary outcomes, grouped markets, rules/lower content. | Android screenshot/XML compared with `pm-dq-c-03-world-cup-game-top.*` and lower-page captures. |
| LD-DQ-C-P0-03 | P0 | Chart interaction must be context-preserving and not static; no visible tooltip is required unless a later unblocked reference shows one. | Chart press proof compared with `pm-dq-c-04-chart-press.*`. |
| LD-DQ-C-P0-04 | P0 | Line markets must update selected team/subject, line, period, Yes/No side, odds, and probabilities as one state. | Line selector proof compared with `pm-dq-c-08-spread-line-dropdown.*`, `pm-dq-c-09-spread-line-25.*`, and `pm-dq-c-16-markets-scroll-2.*`. |
| LD-DQ-C-P0-05 | P0 | Book/depth must render a ladder with bid/ask sides, price, shares, value/total, spread, Yes/No tabs, and market selector. | Book proof compared with `pm-dq-c-12-top-book-action.*` and `pm-dq-c-13-orderbook-market-selector.*`. |
| LD-DQ-C-P0-06 | P0 | Game/Chat, Book, Share, group chevrons, line selectors, period pills, and outcome buttons must be functional or explicitly gated. | Button/action smoke plus reference `pm-dq-c-05-chat-tab.*`, `pm-dq-c-12-top-book-action.*`, and `pm-dq-c-17-share-sheet.*`. |
| LD-DQ-C-P0-07 | P0 | Scroll must retain compact match context and not lose selected market/line state. | Scroll proof compared with `pm-dq-c-07-markets-scroll-1.*` and `pm-dq-c-16-markets-scroll-2.*`. |
| LD-DQ-C-P1-01 | P1 | Ticket amount entry and swipe-like confirmation should be recaptured when the Polymarket location gate is unblocked. | Current DQ-C proof only reaches `pm-dq-c-11-ticket-sheet-settled.*`. |
| LD-DQ-C-P1-02 | P1 | Book market selector should support every visible family/period exposed in reference, including Moneyline and Spreads. | Holiwyn Book selector proof against `pm-dq-c-13-orderbook-market-selector.*`. |
| LD-DQ-C-P2-01 | P2 | Match native motion, density, red/green depth visualization, and chart touch feel after structural parity. | Side-by-side visual QA. |

## Cycle DR-C Line-Market Ticket Target Gate Criteria

The focused DR-C gate in `docs/mobile/audits/cycle-dr-c-line-market-ticket-target-gate.md` converts DQ-C line-selector behavior into pass/fail criteria for Agent B's ticket target work. Integrated Android evidence now exists in `docs/mobile/harness/cycle-DR-C-integrated-line-market-ticket-proof.json`.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| LD-DR-C-P0-01 | P0 | Selected market family must match the tapped family: Spread taps open a Spread ticket, Totals taps open a Totals ticket, and lower-period rows do not fall back to a primary moneyline/fallback target. | Android screenshot/XML for at least one Spread and one Totals ticket opened from the DQ-C-style game detail after selection changes. |
| LD-DR-C-P0-02 | P0 | Selected line must match the user-selected row/selector value. | Before/after selector proof plus ticket XML showing the same selected line in `ticket-selection-line` and selected outcome label. |
| LD-DR-C-P0-03 | P0 | Selected period must carry through from row to ticket, including at least one non-default period. | Row proof and ticket proof both showing the selected period. |
| LD-DR-C-P0-04 | P0 | Selected side/outcome must carry through, including Yes/No or Over/Under/team subject changes caused by line selection. | Ticket XML showing side and outcome in `ticket-contract-outcome-row` and `ticket-selected-outcome-choice`, with screenshot agreement. |
| LD-DR-C-P0-05 | P0 | Odds/probability must come from the selected market/line/period/outcome, not stale row state. | Row odds/probability before tap and ticket odds/probability after tap for Spread and Totals. |
| LD-DR-C-P0-06 | P0 | Ticket target identity must preserve selected market family, line, period, side/outcome, event, provider/source identity where available, and order target through amount entry/ready state. | Clean Android ticket proof after entering amount, plus XML/proof JSON showing the selection fields used by the order payload or service layer. |
| LD-DR-C-P0-07 | P0 | Android visible proof must be clean and DR-C-owned. | Passing smoke/test summary plus committed `docs/mobile/screenshots/cycle-DR-C-*` and `docs/mobile/harness/cycle-DR-C-*` artifacts. |

## Cycle DS-C Orderbook Audit Gate Criteria

The focused DS-C gate in `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md` converts DQ-C Book/orderbook evidence into pass/fail criteria for PM-GAP-075. The DT re-gate in `docs/mobile/audits/cycle-dt-c-orderbook-regate.md` rechecks the same gap using DS integrated evidence. Current status is fail-until-proof after integrated Android proof in `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json`; PM-GAP-075 is not passed yet.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| OB-DS-C-P0-01 | P0 | Book action opens a dedicated orderbook surface and preserves event identity. | Android screenshot/XML after tapping Book from the DS Holiwyn game detail. |
| OB-DS-C-P0-02 | P0 | Yes/No tabs are visible and interactive without losing selected market identity. | Before/after tab proof in XML or proof JSON. |
| OB-DS-C-P0-03 | P0 | Market selector is grouped by family and exposes Moneyline plus Spread choices. | Open selector screenshot/XML comparable to `pm-dq-c-13-orderbook-market-selector.*`. |
| OB-DS-C-P0-04 | P0 | Family, period, line, side/outcome, and selected market identity carry through selector, ladder, and ticket action. | Selector before/after plus ladder/ticket XML or proof JSON. |
| OB-DS-C-P0-05 | P0 | Ladder has Price, Shares, and Value/total columns with multiple rows when depth exists. | Android XML and screenshot comparable to `pm-dq-c-12-top-book-action.*`. |
| OB-DS-C-P0-06 | P0 | Ask and bid sides are visually distinct, with asks above spread and bids below spread. | Screenshot proof of red/green side styling plus row-side metadata. |
| OB-DS-C-P0-07 | P0 | Spread separator is visible and reflects the active ladder. | Android XML/screenshot with spread value. |
| OB-DS-C-P0-08 | P0 | Loading, empty, unavailable, stale, and error states are explicit and not mistaken for ready Polymarket-backed depth. | Ready plus at least one non-ready state proof, or documented unavailable-state reason. |
| OB-DS-C-P0-09 | P0 | Proof is integrated and DS-C-owned. | Committed `cycle-DS-C-*` screenshots/XML/proof JSON plus passing smoke/test summary. |
| OB-DS-C-P1-01 | P1 | Settings expose `Decimalize book` or documented display equivalent. | Settings screenshot/XML and state-preservation proof. |
| OB-DS-C-P1-02 | P1 | Selector coverage extends to every visible family/period when the event exposes them. | Additional selector proof for Totals/halves/team totals when available. |
| OB-DS-C-P1-03 | P1 | Ladder row tap carries price, side, shares/value, and selected market identity into ticket/order. | Row tap ticket/order proof JSON/XML. |
| OB-DS-C-P2-01 | P2 | Phone density, motion, row bars, and red/green styling are close to DQ-C reference. | Side-by-side visual QA after P0 pass. |

## Cycle DU-C Orderbook Final Gate Criteria

The focused DU-C gate in `docs/mobile/audits/cycle-du-c-orderbook-final-gate.md` is the final pre-integration blocker for PM-GAP-075. It reuses DQ-C S23 Polymarket reference evidence and DS/DT Holiwyn progress evidence. No fresh DU-C S23 reference or Holiwyn Android proof was captured by Agent C.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| OB-DU-C-P0-01 | P0 | Provider-backed ready depth must be visible in the Android Book UI, not only returned by backend JSON. | Integrated Android screenshot/XML/proof JSON showing ready provider source/status, event title, selected market identity, Price/Shares/Value rows, bid/ask rows, and spread. |
| OB-DU-C-P0-02 | P0 | Backend ready JSON must be tied to the app-visible market id or selector key in the same run. | Proof JSON showing the visible UI market id/selector key matches backend `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`. |
| OB-DU-C-P0-03 | P0 | Spread selector carry-through must preserve family, period, line, side/outcome, and selected market identity through selector, ladder, and ticket. | Before/after Android selector proof plus ladder/ticket XML or proof JSON with matching Spread family, non-default line, period, side/outcome, market id or selector key, and odds/depth source. |
| OB-DU-C-P0-04 | P0 | Spread period and line fields must not collapse to `none` when claiming Spread/period/line parity. | Proof JSON with non-null/non-`none` line and period fields, or documented unavailability that prevents pass. |
| OB-DU-C-P0-05 | P0 | Settings must expose `Decimalize book` or documented Holiwyn equivalent and preserve selected state. | Settings screenshot/XML plus before/after proof that event, selected market, selected side, line, period, ready depth status, and ticket identity do not reset. |
| OB-DU-C-P0-06 | P0 | Ticket/identity preservation must cover the final integrated provider-ready Spread path. | Ticket XML/proof JSON preserving event, family, period, line, side/outcome, market id/selector key, provider/source identity, and selected row price/side where applicable. |
| OB-DU-C-P0-07 | P0 | DT-passed Yes/No switching and side-labelled ladder behavior must not regress. | Same integrated bundle includes tab switch before/after and ask/bid row-side markers above/below spread. |
| OB-DU-C-P0-08 | P0 | Non-ready states must remain honest and visually distinct from provider-ready depth. | Integrated proof includes a non-ready state or documented skip reason; fallback/idle/unavailable rows cannot be used as ready evidence. |
| OB-DU-C-P0-09 | P0 | Final evidence must be integrated, Android-visible, and committed under DU-owned proof paths. | Passing smoke/test summary plus committed screenshots/XML/proof JSON from the integrated DU build. |

## Cycle FD Route Discovery To Event Detail Criteria

The focused FD gate in `docs/mobile/audits/cycle-fd-route-discovery-detail.md` converts the Local MVP entry-flow steering into pass/fail criteria. This is not a full Polymarket parity claim; it verifies the visible route-backed Home -> Event Detail handoff required before continuing to ticket/order/Portfolio proof.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| FD-DISC-P0-01 | P0 | Home discovery must show a route-backed World Cup event with compact tradeable outcomes from `/api/events?includeMobileMarkets=1`. | Samsung tablet screenshot/XML showing event title, outcome labels, Volume/Liquidity, and route-backed card marker. |
| FD-DISC-P0-02 | P0 | Tapping the route-backed discovery card must open the same event detail, not the older local fixture. | Android proof after tap showing the same event title and explicit absence of Mexico/Ecuador fallback markers. |
| FD-DISC-P0-03 | P0 | Server market-data mode must hydrate the opened detail through `/api/mobile/events/:slug/live-detail`. | Android XML showing detail-only chart/probability and provider markers from the live-detail payload. |
| FD-DISC-P0-04 | P0 | The opened detail must expose the local MVP retail surface: chart/probability, Game Lines, and tradeable outcomes. | Screenshot/XML with `event-detail-price-chart`, `Game Lines`, provider-backed outcome labels, and provider source marker. |
| FD-DISC-P0-05 | P0 | Default orderbook UI must remain hidden for the Local MVP retail path. | Android assertions reject top/inline/open orderbook markers in Home and opened detail evidence. |
| FD-DISC-P1-01 | P1 | Production active Polymarket World Cup event breadth should replace disposable proof events. | Future provider mapping proof for active production events. |
| FD-DISC-P1-02 | P1 | The same Home-opened event should continue through Buy/Sell ticket, fake-token order, and Portfolio/history. | Future Android proof for the full retail path from discovery entry. |

## Cycle FE Home Route Event Ticket Criteria

The focused FE gate in `docs/mobile/audits/cycle-fe-home-route-ticket.md` verifies the next Local MVP visible step after FD: a Home-opened route-backed event can reach the simple ticket with selected identity preserved.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| FE-TICKET-P0-01 | P0 | Home must show a route-backed World Cup event card with compact outcomes. | Samsung tablet screenshot/XML with route-backed event title, outcome labels, and event-card marker. |
| FE-TICKET-P0-02 | P0 | Tapping the Home card must open the same route-backed Event Detail. | Android screenshot/XML after tap showing same event title, chart/probability marker, and Game Lines. |
| FE-TICKET-P0-03 | P0 | Event Detail must expose a route-backed Spread row using backend line-market identity. | Android XML with `ticket-source-backend-line-market`, `selection-market-family-spread`, `selection-line-1.5`, `selection-period-Reg. Time`, and provider source. |
| FE-TICKET-P0-04 | P0 | Tapping the Spread outcome must open the simple ticket. | Android screenshot/XML with `trade-ticket`. |
| FE-TICKET-P0-05 | P0 | Ticket must preserve selected market type, line, period, side, provider source, and provider token. | Ticket XML with `ticket-market-type-spread`, `ticket-line-1.5`, `ticket-period-Reg. Time`, `ticket-selection-side-yes`, `provider-source-polymarket`, and provider token. |
| FE-TICKET-P0-06 | P0 | Default orderbook UI must remain hidden for this retail path. | Android assertions reject orderbook markers in Home, Detail, line, and ticket evidence. |
| FE-TICKET-P1-01 | P1 | Submit the Home-opened ticket as a fake-token order and prove Portfolio/history. | Future Android proof continuing from the Home-opened event. |
| FE-TICKET-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Future provider mapping and Android proof against active production events. |

## Cycle FF Home Route Ticket Submit Criteria

The focused FF gate in `docs/mobile/audits/cycle-ff-home-route-order.md` verifies the Local MVP retail journey from Home-opened route-backed event through fake-token order and Portfolio/history.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| FF-ORDER-P0-01 | P0 | Home must show a route-backed World Cup event card with compact outcomes. | Samsung tablet screenshot/XML with route-backed event title, outcome labels, and event-card marker. |
| FF-ORDER-P0-02 | P0 | Tapping the Home card must open the same route-backed Event Detail. | Android screenshot/XML after tap showing same event title, chart/probability marker, and Game Lines. |
| FF-ORDER-P0-03 | P0 | Event Detail must expose a route-backed Spread row using backend line-market identity. | Android XML with `ticket-source-backend-line-market`, `selection-market-family-spread`, `selection-line-1.5`, `selection-period-Reg. Time`, and provider source. |
| FF-ORDER-P0-04 | P0 | Spread ticket must open with selected market type, line, period, side, provider source, and provider token. | Ticket XML with selected identity markers. |
| FF-ORDER-P0-05 | P0 | Amount presets must create a `$25` ready state with `Swipe up to buy`. | Ticket-ready screenshot/XML with amount and submit marker. |
| FF-ORDER-P0-06 | P0 | Submit must create a fake-token order and transition to Portfolio. | Portfolio screenshot/XML with order placed. |
| FF-ORDER-P0-07 | P0 | Portfolio latest order, latest activity, and position/history must preserve order-time selected identity. | Portfolio XML with `latest-order-card`, `latest-activity-card`, `position-card-`, and provider/line/period markers. |
| FF-ORDER-P0-08 | P0 | Default orderbook UI must remain hidden for this retail path. | Android assertions reject orderbook markers across evidence. |
| FF-ORDER-P1-01 | P1 | Repeat this exact Home-opened flow in server order mode. | Future Android proof using `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`. |
| FF-ORDER-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Future provider mapping and Android proof against active production events. |

## Cycle FG Home Route Server Order Criteria

The focused FG gate in `docs/mobile/audits/cycle-fg-home-route-server-order.md` verifies the Local MVP retail journey from Home-opened route-backed event through server fake-token order and server Portfolio open order.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| FG-ORDER-P0-01 | P0 | Home must show the freshly seeded route-backed World Cup event card with compact outcomes. | Samsung tablet screenshot/XML with route-backed event title, outcome labels, and event-card marker. |
| FG-ORDER-P0-02 | P0 | Tapping the Home card must open the same route-backed Event Detail. | Android screenshot/XML after tap showing same event title, chart/probability marker, and Game Lines. |
| FG-ORDER-P0-03 | P0 | Event Detail must expose a route-backed Spread row using backend line-market identity. | Android XML with `ticket-source-backend-line-market`, `selection-market-family-spread`, `selection-line-1.5`, `selection-period-Reg. Time`, and provider source. |
| FG-ORDER-P0-04 | P0 | Spread ticket must open with selected market type, line, period, side, provider source, and provider token. | Ticket XML with selected identity markers. |
| FG-ORDER-P0-05 | P0 | Amount presets must create a `$25` ready state with `Swipe up to buy`. | Ticket-ready screenshot/XML with amount and submit marker. |
| FG-ORDER-P0-06 | P0 | Submit must post a server fake-token order through `/api/orders`. | Proof JSON plus Portfolio screenshot/XML after submit. |
| FG-ORDER-P0-07 | P0 | Server Portfolio sync must show latest order/open order preserving selected identity. | Portfolio XML with `latest-order-card`, `portfolio-open-order-count`, `open-order-row-`, and provider/line/period markers. |
| FG-ORDER-P0-08 | P0 | Default orderbook UI must remain hidden for this retail path. | Android assertions reject orderbook markers across evidence. |
| FG-ORDER-P1-01 | P1 | Prove filled/cancel lifecycle from the exact Home-opened path. | Future Android proof continuing from Home through lifecycle action and Portfolio/history. |
| FG-ORDER-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Future provider mapping and Android proof against active production events. |

## Cycle FH Home Route Server Cancel Criteria

The focused FH gate in `docs/mobile/audits/cycle-fh-home-route-server-cancel.md` verifies the Local MVP retail lifecycle from Home-opened route-backed event through server fake-token order cancel and server Portfolio canceled activity/history.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| FH-CANCEL-P0-01 | P0 | Home must show the freshly seeded route-backed World Cup event card with compact outcomes. | Samsung tablet screenshot/XML with route-backed event title, outcome labels, and event-card marker. |
| FH-CANCEL-P0-02 | P0 | Tapping the Home card must open the same route-backed Event Detail. | Android screenshot/XML after tap showing same event title, chart/probability marker, and Game Lines. |
| FH-CANCEL-P0-03 | P0 | Event Detail must expose a route-backed Spread row using backend line-market identity. | Android XML with `ticket-source-backend-line-market`, `selection-market-family-spread`, `selection-line-1.5`, `selection-period-Reg. Time`, and provider source. |
| FH-CANCEL-P0-04 | P0 | Spread ticket must open with selected market type, line, period, side, provider source, and provider token. | Ticket XML with selected identity markers. |
| FH-CANCEL-P0-05 | P0 | Amount presets must create a `$25` ready state with `Swipe up to buy`. | Ticket-ready screenshot/XML with amount and submit marker. |
| FH-CANCEL-P0-06 | P0 | Submit must post a server fake-token order through `/api/orders`. | Proof JSON plus Portfolio screenshot/XML after submit. |
| FH-CANCEL-P0-07 | P0 | Server Portfolio sync must show latest order/open order and a visible Cancel action. | Portfolio XML with `latest-order-card`, `portfolio-open-order-count`, `open-order-row-`, and `cancel-open-order-`. |
| FH-CANCEL-P0-08 | P0 | Cancel must call the server cancel path and refresh Portfolio/history to canceled activity. | Canceled Portfolio XML with `latest-activity-card`, `activity-canceled`, and `status-canceled`. |
| FH-CANCEL-P0-09 | P0 | Canceled activity must preserve selected line, period, provider source, and provider token. | Canceled Portfolio XML with provider/line/period markers. |
| FH-CANCEL-P0-10 | P0 | Default orderbook UI must remain hidden for this retail path. | Android assertions reject orderbook markers across evidence. |
| FH-CANCEL-P1-01 | P1 | Prove filled lifecycle from the exact Home-opened path. | Future Android proof continuing from Home through fill and Portfolio/history. |
| FH-CANCEL-P1-02 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Future provider mapping and Android proof against active production events. |

## Cycle FI Home Route Server Filled Criteria

The focused FI gate in `docs/mobile/audits/cycle-fi-home-route-server-filled.md` verifies the Local MVP retail lifecycle from Home-opened route-backed event through server fake-token filled order and server Portfolio position/activity/history.

| ID | Priority | Criterion | Required proof |
| --- | --- | --- | --- |
| FI-FILLED-P0-01 | P0 | Home must show the freshly seeded route-backed World Cup event card with compact outcomes. | Samsung tablet screenshot/XML with route-backed event title, outcome labels, and event-card marker. |
| FI-FILLED-P0-02 | P0 | Tapping the Home card must open the same route-backed Event Detail. | Android screenshot/XML after tap showing same event title, chart/probability marker, and Game Lines. |
| FI-FILLED-P0-03 | P0 | Event Detail must expose a route-backed Spread row using backend line-market identity. | Android XML with `ticket-source-backend-line-market`, `selection-market-family-spread`, `selection-line-1.5`, `selection-period-Reg. Time`, and provider source. |
| FI-FILLED-P0-04 | P0 | Counterparty proof must seed a resting SELL order for the same spread market/outcome. | Counterparty JSON with same event slug, spread market id, outcome id, SELL side, price, and size. |
| FI-FILLED-P0-05 | P0 | Spread ticket must open with selected market type, line, period, side, provider source, and provider token. | Ticket XML with selected identity markers. |
| FI-FILLED-P0-06 | P0 | Amount presets must create a `$25` ready state with `Swipe up to buy`. | Ticket-ready screenshot/XML with amount and submit marker. |
| FI-FILLED-P0-07 | P0 | Submit must post a server fake-token order through `/api/orders` and fill against seeded liquidity. | Proof JSON plus Portfolio screenshot/XML after submit. |
| FI-FILLED-P0-08 | P0 | Server Portfolio sync must show filled order, position, and latest activity. | Portfolio XML with `latest-order-card`, `latest-activity-card`, `position-card-`, and `status-filled`. |
| FI-FILLED-P0-09 | P0 | Filled position/activity must preserve selected line, period, provider source, and provider token. | Portfolio XML with provider/line/period markers. |
| FI-FILLED-P0-10 | P0 | Default orderbook UI must remain hidden for this retail path. | Android assertions reject orderbook markers across evidence. |
| FI-FILLED-P1-01 | P1 | Replace disposable proof event with production active Polymarket-backed event breadth. | Future provider mapping and Android proof against active production events. |
