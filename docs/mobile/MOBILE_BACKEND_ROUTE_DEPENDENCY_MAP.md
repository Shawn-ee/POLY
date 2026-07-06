# Mobile Backend Route Dependency Map

Purpose: document what the mobile app needs from backend routes, auth, request/response contracts, database models, and mock fallbacks for each feature cycle.

## Cycle NU - Event Detail Profile Rules Contract

Cycle NU hardens Event Detail backend-owned profile rules before visible state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NU-event-detail-profile-rules-contract/cycle-NU-event-detail-profile-rules-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_profile_rules_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail backend-owned profile rules | `/api/mobile/events/:slug/live-detail` through Event Detail hydration | GET | Public/mobile route | Event slug | Event `marketProfile`, `resultMode`, `gameRules.allowDraw`, `gameRules.includesOvertime`; regulation profiles must be draw-capable and overtime-free, while advance/overtime profiles must be no-draw and include overtime/advancement semantics | `Event`, listed public `Market`, `Outcome`, backend market-rule/profile derivation | Local/mock Event Detail remains unchanged. Route-backed Event Detail rejects contradictory event-level profile rules before visible market state applies. | None for focused Event Detail profile rules contract. P2 optional event-rule-specific error copy. |

## Cycle NT - Event Detail Profile Outcome Contract

Cycle NT hardens Event Detail primary profile market outcome structure before visible markets apply:

- Route/mobile proof: `docs/mobile/harness/cycle-NT-event-detail-profile-outcome-contract/cycle-NT-event-detail-profile-outcome-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_profile_outcome_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail primary profile outcome structure | `/api/mobile/events/:slug/live-detail` through Event Detail hydration | GET | Public/mobile route | Event slug | Market `marketType`, outcomes and outcome `side`; `regulation_90` requires a draw outcome, while `to_advance` and `full_match_with_overtime` reject draw outcomes and require two team outcomes | `Event`, listed public `Market`, `Outcome`, backend market-rule/profile derivation | Local/mock Event Detail remains unchanged. Route-backed Event Detail rejects profile markets whose outcome structure contradicts backend game rules. | None for focused Event Detail profile outcome contract. P2 optional disabled-row copy. |

## Cycle NS - Event List Pagination Contract

Cycle NS hardens Home/Search/Live/Futures event-list pagination metadata before visible page state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NS-event-list-pagination-contract/cycle-NS-event-list-pagination-contract.json`.
- Proof script: `scripts/prove_mobile_event_list_pagination_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventListRouteShapeService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live/Futures pagination metadata | `/api/events` through event-list loaders | GET | Public/mobile route, optional user context | Cursor/status/search/filter params depending on surface | `page.limit`, `page.nextCursor`, `page.hasMore`, top-level `nextCursor`; visible pagination requires positive integer limit and a cursor when `hasMore=true` | `Event`, listed public `Market`, `Outcome`, event-list pagination projection | Mock/local event lists remain unchanged. Server-mode impossible pagination metadata rejects before visible page state applies. | None for focused event-list pagination contract. P2 optional pagination retry/error copy. |

## Cycle NR - Portfolio Position Shares Contract

Cycle NR hardens Portfolio position share quantities before visible position state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NR-portfolio-position-shares-contract/cycle-NR-portfolio-position-shares-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_position_shares_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio visible position shares | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | `positions[].shares`; visible position rows require positive shares, while empty `positions: []` remains valid | `Position`, `Market`, `Outcome`, portfolio snapshot projection | Mock/local Portfolio remains unchanged. Server-mode zero-share or negative-share position rows reject before visible Portfolio state applies. | None for focused Portfolio position shares contract. P2 optional zero-position row copy. |

## Cycle NQ - Portfolio Open-Order Side Contract

Cycle NQ hardens Portfolio open-order side fields before visible Orders state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NQ-portfolio-open-order-side-contract/cycle-NQ-portfolio-open-order-side-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_open_order_side_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Orders side mapping | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | `openOrders[].side`; visible Orders rows require `BUY` or `SELL` before mapping to buy/sell rows | `Order`, `Market`, `Outcome`, open-order projection | Mock/local Portfolio remains unchanged. Server-mode unknown or missing open-order side values reject before visible Orders state applies. | None for focused Portfolio open-order side contract. P2 optional side-specific error copy. |

## Cycle NP - Portfolio Resolved-History Status Contract

Cycle NP hardens Portfolio History resolved-market status before visible closed activity state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NP-portfolio-resolved-history-status-contract/cycle-NP-portfolio-resolved-history-status-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_resolved_history_status_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio closed history activity status | `/api/portfolio/history` through `PolyApi.getPortfolioHistory()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | `history[].market.status`; visible closed activity requires terminal `RESOLVED`, `CLOSED`, `SETTLED`, or `FINAL` status | `Market`, `Outcome`, settlement/history projection | Mock/local history remains unchanged. Server-mode live/open history rows reject before visible closed History state applies. | None for focused Portfolio resolved-history status contract. P2 optional terminal-status-specific error copy. |

## Cycle NO - Portfolio History Side Contract

Cycle NO hardens Portfolio History side fields before visible activity state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NO-portfolio-history-side-contract/cycle-NO-portfolio-history-side-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_history_side_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History activity side mapping | `/api/portfolio/history` through `PolyApi.getPortfolioHistory()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | `recentTrades[].side` and `canceledOrders[].side`; visible activity requires `BUY` or `SELL` before mapping to opened/sold/canceled rows | `Trade`, `Order`, `Market`, `Outcome`, portfolio history projection | Mock/local history remains unchanged. Server-mode unknown side values reject before visible History state applies. | None for focused Portfolio History side contract. P2 optional side-specific error copy. |

## Cycle NN - Portfolio Canceled-Order History Contract

Cycle NN hardens Portfolio History canceled-order rows before visible activity state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NN-portfolio-canceled-order-history-contract/cycle-NN-portfolio-canceled-order-history-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_canceled_order_history_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio canceled-order history activity | `/api/portfolio/history` through `PolyApi.getPortfolioHistory()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | `canceledOrders[].status`, `size`, `remaining`, `price`, side, market/outcome, selection; visible canceled activity requires `CANCELED` status and `remaining <= size` | `Order`, `Market`, `Outcome`, order history projection | Mock/local history remains unchanged. Server-mode non-canceled or impossible canceled rows reject before visible History state applies. | None for focused Portfolio canceled-order history contract. P2 optional malformed-row copy. |

## Cycle NM - Portfolio Open-Order Status Contract

Cycle NM hardens Portfolio server-mode open-order rows before visible Orders state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NM-portfolio-open-order-status-contract/cycle-NM-portfolio-open-order-status-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_open_order_status_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio visible open-order status | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | `openOrders[].status`, `remaining`, `size`, `price`; visible open orders require active status and positive remaining shares | `Order`, `Market`, `Outcome`, open-order projection | Mock/local Portfolio remains unchanged. Server-mode terminal or zero-remaining rows reject before visible Orders state applies. | None for focused Portfolio open-order status contract. P2 optional stale-row copy. |

## Cycle NL - Position Re-Trade Availability Contract

Cycle NL hardens Portfolio position Buy/Sell re-trade targets so backend Portfolio market availability remains authoritative:

- Route/mobile proof: `docs/mobile/harness/cycle-NL-position-retrade-availability-contract/cycle-NL-position-retrade-availability-contract.json`.
- Proof script: `scripts/prove_mobile_position_retrade_availability_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionTradeTargetService.test.ts`, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position Buy/Sell re-trade availability | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | Position market id/outcome id plus `position.market.availability`; Portfolio availability overrides locally loaded market availability before Trade Ticket submit guard | `Position`, `Market`, provider/internal market status projection | Mock/local Portfolio remains unchanged. Server-mode Portfolio position availability blocks re-trade tickets even when local market fixtures look ready. | None for focused position re-trade availability contract. P2 optional Portfolio row copy. |

## Cycle NK - Cashout Status Contract

Cycle NK hardens Portfolio server-mode cashout confirmation status before treating a full-position close as accepted:

- Route/mobile proof: `docs/mobile/harness/cycle-NK-cashout-status-contract/cycle-NK-cashout-status-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_status_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio server-mode cashout status confirmation | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Market id, outcome id, side `SELL`, bounded current price, and full visible position shares | Returned order id, optional status, size, remaining, and fills; explicit failed terminal statuses reject before treating cashout as accepted | `Order`, `Position`, matching/reservation service | Mock/local cashout remains unchanged. Server-mode legacy id-only confirmations remain accepted; explicit failed statuses block success state. | None for focused cashout status contract. P2 optional rejected-cashout copy. |

## Cycle NJ - Order Submit Status Contract

Cycle NJ hardens Trade Ticket server-mode order submit confirmation before visible submitted-order state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NJ-order-submit-status-contract/cycle-NJ-order-submit-status-contract.json`.
- Proof script: `scripts/prove_mobile_order_submit_status_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket server-mode submit status confirmation | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Market id, outcome id, side, contract side, validated price, derived size, and selection identity | Returned order id plus optional status; explicit failed terminal statuses are rejected before visible submitted-order state applies | `Order`, matching/reservation service, status projection | Mock/local order submit remains unchanged. Server-mode legacy id-only confirmations remain accepted; explicit failed statuses block success state. | None for focused order submit status contract. P2 optional rejected-status copy. |

## Cycle NI - Event Detail Period Market Support Contract

Cycle NI hardens route-backed Event Detail first-half and second-half winner market availability before rendering visible period rows:

- Route/mobile proof: `docs/mobile/harness/cycle-NI-event-detail-period-market-support-contract/cycle-NI-event-detail-period-market-support-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_period_market_support_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail route-backed first-half/second-half winner availability | `/api/mobile/events/:slug/live-detail` through Event Detail hydration | GET | Public/mobile route | Event slug | `event.supportedMarketTypes`, period winner market type, period, outcomes; route-backed period winner rows require declared first-half/second-half support and matching backend market | `Event`, listed public `Market`, `Outcome`, backend market-rule/profile derivation | Local/mock Event Detail still allows fallback period winner rows. Route-backed Event Detail rejects undeclared period winner markets and does not render period rows without matching backend support. | None for focused Event Detail period market support contract. P2 optional disabled-row explanation copy. |

## Cycle NH - Event Detail Supported Line Family Contract

Cycle NH hardens route-backed Event Detail Game Lines market-family availability before rendering visible line groups:

- Route/mobile proof: `docs/mobile/harness/cycle-NH-event-detail-supported-line-family-contract/cycle-NH-event-detail-supported-line-family-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_supported_line_family_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`, `mobile/src/__tests__/eventDetailLineAvailabilityService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail route-backed Game Lines family availability | `/api/mobile/events/:slug/live-detail` through Event Detail hydration | GET | Public/mobile route | Event slug | `event.supportedMarketTypes`, line market family/type, period, line, outcomes; route-backed Game Lines require a declared supported family and a matching backend market | `Event`, listed public `Market`, `Outcome`, backend market-rule/profile derivation | Local/mock Event Detail still allows fallback line fixtures. Route-backed Event Detail rejects undeclared line families and does not render line groups without matching backend support. | None for focused Event Detail supported line-family contract. P2 optional disabled-row explanation copy. |

## Cycle NG - Event Detail Line Ticket Route-Backed Contract

Cycle NG hardens route-backed Event Detail Game Lines ticket identity before opening Trade Ticket:

- Route/mobile proof: `docs/mobile/harness/cycle-NG-event-detail-line-ticket-route-backed-contract/cycle-NG-event-detail-line-ticket-route-backed-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_line_ticket_route_backed_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailLineTicketService.test.ts`, `mobile/src/__tests__/eventDetailLineAvailabilityService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail route-backed Game Lines ticket identity | `/api/mobile/events/:slug/live-detail` through Event Detail hydration | GET | Public/mobile route | Event slug | Line market id, outcome id, market family/type, period, line, provider ids, condition/token ids; route-backed tickets require matching backend market/outcome identity | `Event`, listed public `Market`, `Outcome`, provider selection metadata | Local/mock Event Detail still allows deterministic line fixtures. Route-backed Event Detail no longer uses synthetic ticket identity when backend identity is missing or mismatched. | None for focused Event Detail route-backed line ticket identity. P2 optional disabled-row copy. |

## Cycle NF - Account Profile Link Consistency Contract

Cycle NF hardens Account profile linked identity metadata before visible Account profile state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NF-account-profile-link-consistency-contract/cycle-NF-account-profile-link-consistency-contract.json`.
- Proof script: `scripts/prove_mobile_account_profile_link_consistency_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/accountProfileService.test.ts`, `mobile/src/__tests__/accountBootstrapService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account profile linked identity consistency | `/api/account/profile` through `PolyApi.getAccountProfile()` | GET | Canonical API key/session with account read access | None beyond authenticated request | `hasWalletLinked` must agree with `walletAddress`; `hasGoogleLinked` must agree with `email`; display identity fields remain required | `User`, linked auth provider records, wallet/account identity metadata | Mock/local Account remains unchanged. Server-mode contradictory linked metadata rejects before visible Account profile state applies. | None for focused Account profile link consistency contract. P2 optional linked-state error copy. |

## Cycle NE - Profile Preferences Numeric Defaults Contract

Cycle NE hardens profile preference numeric defaults before visible Account settings state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NE-profile-preferences-numeric-defaults-contract/cycle-NE-profile-preferences-numeric-defaults-contract.json`.
- Proof script: `scripts/prove_mobile_profile_preferences_numeric_defaults_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/profilePreferencesService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account settings profile preference defaults | `/api/profile/preferences` through `PolyApi.getProfilePreferences()` and `PolyApi.saveProfilePreferences()` | GET/PUT | Canonical API key/session with profile read/write access | Locale, ticket default amount, side, slippage, saved event ids | `ticketDefaultAmount` must be a positive numeric string; `ticketDefaultSlippage` must be a percent string from `0%` to `100%`; missing legacy slippage defaults to `1%` | User profile preferences store | Mock/local preferences remain unchanged. Server-mode malformed numeric defaults reject before visible Account settings state applies. | None for focused Profile preferences numeric defaults contract. P2 optional Account settings-specific malformed preference copy. |

## Cycle ND - Account Navigation Consistency Contract

Cycle ND hardens Account navigation metadata before visible Account menu state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-ND-account-navigation-consistency-contract/cycle-ND-account-navigation-consistency-contract.json`.
- Proof script: `scripts/prove_mobile_account_navigation_consistency_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/accountNavigationService.test.ts`, `mobile/src/__tests__/accountBootstrapService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account menu navigation consistency | `/api/account/navigation` through `PolyApi.getAccountNavigation()` | GET | Canonical API key/session with account read access | None beyond authenticated request | Item `kind`, `enabled`, `status`, `destination`, and reason; available items must be enabled with a destination, placeholders must be disabled/unavailable/destinationless | Account navigation metadata service, user feature flag/permission state | Mock/local Account remains unchanged. Server-mode contradictory navigation metadata rejects before visible Account menu state applies. | None for focused Account navigation consistency contract. P2 optional item-specific error copy. |

## Cycle NC - Selection Limit Price Bounds Contract

Cycle NC hardens selected-market snapshot `limitPrice` fields before visible Portfolio, History, or submitted-order state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NC-selection-limit-price-bounds-contract/cycle-NC-selection-limit-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_selection_limit_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSelectionService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/portfolioHistoryService.test.ts`, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected-market snapshot limit price bounds | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` through shared selection parsing | POST/GET | Canonical API key/session with order write or portfolio read access | Existing order submit request; no new fields | Selection `limitPrice` must be a contract price from `0` to `1`; `limitShares` remains a non-negative share size and may exceed `1` | `Order`, `Position`, `Trade`, selected-market snapshot metadata | Legacy rows without selection remain allowed. Server-mode above-one `limitPrice` rejects before visible submitted-order, Portfolio, or History state applies. | None for focused selection limit price bounds contract. P2 optional selection-specific malformed price copy. |

## Cycle NB - Order Submit Price Bounds Contract

Cycle NB hardens Trade Ticket order submit price derivation before `/api/orders` is called:

- Route/mobile proof: `docs/mobile/harness/cycle-NB-order-submit-price-bounds-contract/cycle-NB-order-submit-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_order_submit_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket submit price bounds | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Market id, outcome id, side, contract side, validated price, derived size, and selection identity | Computed contract probability must be finite and within `1` to `100` cents before `price` and `size` are sent | `Order`, `Market`, `Outcome`, matching/reservation service | Mock order mode uses the same validated contract probability. Server-mode invalid prices reject before route call. | None for focused order submit price bounds contract. P2 optional Trade Ticket-specific invalid-price copy. |

## Cycle NA - Portfolio Open-Order Price Bounds Contract

Cycle NA hardens Portfolio open-order price fields before visible Orders and cancel activity state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-NA-portfolio-open-order-price-bounds-contract/cycle-NA-portfolio-open-order-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_open_order_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/openOrderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order price bounds | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | Open-order `price` must be a contract price from `0` to `1`; `size` and `remaining` remain non-negative share counts and `remaining <= size` | `Order`, `Market`, `Outcome`, selected-market snapshot metadata | Mock/local Portfolio remains unchanged. Server-mode invalid open-order prices reject before visible Orders rows or cancel activity state applies. | None for focused Portfolio open-order price bounds contract. P2 optional Portfolio Orders-specific malformed price copy. |

## Cycle MZ - Portfolio History Price Bounds Contract

Cycle MZ hardens Portfolio history/activity price fields before visible History state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MZ-portfolio-history-price-bounds-contract/cycle-MZ-portfolio-history-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_history_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio history activity price bounds | `/api/portfolio/history` through `PolyApi.getPortfolioHistory()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | Canceled order `price` and recent trade execution price derived from `cost / shares`; both must be contract prices from `0` to `1` | `Order`, `Trade`, `Market`, `Outcome`, settlement/history read models | Mock/local Portfolio history remains unchanged. Server-mode invalid history activity prices reject before visible History state applies. | None for focused Portfolio history price bounds contract. P2 optional Portfolio History-specific malformed price copy. |

## Cycle MY - Portfolio Position Price Bounds Contract

Cycle MY hardens Portfolio position price fields before visible Portfolio rows and cashout state apply:

- Route/mobile proof: `docs/mobile/harness/cycle-MY-portfolio-position-price-bounds-contract/cycle-MY-portfolio-position-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_position_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position price bounds | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | Position `avgCost`, `currentPrice`, `bestBid`, and `bestAsk` must be contract prices from `0` to `1`; `bestBidSize` and `bestAskSize` remain non-negative depth values and may exceed `1` | `Position`, `Market`, `Outcome`, provider quote/depth projection | Mock/local Portfolio remains unchanged. Server-mode invalid position prices reject before visible Portfolio rows or cashout state apply. | None for focused Portfolio position price bounds contract. P2 optional Portfolio-specific malformed price copy. |

## Cycle MX - Portfolio Value History Total Contract

Cycle MX hardens Portfolio value-history point totals before visible chart state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MX-portfolio-value-history-total-contract/cycle-MX-portfolio-value-history-total-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_value_history_total_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioValueHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio value-history chart total consistency | `/api/portfolio/value-history?range=<range>` through `PolyApi.getPortfolioValueHistory()` | GET | Canonical API key/session with portfolio read access | Selected range | Point `value`, `cash`, `positionsValue`, and `pnl`; `value` must equal `cash + positionsValue` within currency tolerance; `pnl` may be negative | Wallet balance snapshots, position valuation snapshots, portfolio history projection | Mock/local Portfolio remains unchanged. Server-mode inconsistent point totals reject before visible chart state applies. | None for focused Portfolio value-history total contract. P2 optional total mismatch copy. |

## Cycle MW - Quote Price Bounds Contract

Cycle MW hardens quote route price fields before visible ticket/card odds apply:

- Route/mobile proof: `docs/mobile/harness/cycle-MW-quote-price-bounds-contract/cycle-MW-quote-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_quote_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/quoteService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket/card quote refresh price bounds | `/api/markets/:id/quote` through `PolyApi.getMarketQuote()` | GET | Public/mobile route | Market id and optional outcome id | Quote `bestBid`, `bestAsk`, `midPrice`, and `lastPrice` must be contract prices from `0` to `1`; `bestBidSize` and `bestAskSize` remain non-negative depth values and may exceed `1` | `Market`, `Outcome`, provider quote/depth projection | Direct local quote conversion remains tolerant. Server-mode route loading rejects impossible quote prices and bulk refresh marks malformed markets failed. | None for focused quote price bounds contract. P2 optional quote-specific retry/error copy. |

## Cycle MV - Market Chart Price Bounds Contract

Cycle MV hardens chart route history prices before visible Event Detail/Futures chart state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MV-market-chart-price-bounds-contract/cycle-MV-market-chart-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_market_chart_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/marketChartRouteShapeService.test.ts`, `mobile/src/__tests__/marketChartService.test.ts`, `mobile/src/__tests__/futuresChartService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail/Futures chart history price bounds | `/api/markets/:id/chart?range=<range>` through `PolyApi.getMarketChart()` | GET | Public/mobile route | Market id and selected chart range | `history[].price` must be a contract price from `0` to `1`; `history[].probability` remains `0` to `100`; requested market/range identity must match | `Market`, outcome price history, provider/CLOB chart projection | Mock/local chart fallback remains unchanged. Server-mode impossible chart prices reject before visible chart state applies. | None for focused chart price bounds contract. P2 optional field-specific chart price error copy. |

## Cycle MU - Portfolio Open Order Lifecycle Contract

Cycle MU hardens server-mode Portfolio open-order lifecycle quantities before visible Orders state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MU-portfolio-open-order-lifecycle-contract/cycle-MU-portfolio-open-order-lifecycle-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_open_order_lifecycle_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order lifecycle quantities | `/api/portfolio` through `PolyApi.getPortfolio()` | GET | Canonical API key/session with portfolio read access | None beyond authenticated request | Open-order `price`, `size`, and `remaining`; `remaining` must be less than or equal to `size`; visible `orderValue`, `remainingShares`, and `originalShares` reuse validated values | `Order`, `Market`, `Outcome`, selected-market snapshot metadata | Mock/local Portfolio remains unchanged. Server-mode impossible open-order lifecycle quantities reject before visible Orders state applies. | None for focused Portfolio open-order lifecycle contract. P2 optional field-specific lifecycle error copy. |

## Cycle MT - Order Lifecycle Consistency Contract

Cycle MT hardens server-mode Trade Ticket order lifecycle totals before visible submitted-order state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MT-order-lifecycle-consistency-contract/cycle-MT-order-lifecycle-consistency-contract.json`.
- Proof script: `scripts/prove_mobile_order_lifecycle_consistency_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket submit lifecycle confirmation | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Buy/sell order with market id, outcome id, contract side, limit price, size, and selected market identity | Nested or top-level order `size` and `remaining`; returned `fills[].size`; lifecycle numbers must be non-negative, `remaining <= size`, fill total <= `size`, and fill total plus remaining <= `size` when returned | `Order`, `Fill`, `Position`, matching/reservation service | Mock/local order submit remains unchanged. Server-mode impossible lifecycle totals reject before visible submitted-order state applies. | None for focused order lifecycle consistency contract. P2 optional richer inline lifecycle error copy. |

## Cycle MS - Event List Quote Price Bounds Contract

Cycle MS hardens compact event-list quote prices before Home, Search, Live, and Futures card state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MS-event-list-quote-price-bounds-contract/cycle-MS-event-list-quote-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_event_list_quote_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventListRouteShapeService.test.ts`, `mobile/src/__tests__/liveEventFeedService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live/Futures compact event quote bounds | `/api/events?includeMobileMarkets=1`; `/api/events?statusGroup=live&includeMobileMarkets=1` | GET | Public/mobile route | Query filters, cursor, limit, optional saved ids/status/sort | Outcome `price`, `bestBid`, and `bestAsk` must be probability values from `0` to `1`; `bestBidSize` and `bestAskSize` remain non-negative depth values and may exceed `1` | `Event`, listed public `Market`, compact mobile market projection, quote/depth provider rows | Mock/local card data remains unchanged. Server-mode impossible quote prices reject before card normalization or visible card rendering. | None for focused event-list quote bounds contract. P2 optional field-specific quote error copy. |

## Cycle MR - Cashout Fill Plus Remaining Contract

Cycle MR hardens server-mode cashout lifecycle totals before Portfolio refresh treats a close as accepted:

- Route/mobile proof: `docs/mobile/harness/cycle-MR-cashout-fill-remaining-contract/cycle-MR-cashout-fill-remaining-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_fill_remaining_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout fill/remaining lifecycle | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Sell order with market id, outcome id, side `SELL`, bounded current price, and full visible `position.shares` size | Nested or top-level order `size` and `remaining`; returned `fills[].size`; when all are returned, fill total plus remaining must be less than or equal to order `size` | `Order`, `Fill`, `Position`, matching/reservation service | Mock/local cashout remains unchanged. Server-mode impossible lifecycle totals reject before Portfolio refresh treats cashout as accepted. | None for focused cashout fill plus remaining contract. P2 optional richer lifecycle mismatch copy. |

## Cycle MQ - Event Detail Quote Price Bounds Contract

Cycle MQ hardens route-backed Event Detail quote prices before game-page market rows apply:

- Route/mobile proof: `docs/mobile/harness/cycle-MQ-event-detail-quote-price-bounds-contract/cycle-MQ-event-detail-quote-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_quote_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail outcome quote bounds | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Outcome `price`, `bestBid`, and `bestAsk` must be probability values from `0` to `1`; `bestBidSize` and `bestAskSize` remain non-negative depth values and may exceed `1` | `Event`, listed public `Market`, quote projection, provider depth/quote rows | Mock/local detail remains unchanged. Server-mode impossible quote prices reject before frontend normalization or game-page market rendering. | None for focused Event Detail quote bounds contract. P2 optional field-specific quote error copy. |

## Cycle MP - Cashout Fill Size Contract

Cycle MP hardens server-mode cashout fill lifecycle confirmation before Portfolio refresh treats a close as accepted:

- Route/mobile proof: `docs/mobile/harness/cycle-MP-cashout-fill-size-contract/cycle-MP-cashout-fill-size-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_fill_size_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout fill lifecycle | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Sell order with market id, outcome id, side `SELL`, bounded current price, and full visible `position.shares` size | Nested or top-level order `size`; returned `fills[].size` values must sum to less than or equal to order `size` when `size` is returned | `Order`, `Fill`, `Position`, matching/reservation service | Mock/local cashout remains unchanged. Server-mode impossible fill lifecycle rejects before Portfolio refresh treats cashout as accepted. | None for focused cashout fill size contract. P2 optional richer fill mismatch copy. |

## Cycle MO - Cashout Remaining Size Contract

Cycle MO hardens server-mode cashout order lifecycle confirmation before Portfolio refresh treats a close as accepted:

- Route/mobile proof: `docs/mobile/harness/cycle-MO-cashout-remaining-size-contract/cycle-MO-cashout-remaining-size-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_remaining_size_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout remaining lifecycle | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Sell order with market id, outcome id, side `SELL`, bounded current price, and full visible `position.shares` size | Nested or top-level `size` and `remaining`; when both are returned, `remaining` must be less than or equal to `size` | `Order`, `Position`, matching/reservation service | Mock/local cashout remains unchanged. Server-mode impossible remaining lifecycle rejects before Portfolio refresh treats cashout as accepted. | None for focused cashout remaining size contract. P2 optional richer lifecycle mismatch copy. |

## Cycle MN - Event Detail Required Rules Contract

Cycle MN requires backend-owned Event Detail game-rule fields before route-backed game page state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MN-event-detail-required-rules-contract/cycle-MN-event-detail-required-rules-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_required_rules_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail required game-rule metadata | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Required `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes`; values remain subject to Cycle MJ consistency checks | `Event`, listed public `Market`, backend market-rule/profile derivation | Mock/local detail remains unchanged. Server-mode missing rule fields reject before frontend market selection can infer game structure. | None for focused Event Detail required rules contract. P2 optional missing-rule-field error copy. |

## Cycle MM - Cashout Price Bounds Contract

Cycle MM bounds server-mode cashout current price to the binary contract price range before submit:

- Route/mobile proof: `docs/mobile/harness/cycle-MM-cashout-price-bounds-contract/cycle-MM-cashout-price-bounds-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_price_bounds_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseService.test.ts`, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout current price bounds | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Sell order with market id, outcome id, side `SELL`, finite positive `position.currentPrice <= 1`, and full visible `position.shares` size | Confirmation handled by Cycle MK; submit is blocked before route call when current price is missing, zero, negative, or above one | `Position`, `Market`, current quote/price projection, `Order` | Mock/local cashout remains unchanged. Server-mode invalid current price blocks cashout instead of submitting impossible limit price. | None for focused cashout price bounds contract. P2 optional richer invalid-price copy. |

## Cycle ML - Cashout Current Price Contract

Cycle ML requires server-mode cashout to use a current market price instead of falling back to entry probability:

- Route/mobile proof: `docs/mobile/harness/cycle-ML-cashout-current-price-contract/cycle-ML-cashout-current-price-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_current_price_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseService.test.ts`, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout sell-all current price | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Sell order with market id, outcome id, side `SELL`, finite positive `position.currentPrice`, and full visible `position.shares` size | Confirmation handled by Cycle MK; submit is blocked before route call when current price is missing or invalid | `Position`, `Market`, current quote/price projection, `Order` | Mock/local cashout remains unchanged. Server-mode missing or zero current price blocks cashout instead of using entry probability. | None for focused cashout current price contract. P2 optional richer unavailable-price copy. |

## Cycle MK - Cashout Confirmation Size Contract

Cycle MK hardens server-mode cashout sell-all confirmations before Portfolio refresh treats a close as accepted:

- Route/mobile proof: `docs/mobile/harness/cycle-MK-cashout-confirmation-size-contract/cycle-MK-cashout-confirmation-size-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_confirmation_size_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout sell-all confirmation | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Sell order with market id, outcome id, side `SELL`, current close price, and full visible `position.shares` size | Nested `order.id` or top-level `id`; optional `order.size`/top-level `size` must match the requested sell-all full-position size when present | `Order`, `Position`, matching/reservation service | Mock/local cashout remains unchanged. Server-mode mismatched confirmation size rejects before Portfolio refresh treats cashout as accepted. | None for focused cashout confirmation size contract. P2 optional richer mismatch copy. |

## Cycle MJ - Event Detail Rule Consistency Contract

Cycle MJ hardens backend-owned Event Detail game-rule metadata before route-backed game page state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MJ-event-detail-rule-consistency-contract/cycle-MJ-event-detail-rule-consistency-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_rule_consistency_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail game-rule selection metadata | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `resultMode` must agree with `gameRules.allowDraw`; `marketProfile` must be present in `supportedMarketTypes` when both fields are supplied | `Event`, listed public `Market`, backend market-rule/profile derivation | Mock/local detail remains unchanged. Server-mode contradictory rule fields reject before frontend primary/regulation market selection applies. | None for focused Event Detail rule consistency contract. P2 optional rule-specific error copy. |

## Cycle MI - Event Detail Market Count Contract

Cycle MI hardens Event Detail market-count metadata before route-backed game page state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MI-event-detail-market-count-contract/cycle-MI-event-detail-market-count-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_market_count_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail market-count metadata | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Event `marketCount` and `activeMarketCount` must be finite non-negative integers, and `activeMarketCount` must not exceed `marketCount` | `Event`, listed public `Market`, active market projection fields | Mock/local detail remains unchanged. Server-mode malformed count fields reject before impossible visible Event Detail market metadata applies. | None for focused Event Detail market count contract. P2 optional count-specific error copy. |

## Cycle MH - Event Detail Score Contract

Cycle MH hardens Event Detail visible score fields before route-backed game page state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MH-event-detail-score-contract/cycle-MH-event-detail-score-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_score_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail visible score | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Event `homeScore` and `awayScore` must be finite non-negative numbers when present; null/omitted scores remain allowed for pre-match or unknown score state | `Event`, live score/provider projection fields | Mock/local detail remains unchanged. Server-mode negative score fields reject before impossible visible Event Detail score state applies. | None for focused Event Detail score contract. P2 optional score-specific error copy. |

## Cycle MG - Event List Non-Negative Quote Contract

Cycle MG hardens event-list quote/depth fields before Home, Search, Live, or Futures visible card state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MG-event-list-nonnegative-quote-contract/cycle-MG-event-list-nonnegative-quote-contract.json`.
- Proof script: `scripts/prove_mobile_event_list_nonnegative_quote_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventListRouteShapeService.test.ts`, `mobile/src/__tests__/liveEventFeedService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live/Futures event-list quote fields | `/api/events?includeMobileMarkets=1` and filtered variants | GET | Public/mobile route | Query filters such as status group, saved ids, sort, market type, cursor | Outcome `price`, `bestBid`, `bestAsk`, `bestBidSize`, and `bestAskSize` must be finite non-negative number-like values when present | `Event`, listed public `Market`, active `Outcome`, quote/depth projection fields | Mock/local discovery remains unchanged. Server-mode negative or malformed quote/depth fields reject before frontend probability fallback or visible card state applies. | None for focused event-list non-negative quote contract. P2 optional surface-specific quote error copy. |

## Cycle MF - Portfolio History Economics Contract

Cycle MF hardens visible Portfolio history/activity economics before server-mode activity state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MF-portfolio-history-economics-contract/cycle-MF-portfolio-history-economics-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_history_economics_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio recent trades, canceled orders, and resolved activity | `/api/portfolio/history` | GET | Canonical API key/session with `account:read` | None | Resolved `winningsTokens`, `refundsTokens`, `netInvestedTokens`; recent trade `shares`, `cost`; canceled order `remaining`, `price` must be finite non-negative values; realized P/L may be negative | `Trade`, `Fill`, `Order`, `Market`, `Outcome`, history aggregation service | Mock/local Portfolio activity remains unchanged. Server-mode malformed negative activity economics reject before visible Portfolio activity applies. | None for focused Portfolio history economics contract. P2 optional field-specific Portfolio history error copy. |

## Cycle ME - Portfolio Snapshot Economics Contract

Cycle ME hardens visible Portfolio snapshot economics before server-mode Portfolio state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-ME-portfolio-snapshot-economics-contract/cycle-ME-portfolio-snapshot-economics-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_snapshot_economics_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio snapshot wallet, positions, and open orders | `/api/portfolio` | GET | Canonical API key/session with `account:read` | None | `walletAvailableUSDC`, position cost basis, average cost, shares, current price, current value, open-order price, size, and remaining must be finite non-negative values; position `pnlTokens` may be negative | `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | Mock/local Portfolio remains unchanged. Server-mode malformed negative economics reject before visible Portfolio state applies. | None for focused Portfolio snapshot economics contract. P2 optional field-specific Portfolio snapshot error copy. |

## Cycle MD - Account Balance Shape Contract

Cycle MD hardens visible Account balance data before server-mode account state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MD-account-balance-shape-contract/cycle-MD-account-balance-shape-contract.json`.
- Proof script: `scripts/prove_mobile_account_balance_shape_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/accountBalanceService.test.ts`, `mobile/src/__tests__/accountBootstrapService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account visible wallet balance | `/api/account/balance` | GET | Canonical API key/session with `account:read` | None | `availableUSDC`, `lockedUSDC`, and `totalUSDC` as finite non-negative number-like values; `totalUSDC` must match `availableUSDC + lockedUSDC`; `updatedAt` must be string, null, or omitted | `UserBalance`, custody balance helper, canonical auth/API usage | Mock/local Account balance remains unchanged. Server-mode malformed balances reject and feed existing Account bootstrap error state. | None for focused Account balance shape contract. P2 optional field-specific Account balance error copy. |

## Cycle MC - Order Selection Echo Contract

Cycle MC hardens Trade Ticket order submit selection echoes before visible submitted-order state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MC-order-selection-echo-contract/cycle-MC-order-selection-echo-contract.json`.
- Proof script: `scripts/prove_mobile_order_selection_echo_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSelectionService.test.ts`, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket order submit selection echo | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | Order body with selected market/outcome, side, contract side, price, size, and `selection` snapshot | Nested `order.id` or top-level `id`; optional `order.selection`/top-level `selection` must have valid selected-market identity when present; line-market submits still require an echo that matches critical selected fields | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, selection snapshot serializers | Mock order mode remains local. Server-mode id-only legacy confirmations remain accepted, but malformed selection echoes reject before visible order state applies. | None for focused order selection echo contract. P2 optional route-specific Trade Ticket error copy. |

## Cycle MB - Portfolio Selection Identity Contract

Cycle MB hardens Portfolio selection identity so visible positions, open orders, recent trades, and canceled order rows cannot silently downgrade malformed backend market data:

- Route/mobile proof: `docs/mobile/harness/cycle-MB-portfolio-selection-identity-contract/cycle-MB-portfolio-selection-identity-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_selection_identity_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSelectionService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/portfolioHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio selected market identity | `/api/portfolio` and `/api/portfolio/history` | GET + GET | Canonical API key/session with `account:read` | None | Optional `selection` objects on positions, open orders, recent trades, and canceled orders. When present, `displayLabel` must be non-empty, `marketType` must be one of `spread`, `totals`, `team-total`, `winner`, `prop`, `future`, or `live`, optional text identity fields must be strings, `contractSide` must be `yes`/`no`, `limitSide` must be `bid`/`ask`, and optional limit numbers must be finite non-negative values. | `Position`, `Order`, `Trade`, `Fill`, market/outcome selection snapshot fields | Mock/local Portfolio remains unchanged. Server-mode malformed selection payloads reject before visible Portfolio state/activity applies. Legacy rows with no selection object remain renderable. | None for focused selection identity contract. P2 optional route-specific Portfolio selection error copy. |

## Cycle MA - Portfolio Value History Route Shape Contract

Cycle MA hardens Portfolio value-history data before visible chart state applies:

- Route/mobile proof: `docs/mobile/harness/cycle-MA-portfolio-value-history-route-shape-contract/cycle-MA-portfolio-value-history-route-shape-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_value_history_route_shape_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioValueHistoryService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio value chart history | `/api/portfolio/value-history?range=<range>` | GET | Canonical API key/session with `account:read` | Range query (`1D`, `1W`, `1M`, `All`) | `range` must match requested range; `ranges[]`, `source`, `status`, `generatedAt`, nullable `lastUpdated`, `emptyState`, and `points[]`; point `value`, `cash`, and `positionsValue` must be non-negative, while `pnl` may be negative | `Position`, `UserBalance`, market price snapshots/value-history route service | Mock/local Portfolio remains unchanged. Server-mode malformed value-history payloads reject before visible chart state applies. | None for focused value-history route-shape contract. P2 optional route-specific retry/error copy. |

## Cycle LZ - Account Navigation Enabled Contract

Cycle LZ hardens Account navigation enabled-state fields so malformed backend booleans cannot silently enable or disable visible Account menu actions:

- Route/mobile proof: `docs/mobile/harness/cycle-LZ-account-navigation-enabled-contract/cycle-LZ-account-navigation-enabled-contract.json`.
- Proof script: `scripts/prove_mobile_account_navigation_enabled_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/accountNavigationService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account navigation enabled state | `/api/account/navigation` | GET | Canonical API key/session with `account:read` | None | `source`, `generatedAt`, `items[]`, `items[].id`, `label`, `icon`, `kind`, `status`, `destination`, `reason`, and `enabled`; enabled must be a real boolean | Account navigation/menu config service, canonical auth/API usage | Mock mode keeps local placeholder menu. Server-mode malformed enabled values reject and feed existing Account bootstrap error state. | None for focused enabled response-shape contract. P2 optional field-specific error copy. |

## Cycle LY - Account Profile Boolean Contract

Cycle LY hardens Account profile linked-state fields so malformed backend booleans cannot silently change visible Account state:

- Route/mobile proof: `docs/mobile/harness/cycle-LY-account-profile-boolean-contract/cycle-LY-account-profile-boolean-contract.json`.
- Proof script: `scripts/prove_mobile_account_profile_boolean_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/accountProfileService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account profile linked states | `/api/account/profile` | GET | Canonical API key/session with `account:read` | None | `id`, `username`, `displayName`, optional text fields, `hasWalletLinked`, `hasGoogleLinked`; linked fields must be real booleans | `User`, wallet/account link models, canonical auth/API usage | Mock mode keeps local demo state. Server-mode malformed linked booleans reject and feed existing Account bootstrap error state. | None for focused boolean response-shape contract. P2 optional field-specific error copy. |

## Cycle LX - Cashout Submit Confirmation Contract

Cycle LX hardens server-mode cashout so `/api/orders` must confirm the sell-all close order before visible Portfolio refresh treats cashout as accepted:

- Route/mobile proof: `docs/mobile/harness/cycle-LX-cashout-submit-confirmation-contract/cycle-LX-cashout-submit-confirmation-contract.json`.
- Proof script: `scripts/prove_mobile_cashout_submit_confirmation_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/positionCloseRouteShapeService.test.ts`, `mobile/src/__tests__/positionCloseService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cashout / close position submit confirmation | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Canonical API key/session with `orders:write` | SELL limit order with full held `position.shares`, market id, outcome id, and current close price | Nested `order.id` or top-level `id` must be present; optional `size`, `remaining`, and `fills[].size` must be finite non-negative numbers when provided | `Order`, `Position`, `Market`, `Outcome`, matching/reservation service | Mock mode remains local. Server-mode zero/missing-share cashout is blocked before API; malformed submit confirmations reject before Portfolio refresh. | None for the focused cashout submit confirmation contract. P2 optional richer submit error copy. |

## Cycle LW - Cancel Route Shape Contract

Cycle LW hardens the visible Portfolio cancel flow so server-mode cancel is confirmed only by the exact backend route shape the UI needs:

- Route/mobile proof: `docs/mobile/harness/cycle-LW-cancel-route-shape-contract/cycle-LW-cancel-route-shape-contract.json`.
- Proof script: `scripts/prove_mobile_cancel_route_shape_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/cancelOrderRouteShapeService.test.ts`, `mobile/src/__tests__/openOrderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order cancel confirmation | `/api/orders/:id` through `PolyApi.cancelOrder()` | DELETE | Canonical API key/session with `orders:write` | None | `order.id` must match the visible open order id; `order.status` must be `CANCELED`; malformed, wrong-order, or non-canceled responses reject before visible cancel confirm | `Order`, order ownership/session auth, canonical cancel route | Mock mode remains optimistic. Server mode still waits for route confirmation and then refreshes Portfolio/history. | None for the focused cancel route-shape contract. P2 optional cancel-race copy/action. |

## Cycle LV - Event Detail Route Shape Contract

Cycle LV hardens Event Detail hydration so visible game rules and market rows cannot be applied from malformed backend detail payloads:

- Route/mobile proof: `docs/mobile/harness/cycle-LV-event-detail-route-shape-contract/cycle-LV-event-detail-route-shape-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_route_shape_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailRouteShapeService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail backend game rules and market rows | `/api/mobile/events/:slug/live-detail`, falling back to `/api/events/:slug` through `PolyApi.getEvent()` | GET | Public/mobile route | Backend event slug | `event.id`, `event.slug`, `event.title`, `event.status`, `event.liveStatus`, `event.startTime`, `event.marketProfile`, `event.resultMode`, `event.gameRules`, `event.supportedMarketTypes`, `markets[]`, `marketType`, `period`, `line`, `outcomes[]`, outcome labels/sides/tradability/quote fields | `Event`, listed public `Market`, active `Outcome`, compact live-detail route serializers | Local/offline fixtures remain unchanged. Server-mode detail routes must validate before hydration; malformed payloads reject instead of applying guessed or partial Event Detail state. | None for the focused route-shape contract. P2 optional route-specific retry/error copy. |

## Cycle LE - Portfolio Partial Sync Contract

Cycle LE tightens visible Portfolio sync status for the two backend routes that feed the Portfolio screen:

- Route/mobile proof: `docs/mobile/harness/cycle-LE-portfolio-partial-sync-contract/cycle-LE-portfolio-partial-sync-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_partial_sync_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/portfolioSyncService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio snapshot/history combined sync state | `/api/portfolio` and `/api/portfolio/history` | GET + GET | Canonical API key/session with `account:read` | None | Snapshot balance/positions/open orders and history activities; mobile now reports visible `syncStatus=error` unless both routes succeed, while preserving successful partial data | `UserBalance`, `Position`, `Order`, `Trade`, `Fill`, `ApiOrderRequest`, `Market`, `Outcome` | Mock/local Portfolio state remains unchanged. Server-mode partial failures no longer show full synced status or invent missing data. | P1: more granular UI copy for snapshot-vs-history partial failures if product wants separate banners. |

## Cycle LD - Account Preferences Response Contract

Cycle LD hardens the mobile response-shape contract for visible Account preferences that feed language, saved markets, and Trade Ticket defaults:

- Route/mobile proof: `docs/mobile/harness/cycle-LD-account-preferences-response-contract/cycle-LD-account-preferences-response-contract.json`.
- Proof script: `scripts/prove_mobile_account_preferences_response_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/profilePreferencesService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account preferences response normalization | `/api/profile/preferences` | GET | Canonical API key/session with `account:read` | None | `preferences.locale`, `ticketDefaultAmount`, `ticketDefaultSide`, `ticketDefaultSlippage`, `savedEventIds`; mobile validates locale, side, amount, and saved ids before applying visible state | `UserProfilePreference`, `User`, canonical auth/API usage | Mock/local mode still uses AsyncStorage. Server-mode malformed preference payloads now fail clearly instead of partially applying bad visible state. | None for focused response-shape validation. |
| Account preferences save echo and persisted reload | `/api/profile/preferences` | PUT then GET | Canonical API key/session with `account:write` for PUT and `account:read` for GET | Same preferences envelope including slippage and saved event ids | Saved route echo and persisted GET normalize to the same mobile state used by Account saved count, Home/Search saved filters, language, and Trade Ticket defaults | `UserProfilePreference.preferences` JSONB row keyed by user | Local fallback remains when server preference sync is unavailable. Missing slippage remains a deliberate legacy compatibility default of `1%`. | P1: richer retry/conflict UI if account preference save fails mid-session. |

## Cycle LC - Trade Ticket Availability Submit Contract

Cycle LC makes backend-provided market availability part of the Trade Ticket submit contract, not only a visual disabled state:

- Route/mobile proof: `docs/mobile/harness/cycle-LC-trade-ticket-availability-submit-contract/cycle-LC-trade-ticket-availability-submit-contract.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_availability_submit_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/orderService.test.ts`, root typecheck, mobile typecheck, and audit gate.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket submit availability guard | `/api/mobile/events/:slug/live-detail` or `/api/events?includeMobileMarkets=1` for market availability, then `/api/orders` only when orderable | GET then POST | Public/mobile event route; canonical API key/session with `orders:write` for submit | Canonical order body only after availability passes | Compact market `availability.status`, `availability.reason`, `marketStatus`; mobile blocks `suspended`/`unavailable` before `POST /api/orders`, while `ready`/`stale`/`delayed` keep existing submit path | Listed public `Market`, provider quote/depth lifecycle fields, canonical `Order` only for orderable submits | Mock mode remains unchanged. Legacy markets without availability continue to use the existing mock/server behavior; route-backed blocked statuses do not call `/api/orders`. | None for the focused Trade Ticket availability submit contract. Backend `/api/orders` still remains the final safety layer. |

## Cycle KZ - Event Detail Market Availability Contract

Cycle KZ prevents route-backed Event Detail from inventing unsupported Game Lines families:

- Route/mobile proof: `docs/mobile/harness/cycle-KZ-event-detail-market-availability-contract/cycle-KZ-event-detail-market-availability-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_market_availability_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, `mobile/src/__tests__/worldCupAdapter.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines availability gating | `/api/mobile/events/:slug/live-detail` through `PolyApi.getEvent()` | GET | Public/mobile route | Backend event slug | Route-backed event `backendSlug`, compact `markets[]`, backend market families/types/period/line; mobile renders Spread/Totals/Team Total/Halves only when a matching backend market exists | Listed public `Market` rows, `Market.marketType`, `Market.period`, `Market.line`, active `Outcome.side` | Local/offline fixtures without `backendSlug` keep deterministic synthetic line rows. Server-mode route-backed events do not show unsupported synthetic families. | None for the focused Event Detail market availability contract. |

## Cycle KY - Event Detail Mixed Profile Contract

Cycle KY wires and proves the mixed knockout profile where the primary buttons are advance/no-draw while Game Lines still renders a backend-provided regulation 90-minute Home/Tie/Away market:

- Route/mobile proof: `docs/mobile/harness/cycle-KY-event-detail-mixed-profile-contract/cycle-KY-event-detail-mixed-profile-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_mixed_profile_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, `mobile/src/__tests__/worldCupAdapter.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mixed knockout Event Detail primary/Game Lines split | `/api/mobile/events/:slug/live-detail` through `PolyApi.getEvent()` | GET | Public/mobile route | Backend event slug | `event.marketProfile=full_match_with_overtime`, `event.resultMode=can_draw`, `event.supportedMarketTypes` includes `to_advance` and `regulation_90`; mobile selects `to_advance` for primary outcome buttons and a draw-capable regulation market for Game Lines | `Event.slug`, listed public `Market.marketType=to_advance`, listed public `Market.marketType=moneyline`/`period=regulation`, active `Outcome.side` | Local fixtures remain non-server fallback. Server-mode route-backed mixed events use backend market availability and do not reuse the advance market as a fake Game Lines regulation row. | None for the focused mixed-profile Event Detail contract. |

## Cycle KX - Event Detail Advance Profile Contract

Cycle KX proves the same Event Detail hydration path used in Cycle KW also carries backend-owned one-team-advances/no-draw rules:

- Route/mobile proof: `docs/mobile/harness/cycle-KX-event-detail-advance-contract/cycle-KX-event-detail-advance-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_advance_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, `mobile/src/__tests__/worldCupAdapter.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail advance/no-draw profile | `/api/mobile/events/:slug/live-detail` through `PolyApi.getEvent()` | GET | Public/mobile route | Backend event slug | `event.marketProfile=to_advance`, `event.resultMode=no_draw`, `event.gameRules.allowDraw=false`, `event.gameRules.includesOvertime=true`, `event.supportedMarketTypes[]`, compact advance `markets[]`, two non-draw outcomes | `Event.slug`, `Market.marketType=to_advance`, listed public `Market`, active `Outcome.side` | Local fixtures remain only non-server fallback. Server-mode route-backed advance events use backend rule fields and do not invent a draw outcome. | None for the focused advance/no-draw Event Detail contract. |

## Cycle KW - Event Detail Hydration Key Contract

Cycle KW makes Home/Live/Search card-open Event Detail hydration explicitly use the backend event slug required by `/api/mobile/events/:slug/live-detail`:

- Route/mobile proof: `docs/mobile/harness/cycle-KW-event-detail-hydration-contract/cycle-KW-event-detail-hydration-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_hydration_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventDetailHydrationService.test.ts`, `mobile/src/__tests__/worldCupAdapter.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail hydration from discovery card | `/api/mobile/events/:slug/live-detail` through `PolyApi.getEvent()` | GET | Public/mobile route | Backend event slug | Summary `events[].slug` is preserved as mobile `event.backendSlug`; detail response fields include `event.marketProfile`, `event.resultMode`, `event.gameRules`, `event.supportedMarketTypes`, compact `markets[]`, and outcome `side` including draw where provided | `Event.slug`, `Event.status`, listed public `Market`, active `Outcome`; live-detail route is slug-addressed | Local fixtures fall back to `event.id` when no backend slug exists. Server-mode route-backed events use `backendSlug` for hydration. | None for the focused Event Detail hydration key/rules contract. |

## Cycle KV - Live Tab Pagination Contract

Cycle KV wires the visible Live tab load-more affordance to backend cursor pagination in server mode:

- Route/mobile proof: `docs/mobile/harness/cycle-KV-live-tab-pagination-contract/cycle-KV-live-tab-pagination-contract.json`.
- Proof script: `scripts/prove_mobile_live_tab_pagination_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/liveEventFeedService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live tab load more | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&statusGroup=live&cursor=<eventId>` | GET | Public/mobile route | None | `events[]`, compact `events[].markets[]`, `nextCursor`/`page.nextCursor`; mobile appends unique returned events and hides load-more when cursor is absent | `Event.status`, `Event.liveStatus`, listed public `Market`, active `Outcome`, event cursor ordering by `updatedAt`, `createdAt`, and `id` | Mock/offline mode keeps local fixture filtering with no paginated route calls. Server mode uses backend cursor state. | None for the focused Live tab pagination contract. |

## Cycle KU - Live Tab Feed Contract

Cycle KU wires the visible Live tab to the backend live-event route in server mode instead of borrowing the current Home feed and filtering it on-device:

- Route/mobile proof: `docs/mobile/harness/cycle-KU-live-tab-feed-contract/cycle-KU-live-tab-feed-contract.json`.
- Proof script: `scripts/prove_mobile_live_tab_feed_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/liveEventFeedService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live tab event feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&statusGroup=live` | GET | Public/mobile route | None | `events[]`, `events[].status`, `events[].liveStatus`, compact `events[].markets[]`, `nextCursor`/`page.nextCursor`; server order mode then refreshes market quotes for returned market ids | `Event.status`, `Event.liveStatus`, listed public `Market`, active `Outcome`, orderbook quote/depth helpers when server quotes are enabled | Mock/offline mode keeps local live fixture filtering. Server mode requests the backend live feed directly and does not depend on Home's current loaded page. | None for the focused Live tab feed contract. |

## Cycle KT - Home Event Metrics Contract

Cycle KT removes frontend-invented Home game-card volume/liquidity metrics:

- Route/mobile proof: `docs/mobile/harness/cycle-KT-home-event-metrics-contract/cycle-KT-home-event-metrics-contract.json`.
- Proof script: `scripts/prove_mobile_home_event_metrics_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/eventCardMetricsService.test.ts`, `mobile/src/__tests__/futuresMetricsService.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home game-card visible volume/liquidity metrics | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public/mobile route | None | `events[].metrics.source`, `volume24h`, `liquidity`; unavailable values remain `null`/`--` instead of local-count-derived | `Event`, listed public `Market`, active `Outcome`, orderbook quote/depth helpers when available | Mock/offline cards render unknown metrics when route metrics are absent. Home no longer derives visible game-card metrics from local market/outcome counts. | P1: provider-sourced 24h volume/open-interest when those become product requirements. |

## Cycle KS - Home Futures Metrics Contract

Cycle KS removes frontend-invented futures volume/liquidity metrics from the visible Home futures module:

- Route/mobile proof: `docs/mobile/harness/cycle-KS-home-futures-metrics-contract/cycle-KS-home-futures-metrics-contract.json`.
- Proof script: `scripts/prove_mobile_home_futures_metrics_contract.ts`.
- Focused validation: route/mobile proof, `mobile/src/__tests__/futuresMetricsService.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home futures visible volume/liquidity metrics | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&marketType=future` | GET | Public/mobile route | None | compact `events[].markets[].liquidity`; unavailable futures `volume` remains `null`/`--` instead of probability-derived | `Event`, listed public `Market`, active `Outcome`, orderbook quote/depth helpers when available | Mock/offline mode still has local futures rows, but shared metric rendering does not synthesize futures volume from outcome count/probability. | P1: provider-sourced futures volume/open-interest fields when those become part of the backend contract. |

## Cycle KR - Home Futures Chart Contract

Cycle KR wires the visible Home futures chart/range controls to backend market chart history in server mode:

- Route/mobile proof: `docs/mobile/harness/cycle-KR-home-futures-chart-contract/cycle-KR-home-futures-chart-contract.json`.
- Proof script: `scripts/prove_mobile_home_futures_chart_contract.ts`.
- Focused validation: route proof, `src/__tests__/public.market-chart.no-leak.test.ts`, `mobile/src/__tests__/futuresChartService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home futures chart/range state | `/api/markets/:marketId/chart?range=1H|1D|1W|1M|MAX` | GET | Public market visibility guard, optional user context | None | `marketId`, `source`, `range`, `ranges`, `lastUpdated`, `emptyState`, `history[].outcomeId`, `timestamp`, `probability` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, public market visibility guard | Mock/offline mode keeps local deterministic chart lines. Server mode loads chart history for current futures market ids and marks `chart-status`, `chart-source`, `chart-range`, and point count on the visible futures chart. | P1: provider-backed futures volume/open-interest metrics beyond price history. |

## Cycle KQ - Home Futures Contract

Cycle KQ wires the visible Home futures module to backend-filtered futures markets in server mode:

- Route/mobile proof: `docs/mobile/harness/cycle-KQ-home-futures-contract/cycle-KQ-home-futures-contract.json`.
- Proof script: `scripts/prove_mobile_home_futures_contract.ts`.
- Focused validation: route proof, `src/__tests__/public.events.no-leak.test.ts`, `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/worldCupAdapter.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home futures discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&marketType=future` | GET | Public/mobile route | None | `events[]`, compact `events[].markets[]`, `marketType`, `outcomes[].id`, `label`, `price`, `probability`, `providerTokenId`, `externalMarketId`, liquidity/price fields used by the futures card/list adapter | `Event`, listed public `Market` with `marketType=future` or `outright`, active `Outcome`, quote/depth helpers when available | Mock mode keeps local `worldCupFutures`. Server mode requests backend futures and replaces the module when the route returns usable futures; fixture fallback remains isolated for offline/demo mode. | P1: fuller production futures catalog breadth and provider-backed futures chart/history metrics. |

## Cycle KP - Portfolio Value History Contract

Cycle KP wires the visible Portfolio value-history state to the backend route in server mode without redesigning Portfolio:

- Route/mobile proof: `docs/mobile/harness/cycle-KP-portfolio-value-history-contract/cycle-KP-portfolio-value-history-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_value_history_contract.ts`.
- Focused validation: route proof, `src/__tests__/portfolio.value-history.route.test.ts`, `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/portfolioValueHistoryService.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio value-history state | `/api/portfolio/value-history?range=1D` | GET | Canonical API key/session with `account:read` | None | `source`, `status`, `range`, `ranges`, `lastUpdated`, `emptyState`, `points[].timestamp`, `value`, `cash`, `positionsValue`, `pnl` | `UserBalance`, `Position`, `MarketOutcomeSnapshot`, canonical auth | Mock mode keeps the existing local Portfolio state. Server mode loads the route and exposes a compact backend-source marker in Portfolio. | P1: richer Portfolio value chart/range controls when visual redesign is allowed. |

## Cycle KO - Search Sort Contract

Cycle KO wires the visible Search `Popular` and `Live first` controls to backend route sorting instead of sorting only the current client page:

- Route/mobile proof: `docs/mobile/harness/cycle-KO-search-sort-contract/cycle-KO-search-sort-contract.json`.
- Proof script: `scripts/prove_mobile_search_sort_contract.ts`.
- Focused validation: route proof, `src/__tests__/public.events.no-leak.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search Popular sort | `/api/events?search=...&includeMobileMarkets=1&sortBy=popular` | GET | Public/mobile route | None | Backend-sorted `events[]`, `nextCursor`, `page.sortBy=popular`, `events[].metrics.marketCount`, `activeMarketCount`, `liquidity` | `Event`, listed public `Market`, active `Outcome`; mobile route metrics from compact market read models | Mock mode keeps local sort over local fixtures. Server mode sends `sortBy=popular` and preserves route order. | P1: provider-backed 24h volume/open-interest ranking when a real popularity source is added. |
| Search Live first sort | `/api/events?search=...&includeMobileMarkets=1&sortBy=live` | GET | Public/mobile route | None | Backend-sorted `events[]`, `nextCursor`, `page.sortBy=live`, `status`, `liveStatus`, metrics tiebreaks | `Event.status`, `Event.liveStatus`, listed public `Market`, active `Outcome` | Mock mode keeps local live-first sort. Server mode sends `sortBy=live` and does not reorder route results on-device. | P1: richer event-state ranking if provider live state becomes more granular. |

## Cycle KN - Search Metrics Contract

Cycle KN removes frontend-invented Search row volume/liquidity/chat metrics and makes visible Search event rows consume an explicit backend event metrics contract:

- Route/mobile proof: `docs/mobile/harness/cycle-KN-search-metrics-contract/cycle-KN-search-metrics-contract.json`.
- Proof script: `scripts/prove_mobile_search_metrics_contract.ts`.
- Focused validation: route proof, `src/__tests__/public.events.no-leak.test.ts`, `mobile/src/__tests__/worldCupAdapter.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search event row metrics | `/api/events?search=...&includeMobileMarkets=1` | GET | Public/mobile route | None | `events[].metrics.source`, `marketCount`, `activeMarketCount`, `liquidity`, `volume24h`, `commentCount`, plus compact `events[].markets[]` | `Event`, listed public `Market`, active `Outcome`, orderbook quote/depth helper for real liquidity when present | Mock mode may aggregate embedded market liquidity; server mode consumes route-owned `metrics` and shows unknown volume/comments as `--`/absent rather than generating fake values | P1: real backend 24h volume and comment/activity counts if those become product requirements. |

## Cycle KM - Account Navigation Contract

Cycle KM wires visible Account menu rows to backend-owned metadata so unsupported destinations are disabled instead of pretending to be functional mobile buttons:

- Route/mobile proof: `docs/mobile/harness/cycle-KM-account-navigation-contract/cycle-KM-account-navigation-contract.json`.
- Proof script: `scripts/prove_mobile_account_navigation_contract.ts`.
- Focused validation: route proof, `mobile/src/__tests__/accountNavigationService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account visible menu rows | `/api/account/navigation` | GET | Canonical API key/session with `account:read` | None | `source`, `generatedAt`, `items[].id`, `label`, `icon`, `kind`, `enabled`, `status`, `destination`, `reason` | Canonical auth, API usage/rate-limit; no product tables required because rows are server-authored MVP placeholders | Mock/standalone mode keeps the same disabled local fallback rows. Server mode replaces them with backend route rows when sync succeeds. | P1: real destinations/actions for enabled Account menu entries when those products are intentionally in scope. |

## Cycle KL - Search Saved Filter

Cycle KL wires the visible Search Saved filter to backend event ids instead of filtering only the current client page:

- Route/mobile proof: `docs/mobile/harness/cycle-KL-search-saved-filter/cycle-KL-search-saved-filter.json`.
- Proof script: `scripts/prove_mobile_search_saved_filter.ts`.
- Focused validation: route proof, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search Saved filter | `/api/events?search=...&eventIds=...&includeMobileMarkets=1` | GET | Public/mobile route; saved ids are sourced from profile preferences in server mode when available | None | `events[]`, `events[].markets[]`, `nextCursor`, `page.nextCursor`; route applies text search and selected saved event ids before pagination | `Event.id`, searchable `Event`/`Market`/`Outcome` fields, listed public `Market`, `Outcome`; profile preferences still own saved ids | Mock mode keeps local Search saved filtering. Server mode sends saved ids to backend; empty Saved is handled in app as empty state. | P1: first-class saved/followed market route if saved state moves beyond profile preferences. |

## Cycle KK - Home Saved Filter

Cycle KK wires visible Home Saved filtering to backend event ids instead of filtering only the current client page:

- Route/mobile proof: `docs/mobile/harness/cycle-KK-home-saved-filter/cycle-KK-home-saved-filter.json`.
- Proof script: `scripts/prove_mobile_home_saved_filter.ts`.
- Focused tests: `mobile/src/__tests__/api.test.ts`, route proof, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home Saved filter | `/api/events?eventIds=...&includeMobileMarkets=1` | GET | Public/mobile route; saved ids are sourced from profile preferences in server mode when available | None | `events[]`, `events[].markets[]`, `nextCursor`, `page.nextCursor`; route filters selected ids before pagination | `Event.id`, listed public `Market`, `Outcome`; profile preferences still own saved ids | Mock mode keeps local saved filtering. Server mode sends saved ids to backend; empty Saved is handled in app as empty state. | P1: first-class saved/followed market route if saved state moves beyond profile preferences. |

## Cycle KJ - Home Status Filters

Cycle KJ wires visible Home Live/Today filters to backend route filters instead of filtering only the current client page:

- Route/mobile proof: `docs/mobile/harness/cycle-KJ-home-status-filters/cycle-KJ-home-status-filters.json`.
- Proof script: `scripts/prove_mobile_home_status_filters.ts`.
- Focused tests: `mobile/src/__tests__/api.test.ts`, route proof, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home Live filter | `/api/events?statusGroup=live&includeMobileMarkets=1` | GET | Public/mobile route | None | `events[]`, `events[].markets[]`, `nextCursor`, `page.nextCursor`; route filters live events before pagination | `Event.status`, listed public `Market`, `Outcome` | Mock mode keeps local filtering. Server mode sends the selected visible filter to backend. | P1: saved filter remains local until saved state is backend-owned. |
| Home Today filter | `/api/events?statusGroup=today&includeMobileMarkets=1` | GET | Public/mobile route | None | Same compact Home event page shape; route includes events with `status=today` or `startTime` within current UTC day | `Event.status`, `Event.startTime`, listed public `Market`, `Outcome` | Mock mode keeps local `status=today` filtering. Server mode treats route response as already filtered so valid today events are not hidden by client status text. | P1: richer timezone/user-locale day boundaries if product requires local-day semantics. |

## Cycle KI - Account Profile Contract

Cycle KI wires the visible Account profile identity to a canonical backend route:

- Route/mobile proof: `docs/mobile/harness/cycle-KI-account-profile-contract/cycle-KI-account-profile-contract.json`.
- Proof script: `scripts/prove_mobile_account_profile_contract.ts`.
- Focused tests: `mobile/src/__tests__/accountProfileService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account profile identity | `/api/account/profile` | GET | Canonical API key/session with `account:read` | None | `id`, `username`, `displayName`, `email`, `image`, `walletAddress`, `hasWalletLinked`, `hasGoogleLinked` | `User`, `Wallet`, `Account`, canonical auth/API usage/rate limits | Mock mode keeps local `Holiwyn Demo`. Server mode loads backend `displayName` and marks Account as signed in when profile sync succeeds. | P1: full server-authored Account menu destinations and account-specific sync/error copy remain future work. |

## Cycle KH - Account Balance Contract

Cycle KH wires the visible Account balance state to the canonical account balance route:

- Route/mobile proof: `docs/mobile/harness/cycle-KH-account-balance-contract/cycle-KH-account-balance-contract.json`.
- Proof script: `scripts/prove_mobile_account_balance_contract.ts`.
- Focused tests: `mobile/src/__tests__/accountBalanceService.test.ts`, `mobile/src/__tests__/api.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account visible balance | `/api/account/balance` | GET | Canonical API key/session with `account:read` | None | `availableUSDC`, `lockedUSDC`, `totalUSDC`, `updatedAt`; backend emits decimal strings and mobile normalizes to numbers | `UserBalance`, custody balance helper, canonical auth/API request logging | Mock mode keeps local demo balance. Server mode now refreshes visible balance through the canonical account route when an API key is present. | P1: full server-authored account identity/session/menu metadata remains future work. |
| Account/Portfolio wallet consistency | `/api/account/balance` and `/api/portfolio` | GET | Canonical API key/session with `account:read` | None | Account available/locked/total balance matches Portfolio wallet fields for the same user | `UserBalance`, `Position`, `Order` for Portfolio envelope | Local Portfolio fixtures remain available for mock/device harness paths. | P1: richer account sync status/error surface outside Portfolio sync. |

## Cycle KG - Route Sell/Cashout Safety

Cycle KG proves the production-like route path for mobile cashout/sell safety:

- Route proof: `docs/mobile/harness/cycle-KG-route-sell-safety/cycle-KG-route-sell-safety.json`.
- Proof script: `scripts/prove_mobile_route_sell_safety.ts`.
- Focused tests: `mobile/src/__tests__/positionCloseService.test.ts`, `src/server/services/__tests__/phase7_kalshi_model.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No-position cashout/sell rejection | `/api/orders` then `/api/portfolio` | POST then GET | Canonical API key/session with `orders:write` and `account:read`; internal trading beta enabled in local proof | `SELL LIMIT` with no owned `Position` shares | Route returns `409` with `Insufficient shares`; `/api/portfolio` shows no positions and no open orders | `ApiOrderRequest`, `Order`, `Position`, `UserBalance`, `Market`, `Outcome` | Mobile mock mode unchanged. Server-mode close keeps using backend route and must surface the route error. | None for focused no-position route safety. |
| Oversell cashout/sell rejection | `/api/orders` then `/api/portfolio` | POST then GET | Same as above | `SELL LIMIT` size greater than owned available shares | Route returns `409` with `Insufficient available shares`; `/api/portfolio` preserves existing shares and no open order is created | `ApiOrderRequest`, `Order`, `Position.reservedShares`, `UserBalance`, `Market`, `Outcome` | Mobile close still submits full current position size only; backend remains the final safety layer if frontend state is stale. | None for focused oversell route safety. |
| Valid full-position cashout/sell | `/api/orders` then `/api/portfolio` | POST then GET | Same as above | `SELL LIMIT` size equal to owned shares, matching the mobile default close-all behavior | Route returns `200` with `order.side=SELL` and `order.size`; `/api/portfolio` exposes the open sell order and DB reserves owned shares | `ApiOrderRequest`, `Order`, `Position.reservedShares`, `UserBalance`, `Market`, `Outcome`, complete-set collateral | Mock mode unchanged. Server mode confirms the backend order before treating close as submitted. | P1: provider-backed close/cashout replay when exact live provider markets are available. |

## Cycle KF - Route Line Family Filled Lifecycle

Cycle KF proves selected Spread and Team Total line/provider identity survives a filled order lifecycle:

- Route/mobile proof: `docs/mobile/harness/cycle-KF-route-line-family-filled-lifecycle/cycle-KF-route-line-family-filled-lifecycle.json`.
- Proof script: `scripts/prove_mobile_route_line_family_filled_lifecycle.ts`.
- Focused tests: `mobile/src/__tests__/orderService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/portfolioHistoryService.test.ts`, `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spread selected-line filled submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Maker SELL and taker BUY selected Spread ticket with provider `selection`, price, size, and complete-set inventory | `order.status=FILLED`, `fills[]`, `position`, and `order.selection.line/period/provider ids`; consumed by mobile submit guard | `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome`, complete-set collateral | Mock mode unchanged. Server mode consumes confirmed backend fill and selection echo. | P1: real-provider replay when exact live Spread market is available. |
| Team Total selected-line filled submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Maker SELL and taker BUY selected Team Total ticket with provider `selection`, price, size, and complete-set inventory | Same filled order, fill, position, and selection fields as Spread | `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome`, complete-set collateral | Mock mode unchanged. Server mode consumes confirmed backend fill and selection echo. | P1: real-provider replay when exact live Team Total market is available. |
| Filled line-family Portfolio/history | `/api/portfolio` and `/api/portfolio/history` | GET | Canonical API key/session with `account:read` | None | `positions[].selection.line`, `period`, `externalMarketId`, `referenceTokenId`; `recentTrades[].selection.line`, `period`, `externalMarketId`, `referenceTokenId`, `limitSide` | `Position`, `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock Portfolio/history path unchanged. Server mode consumes route snapshots. | P1: immutable first-class order/fill/trade selection snapshot columns remain future hardening. |

## Cycle KE - Route Line Family Cancel and History

Cycle KE proves selected line/provider identity survives cancel and canceled-history routes for the line families broadened in Cycle KD:

- Route/mobile proof: `docs/mobile/harness/cycle-KE-route-line-family-cancel-history/cycle-KE-route-line-family-cancel-history.json`.
- Proof script: `scripts/prove_mobile_route_line_family_cancel_history.ts`.
- Focused tests: `mobile/src/__tests__/orderService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/portfolioHistoryService.test.ts`, `mobile/src/__tests__/openOrderService.test.ts`, `src/__tests__/orders.cancel.route.test.ts`, `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spread selected-line cancel | `/api/orders` then `/api/orders/:id` | POST then DELETE | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Spread ticket submit with selected line/provider `selection`, followed by cancel by order id | Submit route echoes `order.selection`; cancel confirms `CANCELED` and unlocks balance | `ApiOrderRequest`, `Order`, `UserBalance`, `Market`, `Outcome`, provider quote snapshots | Mock cancel path unchanged. Server mode relies on route confirmation. | P1: filled lifecycle breadth for selected Spread tickets. |
| Team Total selected-line cancel | `/api/orders` then `/api/orders/:id` | POST then DELETE | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Team Total ticket submit with selected line/provider `selection`, followed by cancel by order id | Same selected identity and cancel confirmation fields as Spread | `ApiOrderRequest`, `Order`, `UserBalance`, `Market`, `Outcome`, provider quote snapshots | Mock cancel path unchanged. Server mode relies on route confirmation. | P1: filled lifecycle breadth for selected Team Total tickets. |
| Canceled line-family history | `/api/portfolio` and `/api/portfolio/history` | GET | Canonical API key/session with `account:read` | None | Canceled orders are removed from `openOrders[]`; `canceledOrders[].selection.line`, `period`, `externalMarketId`, `referenceTokenId`, and `limitSide` are preserved | `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock Portfolio/history path unchanged. Server mode consumes route snapshots. | P1: immutable first-class order/fill/trade selection snapshot columns remain future hardening. |

## Cycle KD - Route-Backed Line Family Submit Breadth

Cycle KD broadens the selected line/provider submit echo proof from KC beyond Totals:

- Route/mobile proof: `docs/mobile/harness/cycle-KD-route-order-submit-line-family-breadth/cycle-KD-route-order-submit-line-family-breadth.json`.
- Proof script: `scripts/prove_mobile_route_order_submit_line_family_breadth.ts`.
- Focused tests: `mobile/src/__tests__/orderService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed Spread line submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Spread line ticket with selected market/outcome, `marketType=spread`, `line=1.5`, `period=regulation`, provider market/condition/token ids, and limit metadata | `order.selection.marketType`, `line`, `period`, `externalMarketId`, `conditionId`, `referenceTokenId`; consumed by mobile `submitTicketOrder` guard | `ApiOrderRequest`, `Order`, `UserBalance`, `Market`, `Outcome`, provider quote snapshots | Mock mode remains local. Server mode requires matching route echo. | P1: filled/canceled lifecycle breadth for selected Spread line tickets. |
| Route-backed Team Total line submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Team Total line ticket with `marketType=team-total`, `line=1.5`, `period=second-half`, provider market/condition/token ids, and limit metadata | Same selected identity fields as Spread, echoed by `/api/orders` and accepted by mobile guard | `ApiOrderRequest`, `Order`, `UserBalance`, `Market`, `Outcome`, provider quote snapshots | Mock mode remains local. Server mode requires matching route echo. | P1: filled/canceled lifecycle breadth for selected Team Total tickets. |
| Post-submit Portfolio line-family echo | `/api/portfolio` | GET | Canonical API key/session with `account:read` | None | `openOrders[].selection.line`, `period`, `externalMarketId`, `referenceTokenId` for both submitted families | `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock Portfolio path unchanged. Server Portfolio uses backend open-order echo. | P1: immutable first-class order selection snapshot columns remain future hardening. |

## Cycle KC - Route-Backed Order Submit Selection Echo

Cycle KC proves the actual backend route satisfies the stricter Cycle KB mobile guard for selected line/provider tickets:

- Route/mobile proof: `docs/mobile/harness/cycle-KC-route-order-submit-selection-echo/cycle-KC-route-order-submit-selection-echo.json`.
- Proof script: `scripts/prove_mobile_route_order_submit_selection_echo.ts`.
- Focused tests: `mobile/src/__tests__/orderService.test.ts`, `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`, root typecheck, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed selected line submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; internal trading beta enabled in local proof | Totals line ticket with `selection.marketId`, `outcomeId`, `marketType=totals`, `line=2.5`, `period=first-half`, provider market/condition/token ids, and limit metadata | `order.id`, `order.status`, `order.selection.*`; consumed by mobile `submitTicketOrder` guard | `ApiOrderRequest`, `Order`, `UserBalance`, `Market`, `Outcome`, provider quote snapshots | Mock mode remains local. Server mode now accepts route-backed selected tickets only when `/api/orders` echoes critical selected identity. | P1: repeat route-backed proof across spread and team-total families plus filled/canceled lifecycle breadth. |
| Post-submit open-order echo | `/api/portfolio` | GET | Canonical API key/session with `account:read` | None | `openOrders[].selection.line`, `period`, `externalMarketId`, `referenceTokenId` | `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock Portfolio path unchanged. Server Portfolio uses backend open-order echo. | P1: immutable first-class order selection snapshot columns remain future hardening. |

## Cycle KB - Order Submit Selection Echo Contract

Cycle KB tightens Trade Ticket server-mode submit for backend-selected line/provider tickets:

- Client proof: `docs/mobile/harness/cycle-KB-order-submit-selection-echo/cycle-KB-order-submit-selection-echo.json`.
- Proof script: `scripts/prove_mobile_order_submit_selection_echo.ts`.
- Focused mobile tests: `mobile/src/__tests__/orderService.test.ts` and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket selected line submit confirmation | `/api/orders` | POST | Canonical API key/session with `orders:write` | `marketId`, `outcomeId`, `side`, `contractSide`, `price`, `size`, and `selection` with line/period/provider identity | `order.id`, `order.selection.marketId`, `outcomeId`, `marketType`, `line`, `period`, `contractSide`, `externalMarketId`, `conditionId`, `referenceTokenId`, `referenceOutcomeLabel` | `ApiOrderRequest.requestBody.selection`, `Order`, `Market`, `Outcome` | Mock mode remains local. Server mode now rejects selected line/provider tickets if the backend response omits selection echo or changes critical selected identity. | P1: production backend should continue returning first-class `order.selection` for every selected line/provider ticket; immutable order/fill/trade selection columns remain future hardening. |

## Cycle KA - Line Selector Backend Selection Contract

Cycle KA tightens Event Detail Game Lines line-selector identity so visible Totals/Team Total/Spread row tickets can use backend route-owned `markets[].selection` instead of frontend reconstruction:

- Route/adapter proof: `docs/mobile/harness/cycle-KA-line-selector-backend-selection/cycle-KA-line-selector-backend-selection.json`.
- Proof script: `scripts/prove_mobile_line_selector_backend_selection.ts`.
- Focused mobile tests: `mobile/src/__tests__/worldCupAdapter.test.ts`, `mobile/src/__tests__/eventDetailLineTicketService.test.ts`, and mobile typecheck.
- Focused backend route test: `src/__tests__/mobile-live-event-detail.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines selector identity | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | None | `markets[].selection.selectorKey`, `marketId`, `marketGroupId`, `marketFamily`, `marketType`, `period`, `line`, `lineValue`, `outcomes[].outcomeId`, `side`, `referenceTokenId`, `referenceOutcomeLabel` | Existing `Event`, `Market`, `Outcome`, provider quote/chart/depth snapshot rows | Deterministic line fixtures remain only when backend line markets are absent. When backend selection is present, ticket metadata is built from the route-owned market/outcome selection. | P1: broader real-provider line-family replay for spread/totals/team-total when Polymarket exposes those exact markets. |
| Line ticket submit identity | `/api/orders` after ticket open | POST | Canonical API key/session with `orders:write` | Existing ticket `selection` snapshot now includes backend line selector identity when opened from Game Lines | Order submit consumes `selection.marketId`, `outcomeId`, `marketType`, `line`, `period`, provider market/condition/token fields | `ApiOrderRequest.requestBody.selection`, `Order`, `Market`, `Outcome` | Local/mock ticket mode still works, but server-mode line tickets no longer need to infer the selected backend market from UI labels alone. | P1: immutable first-class line selection snapshot remains future hardening. |

## Cycle JZ - Account Preferences Contract

Cycle JZ tightens the visible Account/settings profile preferences contract:

- Route proof: `docs/mobile/harness/cycle-JZ-account-preferences-contract/cycle-JZ-account-preferences-contract.json`.
- Proof script: `scripts/prove_mobile_account_preferences_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/profilePreferencesService.test.ts`, `mobile/src/__tests__/api.test.ts`, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account preferences load | `/api/profile/preferences` | GET | Canonical API key/session with `account:read` | None | `preferences.locale`, `ticketDefaultAmount`, `ticketDefaultSide`, `ticketDefaultSlippage`, `savedEventIds` | `UserProfilePreference`, `User`, `ApiCredential` | Mock/local mode uses AsyncStorage and hides profile sync row. Server mode shows syncing/synced/error from this route. | P1: full server-authored account menu/session/wallet destination metadata remains future work. |
| Account preferences save | `/api/profile/preferences` | PUT | Canonical API key/session with `account:write` | Same preferences envelope, including slippage and saved event ids | Normalized persisted preferences used by Account row, Trade Ticket defaults, language, and saved market count | `UserProfilePreference` JSONB row keyed by user | Local fallback remains when server preference sync is unavailable. Malformed server responses now fail clearly in mobile service. | P1: richer mobile retry/conflict state if sync fails mid-session. |

## Cycle JY - Trade Ticket Filled Lifecycle

Cycle JY proves the visible Trade Ticket server submit path when the order crosses existing liquidity:

- Route proof: `docs/mobile/harness/cycle-JY-trade-ticket-filled-lifecycle/cycle-JY-trade-ticket-filled-lifecycle.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_filled_lifecycle.ts`.
- Focused mobile tests: `mobile/src/__tests__/orderService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/portfolioHistoryService.test.ts`, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket filled submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; local/internal proof requires `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | Taker `BUY LIMIT` with `contractSide=NO`, selected totals line/provider token metadata, and idempotency key; maker liquidity is a resting `SELL` created through the same route | `order.status=FILLED`, `order.remaining=0`, `fills[]`, `position.shares`, `order.selection` | `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome`, complete-set collateral | Mock mode keeps local ticket order state. Server mode consumes confirmed backend fills and Portfolio/history refreshes. | P1: broader filled lifecycle breadth across spread/team-total and partial-fill states. |
| Post-fill Portfolio position/history | `/api/portfolio` and `/api/portfolio/history` | GET | Canonical API key/session with `account:read` | None | Filled position appears in `positions[]` and recent trade appears in `recentTrades[]`, both preserving `selection.contractSide`, provider token, external market id, and limit metadata | `Position`, `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock mode maps local Portfolio state. Server mode consumes backend snapshots. | P1: durable first-class fill/trade selection snapshots remain future hardening. |

## Cycle JX - Trade Ticket Submit Contract

Cycle JX tightens the visible Trade Ticket server submit contract:

- Route proof: `docs/mobile/harness/cycle-JX-trade-ticket-submit-contract/cycle-JX-trade-ticket-submit-contract.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_submit_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/orderService.test.ts`, `mobile/src/__tests__/api.test.ts`, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket server submit | `/api/orders` | POST | Canonical API key/session with `orders:write`; local/internal proof requires `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side`, `type=LIMIT`, `price`, `size`, `contractSide`, `clientOrderId`, and `selection` with market type, line, period, provider ids/tokens, and limit metadata | `order.id`, `status`, `size`, `remaining`, `contractSide`, `selection`, `fills`, `balance`, `position` | `ApiOrderRequest`, `Order`, `UserBalance`, `Market`, `Outcome`, provider quote snapshots | Mock mode keeps local ticket order state. Server mode now rejects malformed backend responses with no confirmed order id. | P1: route-backed filled lifecycle for this same simple ticket path when counterparty liquidity is present. |
| Post-submit Portfolio open order | `/api/portfolio` | GET | Canonical API key/session with `account:read` | None | Submitted order appears in `openOrders[]` with `selection.contractSide`, provider token, external market id, and limit metadata | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, `UserBalance` | Mock mode maps local order state. Server mode consumes backend open-order snapshot. | P1: durable first-class order selection snapshot remains future hardening. |

## Cycle JW - Portfolio Open-Order Cancel Flow

Cycle JW tightens the visible Portfolio open-order cancel contract:

- Route proof: `docs/mobile/harness/cycle-JW-portfolio-cancel-flow/cycle-JW-portfolio-cancel-flow.json`.
- Proof script: `scripts/prove_mobile_portfolio_cancel_flow.ts`.
- Focused mobile tests: `mobile/src/__tests__/openOrderService.test.ts`, `mobile/src/__tests__/api.test.ts`, and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order cancel | `/api/orders/:id` | DELETE | Canonical API key/session with `orders:write` | None | `order.id`, `order.status=CANCELED`, `order.clientOrderId`, `order.canceledByApiKeyId`, unlocked `balance` | `Order`, `UserBalance`, `ApiOrderRequest`, `ApiCredential`, `Market`, optional `Position` for SELL cancel | Mock mode keeps local cancel behavior and does not call backend. Server mode requires a matching canceled order confirmation. | P1: richer mobile inline error copy/state if cancel fails because order was already filled/canceled by another actor. |
| Portfolio post-cancel refresh/history | `/api/portfolio` and `/api/portfolio/history` | GET | Canonical API key/session with `account:read` | None | Open order removed from `openOrders`; canceled order appears in `canceledOrders[]` with `selection.contractSide`, provider token, and limit metadata | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, `UserBalance` | Mock mode appends local canceled activity once. Server mode relies on route refresh and rejects malformed cancel confirmation. | P1: durable first-class order/trade selection snapshots remain future hardening. |

## Cycle JV - Portfolio History Contract-Side Snapshot

Cycle JV tightens the visible Portfolio history/activity contract for canceled orders and recent trades:

- Route proof: `docs/mobile/harness/cycle-JV-portfolio-history-contract-side/cycle-JV-portfolio-history-contract-side.json`.
- Proof script: `scripts/prove_mobile_portfolio_history_contract_side.ts`.
- Focused mobile tests: `mobile/src/__tests__/portfolioHistoryService.test.ts` and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio canceled-order contract side | `/api/portfolio/history` | GET | Session or canonical API key with `account:read` | None | `canceledOrders[].selection.contractSide`, `displayLabel`, provider token fields, limit side/price/shares | `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock mode keeps local activity state. Server mode consumes the route snapshot. | P1: first-class immutable `Order.selection` column remains future hardening. |
| Portfolio recent-trade contract side | `/api/portfolio/history` | GET | Session or canonical API key with `account:read` | None | `recentTrades[].selection.contractSide`, provider token fields, limit metadata, side and cost/share fields | `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock mode keeps local activity state. Server mode consumes the route snapshot. | P1: first-class immutable `Trade.selection` or fill snapshot remains future hardening. |

## Cycle JU - Portfolio Contract-Side Snapshot

Cycle JU tightens the visible Portfolio positions/open-orders contract for Yes/No side preservation:

- Route proof: `docs/mobile/harness/cycle-JU-portfolio-contract-side-snapshot/cycle-JU-portfolio-contract-side-snapshot.json`.
- Proof script: `scripts/prove_mobile_portfolio_contract_side_snapshot.ts`.
- Focused mobile tests: `mobile/src/__tests__/portfolioSnapshotService.test.ts` and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position contract side | `/api/portfolio` | GET | Session or canonical API key with `account:read` | None | `positions[].selection.contractSide`, `displayLabel`, provider token fields, pricing/value fields | `Position`, `Market`, `Outcome`, `ApiOrderRequest`, `UserBalance` | Mock mode keeps local Portfolio state. Server mode consumes the route snapshot. | P1: first-class immutable `Position.selection` column remains future hardening. |
| Portfolio open-order contract side | `/api/portfolio` | GET | Session or canonical API key with `account:read` | None | `openOrders[].selection.contractSide`, limit side/price/shares, provider token fields | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, `UserBalance` | Mock mode keeps local open-order state. Server mode consumes the route snapshot. | P1: first-class immutable `Order.selection` column remains future hardening. |

## Cycle JT - Search Status Filter Backend Wiring

Cycle JT wires visible Search `Live` and `Upcoming` filters to backend route filters in server market-data mode:

- Route proof: `docs/mobile/harness/cycle-JT-search-status-filters/cycle-JT-search-status-filters.json`.
- Proof script: `scripts/prove_mobile_search_status_filters.ts`.
- Focused route tests: selected status-group case in `src/__tests__/public.events.no-leak.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search Live filter | `/api/events?...&search=<query>&statusGroup=live&limit=10` | GET | Public/mobile route | Query params only | Live `events[]` with compact `markets[]`, `nextCursor`, `page.hasMore` | Existing `Event.status`, `Market`, `Outcome` rows | Mock mode keeps local filtering. Server mode fetches the Live backend page for the active query. | P1: richer live ranking/facet counts. |
| Search Upcoming filter | `/api/events?...&search=<query>&statusGroup=upcoming&limit=10` | GET | Public/mobile route | Query params only | Non-live `events[]` with compact `markets[]`, cursor metadata | Existing `Event.status`, `Market`, `Outcome` rows | Mock mode keeps local filtering. Server mode fetches the Upcoming backend page for the active query. | P1: exact event lifecycle taxonomy if statuses expand beyond live/non-live MVP. |

## Cycle JS - Search Event Route and Pagination

Cycle JS wires the visible Search tab in server market-data mode to backend search and cursor pagination:

- Route proof: `docs/mobile/harness/cycle-JS-search-event-pagination/cycle-JS-search-event-pagination.json`.
- Proof script: `scripts/prove_mobile_search_event_pagination.ts`.
- Focused route tests: selected Search case in `src/__tests__/public.events.no-leak.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search default/top results | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public/mobile route | Query params only | `events[]` with compact `markets[]`, `nextCursor`, `page.hasMore` | Existing `Event`, `Market`, `Outcome` rows; listed public markets only | In mock market-data mode Search keeps local fixture filtering. In server mode Search uses backend Search state and does not replace backend failures with fixtures. | P1: dedicated ranking/facet endpoint if Search expands beyond MVP World Cup scope. |
| Typed Search results | `/api/events?...&search=<query>&limit=10` | GET | Public/mobile route | Query params only | Matching event rows with compact markets and cursor metadata | Search predicate now covers event title/description, home/away team names, market title/description, and outcome name/label | Route errors show a clear Search unavailable state rather than silently inventing rows. | P1: server-side Search status filters, saved filter integration, richer category/facet counts, and ranking metrics. |
| Search "Load more" | `/api/events?...&search=<query>&limit=10&cursor=<event-id>` | GET | Public/mobile route | Query params only | Next matching `events[]` page, `nextCursor`, `page.limit`, `page.hasMore` | Cursor resolves against `Event.id` with stable ordering by `updatedAt`, `createdAt`, `id` descending | Failed next-page loads keep already loaded route results and show route error. | P1: Android device proof for pressing Search Load more if visual proof becomes required again. |

## Cycle JR - Home Event List and Pagination

Cycle JR wires the visible Home event list "Load more" flow to backend cursor pagination in server market-data mode:

- Route proof: `docs/mobile/harness/cycle-JR-home-event-list-pagination/cycle-JR-home-event-pagination.json`.
- Proof script: `scripts/prove_mobile_home_event_pagination.ts`.
- Focused route tests: selected cases in `src/__tests__/public.events.no-leak.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and mobile typecheck.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home event list initial page | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public/mobile route | Query params only | `events[]` with compact `markets[]`, plus `nextCursor` and `page.hasMore` | Existing `Event`, `Market`, `Outcome` rows; listed public markets only | In mock market-data mode Home keeps the existing fixture behavior. In server mode the initial Home list comes from the backend page. | P1: richer server-side Home filters beyond current loaded-page filtering. |
| Home "Load more" | `/api/events?...&limit=10&cursor=<event-id>` | GET | Public/mobile route | Query params only | Next `events[]` page, `nextCursor`, `page.limit`, `page.hasMore` | Cursor resolves against `Event.id` and stable route ordering by `updatedAt`, `createdAt`, `id` descending | Failed next-page loads do not replace loaded server events with local mocks. | P1: Android device proof for pressing Load more in server mode if visual regression evidence becomes required again. |

## Cycle JQ - Backend-Driven Event Rules and Sell Safety

Cycle JQ tightens backend-owned market-rule contracts for visible Event Detail/Game Lines UI and verifies sell/cashout safety:

- Route proof: `docs/mobile/harness/cycle-JQ-backend-event-market-cashout-safety/cycle-JQ-market-rule-profiles.json`.
- Focused backend tests: `src/__tests__/mobile-event-market-rules-contract.test.ts` and selected sell-safety cases in `src/server/services/__tests__/phase7_kalshi_model.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/worldCupAdapter.test.ts` and `mobile/src/__tests__/positionCloseService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail/Game Lines market-rule rendering | `/api/mobile/events/:slug/live-detail` and event summary serialization | GET | Public/mobile route | Event slug | `event.marketProfile`, `event.resultMode`, `event.gameRules.allowDraw`, `event.gameRules.includesOvertime`, `event.supportedMarketTypes`, plus backend markets/outcomes/period/line/type | Existing `Event`, `Market`, and `Outcome` fields: `sportKey`, `leagueKey`, `eventType`, `description`, `marketType`, `marketGroupKey`, `marketGroupTitle`, `period`, `line`, outcomes with `side/label/name` | Mobile preserves backend-provided rule fields first. Local derivation is fallback only and now uses the same explicit `to_advance`/`to_qualify` key detection instead of guessing from event/team names. | P1: production real-provider replay across more World Cup event profiles. No new schema migration required for this cycle. |
| Regulation draw versus knockout advance profile | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Regulation profile returns `marketProfile=regulation_90`, `resultMode=can_draw`, `supportedMarketTypes` containing `regulation_90`, `spread`, `totals`. Knockout profile returns `marketProfile=full_match_with_overtime`, `resultMode=can_draw`, and supports both separate `to_advance` and `regulation_90`. | Same existing event/market/outcome tables | No frontend-invented market rows are accepted by the proof. Backend availability determines which market groups are present. | P1: broader provider-backed family availability beyond disposable contract proof rows. |
| Cashout/sell safety | Canonical order submission backing `POST /api/orders`; mobile `closePositionOnServer()` submits a full-position `SELL` | POST | Existing canonical API key/session order auth | `marketId`, `outcomeId`, `side=SELL`, `type=LIMIT`, full `size` from position shares, price from current/best price, `selection` identity | Backend rejects no-position and oversell attempts; mobile blocks no-share and oversize sell attempts before submit. Valid sell within available position can proceed. | Existing `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | No mock fallback may permit server-mode naked sells. Local fake-token UI remains test-only and must keep the same safety checks. | P1: full HTTP route proof under production-like auth flags; current focused proof exercises canonical backend service and mobile service guards. |

## Cycle ET - Period-Safe Retail Line Matching

Cycle ET changes mobile route-data selection rules, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-ET-local-mvp-period-safe-line-family/cycle-ES-local-mvp-line-family-breadth-proof.json`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed retail line ticket matching | Existing `/api/mobile/events/:slug/live-detail` data when in server mode; local proof uses fixture fallback | GET | Public/mobile route | Event slug | Mobile requires each backend line market to expose `marketType`, `line`, `period`, outcomes, provider ids/tokens, and availability so the selected retail ticket can match family + line + period | Existing `Market.period`, `Market.line`, `Market.marketType`, `Outcome.referenceTokenId`, provider snapshot tables | If backend family/line/period does not match, mobile falls back to deterministic contract-shaped fixture instead of using wrong route data | P1: route proof with real provider-backed spread/totals/team-total rows through the simple ticket path. |

## Cycle ES - Local MVP Line-Family Ticket Breadth

Cycle ES changes mobile contract-shaped fallback coverage and Android proof, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-local-mvp-line-family-breadth-proof.json`.
- Visible Book/orderbook controls remain hidden by default and debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default Local MVP Totals and Team Total tickets | No new endpoint; proof exercises existing mobile fake-token ticket state and line-ticket resolver | N/A for ES proof | N/A for ES proof | N/A until submit; ticket opens with selected market family/type, line, period, display label, and contract side | Mobile consumes line-family ticket fields for `totals` and `team-total`, including `ticket-line`, `ticket-period`, `ticket-display-label`, and outcome identity | Future backend route should provide provider-backed `Market`/`Outcome` rows for spread/totals/team-total with `marketType`, `line`, `period`, provider ids/tokens, availability, and price fields | Deterministic Team Total fallback is contract-shaped and used only when backend team-total line market is absent | P1: replace deterministic Team Total fallback with real Polymarket-backed route data where available, or explicit unavailable/stale route status where Polymarket does not expose that market. |

## Cycle ER - Local MVP Retail Status Flow

Cycle ER changes proof coverage, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-local-mvp-status-flow-proof.json`.
- Visible Book/orderbook controls remain hidden by default and debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default local MVP retail status surface | No new endpoint; proof exercises existing mobile event-detail fallback/status state | N/A for ER proof | N/A for ER proof | N/A | Mobile renders chart route status, ticket handoff provider lifecycle, selected line identity, and hidden orderbook state markers | Future provider-backed route should continue using `Event.liveDataStatus`, `Market.availability`, chart history status/source, and selected market/outcome identity fields | Deterministic line/status fixture is accepted only for local UI proof | P1: route-backed loading/stale/unavailable status breadth for provider-backed retail tickets, without requiring users to open Book. |

## Cycle EQ - Local MVP Sell Flow

Cycle EQ changes mobile ticket identity and proof coverage, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/cycle-EQ-local-mvp-trade-flow-proof.json`.
- Visible Book/orderbook controls remain hidden by default and debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default local MVP simple Sell ticket | No new endpoint; fixture proof exercises existing mobile fake-token trading state and selected-ticket/portfolio mappers | N/A for EQ proof | N/A for EQ proof | Ticket submit uses existing fake-token order shape with selected spread line identity, `side=sell`, and `contractSide=no` | Mobile consumes the same selection envelope in ticket, latest order, activity, and position rows: market family/type, line, period, side, contract side, display label, order status, and fake-token activity text | Future backend route remains existing `Event`, `Market`, `Outcome`, `Order`, `Position`, `Trade`, and selection snapshot fields; no new schema | Deterministic line fixture is accepted only for local UI proof and is shaped like backend selection data, not arbitrary display-only strings | P1: repeat Buy/Sell simple-ticket flow with real provider-backed spreads, totals, and team totals. Production backend order route should preserve the same `side` plus `contractSide` envelope into portfolio/history. |

## Cycle EP - Local MVP Trade Flow Steering

Cycle EP changes the default mobile surface, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-EP-local-mvp-trade-flow/cycle-EP-local-mvp-trade-flow-proof.json`.
- Visible Book/orderbook controls are hidden by default and remain debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default local MVP event detail and simple ticket | No new endpoint; fixture proof exercises existing mobile mock trading state and existing selected-ticket/portfolio mappers | N/A for EP proof | N/A for EP proof | Ticket submit uses existing mobile fake-token order shape with selected `marketId`/`outcomeId` where available, market family/type, line, period, side, contract side, probability/price, and display label | Mobile consumes the same selection envelope in ticket, latest order, activity, and position rows | Future backend route remains existing `Event`, `Market`, `Outcome`, `Order`, `Position`, `Trade`, and selection snapshot fields; no new schema | Deterministic line fixture is accepted only for UI proof and is shaped like backend selection data, not arbitrary display-only strings | P1: repeat the same simple-ticket flow with real provider-backed spread/totals/team-total routes and Sell-side order/portfolio history. Loading/stale/unavailable states should stay visible in the retail flow without forcing Book. |

## Cycle EO-A - Route-Backed Lifecycle Breadth

Cycle EO-A extends backend/provider route proof beyond the prior selected ask/Buy lifecycle:

- Backend proof: `docs/mobile/harness/cycle-EO-A-route-breadth/proof.json`.
- Proof script: `scripts/prove_mobile_eo_a_route_breadth.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Totals provider-depth Sell selection source | `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book?maxLevels=24` | GET / GET | Public/mobile routes | Event slug and selected market id | Live-detail `markets[].selection`, `markets[].outcomes[]`, `markets[].orderbookDepth[]`, `orderbookIdentity`, `providerLifecycle`, and Book `marketIdentity`, `availability`, `levels[]` preserve totals family/type/group, `2H`, line `3.5`, selected outcome token, provider source, and bid ladder price/share identity | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | No frontend-only fixture is accepted by the proof; disposable provider rows are backend-shaped Polymarket/Gamma/CLOB data | Production replay on a real live Polymarket event remains future coverage. |
| Bid-side Sell limit order creation | Canonical order service backing `POST /api/orders` | POST | Canonical API key/idempotency flow in production; EO-A uses the route-backed service entry to avoid local trading-beta env flags | `marketId`, `outcomeId`, `side=SELL`, `type=LIMIT`, bid-row `price`, `size`, `contractSide=YES`, and `selection` born from Book provider depth, including `limitPrice`, `limitSide=bid`, and `limitShares` | Order response echoes `order.side=SELL` and `order.selection` with selected totals/provider/bid identity intact | `ApiOrderRequest`, `Order`, `Market`, `Outcome`; sell leg also uses existing share collateral/position state | None. Limit fields are sanitized into existing request JSON. | First-class immutable order/fill/trade/position selection columns remain future hardening. |
| Bid-side Sell portfolio/history lifecycle | `/api/portfolio` and `/api/portfolio/history` | GET / GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection`, `canceledOrders[].selection`, and `recentTrades[].selection` preserve totals market/outcome/type/group/line/period/side/contract side/provider ids/tokens plus `limitPrice`, `limitSide=bid`, and `limitShares`; open/canceled/recent activity preserve `side=SELL` | `Order`, `ApiOrderRequest`, `Position`, `Trade`, `Market`, `Outcome` with the guarded request snapshot bridge | None in backend proof. Mobile fixtures are not used for EO-A identity. | Same-market/outcome multi-selection history still depends on the latest matching request snapshot until durable trade/position snapshots are approved. |

Cycle EO-A implementation notes:

- The proof starts from both route origins required by mobile, `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book`, then uses the Book route bid level as the staged limit source.
- Focused route tests assert `/api/portfolio` and `/api/portfolio/history` preserve bid-side Sell totals snapshots with provider token identity.
- `OPTIC_ODDS_API_KEY` remains optional/unconfigured and non-blocking; the proven path uses Polymarket-first quote and CLOB depth rows.

## Cycle EN Integrated - Route-Backed Provider-Depth Limit Lifecycle

Cycle EN integrated pairs backend/provider route proof with visible Android proof:

- Backend proof: `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json`.
- Integrated Android proof: `docs/mobile/harness/cycle-EN-integrated-route-limit-lifecycle/cycle-EN-B-visible-route-limit-lifecycle-proof.json`.

Backend/data dependency notes:

- Mobile consumes `/api/mobile/events/:slug/live-detail`, `/api/orderbook/:marketId/book`, `/api/markets/:marketId/quote`, and `/api/markets/:marketId/chart` from backend `http://127.0.0.1:3002` in server market-data mode.
- The integrated Android proof uses mock trading mode for submit/cancel, but the selected market/depth identity is route-backed from provider-depth rows and not arbitrary local UI-only data.
- Backend EN-A separately proves the selected provider-depth Book limit identity through the canonical order service contract, `/api/portfolio`, and `/api/portfolio/history` mapping.
- Production hardening still needs HTTP `POST /api/orders` route proof under the trading-beta environment, broader market-family/bid-side route-backed Android proof, and first-class immutable order/fill/trade/position selection snapshots.

## Cycle EN-A - Route-Backed Provider-Depth Limit Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-depth Book selection source | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `markets[].selection`, `markets[].outcomes[]`, `markets[].orderbookDepth[]`, `markets[].orderbookIdentity`, `markets[].providerLifecycle`, and `markets[].providerOrderbookDepth` provide the selected `marketId`, `outcomeId`, market group/type, line, period, side, provider source, external market/condition ids, token ids, and tapped Book ask/bid price/share level | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | No frontend-only fixture is accepted by the proof; disposable provider rows are backend-shaped Polymarket/Gamma/CLOB data | Production replay on a real live Polymarket event remains future coverage. |
| Book-staged limit order creation | Canonical order service backing `POST /api/orders` | POST | Canonical API key/idempotency flow in production; EN-A uses the route-backed service entry to avoid local trading-beta env flags | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` born from live-detail provider depth, including `limitPrice`, `limitSide`, and `limitShares` | Order response echoes `order.selection` and `order.contractSide` with selected provider and limit identity intact | `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None. Limit fields are sanitized into existing request JSON. | First-class immutable order/fill/trade/position selection columns remain future hardening. |
| Route-backed limit portfolio/history lifecycle | `/api/portfolio` and `/api/portfolio/history` | GET / GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection`, `canceledOrders[].selection`, and `recentTrades[].selection` preserve selected market/outcome/type/group/line/period/side/contract side/provider ids/tokens plus `limitPrice`, `limitSide`, and `limitShares` | `Order`, `ApiOrderRequest`, `Position`, `Trade`, `Market`, `Outcome` with the guarded request snapshot bridge | None in backend proof. Mobile fixtures are not used for EN-A identity. | Same-market/outcome multi-selection history still depends on the latest matching request snapshot until durable trade/position snapshots are approved. |

Cycle EN-A implementation notes:

- Proof script: `scripts/prove_mobile_en_a_route_limit_lifecycle.ts`.
- Proof artifact: `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json`.
- The proof starts from `/api/mobile/events/:slug/live-detail` provider orderbook depth, selects an ask ladder level, and derives the order `selection` from that route payload before open/cancel/fill lifecycle assertions.
- Focused route tests now assert `/api/portfolio` and `/api/portfolio/history` preserve `limitPrice`, `limitSide`, and `limitShares` with provider token identity after current market metadata drift.
- `OPTIC_ODDS_API_KEY` remains optional/unconfigured and non-blocking; the proven path uses existing Polymarket-first quote, CLOB depth, and CLOB chart rows.

## Cycle EM Integrated - Book-Staged Limit Lifecycle Proof Pairing

Cycle EM integrated pairs two evidence types:

- Service/backend contract proof: `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json`.
- Android-visible lifecycle proof: `docs/mobile/harness/cycle-EM-integrated-limit-lifecycle/cycle-EM-B-visible-limit-lifecycle-proof.json`.

Backend/data dependency notes:

- The selected staged limit fields use the existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` selection envelopes documented in Cycle EM-A.
- The integrated tablet proof was accepted as a fake-token visible lifecycle proof because it exercised the mobile state surfaces and was paired with EM-A's service proof. It did not prove a live route-backed provider-depth lifecycle from the tablet because backend health was unavailable in that launch context.
- No new schema migration or route shape was introduced in Lead integration.
- Remaining backend work is P1: route-backed provider-depth lifecycle execution through order/portfolio/history and durable first-class DB snapshots for same market/outcome multi-selection history.

## Cycle EM-A - Book-Staged Limit Lifecycle Service Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book-staged limit order creation | Mobile `submitTicketOrder()` -> `/api/orders` via `placeLimitOrder()` and canonical order normalization | POST | Server mode uses existing canonical API key/idempotency flow | `selection` now preserves `limitPrice`, `limitSide`, and `limitShares` with selected `marketId`, `outcomeId`, family/line/period/side, display label, contract side, and provider identity | Immediate mobile order result keeps the staged Book limit fields in `result.selection`; backend `sanitizeTicketSelectionSnapshot()` keeps the same fields in `ApiOrderRequest.requestBody.selection` | Existing `ApiOrderRequest.requestBody` JSON snapshot; no schema migration | Mock order mode uses the same mobile `selectionForOrder()` path, so the service contract is identical for local ticket tests | Live Android route proof and immutable first-class order/trade selection columns remain future hardening. |
| Book-staged limit open orders and positions | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection.limitPrice`, `openOrders[].selection.limitSide`, `openOrders[].selection.limitShares`, and matching fields on `positions[].selection` survive mobile portfolio mapping | `Order`, `ApiOrderRequest`, `Position`, `Market`, `Outcome` with existing request snapshot bridge for matching market/outcome | Mobile portfolio service tests use backend-shaped payloads, not UI-only fields | Filled positions still depend on the latest matching request snapshot or current market/outcome fallback; no immutable position snapshot column. |
| Book-staged limit activity/history | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection.*` and `recentTrades[].selection.*` carry `limitPrice`, `limitSide`, and `limitShares` into mobile activity rows | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome` | Mobile history mapper tests use backend-shaped canceled/recent trade payloads | Same-market/outcome multi-selection history remains limited by existing request JSON lookup until durable trade snapshots are added. |

Cycle EM-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json`.
- Focused tests cover mobile order creation, mobile portfolio snapshot mapping, mobile history/activity mapping, and backend selection metadata sanitization/building for `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares`.
- `sanitizeTicketSelectionSnapshot()` now preserves finite numeric `limitPrice`/`limitShares` and normalized `limitSide=bid|ask`, so Book-staged fields survive canonical request storage and later portfolio/history serialization through the existing selection snapshot JSON.
- No visible mobile UI, mobile smoke scripts, shared audit gate docs, Prisma schema, or migration files were changed.

## Cycle EL Integrated - Route-Backed Book/Ticket Limit Handoff

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed Book ladder to staged ticket | `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book?maxLevels=24` | GET / GET | Public/mobile routes for live-detail and orderbook. Server order mode uses existing API key handling when a ticket is submitted. | Live-detail uses event slug. Book uses selected `marketId`, `maxLevels`, and mobile cache-buster `_ts`. Future order payloads preserve `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares` from the tapped Book row. | Live-detail selected market/outcome identity, `orderbookIdentity`, provider lifecycle, chart status, and route-backed depth readiness. Book `levels[].side/price/shares/value`, `marketIdentity`, and availability. Mobile ticket consumes the selected `limitPrice/limitSide/limitShares` so price display and future order snapshots stay tied to the tapped ladder row. | Reads provider-backed `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`. Future order/portfolio/history flows use existing order selection snapshot fields. | The integrated proof uses the disposable EL-A provider event seeded through route/provider services, not arbitrary frontend-only data. No frontend fixture is accepted for the selected integrated pass. | Production proof still needs live real Polymarket mapped events and scheduled refresh breadth. A future backend/order cycle should assert `limitPrice/limitSide/limitShares` through server order creation, portfolio, and history. |

Cycle EL integrated implementation notes:

- Proof artifacts: `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-A-provider-breadth.json` and `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-B-visible-live-depth-proof.json`.
- The Samsung tablet proof used backend event slug `mobile-el-a-provider-breadth-bc35089a` against `http://127.0.0.1:3002`.
- The selected ask row staged Buy at `0.55` / 55c for 150 shares; the selected bid row staged Sell at `0.50` / 50c for 180 shares; both ticket price lines preserved the tapped Book level.

## Cycle EL-A - Provider Line-Family Breadth Route Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail/provider-refresh line-family breadth | `/api/mobile/events/:slug/live-detail` before and after `/api/mobile/events/:slug/provider-refresh` | GET / POST / GET | Live-detail is public/mobile. Provider-refresh remains protected by internal/admin auth in production; the proof calls the shared route execution helper used by the protected POST. | Provider-refresh body uses `allowContractProofFallback=false`. | Refresh now returns `refresh.lineFamilyCoverage.source/generatedAt/compactMarketCount/familyCount/providerRefreshableFamilyCount/providerRefreshableMarketCount/readyProviderRefreshableMarketCount/hasProviderMappedBreadth/hasReadyProviderMappedBreadth/optionalLineProviderBlocking`, `families[]`, and per-market `markets[].selectorKey/marketFamily/period/line/providerRefreshable/status/ready/quote/orderbookDepth/chartHistory`. Live-detail after refresh continues to expose each compact market's `providerLifecycle.quote/orderbookDepth/chartHistory`, `orderbookIdentity`, `chartHistoryStatus`, and `orderbookDepthStatus`. | Creates disposable `Event`, `Market`, and `Outcome` rows. Refresh writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` through the existing Polymarket Gamma/CLOB services. | Contract-proof fallback is disabled and asserted null. Provider fetches are deterministic Polymarket Gamma/CLOB-shaped responses scoped to disposable proof slugs/tokens. Missing `OPTIC_ODDS_API_KEY` remains optional and non-blocking. | Production breadth still depends on live Polymarket mappings for actual World Cup events. Android-visible proof remains outside Agent A ownership. |
| Focused EL-A proof harness | `scripts/prove_mobile_el_a_provider_breadth.ts` | Local script calling route modules | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records before unavailable compact markets, provider refresh completion, Gamma quote/CLOB depth/CLOB chart refresh counts for three mapped families, line-family coverage, cache invalidation for all family routes, after-refresh live-detail readiness, and optional/non-blocking line-provider state | Same backend provider tables as live-detail/provider-refresh; no schema migration | No frontend fallback. The proof uses route/service calls and fails unless moneyline, spread, and totals all become provider-ready without contract fallback. | Requires local database and dependency runtime. It is backend/provider route proof only. |

Cycle EL-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EL-A-provider-breadth/cycle-EL-A-provider-breadth.json`.
- `refresh.lineFamilyCoverage` is backend-owned route proof metadata; mobile can use it for diagnostics or readiness gating without deriving provider breadth from UI state.
- The proof shows three compact market families ready after refresh: moneyline, spread, and totals. Each preserves Polymarket quote, CLOB orderbook depth, CLOB chart history, selected market identity, selector key, line/period, and cache invalidation paths.
- No visible mobile UI, shared audit gate docs, Prisma schema, or migration files were changed.

## Cycle EK Integrated - Visible Provider Transition Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail stale/refreshing/ready transition on tablet | `/api/mobile/events/:slug/live-detail`, `/api/orderbook/:marketId/book?maxLevels=24`, and the provider-refresh route execution helper used by `/api/mobile/events/:slug/provider-refresh` | GET / GET / local route helper | Live-detail and orderbook are public/mobile routes. Provider refresh remains internal/admin protected in production; the integrated proof calls the shared route execution body locally. | Live-detail uses event slug. Orderbook uses selected `marketId` and `maxLevels`. Refresh helper uses `allowContractProofFallback=false` for the existing disposable EK event. | `event.liveDataStatus.source/status/reason/lastUpdated`, `markets[].providerLifecycle.status/quote/orderbookDepth/chartHistory`, `markets[].availability.status/source/reason`, selected `markets[].selection`, selected `markets[].orderbookIdentity`, Book `availability.status/source/reason`, Book `providerOrderbookDepth.status`, and ticket handoff fields from the selected market/line/outcome. | Reads live `Event`, provider-shaped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`. The proof helper refreshes the existing disposable EK event with scoped Polymarket Gamma/CLOB-shaped provider stubs. | No frontend fallback is accepted for the selected transition. The tablet proof checks a stale/refresh-due state, runs refresh, then requires route-backed ready labels. Mobile orderbook requests add a timestamp query parameter so the tablet cannot reuse stale Book data. | Production scheduler execution and real provider-backed line-family breadth are still not complete. The helper proves the route path for one selected EK transition, not universal production refresh coverage. |
| EK integrated proof harness | `mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleStatusTransition` plus `scripts/refresh_mobile_ek_provider_transition.ts` | Local harness | Local development device/database only | Device, backend URL, event slug, screenshot output, hierarchy output, and refresh summary path | JSON proof records before-refresh status, in-flight refresh UI, after-refresh live-detail status, Book/orderbook readiness, ticket settings handoff, route-backed labels, and provider refresh summary with `fallbackApplied=false` | Same provider snapshot tables as above; no schema migration | No arbitrary UI fixture is added. Existing deterministic provider responses are contract-shaped and only scoped to the proof refresh execution. | Fresh S23 Polymarket recapture and repeated production-family Android proof remain P1 follow-up work. |

Cycle EK integrated implementation notes:

- Proof artifacts: `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-proof.json` and `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-refresh-route.json`.
- Live-detail now lets provider lifecycle downgrade a live event from ready to stale/unavailable when the provider route data is not ready, so the app no longer hides refresh debt behind stale top-level metadata.
- When provider lifecycle becomes ready after refresh, selected market availability and Book availability can be promoted from stale to route-backed ready only when provider quote/depth evidence is fresh.
- Mobile Book requests include a cache-buster query value to prevent stale device responses from masking the provider transition.

## Cycle EK-A - Provider Transition Route Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail provider transition breadth | `/api/mobile/events/:slug/live-detail` before and after `/api/mobile/events/:slug/provider-refresh` | GET / POST / GET | Live-detail is public/mobile. Provider-refresh remains protected by internal/admin auth in production; the proof calls the route execution helper used by the protected POST. | Provider-refresh body uses `allowContractProofFallback=false`; no expire-first fallback is required. | Live-detail `markets[].providerLifecycle.status/ready/stale/refreshDue/unavailable/empty/notReady`, `markets[].providerLifecycle.quote/orderbookDepth/chartHistory.source/status/reason/nextRefreshAt/lastFetchedAt`, `markets[].providerOrderbookDepth.status`, `markets[].chartHistoryStatus.status`, `markets[].selection`, and `markets[].orderbookIdentity`. Provider-refresh `providerLifecycle.refreshStarted/refreshStatus/refreshStartedAt/refreshCompletedAt/ready/fallbackApplied`, `refresh.provider`, `refresh.providerDepth`, `refresh.providerHistory`, `refresh.contractProofFallback`, `refresh.mappingReadiness`, and `cacheInvalidation.invalidated`. | Creates disposable `Event`, `Market`, and `Outcome` rows. Reads/writes `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` through the existing provider refresh services. | Contract-proof fallback is disabled and asserted null. Provider fetches are deterministic Polymarket Gamma/CLOB-shaped responses scoped to the disposable proof slugs/tokens; missing `OPTIC_ODDS_API_KEY` stays optional/unconfigured. | Android-visible refresh/loading/ready pairing remains Agent B/Lead scope. Production line-family breadth still depends on real mapped Polymarket markets being available. |
| Focused EK-A proof harness | `scripts/prove_mobile_ek_a_provider_transition.ts` | Local script calling route modules | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records ready Moneyline, selected stale/refresh-due Spread before refresh, provider-refresh completed lifecycle, selected Spread ready after refresh, unavailable Totals before/after, cache invalidation paths, no fallback, and selected identity preservation | Same existing backend provider tables as live-detail/provider-refresh; no schema migration | No frontend fallback. The proof fails if `mock-ready`, `fixture-ready`, `frontend-fixture`, `default-ready`, fallback depth, or first-row fallback markers appear. | Requires local database and dependency runtime. It is backend route proof only. |

Cycle EK-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json`.
- `executeMobileLiveProviderRefreshRoute()` is the shared route execution body used by protected `POST`; production auth behavior is unchanged.
- Selected transition identity is preserved by market id, selector key, family, period, line, and token ids across before live-detail, route refresh response, and after live-detail.
- Unavailable/not-ready Totals stays explicit and is not counted as ready evidence.

## Cycle EJ-A - Provider Status Breadth Route Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail provider status breadth | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `event.liveDataStatus`, top-level and `contract.providerLifecycle`, `contract.batchedProviderOrderbookDepthReadyCount/StaleCount/RefreshDueCount`, `contract.batchedChartHistoryReadyCount/StaleCount/RefreshDueCount`, compact `markets[].providerLifecycle.status/ready/stale/refreshDue/unavailable/empty/notReady`, `markets[].providerLifecycle.quote/orderbookDepth/chartHistory.source/status/reason/nextRefreshAt/lastFetchedAt`, `markets[].providerOrderbookDepth.status`, `markets[].chartHistoryStatus.status`, `markets[].selection`, and `markets[].orderbookIdentity` | Reads compact live `Event`, provider-shaped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows | None. The EJ-A proof fails if `mock-ready`, `fixture-ready`, `frontend-fixture`, or `default-ready` appears in the route payload. Missing `OPTIC_ODDS_API_KEY` is non-blocking. | Android visible consumption and production mapped-market breadth remain Agent B/production coverage work. |
| Focused EJ-A proof harness | `scripts/prove_mobile_ej_a_provider_status_breadth.ts` | Local script calling the route module | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records a ready moneyline, refresh-due quote plus stale depth/chart spread, unavailable/not-ready totals market, aggregate contract counts, Polymarket/CLOB sources, and no fixture/mock/default-ready markers | Creates one disposable live event with three compact markets and seeds only the backend provider snapshot tables needed for each state | No frontend fallback. The unavailable market intentionally has no provider snapshot rows and is not counted as ready evidence. | Requires local database and dependency runtime. It is backend route proof only. |

Cycle EJ-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json`.
- The ready market proves `providerLifecycle.status=ready`, `orderbookDepthSource=provider-orderbook-depth`, and `orderbookIdentity.ready=true`.
- The stale market proves `providerLifecycle.quote.status=refresh_due` while orderbook depth and chart history are `stale`.
- The unavailable market proves `providerLifecycle.status=unavailable`, `empty=true`, `notReady=true`, and route identity remains present without provider-ready labeling.

## Cycle EI-A - Route-Backed Provider Status Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tablet live-detail provider lifecycle/status rendering | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `event.liveDataStatus.source/status/lastUpdated/reason`, top-level and `contract.providerLifecycle.status/source/reason/ready/stale/refreshDue/unavailable/empty/notReady/nextRefreshAt/lastFetchedAt`, selected `markets[].providerLifecycle.quote/orderbookDepth/chartHistory.source/status/reason/nextRefreshAt/lastFetchedAt/ready/notReady`, `markets[].chartHistoryStatus.status/source/lastUpdated/nextRefreshAt`, `markets[].orderbookDepthSource/orderbookDepthStatus/providerOrderbookDepth.status`, and selected `markets[].selection` plus `markets[].orderbookIdentity` | Reads compact live `Event`, mapped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` | None. The EI-A route proof fails if `mock-ready`, `fixture-ready`, or `frontend-fixture` markers appear in the route payload. Missing `OPTIC_ODDS_API_KEY` is non-blocking for this live-detail route proof. | Visible tablet rendering remains Agent B scope. Production line-family coverage still depends on mapped provider markets and scheduled refresh coverage. |
| Focused EI-A proof harness | `scripts/prove_mobile_ei_a_route_backed_status.ts` | Local script calling the route module | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records liveDataStatus, chart status, orderbook/availability status, selected market identity, provider source/reason/freshness fields, aggregate lifecycle status, missing Optic Odds non-blocking state, and no fixture/mock-ready markers | Creates a disposable provider-backed event and seeds provider quote, provider orderbook depth, and chart snapshot rows consumed by the real live-detail route | No frontend fallback and no mobile smoke fixture. Disposable backend rows use the same snapshot tables as production refresh code. | Requires local database. It is backend proof only and does not replace Android/tablet UI proof. |

Cycle EI-A implementation notes:

- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json` records the focused route proof for PM-GAP-084.
- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json` pairs the route proof with Samsung tablet UI proof for the same disposable event slug.
- The tablet proof consumes `/api/mobile/events/:slug/live-detail` through `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3002`, requires `/api/health`, and preserves route-backed provider/source/status identity through live page, Book/orderbook, ticket handoff, and ticket settings.
- No backend route/service or schema source change was required after EH-A; EI integrated work changed proof seeding and mobile harness routing/expectations only.

## Cycle EH-A - Provider Status Surface Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail provider lifecycle status | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Top-level/event/contract `providerLifecycle.status/ready/stale/refreshDue/refreshing/refreshStarted/unavailable/empty/notReady/source/reason/nextRefreshAt/lastFetchedAt/fallback/fallbackApplied/fallbackReason`, plus `markets[].providerLifecycle.quote/orderbookDepth/chartHistory` with the same status/freshness vocabulary | Reads compact live `Event`, mapped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` | None in the route. Empty provider rows remain explicit as `status=unavailable`, `empty=true`, `notReady=true` | Real provider coverage for every production line-family compact market still depends on mapping and scheduled refresh coverage. |
| Provider refresh status transition | `/api/mobile/events/:slug/provider-refresh` then `/api/mobile/events/:slug/live-detail` | POST / GET | Provider refresh uses internal admin guard; live-detail is public/mobile | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | Refresh route `providerLifecycle.status`, `refreshStartedAt`, `refreshCompletedAt`, `refreshStarted`, `refreshing`, `refreshStatus`, `lastFetchedAt`, `fallbackApplied`, `fallbackReason`, and optional `lineProvider.status=unconfigured` when `OPTIC_ODDS_API_KEY` is absent | Writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`; refreshes Polymarket Gamma/CLOB for mapped markets | Contract-proof fallback remains opt-in and is labelled through `fallbackApplied/fallbackReason`; missing Optic Odds is optional/unconfigured, not blocking | Visible mobile rendering of the new status surface remains Agent B scope. |
| Focused EH-A proof harness | `scripts/prove_mobile_eh_a_provider_status_surface.ts` | Local script | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact with before stale/refresh-due market lifecycle, refresh-start/completion lifecycle, optional/unconfigured line-provider state, after ready market lifecycle, and unavailable control market lifecycle | Creates a disposable provider-backed event with one mapped market and one intentionally empty compact market; seeds provider quote/depth/chart rows for state transition | Deterministic CLOB-shaped proof fetches are explicit; quote fallback is marked when used | Requires local database. It is backend proof only and does not replace Android UI proof. |

Cycle EH-A implementation notes:

- `docs/mobile/harness/cycle-EH-A-provider-status-surface.json` records the focused backend proof.
- PM-GAP-084 backend surface is closed for route shape: mobile can render ready, refresh-due, stale, refresh-started/completed, unavailable/empty, source, reason, next refresh, last fetch, fallback, and not-ready flags from backend responses.
- No mobile visible UI, mobile scripts, Prisma schema, or global audit docs were changed.

## Cycle EG-A - Provider Refresh Lifecycle Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Polymarket-first live-detail/provider refresh lifecycle | `/api/mobile/events/:slug/provider-refresh` then `/api/mobile/events/:slug/live-detail` | POST / GET | Provider refresh uses internal admin guard; live-detail is public/mobile | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | Refresh route now returns top-level `providerLifecycle.source/generatedAt/quote/orderbookDepth/chartHistory/ready/refreshDue/stale/nextRefreshAt`, plus `refresh.postRefreshDepth.lifecycle` and `refresh.postRefreshHistory.lifecycle`. Live-detail now exposes `markets[].chartHistoryStatus.stalenessSeconds/staleAfterSeconds/refreshTtlSeconds/nextRefreshAt/shouldRefresh/isStale` and contract `batchedChartHistoryReadyCount/StaleCount/RefreshDueCount/NextRefreshAt`. Book/live-detail depth continues to expose `providerOrderbookDepth.status/nextRefreshAt/shouldRefresh/isStale`. | Reads compact live `Event`, mapped `Market`, active `Outcome`; writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`. | Production route uses Polymarket Gamma/CLOB by default. The EG-A proof uses deterministic CLOB-shaped depth/history responses only after Gamma quote refresh reports skipped, and labels that path with explicit `contractProofFallback`/fixture status. Missing `OPTIC_ODDS_API_KEY` does not block the Polymarket path. | Production recurring refresh and full real-provider coverage for line-family markets remain outside this focused lifecycle proof. |
| EG-A proof harness | `scripts/prove_mobile_eg_a_provider_refresh_lifecycle.ts` | Local script | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact with before stale live-detail contract, provider refresh lifecycle, CLOB depth/history refresh reports, skipped line-provider state, after ready live-detail contract, and assertions | Creates a disposable provider-backed event/market/outcome set, seeds stale quote/depth/chart rows, refreshes CLOB-shaped depth/history, and records the resulting route-shaped lifecycle state | Deterministic fixture is explicit: `providerSource=polymarket-first-with-deterministic-clob-fixture` and `fixtureStatus=explicit_contract_proof_fallback_for_gamma_quote_only` | Real Gamma quote success depends on live Polymarket slug availability for production-mapped events. |

Cycle EG-A implementation notes:

- `docs/mobile/harness/cycle-EG-A-provider-refresh-lifecycle.json` proves stale -> ready for provider orderbook depth and chart history, with quote fallback explicitly reported and `lineProvider.status=skipped` not blocking the pass.
- The refresh path invalidates live-detail, event, chart, and orderbook route paths and now reports the lifecycle fields mobile needs to distinguish `ready`, `refresh_due`, `stale`, and `unavailable`.
- No mobile visible UI files were changed.

## Cycle EC-A - Provider Orderbook Identity Parity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail compact market to Book identity carry-through | `/api/mobile/events/:slug/live-detail` then `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public/mobile route then public visibility guard | Event slug; selected compact `marketId` for Book route | Live-detail compact `markets[].selection.selectorKey`, `markets[].orderbookIdentity.route/marketId/marketGroupId/selectorKey/marketFamily/period/line/outcomeIds/tokenIds/providerSource/providerStatus/depthSource/depthStatus/depthProviderStatus/depthProviderSources/refreshedAt/nextRefreshAt/shouldRefresh/isStale/ready/reason`, plus Book `marketIdentity.marketId/marketGroupId/selectorKey/marketFamily/period/line/outcomes[].id/outcomeId/tokenId`, `depthSource`, `providerOrderbookDepth.status/sources/latestFetchedAt/nextRefreshAt/isStale/shouldRefresh/reason`, and `levels[]`. | `Event`, `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`; local `Order` rows still take precedence in Book snapshot resolution | None in backend. The EC proof fails unless live-detail selects a provider-backed compact market and the corresponding Book route returns the same identity with ready provider depth | Real production line-family provider mappings/refresh coverage remain incomplete; EC documents the line gap when only match-winner is provider-backed. |
| Focused EC-A proof harness | `scripts/prove_mobile_ec_provider_orderbook_identity.ts` | Local script calling both routes | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | JSON artifact with live-detail selected compact identity, matching Book identity, provider depth summary, token equality, selector equality, and line-market gap note | Upserts a disposable World Cup-style event with match-winner and Totals markets, writes provider quote/depth rows for match winner, clears local open orders/provider rows for proof markets | None. Disposable provider rows use the same reference snapshot tables as production refresh code | Requires local database and a Next server running the current worktree code. |
| Focused route/service unit proof | `src/__tests__/mobile-live-event-detail.test.ts`, `src/__tests__/public.orderbook-book.no-leak.test.ts` | Jest | Local development only | Mocked service/route requests | Asserts live-detail `orderbookIdentity` and Book `marketIdentity.outcomes[].tokenId` align with compact selector identity while no private account/order fields leak | Prisma and orderbook snapshot service are mocked | None | Broader end-to-end visible mobile proof remains outside Agent A backend scope. |

Cycle EC-A implementation notes:

- `selection.selectorKey` is now compact and route-compatible: `marketGroupKey:period:line-or-default`. `marketId` remains explicit for uniqueness.
- Book `marketIdentity.outcomes[].tokenId` is a public provider contract id, not an auth token or credential. Sensitive owner/user/order fields remain excluded by no-leak tests.
- `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json` passed with `sameMarketId`, `sameSelectorKey`, `sameOutcomeIds`, `sameTokenIds`, provider source, ready depth status, and freshness assertions all true.

## Cycle EA-A - Live Detail Per-Market Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event page selected-market chart behavior | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Top-level `event.chartHistory` remains primary-market scoped. Each compact `markets[]` row now includes `chartHistory[]` and `chartHistoryStatus.source/status/pointCount/outcomeCount/lastUpdated/stalenessSeconds/staleAfterSeconds/refreshTtlSeconds/nextRefreshAt/shouldRefresh/isStale/emptyState/range/ranges`. `contract` now includes `batchedChartHistorySource`, `batchedChartHistoryMarketCount`, `batchedChartHistoryPointCount`, `batchedChartHistoryReadyCount`, `batchedChartHistoryStaleCount`, `batchedChartHistoryRefreshDueCount`, `batchedChartHistoryNextRefreshAt`, `batchedChartHistoryRequestedMarketCount`, and `batchedChartHistoryRequestedMarketIds`. | Reads compact live `Event`, `Market`, active `Outcome`, provider quote/depth snapshots through existing Book snapshot service, and `MarketOutcomeSnapshot` rows for every compact market id. | None in backend. Markets with no history return `chartHistory=[]`, `chartHistoryStatus.status=unavailable`, and `emptyState=no-history`. | Real Polymarket/CLOB history ingestion for mapped Spread/Totals/Team Total line markets still depends on provider token mapping and refresh coverage. |
| Focused backend unit proof | `src/__tests__/mobile-live-event-detail.test.ts` | Jest service test | Local development only | Mocked event/market/snapshot inputs | Proves primary `event.chartHistory` remains separate from non-primary `market.chartHistory`, and proves selected line-market chart readiness can be audited by `marketId`. | No DB writes; orderbook snapshot service is mocked. | None | DB-backed route probe needs a seeded World Cup proof event in the active local database. |

Cycle EA-A implementation notes:

- The route now fetches chart snapshots for all `selectCompactLiveMarkets()` market ids with a bounded `compactMarketIds.length * 240` cap.
- Per-market chart status is backend-shaped and replaceable by real provider history: it carries source, status, point count, outcome count, last update, range, and empty state.
- This narrows the chart parity gap for line selector work because mobile no longer has to assume the primary market chart applies to the selected line market.

## Cycle DU-A - Provider Ready Line Orderbook Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book ready provider line ladder | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public visibility guard; private markets still use existing access checks | Query params only: optional `outcomeId`, optional `maxLevels` capped at 200 | `depthSource=provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, `providerOrderbookDepth.sources[]`, `marketIdentity.selectorKey`, `marketIdentity.marketFamily`, `marketIdentity.marketType`, `marketIdentity.marketGroupKey`, `marketIdentity.marketGroupId`, `marketIdentity.period`, `marketIdentity.line`, `marketIdentity.unit`, `marketIdentity.outcomes[].id`, `marketIdentity.outcomes[].side`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].value`, legacy `levels[].total`, `bids[]`, `asks[]` | `Market`, active `Outcome`, `ReferenceOrderbookDepthSnapshot`; local `Order` rows still have precedence if present | None in backend. The route reports `emptyState=no-depth` when neither local nor provider depth exists | Production-mapped World Cup line-family markets still need recurring provider refresh coverage outside disposable proof rows. |
| Focused DU-A proof harness | `scripts/prove_mobile_du_provider_line_orderbook_depth.ts` | Local script calling route | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | JSON artifact with route URL, compact first-half spread identity, provider depth source/status, selector key `spreads:first-half:1.5`, outcome ids, and side-labelled Price/Shares/Value rows | Upserts a disposable World Cup-style `Event`/`Market`/`Outcome` set, clears local open orders for that proof market, then writes provider depth rows | None. The proof fails if the route does not return provider-backed ready depth and line selector identity together | Requires an available local database and Next server for the HTTP route probe. |

Cycle DU-A implementation notes:

- `docs/mobile/harness/cycle-DU-A-provider-line-orderbook-depth-proof.json` proves provider-backed ready ladder depth for a compact World Cup first-half spread market.
- The Book route now emits `levels[].value` as an additive alias for the existing notional `levels[].total`, making mobile XML/accessibility proof labels easier without breaking existing consumers.
- The DU-A artifact closes the backend half of PM-GAP-075 for provider-ready line identity: source/status, ready availability, selector key, family/type/group, period, line, outcome ids, level side, price, shares, and value are all route-backed in one response.
- Visible tablet proof still needs to consume this provider-backed route state in the same UI run before PM-GAP-075 can pass end to end.

## Cycle DT-A - Provider Ready Orderbook Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book ready provider ladder | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public visibility guard; private markets still use existing access checks | Query params only: optional `outcomeId`, optional `maxLevels` capped at 200 | `marketIdentity`, `availability`, `depthSource=provider-orderbook-depth`, `providerOrderbookDepth.status=ready`, `levels[].price`, `levels[].shares`, `levels[].total`, `bids[]`, `asks[]` | `Market`, active `Outcome`, `ReferenceOrderbookDepthSnapshot`; local `Order` rows still have precedence if present | None in backend. The route reports `emptyState=no-depth` when neither local nor provider depth exists | Production World Cup compact markets still need mapped provider identity and recurring depth refresh coverage. |
| Focused DT proof harness | `scripts/prove_mobile_dt_ready_orderbook_depth.ts` | Local script calling route | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | JSON artifact with route URL, compact market identity, provider depth summary, and Price/Shares/Value row evidence | Upserts a disposable World Cup-style `Event`/`Market`/`Outcome` set and provider depth rows | None. The proof fails if the route does not return provider-backed ready depth | Requires an available local database and Next server for the HTTP route probe. |
| Focused route unit proof | `src/__tests__/public.orderbook-book.no-leak.test.ts` | Jest route test | Local development only | Mocked route request | Asserts provider-ready ladder shape, selector identity, numeric Price/Shares/Value rows, and no sensitive key leakage | Prisma and snapshot service are mocked | None | Broader live provider mappings remain outside this unit test. |

Cycle DT-A implementation notes:

- `marketIdentity` and provider depth are proven together so the Book UI can render a selected compact market without using fallback/unavailable depth.
- Earlier DT-A proof kept provider token IDs out of the Book identity. Cycle EC-A intentionally adds public provider `tokenId` to `marketIdentity.outcomes[]` for cross-route identity proof while credentials, owner IDs, user IDs, private order state, and condition IDs remain excluded.
- The route's depth precedence is unchanged: local orderbook, provider ladder snapshot, provider quote top-of-book estimate, then empty.

## Cycle DS-A - Orderbook Selector Identity Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book selector/depth identity | `/api/orderbook/:marketId/book` | GET | Public visibility guard; private market access still uses existing user visibility checks | Query params: optional `outcomeId`, optional `maxLevels` capped at 200 | Existing `marketId`, `outcomeId`, `availability`, `emptyState`, `levels[]`, `bids[]`, `asks[]`, provider depth metadata; new `marketIdentity.selectorKey`, `marketFamily`, `marketType`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `displayOrder`, `period`, `line`, `unit`, `displayUnits`, `outcomes[]` | Reads `Market` plus active `Outcome`; reads local orderbook/provider snapshots through `buildPublicOrderbookSnapshot()` | None. The route reports no-depth/availability truthfully and does not synthesize frontend-only family data | Broader production provider mappings for live line-family markets remain outside this route contract. |
| Focused backend proof | `src/__tests__/public.orderbook-book.no-leak.test.ts` | Jest unit route test | Local development only | Mocked route request for Moneyline, Spread, and Totals markets | Asserts selector-ready identity, public ladder units, active outcome list, and no sensitive key leakage | No DB writes; Prisma is mocked | None | Add integration proof against a seeded real event if Agent B needs an end-to-end sibling selector proof. |

Cycle DS-A implementation notes:

- `docs/mobile/harness/cycle-DS-A-orderbook-selector-contract.json` records the focused backend proof.
- Cycle EC-A intentionally exposes public provider `tokenId` in `marketIdentity.outcomes[]` so live-detail and Book can prove the same outcome/token identity. Condition IDs, credentials, owner IDs, user IDs, and private order state remain excluded.
- This closes the backend-side compact market identity gap for Book selector/depth parity; mobile can switch/select line markets without inventing family, line, period, outcome, or display-unit labels.

## Cycle DS-B/Integrated - Visible Orderbook Selector And Ladder

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Orderbook overlay selector/ladder | `/api/orderbook/:marketId/book` plus existing event/live-detail data | GET | Public/mobile visibility guard | Optional selected market/outcome and max depth through existing mobile flow | `marketIdentity` when route-backed; existing `levels[]`, bid/ask prices, shares, value, `availability`, `emptyState`, source/status labels | `Market`, `Outcome`, local orderbook/provider snapshot rows | Existing contract-shaped fallback depth renders with explicit `Fallback depth` and unavailable labels when route-backed ready depth is absent | Need integrated provider-backed ready depth proof and selector carry-through for Moneyline -> Spread/Totals. |
| Tablet orderbook smoke proof | `mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBook` | Local harness | Local device proof only | `-OutputDir`, `-HierarchyOutputDir`, `-Port` | Screenshots/XML for event detail, Book overlay, Book ticket, close state | No DB writes | Uses current mobile app state and backend availability | Add interaction steps for Yes/No tab switching, selector choice changes, and Decimalize/equivalent settings. |

Cycle DS-B/Integrated implementation notes:

- `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json` records the integrated partial proof.
- The Book overlay now depends on stable market/outcome identity and explicit depth status labels. It must not hide fallback/unavailable state as a ready provider-backed ladder.
- PM-GAP-075 remains open until selector changes, Yes/No tab switching, settings, and provider-backed ready depth are proven together.

## Cycle DR-A - Scheduled Provider Refresh Run Reporting

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scheduled provider refresh run report | `runScheduledMobileLiveProviderRefresh()` | Local scheduler service | Backend-only trusted caller | Optional `eventSlugs`, `maxEvents`, `refreshTtlSeconds`, `dryRun` | Backend operator/worker fields: `runId`, `startedAt`, `completedAt`, `durationMs`, `status`, `attemptedEventCount`, `successfulEventCount`, `failedEventCount`, `dryRunEventCount`, `refreshed[].status`, `refreshed[].error` | Reads `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot`; scheduled execution writes provider quote/depth/history through existing refresh services | None. Scheduled execution keeps `allowContractProofFallback=false`; failed refresh attempts are reported, not filled with proof data | Durable run-history table, production retry/alert policy, and cron/queue registration remain future infrastructure work. |
| Scheduled provider refresh proof harness | `scripts/prove_mobile_scheduled_provider_refresh.ts` | Local script | Local development only | Optional `--eventSlug`, `--output`, `--staleSeconds` | JSON artifact with `expired`, `before`, `scheduler`, `after`, run-status assertions, and `pass` | Ages `ReferenceQuoteSnapshot.fetchedAt`, then refreshes through the scheduler service | None. The script fails if stale-to-ready or run reporting assertions do not pass | Keep the harness as backend evidence until deployed worker observability exists. |

Cycle DR-A implementation notes:

- `docs/mobile/harness/cycle-DR-A-mobile-scheduled-provider-refresh-run-report.json` proves stale/refresh-due -> scheduler run report `status=completed` -> ready for `mobile-provider-refresh-proof-live`.
- The refreshed item reports `status=completed` with cache invalidation paths for live-detail, event, chart, and orderbook surfaces.
- The failure contract is unit-tested: provider refresh exceptions produce `status=completed_with_errors`, `failedEventCount=1`, and a sanitized per-event error while keeping contract-proof fallback disabled.

## Cycle DQ-A - Scheduled Provider Refresh Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scheduled provider refresh assessment | `runScheduledMobileLiveProviderRefresh()` | Local scheduler service | Backend-only trusted caller | Optional `eventSlugs`, `maxEvents`, `refreshTtlSeconds`, `dryRun` | `candidateCount`, `dueEventCount`, `candidates[].dueMarketIds`, missing/stale outcome counts, `nextAction` | Reads `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot` | None. The service only marks a market due when provider snapshots are missing or stale | Deploying this service behind a cron/queue worker remains future infrastructure work. |
| Scheduled provider refresh execution | `refreshMobileLiveProviderQuoteSnapshots()` via scheduler | Local scheduler service | Backend-only trusted caller | Due event slug; `allowContractProofFallback=false` | `provider.snapshotsUpdated`, `providerDepth.depthRowsUpdated`, `providerHistory.snapshotsCreated`, `lineProvider.status`, `postRefresh`, `postRefreshHistory` | Writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` for mapped compact markets | Contract-proof fallback is disabled in the scheduled path | Production error taxonomy/retry policy is still light; line-provider enrichment can remain skipped without blocking Polymarket parity. |
| Mobile live-detail readiness after schedule | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `contract.batchedProviderQuoteSnapshotReadyCount`, `batchedProviderQuoteSnapshotStaleCount`, `batchedProviderQuoteSnapshotRefreshDueCount`, `batchedProviderOrderbookDepthReadyCount`, `chartHistorySource` | Reads compact live event, provider quote snapshots, depth snapshots, and chart history | None for the proof event; stale state is reported truthfully before refresh | Android smoke failed before provider assertions in this pass, so the route proof is the authoritative DQ-A evidence. |
| Scheduled refresh proof harness | `scripts/prove_mobile_scheduled_provider_refresh.ts` | Local script | Local development only | Optional `--eventSlug`, `--output`, `--staleSeconds` | JSON artifact with `expired`, `before`, `scheduler`, `after`, `assertions`, and `pass` | Ages `ReferenceQuoteSnapshot.fetchedAt`, then refreshes through the scheduler service | None. The script fails if stale-to-ready does not happen | Keep the harness as a backend proof until a deployed scheduler cadence exists. |

Cycle DQ-A implementation notes:

- `docs/mobile/harness/cycle-DQ-A-mobile-scheduled-provider-refresh.json` proves stale/refresh-due -> scheduler refresh -> ready for `mobile-provider-refresh-proof-live`.
- Missing `OPTIC_ODDS_API_KEY` is not required for this Polymarket-first path. The proof event has no line-provider fixture, so `lineProvider.status=skipped` is expected while Gamma/CLOB quote, depth, and history refresh still pass.
- The scheduler returns cache invalidation paths for live-detail, event, chart, and orderbook consumers so mobile routes know which provider-backed surfaces changed.

## Cycle DF - Provider Mapping Operator UI

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operator readiness review | `/api/mobile/events/:slug/provider-mapping` | GET | Internal admin key or admin session | None | `compactMarketCount`, `providerRefreshableMarketCount`, `providerRefreshableOutcomeCount`, `totalOutcomeCount`, missing field counts, `markets[]`, `markets[].outcomes[]`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome` provider identity fields | None | Need real provider line-market slug source to reduce remaining missing mappings. |
| Operator dry-run review/apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | `reviews[]`, `dryRun`, `confirmApply` generated from parsed operator input | `blocked`, `blockReason`, `preview.failedReviews[]`, `preview.attachReadyReviewCount`, `attach.validation`, `nextRequiredAction` | On confirmed all-pass apply, writes existing provider identity fields on `Market` and `Outcome` | None. UI dry-run and apply both use the protected route; failed reviews block in backend | Durable operator review audit log/table remains future work. |
| Operator input parser | `parseProviderSlugReviewInput()` | Local UI helper | Admin page only | JSON array/object or `marketId=slug1,slug2` lines | Normalized `{ marketId, slugs[] }[]` | None | None | No persistence of draft review input yet. |

Cycle DF implementation notes:

- The UI does not bypass the backend review gate. It only packages operator input for the protected `/provider-mapping` workflow.
- Confirmed apply is disabled until the operator checks `Confirm apply`.
- The UI is intentionally admin-only and separate from Holiwyn user mobile surfaces.

## Cycle DE - Bulk Review Apply Workflow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Review-first bulk provider mapping apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | `reviews[]`, optional `dryRun`, optional `confirmApply` | `mode=bulk-manual-slug-review-apply`, `blocked`, `blockReason`, `preview.reviewCount`, `preview.attachReadyReviewCount`, `preview.failedReviews[]`, `attach`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome`; fetches exact Gamma `/markets?slug=...`; on confirmed all-pass apply writes `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, and `Outcome.referenceOutcomeLabel` | None. Failed review blocks all attach; no partial success is written | Need operator/admin UI to collect captured slugs and call this route. |
| Existing direct mapping apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | Existing `mappings[]`, `dryRun`, `confirmApply` | Existing validation and before/after readiness report | Same provider identity fields as above | None | Kept for lower-level tooling; operator flow should prefer `reviews[]` so relevance/family checks happen in the same apply cycle. |
| Bulk review/apply proof harness | `scripts/prove_mobile_provider_bulk_review_apply_workflow.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` | Proof artifact showing blocked mixed review, unchanged readiness, all-valid dry-run, confirmed apply, and after-apply readiness | Upserts local proof event/market/outcome rows shaped like compact live markets; applies real provider IDs only after all reviews pass | Uses real Polymarket slugs/tokens for match-winner mappings; guard totals market remains unmapped | Real line-market slugs are still needed before line markets can pass review/apply. |

Cycle DE implementation notes:

- `reviews[]` on `/provider-mapping` is the protected high-level apply path: review first, block on any failure, then dry-run or confirmed apply only when every review is attach-ready.
- The pass proof shows a bad totals review cannot be silently skipped while 3 match-winner markets are attached.
- The route returns `nextRequiredAction=fix_failed_slug_reviews_before_bulk_apply` for blocked review sets and `nextRequiredAction=run_provider_refresh_without_contract_fallback` after confirmed all-pass apply.

## Cycle DC - Bulk Manual Slug Review Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bulk exact provider slug review | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `reviews[]` where each review has `marketId` and `slugs[]` | `mode=bulk-manual-slug-preview`, `reviewCount`, `attachReadyReviewCount`, `candidateCount`, `attachReadyCandidateCount`, `mappings[]`, `results[].expectedProviderFamily`, `bestCandidate.attachReadiness.reasons`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome`; fetches exact Gamma `/markets?slug=...`; returned mappings can later be sent to `/provider-mapping` | None. The route is read-only and does not attach provider IDs | Need operator UI/admin flow to submit bulk reviews and then apply only all-approved mappings. |
| Bulk provider identity apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | Existing `mappings[]`, `dryRun`, `confirmApply` | Existing validation and before/after readiness report | Writes `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, and `Outcome.referenceOutcomeLabel` | None | Not changed this cycle; applying remains separate by design. |
| Bulk slug proof harness | `scripts/prove_mobile_provider_bulk_slug_review.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` | Proof artifact showing 3 attach-ready match-winner reviews and 1 rejected wrong-family totals review | Upserts local proof event/market/outcome rows shaped like compact live markets; does not apply returned mappings | Uses real Polymarket slugs/tokens for preview; no frontend-only mapping fixture | Real line-market slugs are still needed before line markets can pass bulk review. |

Cycle DC implementation notes:

- The bulk preview contract deliberately stops before attach.
- `nextRequiredAction=fix_failed_slug_reviews_before_bulk_apply` when any review fails, preventing partial silent completion.
- The proof shows wrong-family match-winner slugs cannot satisfy totals markets in bulk mode.

## Cycle DB - Provider Line Source Probe

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line-market provider source probe | `scripts/prove_mobile_provider_line_source_probe.ts` | Local script | Local development only | `--providerEventSlug`, `--output` | Exact event family summary, exact slug guess results, broad line-query ranked candidates, attach-ready counts, rejection reasons, `nextRequiredAction` | No DB writes. In-memory targets are shaped like compact `Market.marketType`, `Market.line`, `Market.period`, and active `Outcome` identity | None. The script does not attach provider identity or count local mock data as provider-backed | Need an actual provider source or operator-reviewed real exact slugs for line markets. |
| Exact provider event source | `https://gamma-api.polymarket.com/events?slug=...` | GET | Public provider endpoint | Query `slug=fifwc-col-gha-2026-07-03` | Provider event markets with `slug`, `question`, `id`, `conditionId`, `outcomes`, `clobTokenIds` | Would map into `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` if a line family candidate existed | None. Current exact event exposes only match-winner candidates | Line-family markets are absent from the exact event payload for this checked event. |
| Exact line slug guesses | `https://gamma-api.polymarket.com/markets?slug=...` | GET | Public provider endpoint | 23 generated line slug guesses for spread, totals, team totals, first half, corners, and correct score | Exact market preview fields if a guessed slug exists | Same provider identity fields as above | None. Missing slugs return no candidates and are not treated as mappings | Need real slugs from reference app/operator review or another source; guessed patterns did not resolve. |
| Broad line search probe | `https://gamma-api.polymarket.com/markets?search=...` | GET | Public provider endpoint | Normalized line-market search queries per backend-shaped target | Ranked candidate `attachReadiness.reasons`, family, relevance report | None unless a candidate passes attach gates; none did | None. Broad candidates are rejected by family/relevance gates | Broad search still returns unrelated markets and is not a safe line mapping source. |

Cycle DB implementation notes:

- This cycle is read-only for provider mapping and DB state.
- The checked surfaces yielded 0 attach-ready line targets; this is documented as a source gap, not a feature-complete line-market claim.
- The existing match-winner provider mapping from Cycle DA remains healthy on Samsung tablet proof.

## Cycle DA - Provider Discovery Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Exact event plus manual slug fallback provider discovery | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: `providerSearchMode=sports-events`, optional `marketId`, optional `maxCandidatesPerMarket` | `providerEventSlugs`, `providerEventSlugSource`, `manualSlugFallbacks`, `manualSlugFallbackCandidateCount`, `providerCandidateFamilySummary`, `targets[].attachProposal`, `attachReadyCandidateCount` | Reads compact `Event`, `Market`, and active `Outcome`; fetches Gamma `/events?slug=...` and exact Gamma `/markets?slug=...`; attach writes `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` | None. Fallback slugs are exact provider slugs and still pass the same family, token, and relevance gates before attach | Need real provider source/slugs for line market families beyond match winner. |
| Provider discovery expansion proof | `scripts/prove_mobile_provider_discovery_expansion.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` | Proof artifact showing initial missing mapping, fallback slugs, 3 attach-ready candidates, attach result, no-fallback refresh, quote snapshots, and CLOB depth rows | Upserts local proof `Event`, `Market`, `Outcome` rows shaped like provider-backed compact markets; uses existing attach and refresh services | No frontend-only fixture. Local proof rows are populated with real Polymarket identity and token IDs before refresh | Production importer should persist trusted provider event slugs and eventually include provider line-market slugs when available. |

Cycle DA implementation notes:

- The manual slug fallback is narrow and match-winner-only: `fifwc-col-gha-2026-07-03-col`, `-draw`, and `-gha`.
- The pass proof attached 3 real provider markets, refreshed 6 outcome quote snapshots, and wrote 246 provider CLOB depth rows without contract-proof fallback.
- Broad Gamma search remains unsafe for automatic line-market attach and is still blocked by the relevance/family gate.

## Cycle CZ - Line Slug Family Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manual exact provider slug review for line markets | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `marketId`, `slugs[]` | `expectedProviderFamily`, `bestCandidate.attachReadiness.expectedFamily`, `candidateFamily`, `reasons[]`, `attachReadyCandidateCount`, `attachProposal` | Reads compact `Event`, `Market`, and active `Outcome`; exact slug data comes from Gamma `/markets?slug=...` | None. Wrong-family exact slugs are rejected before attach; no local fixture counts as provider-backed | Need actual exact provider line slugs or another provider source for production line markets. |
| Line slug family gate proof | `scripts/prove_mobile_provider_line_slug_family_gate.ts` | Local script | Local development only | `--output` | Proof artifact showing accepted same-family total-goals candidate and rejected match-winner candidate for a totals target | In-memory market-shaped target only; does not write DB | No provider identity mutation | Replace synthetic candidate proof with real exact line slug preview when a provider line slug exists. |

Cycle CZ implementation notes:

- The route contract remains protected and read-only for previews.
- `provider_family_mismatch` is additive; relevance and token completeness remain required.
- Generic Over/Under line markets can pass only when the expected family matches and important match tokens overlap.

## Cycle CY - Provider Line Market Availability Diagnostic

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider market-family diagnostics | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Existing discovery params; exact sports-event mode can derive event slug from `Event` data | `providerCandidateFamilySummary`, `providerEventSlugs`, `providerEventSlugSource`, `targets[].attachProposal` | Reads `Event`, compact `Market`, and active `Outcome`; exact provider candidates come from Gamma `/events?slug=...` | None. Missing line families are reported as zero counts; no local line fixture is treated as provider-backed | Need a real source for provider-owned line markets or reviewed exact provider line slugs. |
| Provider line availability proof | `scripts/prove_mobile_provider_line_market_availability.ts` | Local script | Local development only | `--providerEventSlug`, `--output` | Exact event family summary, synthetic Holiwyn-shaped line target search results, attach-ready counts, insufficient-relevance counts, `nextRequiredAction` | Does not write DB. Uses provider candidates plus in-memory line target contracts shaped like `Market.marketType`, `line`, `period`, and `Outcome` identities | None. The script is read-only and must not attach or fabricate provider IDs | Production provider/import path still needs line-market provider identities for spreads, totals, team totals, halves, corners, and props. |

Cycle CY implementation notes:

- Exact event discovery for `fifwc-col-gha-2026-07-03` classified all 3 provider candidates as `match_winner`.
- Broad line searches returned noisy candidates, but the relevance gate kept attach-ready count at 0.
- This is a diagnostic contract improvement, not a claim that line-market provider parity is complete.

## Cycle CX - Provider Event Slug Hint Discovery

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider event slug hint discovery | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: optional `providerEventSlug(s)` override, `providerSearchMode`, `marketId`, `fetchProvider`, `maxCandidatesPerMarket` | `providerEventSlugs`, `providerEventSlugSource`, `targets[].attachProposal`, `attachReadyCandidateCount`, `nextRequiredAction` | Reads `Event.externalSlug`, `Event.externalEventId`, `Event.source`, `Event.metadata`, compact `Market`, and active `Outcome`; does not write DB | None. Exact provider event hints only narrow provider search; candidates still must pass relevance and token completeness | Need provider event slug metadata on all imported World Cup fixtures; line markets still need provider slugs when available. |
| Event-derived provider attach proof | `scripts/prove_mobile_provider_sports_event_discovery.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` for setup; discovery call intentionally omits `providerEventSlugs` | Proof requires `providerEventSlugSource=event`, `providerEventSlugs[]`, 3 attach-ready markets, no-fallback refresh, and depth rows | Upserts a local proof `Event` with provider event metadata, compact `Market` rows, active `Outcome` rows; writes provider IDs through existing attach service | No frontend-only fixture. Local rows are provider-shaped and then populated with real Polymarket token IDs | Replace proof setup with production importer that persists exact provider event slugs for real World Cup fixtures. |

Cycle CX implementation notes:

- Request-provided provider event slugs still override event-derived hints for manual audit work.
- If an exact event hint is available, discovery uses `/events?slug=...` without broad tag discovery, so high-volume unrelated World Cup futures are not mixed into the focused live-match proof.
- The relevance gate from Cycle CV remains required before any attach proposal is considered ready.

## Cycle CV - Provider Candidate Relevance Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider candidate discovery safety gate | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: `marketId`, `fetchProvider`, `maxCandidatesPerMarket` | `targets[].bestCandidate.attachReadiness.reasons`, `attachReadiness.relevance`, `attachReadyCandidateCount`, `providerErrorCount`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome`; does not write DB | None. Real provider search is allowed, but unrelated candidates are reported as not attach-ready | Real matching World Cup soccer provider slugs/token IDs remain missing. |
| Manual slug preview safety gate | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `marketId`, `slugs[]` | Same candidate `attachReadiness` and `relevance` fields before any attach proposal can be used | Reads compact market/outcome identity only; attach still happens through `/provider-mapping` | No automatic attach. Even exact slugs must pass relevance and token completeness | Need reviewed exact soccer market slugs when provider search is noisy. |

Cycle CV implementation notes:

- A candidate can no longer be attach-ready only because it has `conditionId`, `externalMarketId`, `externalSlug`, and token IDs.
- The relevance report records `matchedImportantTokens`, `outcomeNameMatches`, required outcome matches, and score.
- The proof used real provider search and found 42 candidates, all rejected for relevance or outcome-shape mismatch.

## Cycle CU - Provider CLOB Depth Fetcher

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Real provider CLOB refresh for compact live markets | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | `refresh.providerDepth.generatedAt`, `source=polymarket-clob`, `requestedMarketCount`, `refreshedCount`, `depthRowsUpdated`, `skippedCount`, `refreshed[]`, `skipped[]`; post-refresh live-detail/orderbook cache invalidation remains owned by the route | `Event`, provider-mapped compact `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | No frontend-only mock. The route fetches real provider CLOB data for mapped markets; disposable proof uses real provider identity on local proof rows | Real World Cup compact soccer markets still need provider mapping before this can cover production soccer events. |
| Selected Book after CLOB refresh | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `depthSource=provider-orderbook-depth`, `depthReason`, `providerOrderbookDepth.status`, `levelCount`, `snapshotCount`, `sources`, `bids[]`, `asks[]`, `levels[]` | Reads local `Order` rows first, then `ReferenceOrderbookDepthSnapshot` rows written by the CLOB fetcher, then `ReferenceQuoteSnapshot` top-quote fallback | No arbitrary local UI data. If CLOB rows are absent, the route truthfully falls back to provider quote top-of-book or empty state | Retention/cleanup of old provider depth snapshots remains open. |
| External provider order book dependency | `https://clob.polymarket.com/book?token_id=...` | GET | Public provider endpoint | Query string `token_id` from `Outcome.referenceTokenId` | Provider `bids[]` and `asks[]` price/size rows plus provider timestamp when present | Requires `Market.referenceSource=polymarket`, `Market.externalSlug`, and complete active outcome `referenceTokenId` values | Unit tests mock this provider endpoint; production refresh uses live fetch | Need production error taxonomy and retry policy beyond the current skipped/error report. |

Cycle CU implementation notes:

- The CLOB fetcher writes `ReferenceOrderbookDepthSnapshot.source=polymarket-clob`.
- Row freshness uses refresh time so route precedence is stable even when the provider book timestamp is older than the current process time; provider timestamp is still reported in refresh diagnostics.
- Cycle CU closes the real provider-owned depth fetcher gap for mapped markets, not the real World Cup provider-mapping gap.

## Cycle CT - Provider Orderbook Depth Snapshot Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider ladder-backed selected Book | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `depthSource=provider-orderbook-depth`, `depthReason`, `providerOrderbookDepth.status`, `levelCount`, `snapshotCount`, `sources`, `levels[]`, `bids[]`, `asks[]` | `ReferenceOrderbookDepthSnapshot`, `Market`, `Outcome`, existing local `Order` rows, `ReferenceQuoteSnapshot` fallback | No frontend-only mock. Proof rows use the same `ReferenceOrderbookDepthSnapshot` shape intended for future provider ingestion | Real provider CLOB fetcher is still missing. Real World Cup compact markets still need provider mapping. |
| Compact live-detail provider ladder summary | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].providerOrderbookDepth`, `markets[].orderbookDepthSource`, `contract.batchedProviderOrderbookDepthSource`, ready/stale/refresh-due counts | Same provider depth table plus compact selected `Market`/`Outcome` rows | No mobile local fixture. The adapter continues to consume backend route depth | The UI does not yet display a provider-specific ladder source label; it shows route depth. |

Cycle CT implementation notes:

- `ReferenceOrderbookDepthSnapshot` stores durable provider ladder rows separately from local orders and top-quote snapshots.
- `buildPublicOrderbookSnapshot()` source precedence is now local orders, provider ladder snapshots, provider quote top-of-book estimates, then empty.
- Local proof applied the Cycle CT SQL directly because the workstation database has migration-history drift.

## Cycle CS - Provider Quote Top-Of-Book Depth Bridge

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider quote top-of-book depth bridge | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `depthSource`, `depthReason`, `providerQuoteDepth.levelCount`, `providerQuoteDepth.sizeSource`, `providerQuoteDepth.isEstimatedSize`, `emptyState`, `levels[]`, `bids[]`, `asks[]`, `providerQuoteSnapshot.status` | Reads local open `Order` rows first; if no local ladder exists, reads `ReferenceQuoteSnapshot.bestBid`, `bestAsk`, `liquidityClob`, `liquidity`, `volume24hr`, and `volume` | No frontend-only mock. Provider top levels are generated only when provider snapshots expose prices plus liquidity/volume basis; otherwise the route keeps `emptyState=no-depth` | Full provider CLOB depth ladder is still missing. Cycle CS exposes truthful top-of-book provider quote depth only. |
| Server-hydrated EventDetail depth state | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].orderbookDepth[]`, `markets[].outcomes[].bestBidSize`, `bestAskSize`, selected event `orderbookDepthSource=orderbook-route`, `orderbookDepthStatus=ready`, `orderbookAvailability` | Same selected `Market`, `Outcome`, `ReferenceQuoteSnapshot`, and local `Order` rows | No mobile local fixture. Adapter preserves backend route depth when route returns it | Samsung tablet proof passed for the scoped provider quote bridge after reconnect. |

Cycle CS implementation notes:

- The provider quote depth bridge is intentionally labeled `provider-quote-snapshot`, not full provider orderbook depth.
- Size is estimated from provider liquidity fields and exposed through `providerQuoteDepth.isEstimatedSize=true`.
- Route proof and Samsung tablet proof passed for the scoped provider quote bridge.

## Cycle CR - Provider-Owned Refresh And Cache Invalidation

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Real provider-owned compact live refresh | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | `refresh.provider.attempted`, `refresh.providerMappedMarketCount`, `refresh.provider.snapshotsUpdated`, `refresh.provider.refreshedCount`, `refresh.provider.skippedCount`, `refresh.contractProofFallback.applied`, `refresh.postRefresh.readyCount`, `refresh.postRefresh.staleCount`, `refresh.postRefresh.refreshDueCount`, `cacheInvalidation.invalidated`, `cacheInvalidation.errors` | Reads `Event`, compact `Market`, active `Outcome`; writes `ReferenceQuoteSnapshot`; calls Polymarket Gamma using provider-owned `Market.externalSlug` / `externalMarketId` and `Outcome.referenceTokenId` identity | Explicit fallback remains opt-in. Cycle CR proof used `allowContractProofFallback=false`, so no local contract-proof fallback was applied | Real World Cup compact soccer event still lacks provider mappings for all compact markets; proof used a disposable mapped provider market. |
| Refreshed compact live-detail consumption | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedProviderQuoteSnapshotReadyCount`, `batchedProviderQuoteSnapshotStaleCount`, `batchedProviderQuoteSnapshotRefreshDueCount`, `markets[].providerQuoteSnapshot.status`, `shouldRefresh`, `refreshKey`, provider best bid/ask fields surfaced by mobile | Reads `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, and local order/depth data where available | No frontend-only mock. Missing rows report unavailable/stale instead of fake readiness | Provider-owned quote snapshots do not currently create local orderbook depth ladders. |
| Selected orderbook after provider refresh | `/api/orderbook/:marketId/book?maxLevels=2` | GET | Optional public viewing | None | `providerQuoteSnapshot.status`, `shouldRefresh`, `refreshKey`, `snapshotCount`, `bestBid`, `bestAsk`, `levels[]`, `emptyState` | Reads selected `Market`, `Outcome`, `ReferenceQuoteSnapshot`, and open `Order` rows for local ladder depth | No fake depth is created; Cycle CR tablet proof shows provider best bid/ask with no local depth | Need a future provider/orderbook bridge if product requires provider-owned depth ladders, not only top quote snapshots. |
| Disposable provider proof setup | `scripts/prepare_mobile_provider_refresh_proof_event.ts` | Local script | Local development only | Optional `--providerSlug`, `--eventSlug`, `--output` | Proof artifact with `eventSlug`, `providerSlug`, `eventId`, `marketId`, `conditionId`, `outcomeCount`, `snapshotCount`, `staleFetchedAt` | Upserts disposable `Event`, `Market`, `Outcome`, and stale `ReferenceQuoteSnapshot` rows using real Gamma market identity | Fixture rows match the provider data contract and are intentionally disposable | Replace disposable proof setup with real World Cup provider import once soccer market provider slugs are confirmed. |

Cycle CR implementation notes:

- The provider refresh route now owns cache invalidation for the compact live-detail route, public event route, and affected orderbook routes through `next/cache` `revalidatePath`.
- The response is marked `no-store` so the refresh result itself is not cached.
- The proof route changed from stale/refresh-due to ready after real provider refresh, with `fallbackApplied=false`.

## Cycle CQ - Manual Provider Slug Preview Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manual compact-market provider slug preview | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `marketId`, `slugs[]` | `mode`, `marketId`, `requestedSlugs`, `providerError`, `candidateCount`, `bestCandidate`, `attachProposal`, `attachReadyCandidateCount`, `nextRequiredAction` | Reads compact `Event`, `Market`, `Outcome`; provider preview uses Polymarket Gamma `/markets?slug=...`; does not write DB | None. The route returns explicit provider errors instead of fake candidates | Current proof environment still returns `fetch failed` for Gamma fetch, so real provider candidate preview remains open. |

Cycle CQ implementation notes:

- The route is protected because successful previews can expose provider market IDs, condition IDs, and token IDs.
- The route is read-only and prepares data for the existing provider identity attach endpoint.

## Cycle CP - Provider Candidate Discovery Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider candidate discovery | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: `marketId`, `fetchProvider`, `maxCandidatesPerMarket` | `result.targets[].queries`, `candidateCount`, `providerError`, `candidates[]`, `bestCandidate`, `attachProposal.mapping`, `attachReadyCandidateCount`, `nextRequiredAction` | Reads compact `Event`, `Market`, `Outcome`; provider search uses Polymarket Gamma `/markets` and maps candidate fields to the existing attach contract shape | `fetchProvider=false` returns query contract only and does not call Gamma | In this run, provider fetch returned `fetch failed` for all 14 compact targets. Real provider identity import remains open. |

Cycle CP implementation notes:

- The route is protected because it can expose provider identity candidates and token IDs.
- The route never mutates `Market`, `Outcome`, or `ReferenceQuoteSnapshot`; it only prepares reviewable candidate and attach-proposal data.

## Cycle CO - Provider Identity Attach Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider identity attach | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | `dryRun`, `confirmApply`, `mappings[].marketId`, `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `mappings[].outcomes[].outcomeId`, `referenceTokenId`, `referenceOutcomeLabel` | `result.validation.valid`, `errors[]`, `before.providerRefreshableMarketCount`, `after.providerRefreshableMarketCount`, `applied` | `Event`, compact `Market`, active `Outcome`; writes `Market.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, `referenceOutcomeLabel` only when confirmed | Dry-run projection uses future-backend-shaped IDs and does not mutate local DB | Real provider candidate discovery/import for every compact World Cup live market remains missing. |

Cycle CO implementation notes:

- POST defaults to dry-run to prevent accidental fake provider mapping.
- A real write requires `dryRun=false` plus `confirmApply=true`, and each mapped compact market must include every active compact outcome.

## Cycle CN - Provider Mapping Readiness Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider mapping readiness | `/api/mobile/events/:slug/provider-mapping` | GET | Internal admin key or admin session | None | `readiness.compactMarketCount`, `providerRefreshableMarketCount`, `unsupportedSourceMarketCount`, `missingOutcomeTokenMarketCount`, `isProviderRefreshReady`, `nextRequiredAction`, `markets[].missingFields`, `markets[].outcomes[].missingFields` | `Event`, compact `Market`, active `Outcome`; required provider fields are `Market.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, and `referenceOutcomeLabel` | None. The route is a readiness gate and must not fabricate provider identity. | Current local World Cup compact event has 14 compact markets but 0 provider-refreshable markets. |
| Compact live provider refresh blocked state | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | optional `allowContractProofFallback` | `refresh.mappingReadiness`, `providerMappedMarketCount`, `unsupportedMarketCount`, `provider.attempted`, `contractProofFallback` | Same compact `Market`/`Outcome` identities plus `ReferenceQuoteSnapshot` when refresh can run | Fallback remains opt-in and was not used in the no-fallback proof | Real no-fallback refresh still requires imported Polymarket or production sports-provider market/outcome identities. |

Cycle CN implementation notes:

- The mapping readiness route is protected because it exposes provider identity and missing provider-token fields.
- This cycle is intentionally a structural gate. It prevents UI parity cycles from claiming provider readiness while compact live markets remain unmapped.

## Cycle CM - Provider Refresh Execution Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider refresh execution | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | `expireFirst`, `staleSeconds`, `allowContractProofFallback` | `expired.expiredSnapshotCount`, `refresh.provider.attempted`, `snapshotsUpdated`, `unsupportedMarketCount`, `contractProofFallback`, `postRefresh.snapshotCount` | `Event`, compact `Market`, `Outcome`, `ReferenceQuoteSnapshot`; real refresh path uses Polymarket Gamma via `refreshPolymarketReferenceSnapshots()` | Explicit `allowContractProofFallback=true` can upsert future-backend-shaped rows only for local QA after the real provider mapping is reported unsupported | Current local World Cup compact event has `referenceSource=fifa_schedule`, so real Polymarket Gamma mapping is missing. |
| Live-detail stale-to-ready proof | `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book?maxLevels=2` | GET | Optional public viewing | None | `batchedProviderQuoteSnapshotReadyCount`, `StaleCount`, `RefreshDueCount`, selected `providerQuoteSnapshot.status`, `shouldRefresh`, `refreshKey` | Same `ReferenceQuoteSnapshot` rows and selected `Order` depth rows | No frontend-only mock data; fallback writes the same provider snapshot table shape | Real provider refresh cannot complete until compact markets are imported/mapped from Polymarket or another sports odds provider. |

Cycle CM implementation notes:

- The route is protected because provider refresh mutates backend snapshot state.
- This cycle proves cache invalidation and refresh-state transitions, but it does not claim full real-provider parity for the local fixture event.

## Cycle CL - Provider Refresh Policy Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live-detail provider refresh policy | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedProviderQuoteSnapshotReadyCount`, `batchedProviderQuoteSnapshotStaleCount`, `batchedProviderQuoteSnapshotRefreshDueCount`, `batchedProviderQuoteSnapshotNextRefreshAt`, plus existing provider snapshot source/count | `ReferenceQuoteSnapshot` rows joined to compact `Market`/`Outcome` pairs | If snapshot rows are absent, counts remain zero and per-market snapshots report unavailable with `shouldRefresh=true` | Real provider-owned refresh execution, cache invalidation, and external error classification. |
| Selected orderbook provider refresh policy | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `providerQuoteSnapshot.refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, `refreshKey`, `status`, `stalenessSeconds`, `levels[]` | `ReferenceQuoteSnapshot`, `Market`, `Outcome`, open `Order` rows | Deterministic local proof rows are future-backend-shaped and keyed by `marketId`/`outcomeId`/`source`; route stays truthful when rows are missing or stale | Real external provider ingestion should update rows continuously and own invalidation/update sequence. |
| Provider refresh policy proof | `mobile:live-provider-quote-snapshot-seed` plus direct route probe | Local script / GET routes | Local development only | `--eventSlug`, `--summaryPath`, `--apply` | Seed artifact plus route proof showing 14 ready markets, refresh TTL 60s, next-refresh timestamp, and selected second-half book policy | `ReferenceQuoteSnapshot` | N/A | Replace deterministic proof rows with real provider feed once production ingestion is in scope. |

Cycle CL implementation notes:

- This cycle does not invent frontend-only refresh state; it exposes refresh policy from backend-shaped provider snapshot rows.
- It is still a partial PM-GAP-067 pass because the actual provider refresh worker/cache invalidator does not exist yet.

## Cycle CK - Live Provider Quote Snapshot Ready Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live-detail provider snapshot ready proof | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedProviderQuoteSnapshotSource`, `contract.batchedProviderQuoteSnapshotMarketCount`, `markets[].providerQuoteSnapshot.status`, `snapshotCount`, `acceptingOrders` | `ReferenceQuoteSnapshot` rows seeded for compact `Market`/`Outcome` pairs | Deterministic local rows are future-backend-shaped and keyed by `marketId`, `outcomeId`, and `source` | Real external provider ingestion/refresh still missing. |
| Selected second-half orderbook provider snapshot ready proof | `/api/orderbook/:marketId/book?maxLevels=2` | GET | Optional public viewing | None | `providerQuoteSnapshot.source`, `status`, `snapshotCount`, `latestFetchedAt`, `acceptingOrders`, `levels[]` | Same `ReferenceQuoteSnapshot` rows plus open `Order` rows for depth | If snapshot rows are absent, route truthfully reports `unavailable`; Cycle CK proves the ready path | Provider cache invalidation/update sequence and provider-owned depth ladders remain missing. |
| Provider-shaped proof seed | `mobile:live-provider-quote-snapshot-seed` | Local script | Local development only | `--eventSlug`, `--summaryPath`, `--apply` | Summary artifact: compact market count, provider snapshot row count, upsert count, market preview | `ReferenceQuoteSnapshot`, compact live `Market`, active `Outcome` | N/A | Replace deterministic proof rows with real provider refresh when external ingestion is in scope. |

Cycle CK implementation notes:

- This cycle proves the same contract added in Cycle CJ can move into a ready state for all 14 compact live markets.
- It does not mark backend provider parity complete because the rows are deterministic local proof data.

## Cycle CJ - Provider Quote Snapshot Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected orderbook provider snapshot status | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `providerQuoteSnapshot.source`, `status`, `snapshotCount`, `latestFetchedAt`, `latestUpdatedAt`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `acceptingOrders`, `outcomeIds`, `sources`, `reason` | `ReferenceQuoteSnapshot` joined by `marketId` and optional `outcomeId`; existing open `Order` rows for depth | If no provider rows exist, route returns `status: unavailable` rather than fake readiness | Provider ingestion must write current World Cup live quote snapshots. |
| Compact live-detail provider snapshot status | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].providerQuoteSnapshot`, `contract.batchedProviderQuoteSnapshotSource`, `contract.batchedProviderQuoteSnapshotMarketCount` | Compact `Market` rows, active `Outcome` rows, open `Order` rows, optional `ReferenceQuoteSnapshot` rows | Existing local/proof depth still renders; provider snapshot metadata can be unavailable | Provider-owned cache/invalidation and live liquidity remain missing. |

Cycle CJ implementation notes:

- This cycle uses the existing `ReferenceQuoteSnapshot` schema instead of inventing frontend-only provider state.
- The public route intentionally excludes sensitive/provider-internal fields such as token IDs, external market IDs, condition IDs, credentials, owners, and users.

## Cycle CI - Depth Batching Policy Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live-detail depth policy metadata | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.generatedAt`, `contract.maxMarkets`, `contract.marketCount`, `contract.batchedOrderbookDepthRequestedMarketCount`, `contract.batchedOrderbookDepthRequestedMarketIds`, `contract.batchedOrderbookDepthMaxLevels`, `contract.batchedOrderbookDepthCacheTtlSeconds`, plus existing `markets[].orderbookDepth[]` and outcome quote fields | Selected compact `Market` rows, active `Outcome` rows, open `Order` rows through `buildPublicOrderbookSnapshot()` | Local rows still render without provider depth; policy metadata stays present for route-backed compact responses | Real provider cache/invalidation layer, provider snapshot status per market depth response, and provider-owned liquidity ingestion remain missing. |
| Visible depth regression proof | Samsung tablet smoke against server-backed live detail | GET / device proof | Optional public viewing | None | `event-detail-market-depth-second-half-winner`, `market-depth-batched`, selected orderbook `orderbook-source-orderbook-route` | Same as above, with selected second-half market `ed121b08-88bd-4735-9793-64a0022e9696` | N/A | Need provider-scale batching/prefetch implementation behind the documented policy shape. |

Cycle CI implementation notes:

- This cycle reduces PM-GAP-067's repeated production batching/prefetch debt by defining and testing route-level limits, requested market IDs, max depth levels, generated time, and TTL.
- It does not mark backend parity complete because the route still uses current route-backed/local open orders rather than a provider cache with invalidation.

## Cycle CH - Batched Live Market Depth Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live market depth batching | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedOrderbookDepthSource`, `contract.batchedOrderbookDepthMarketCount`, `markets[].liquidity`, `markets[].orderbookDepth[]`, `markets[].outcomes[].bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize` | Selected compact `Market` rows, active `Outcome` rows, open `Order` rows through `buildPublicOrderbookSnapshot()` | Local rows still render without `Route depth` when no server depth exists | Provider-owned liquidity ingestion and production-scale batching/prefetch policy remain missing. |
| Visible row batched-depth proof | Samsung tablet smoke against server-backed live detail | GET / device proof | Optional public viewing | None | `event-detail-market-depth-second-half-winner`, `market-depth-batched`, selected orderbook `orderbook-source-orderbook-route` | Same as above, with selected second-half market `ed121b08-88bd-4735-9793-64a0022e9696` | N/A | Need all visible provider markets to have live provider liquidity, not only seeded proof markets. |

Cycle CH implementation notes:

- This cycle closes a structural gap: compact live-detail no longer limits route-backed depth to the primary market.
- Direct route probe showed 14 compact markets and 6 markets with batched route-backed depth in local proof data.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats only if product keeps that tab, production batching/prefetch, and provider-wide liquidity for all line markets.

## Cycle CG - Second-Half Orderbook Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected second-half orderbook proof | `/api/orderbook/:marketId/book?maxLevels=24` for second-half winner market `ed121b08-88bd-4735-9793-64a0022e9696` | GET | Optional public viewing | None | `marketId`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `availability.status` | Open `Order` rows from deterministic depth seed, selected `Market(period=second-half)`, active `Outcome` rows | N/A | Provider-owned live liquidity remains required before backend parity can be marked complete. |
| Second-half seed/proof harness | `mobile:live-second-half-orderbook-depth-seed` and `smoke:tablet:server-live-second-half-order-book` | Local scripts / device proof | Local development only | `--eventSlug`, `--period=second-half`, `--summaryPath`, `--apply` | Summary artifact records event, market id, market type, period, outcome ids, created order count, and depth preview | `Market`, `Outcome`, `User`, `Order` | N/A | Real provider market discovery/ingestion should own second-half pricing and market freshness. |

Cycle CG implementation notes:

- This cycle closes the repeated second-half separate depth proof debt left by Cycle CF.
- Halves orderbook parity is now proven for both first-half and second-half selected period markets.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats, production batching/prefetch, and provider-wide liquidity for all line markets.

## Cycle CF - Halves Orderbook Depth Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live first/second-half winner markets | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].id`, `marketType: match_winner_1x2`, `period: first-half/second-half`, `marketGroupKey: halves`, `availability`, `outcomes[]` | `Event`, `Market.period`, `Market.marketGroupKey`, `Outcome`, `Market.sourceUpdatedAt` | Local Halves rows remain fallback-only when server markets are unavailable | Real provider market discovery/ingestion should create/update half-period markets. |
| Selected first-half orderbook proof | `/api/orderbook/:marketId/book?maxLevels=24` for first-half winner market `be4ab6f8-c054-4f6b-a6d9-7d857f7655ca` | GET | Optional public viewing | None | `marketId`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `availability.status` | Open `Order` rows from deterministic depth seed, selected `Market`, active `Outcome` rows | N/A | Provider-owned live liquidity remains required before backend parity can be marked complete. |
| Halves seed harness | `mobile:live-halves-markets-seed` and `mobile:live-first-half-orderbook-depth-seed` | Local scripts | Local development only | `--eventSlug`, `--period=first-half`, `--summaryPath`, `--apply` | Summary artifacts record event, half markets, market ids, period, outcome ids, order depth preview | `Market`, `Outcome`, `User`, `Order` | N/A | Current database lacks a usable `Outcome(marketId, code)` conflict target, so the seed uses find-then-update. Production migration should confirm the intended constraint. |

Cycle CF implementation notes:

- This cycle closes the selected Halves proof item that was repeatedly deferred under PM-GAP-067.
- Halves are now backend-shaped and period-addressable instead of ad hoc local UI rows.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats, production batching/prefetch, and all-line provider liquidity. Second-half separate depth proof is closed in Cycle CG.

## Cycle CE - Compact Market Availability Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible live line-market availability | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].availability.source`, `status`, `marketStatus`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, `reason`; existing market `id`, `marketType`, `period`, `line`, outcomes | `Market.status`, `Market.sourceUpdatedAt`, `Market.updatedAt`, `Market`, `Outcome`; selected primary depth still uses open `Order` rows | Local fixtures may omit availability; server mode uses route-shaped `availability` when present | Real provider heartbeat/ingestion must update per-market timestamps/status before fresh provider parity can pass. |
| Team Totals pre-open availability proof | Samsung tablet smoke against server-backed live detail | GET / device proof | Optional public viewing | None | `event-detail-market-availability-team-total-goals`, `market-availability-stale`, `market-status-LIVE`, selected book `orderbook-availability-stale` | Same as above plus selected Team Totals orderbook rows | N/A | Provider-owned availability and all-line refresh remain missing. |

Cycle CE implementation notes:

- This cycle closes the repeated compact-route per-visible-market availability gap without inventing frontend-only state.
- The fixture/proof shape matches the intended backend contract, so future provider ingestion can replace the timestamp source without changing the mobile UI contract.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats, selected Halves proof, and provider-wide live liquidity.

## Cycle CD - Selected Orderbook Availability Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected market orderbook availability | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Optional public viewing | None | `availability.source`, `status`, `marketStatus`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, `reason`; existing `levels[]` depth | `Market.status`, `Market.sourceUpdatedAt`, `Market.updatedAt`, open `Order` rows | Existing fallback orderbook data remains display-only when server mode is unavailable; server mode now exposes selected-market availability | External provider heartbeat/ingestion should own `sourceUpdatedAt` updates before production parity. |
| Selected Team Totals stale-state proof | `/api/orderbook/408ffb79-3492-4fd0-b31b-87a26f8b9dd5/book?maxLevels=2` and tablet smoke | GET / device proof | Optional public viewing | None | `availability.status: stale`, `marketStatus: LIVE`, route-backed bid/ask levels | Same as above | N/A | Need provider refresh path to turn stale live line books into ready/fresh state. |

Cycle CD implementation notes:

- This cycle closes the selected-market availability contract gap without pretending stale data is fresh.
- The proof shows a Polymarket-like distinction: the Team Totals market has depth but its source timestamp is stale.
- PM-GAP-067 remains open for real provider ingestion, per-line provider status sourced externally, provider-owned live stats, and broader liquidity.

## Cycle BC - Live Provider Freshness Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event provider freshness | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `event.liveDataStatus.source`, `status`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, `reason`; `contract.liveDataStatus` | `MarketOutcomeSnapshot` rows provide proof timestamps; `Event.metadata.mobileLiveDetail.liveDataStatus` can override provider state | If no timestamp or metadata exists, route returns `status: unavailable` instead of inventing fresh data | Real provider heartbeat/ingestion route and per-market/per-line availability fields remain missing. |
| Live game UI freshness proof | Server-backed mobile event detail | Client render | Optional viewing | None | Mobile `Event.liveDataStatus` displayed as `event-detail-live-data-inline live-data-status-* live-data-source-*` | Same route contract | Local event fixtures only omit this field; server mode displays it when present | Per-market status beside each adjustable line remains future work. |

Cycle BC implementation notes:

- This cycle closes the repeated unknown-contract part of provider freshness for live event detail.
- The contract is future-backend-shaped and uses stable fields that can be replaced by provider ingestion later.
- PM-GAP-067 remains in progress for real provider ingestion, provider-owned live stats, per-line freshness, and all-line liquidity.

## Cycle BB - Selected Team Totals Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected Team Totals orderbook with ready depth | `/api/orderbook/:marketId/book?maxLevels=24` for market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5` | GET | Optional public viewing | None | `marketId`, `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | Open `Order` rows for selected `team_total_goals` market through `buildPublicOrderbookSnapshot()` | Local Team Total rows remain fallback only when server mode is unavailable | Real provider liquidity ingestion and freshness/stale/suspended metadata remain missing. |
| Team Totals market-type normalization | Compact live event markets from `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | backend `marketType: team_total_goals`, `line: 1.5`, outcome ids/sides/prices | `Market`, `Outcome` | Adapter aliases backend type to mobile `team-total` contract | Canonical market-type alias list should be documented before production ingestion. |
| Targeted Team Totals depth seed harness | `mobile:live-team-totals-orderbook-depth-seed` | Local script | Local development only | `--eventSlug`, `--marketType=team_total_goals`, `--line=1.5`, `--summaryPath`, `--apply` | Summary artifact records event, market id/type/group/line, outcome ids, created order count, and preview rows | `User`, `Order`, `Market`, `Outcome` | N/A | Provider-owned live liquidity remains required for production parity. |

Cycle BB implementation notes:

- This cycle closes selected Team Totals ready-depth proof after Cycle BA reserved Team Totals in the compact route.
- The proof uses stable backend market/outcome ids and public orderbook route fields, not frontend-only mock data.
- PM-GAP-067 remains in progress for provider ingestion, Halves selected depth, and freshness/stale/suspended states.

## Cycle BA - Compact Line Group Coverage And Totals Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live game line group coverage | `/api/mobile/events/:slug/live-detail` | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `markets[].id`, `marketType`, `marketGroupKey`, `line`, `period`, `outcomes[]`; route now reserves representative primary, Spread, Totals, and Team Total markets | `Event`, `Market`, `Outcome`; selected compact markets are still capped by mobile payload budget | Local line groups remain fallback only when server mode is unavailable | Provider/live availability states and broader market pagination remain missing. |
| Selected Totals line orderbook with ready depth | `/api/orderbook/:marketId/book?maxLevels=24` for market `a552efe6-3147-4573-be95-8fe15c068c08` | GET | Optional public viewing | None | `marketId`, `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | Open `Order` rows for the selected `total_goals` market through `buildPublicOrderbookSnapshot()` | Existing local Totals rows are only display fallback; server proof uses backend `total_goals` market identity | Real provider liquidity ingestion, market freshness, and selected Team Total/Halves depth proof remain missing. |
| Targeted Totals depth seed harness | `mobile:live-totals-orderbook-depth-seed` | Local script | Local development only | `--eventSlug`, `--marketType=total_goals`, `--line=2.5`, `--summaryPath`, `--apply` | Summary artifact records event, market id/type/group/line, outcome ids, created order count, and preview rows | `User`, `Order`, `Market`, `Outcome` | N/A | Provider-owned live liquidity remains required for production parity. |

Cycle BA implementation notes:

- This cycle fixes a backend/mobile contract mismatch: the server used `total_goals`, while the UI group is labeled Totals.
- The compact route now keeps representative rendered line groups instead of spending the whole cap on many Spread rows.
- PM-GAP-067 remains in progress because seeded Totals depth is proof data, not external provider liquidity.

## Cycle AZ - Selected Line Market Seeded Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected Spread line orderbook with ready depth | `/api/orderbook/:marketId/book?maxLevels=24` for market `ac527022-07f3-4abb-90f0-b291466e8459` | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `marketId`, `generatedAt`, `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | `Market`, `Outcome`, open `Order` rows created by the deterministic seed harness and read through `buildPublicOrderbookSnapshot()` | Existing local/embedded depth remains fallback only when server mode or route depth is unavailable | Real provider liquidity ingestion and freshness/stale/suspended metadata for all line markets remain missing. |
| Targeted line-depth seed harness | `mobile:live-spread-orderbook-depth-seed` running `scripts/seed_mobile_live_orderbook_depth.ts --marketType=spread --line=1.5` | Local script | Local development only | Optional `--eventSlug`, `--marketId`, `--marketType`, `--line`, `--summaryPath`, `--apply` | Summary artifact records event id/slug/title, selected market id/title/type/group/line, outcome ids, created/deleted order counts, and preview bid/ask rows | `User`, `Order`, `Market`, `Outcome` | N/A | Provider-owned orderbook ingestion remains required before backend parity can be marked complete. |

Cycle AZ implementation notes:

- This cycle uses backend-shaped proof liquidity: every displayed bid/ask row maps to stable `marketId`, `outcomeId`, `side`, `price`, `shares`, and `total` fields from the public orderbook route.
- The tablet proof moves the selected Spread line market from `empty/no-depth` to `ready` route-backed depth while preserving selected market identity.
- PM-GAP-067 remains in progress because the real route/schema/provider pipeline still needs continuous live liquidity and availability state across all line-market groups.

## Cycle AY - Selected Line Market Depth Identity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected live line market order book | `/api/orderbook/:marketId/book?maxLevels=24` through `PolyApi.getOrderbook()` and `loadMarketDepthState(api, event, marketId)` | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `marketId`, `generatedAt`, `emptyState`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | `Market`, `Outcome`, open `Order` rows through `buildPublicOrderbookSnapshot()` | UI keeps showing the selected market and truthful route empty state when no backend depth exists | Seeded/provider liquidity is still missing for most spread/totals/team-total line markets. |
| Live game order-book state identity | Client state plus orderbook route | Client state -> GET | Optional viewing | None | `orderbookDepthMarketId`, `orderbookDepthSource`, `orderbookDepthStatus`, `orderbookDepthEmptyState` | Same orderbook route plus selected mobile `Market.id` | Local fixtures remain fallback only when server mode is unavailable | Need on-demand depth hydration for every market group and a provider/source freshness model before production parity. |

Cycle AY implementation notes:

- This cycle closes a repeated structural ambiguity: the app can now prove which market id its order-book state belongs to.
- Empty depth is a valid backend state and is now visible for unseeded line markets instead of falsely reusing primary-market route depth.
- Backend parity is still incomplete until real or seeded liquidity exists for line markets beyond the primary winner market.

## Cycle AX - Compact Live Detail Route And Route-Backed Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live game detail | `/api/mobile/events/:slug/live-detail` through `PolyApi.getEvent()` compact-first fallback | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `event.id`, `event.slug`, `event.title`, `event.status`, `event.startsAt`, `event.teams[]`, `event.liveStats`, `event.chartHistory[]`, `markets[]`, `marketGroupId`, `marketType`, `period`, `line`, `outcomes[]`, outcome `id`/`side`/`probability`/`bestBid`/`bestAsk`, primary-market `orderbookDepth[]`, and `contract` metadata | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot`, open `Order` rows through `buildPublicOrderbookSnapshot()` | Falls back to legacy `/api/events/:slug` if compact route fails; local fixtures remain last-resort app fallback | Real provider ingestion, provider-owned live stats, event-wide depth hydration, and richer suspended/stale states remain missing. |
| Live orderbook depth in game page | Embedded primary market `orderbookDepth[]` from the compact route | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total`; EventDetail derives best bid/ask/spread and orderbook rows | `Order`, `Market`, `Outcome` | Existing fixture depth uses the same outcome-addressable shape | Full per-market depth on every compact market is intentionally not embedded yet; dedicated book route remains available for deeper views. |
| Backend event launch proof | Expo deep link `forceBackendEventSlug=<slug>` then `PolyApi.getEvent(slug)` | Client launch -> GET | Optional viewing; server mode uses API base URL | None | Compact route result normalized into selected event/ticket state | Same as compact live detail route | If compact route fails, `PolyApi.getEvent()` falls back to legacy route | Production/native route restoration should be revisited when Holiwyn moves from Expo Go to dev build/APK. |

Cycle AX implementation notes:

- This cycle closes the repeated mobile payload/depth proof gap for PM-GAP-067: the tablet now proves route-backed live orderbook depth on the actual game page instead of only backend route tests.
- The compact route avoids heavy quote fan-out by hydrating depth for the selected primary market and capping the market list to a mobile-sized subset.
- Backend parity is still not complete until real live-football provider data populates live stats, chart history, and market availability states continuously.

## Cycle AU - Live Chart Route States

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live game chart lifecycle state | `/api/markets/:marketId/chart?range=<1D\|1W>` through `PolyApi.getMarketChart()` | GET | Optional for public markets; bearer token may be sent by runtime client | None | `range`, `lastUpdated`, `emptyState`, `history[].outcomeId`, `history[].timestamp`, `history[].probability` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, market visibility guard | Embedded/local chart history remains visible, but route status is now explicit as `loading`, `empty`, or `error` | Real provider ingestion and a live server-hydrated device proof are still missing. |

Cycle AU implementation notes:

- This cycle closes the silent-fallback part of the chart route gap: empty/error/loading route states are now user-visible and XML-auditable.
- No new schema or route is required for the basic lifecycle contract because `/api/markets/:marketId/chart` already exposes `emptyState`, `range`, and `lastUpdated`.
- Server proof still needs the Cycle AT seed harness or real provider snapshots when backend services are available.

## Cycle AT - Live Chart Snapshot Seeding Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server-hydrated live chart proof data | Seed script writes `MarketOutcomeSnapshot`; mobile reads via `/api/markets/:marketId/chart?range=1D` and `/api/events/:slug` | Script plus GET routes | Script uses local backend database access; GET routes remain public-visible guarded | Script args: optional `eventSlug`, `baseTime`, `summaryPath`, `--apply` | Route consumers use `history[].outcomeId`, `history[].timestamp`, `history[].probability`, and `emptyState` | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot` | Existing EventDetail fallback remains active when backend is unavailable or no snapshots exist | Real provider ingestion is still missing; Cycle AT only adds deterministic local/proof snapshot seeding. |

Cycle AT implementation notes:

- The seeding harness uses the same `MarketOutcomeSnapshot` table already consumed by event detail and chart routes.
- Fixture/dummy data is now future-backend-shaped because it is literally written as backend chart snapshot rows when the script can run.
- Backend/Docker was unavailable during proof, so the next active PM-GAP-067 cycle should run `npm run mobile:live-chart-snapshot-seed` and capture server-hydrated chart-source device XML once services are available.

## Cycle AS - Event Detail Chart Route Hydration

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible live event chart hydration | `/api/markets/:marketId/chart?range=<1D\|1W>` through `PolyApi.getMarketChart()` | GET | Optional for public markets; bearer token may be sent by runtime client | None | `history[].outcomeId`, `history[].timestamp`, `history[].probability`; mobile derives visible `event.chartHistory[]` and `chartHistorySource` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, market visibility guard | EventDetail keeps embedded `/api/events/:slug` chart history and local fixture chart arrays when the chart route is empty or unavailable | Real live-football snapshot ingestion, loading/error/empty UI states, and server-hydrated tablet proof remain missing. |

Cycle AS implementation notes:

- This cycle consumes the Cycle AR chart contract inside the game page instead of leaving it as an unused client method.
- The fixture fallback remains allowed because it already uses backend-shaped `outcomeId`/`timestamp`/`probability` points.
- Backend parity is still incomplete until real live provider snapshots are present and a device proof shows `chartHistorySource: "market-chart-route"` from the server.

## Cycle AR - Range-Aware Market Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected market chart/history | `/api/markets/:marketId/chart?range=<1D\|1W\|1M\|MAX>` through `PolyApi.getMarketChart()` | GET | Optional for public markets; visibility guard still applies | None | `marketId`, `range`, `ranges[]`, `generatedAt`, `lastUpdated`, `emptyState`, `outcomes[]`, `history[].outcomeId`, `history[].timestamp`, `history[].price`, `history[].probability`, compatibility `series` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, market visibility/owner guard | Existing embedded `event.chartHistory` and local fixture arrays remain fallback until EventDetail consumes the route | Provider ingestion must write live snapshots; EventDetail still needs a UI integration cycle to replace local chart arrays with route data. |

Cycle AR implementation notes:

- This cycle closes the route/client-contract portion of the repeated chart-history gap.
- The endpoint remains public-safe and keeps the existing `series` field for web compatibility while adding mobile-ready `history[]`.
- Backend parity is still incomplete until real World Cup live market snapshots are ingested and device proof uses server-hydrated chart data.

## Cycle AQ - Live Chart History And Depth Identity Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event chart history | `/api/events/:slug` | GET | Optional for viewing | None | `event.chartHistory[].outcomeId`, `timestamp`, `probability`; mobile filters by selected outcome id | `MarketOutcomeSnapshot`, `Market`, `Outcome`, `Event` | Event metadata `chartHistory` and local fixture chart arrays remain fallback when no snapshots exist | Real football provider ingestion and a range-aware dedicated history endpoint are still missing. |
| Live orderbook/depth identity | Embedded in `/api/events/:slug` market objects | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total` plus outcome best bid/ask fields | Open `Order` rows through existing quote/orderbook aggregation; `Market`, `Outcome` | Fixture `orderbookDepth` uses the same outcome-addressable shape | Full depth ladder, timestamps, suspended/no-liquidity state, and per-market book range controls remain missing. |

Cycle AQ implementation notes:

- This cycle converts chart history from a metadata-only optional shape into a route-backed read model sourced from existing `MarketOutcomeSnapshot` rows.
- The route still falls back to metadata when snapshots are absent, which keeps fixture/server compatibility during provider rollout.
- Backend parity remains incomplete until live provider ingestion and dedicated/range-aware chart and depth routes exist.

## Cycle AP - Live Line Order Identity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live/line ticket submit | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Required in server mode; fake-token mock can run locally | `marketId`, `outcomeId`, `side`, `contractSide`, `price`, `size`, `selection.marketId`, `selection.outcomeId`, `selection.marketGroupId`, `selection.marketType`, `selection.line`, `selection.period`, `selection.side`, `selection.displayLabel` | order id/status/size/remaining/fills and preserved request metadata | `ApiOrderRequest.requestBody`, `Order`, `Market`, `Outcome` | Mock orders now also carry full `selection` identity | First-class `Order.selection`/`Trade.selection` columns do not exist yet; request-body reconstruction is the current bridge. |
| Portfolio open orders and positions | `/api/portfolio` | GET | Required for server portfolio; session fallback exists for web | `Authorization` bearer only | `positions[].selection` and `openOrders[].selection` with market/outcome/group/type/line/period/side/display label/contract side | `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome`, `UserBalance` | Local Portfolio state uses the same `TicketSelection` shape | Filled position selection is inferred from market/outcome fields; exact submitted request metadata is only available for open orders. |
| Portfolio history/activity | `/api/portfolio/history` | GET | Required for server history; session fallback exists for web | `Authorization` bearer only | `canceledOrders[].selection`, `recentTrades[].selection` | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome`, `LedgerEntry` | Local activity uses the same `TicketSelection` shape | Recent trades still infer selection from market/outcome schema because `Trade` has no direct order/request relation. |

Cycle AP implementation notes:

- This cycle closes the live line-order identity bridge for request, open order, canceled order, recent trade, position, and mobile Portfolio mapping.
- It intentionally avoids a schema migration by using existing `ApiOrderRequest.requestBody` and market/outcome line fields.
- A future backend cleanup can promote `selection` to first-class `Order`/`Trade` fields once the live market schema stabilizes.

## Cycle AO - Live Event Detail Backend Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live World Cup event detail | `/api/events/:slug` | GET | Optional for viewing; authenticated order routes later | None | `event.liveStats`, `event.chartHistory`, `market.id`, `marketGroupId`, `marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, `liquidity`, `orderbookDepth[]`, `outcome.id`, `outcome.side`, `price`, `bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize` | `Event.metadata` for optional provider-shaped `liveStats` and `chartHistory`; `Market.marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`; `Outcome.side`; `Order` depth through orderbook snapshot aggregation | Mobile local fixture remains fallback, but the mobile adapter now consumes the same route-shaped fields when server mode hydrates event detail | Real external live-football provider ingestion is still missing; event metadata must be populated before chart/live-stat panels show real values. |
| Live orderbook/depth | Embedded in `/api/events/:slug` market objects for top-level depth; existing dedicated book routes can still be used later for full depth | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total`, plus outcome-level best bid/ask sizes | `Order` grouped open/partial orders through `buildPublicOrderbookSnapshot()` and `getOutcomeQuotes()` | Fixture `orderbookDepth` shape matches the embedded contract | Full depth by price ladder/range, depth timestamps, and no-liquidity/suspended states still need a dedicated route or richer embedded object. |
| Live ticket identity source | Event detail payload feeding existing ticket state | Client state, then existing order routes when submitting | Mock mode no auth; server submit requires API key | Future submit must preserve `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `period`, `line`, `side`, amount, order side | selected event/market/outcome/line identity now survives backend route -> mobile adapter -> `EventDetail` model | Orders, positions, fills, open orders, activity/history | Existing fake-token ticket can open from backend-shaped live markets | Order submission/portfolio/history proof for live line markets is still PM-GAP-068 and not completed by this contract cycle. |

Cycle AO implementation notes:

- This cycle closes the repeated unknown-contract part of PM-GAP-067 for market groups, line identity, outcome side, top depth, and optional chart/live-stat payload shape.
- Backend parity is still not complete because real live-football provider ingestion, full chart history, and full depth routes are not implemented.
- The mobile adapter no longer drops backend market line identity, so future Samsung proof can test real route hydration instead of relying only on local fixture state.

## Cycle AN - Live Event Detail Structural Parity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live World Cup event detail | Intended `/api/events/:slug` live-detail payload or `/api/mobile/events/:slug/live-detail`; current cycle uses local fallback only | GET | Optional for viewing; authenticated order routes later | None | `event.id`, `title`, `status`, `startsAt`, `teams[]`, `markets[]`, `marketGroupId`, `marketId`, `marketType`, `period`, `line`, `outcomeId`, `side`, `probability`, `bestBid`, `bestAsk`, `liquidity`, `chartHistory`, `orderbookDepth`, `liveStats` | Events, teams, markets, market groups, line markets, outcomes, live score/state, quote snapshots, orderbook depth, market history, live stats | `worldCupEvents` live fixture now uses backend-shaped fields for Australia vs Egypt | Real backend route/schema does not yet provide grouped live game detail, live score, line markets, chart history, orderbook depth, or live stats. |
| Live ticket open | Client state from selected live market/outcome; existing order submit routes only after amount/order | Client state, then POST order when submitting | Mock mode no auth; server order mode requires API key | Future submit must include `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `period`, `line`, `side`, amount, order side | selected event/market/outcome identity, live clock, quote/probability, line metadata | Orders, positions, fills, open orders, activity/history with live line identity | Tablet proof opens a live Australia ticket and preserves event/market/outcome in the ticket | Live order-to-portfolio/history identity is not yet re-proven with backend-shaped line fields. |
| Live chart/history | Intended `/api/markets/:marketId/history?range=live` or embedded event detail `chartHistory` | GET | Optional for viewing | None | timestamped `outcomeId`, probability/price points, range, lastUpdated | Market history, outcome price snapshots | Event `chartHistory` fixture feeds the chart series | No real chart-history route/schema currently backs mobile event detail. |
| Live orderbook/depth | Intended `/api/markets/:marketId/book` or embedded `orderbookDepth` | GET | Optional for viewing; authenticated for user-specific order actions | None | bid/ask levels with price, shares, total, spread, liquidity, lastUpdated | Order book, orders, liquidity/depth snapshots | Primary live market includes `orderbookDepth` fixture fields | Existing UI still partly uses local display rows; backend depth contract is not wired end to end. |
| Live stats | Intended `/api/events/:slug/live-stats` or embedded event detail `liveStats` | GET | Optional | None | stat id, label, home value, away value, timeline events, lastUpdated | Live match stats provider/cache | Event `liveStats` fixture feeds the Live stats panel | No real route/provider/schema for live football stats yet. |

Cycle AN implementation notes:

- This cycle intentionally does not mark backend parity complete.
- Frontend dummy data is now shaped like the intended backend contract, so future route integration can replace the fixture without changing the UI model.
- The next structural milestone should inspect Prisma/API support and implement or stub the real route/schema before more visual-only live-detail passes.

## Cycle T - Whole-App Navigation And Page Map

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / World Cup discovery | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&search=World+Cup` | GET | Optional; bearer token sent if runtime API key exists | None | `events[]`, event id/slug/title/status/startsAt/markets/outcomes/volume/liquidity/traders | Events, markets, outcomes, sports/league taxonomy | `worldCupEvents` local mock data if server hydration is unavailable | Backend should eventually expose Polymarket-style sports/category rail metadata and page-map ordering. |
| Event detail entry from navigation | `/api/events/:slug` | GET | Optional; bearer token sent if runtime API key exists | None | event detail, markets, outcomes, line/selection metadata when available | Events, markets, outcomes, market groups, lines | Local event detail mock data from `worldCupEvents` | Full page-map route metadata is not provided by backend. |
| Live tab | Same event list route with local live filtering today | GET | Optional | None | event status and live clock-like fields when available | Events, market status, live state | Local filtering of mock events where `status === "live"` | Backend should provide a dedicated live sports feed or `status=live` filter. |
| Portfolio tab | `/api/portfolio` and `/api/portfolio/history` when server mode is active | GET | Required for real user data; demo can run without auth in mock mode | None | wallet balance, positions, open orders, history/recent trades/canceled orders | Users, wallets, positions, orders, fills/trades, activities | Local fake 10000 USDT balance, local positions/open orders/activity | Auth/session model and production wallet are intentionally not complete. |
| Search tab | Same event list route with `search=<query>` | GET | Optional | None | filtered `events[]` | Events/search index, markets/outcomes | Local filtering over mock events/futures | Backend search ranking/categories are still thinner than Polymarket. |
| Account header entry | `/api/profile/preferences` when server mode and API key are available | GET/PUT | Required for server preferences; mock mode local only | PUT sends `ProfilePreferences` | language, ticket defaults, saved/profile preferences when supported | Users, profiles, preferences | Local AsyncStorage/preferences and mock signed-in state | Full auth, profile, KYC, wallet settings, notification settings are incomplete. |

Navigation-only implementation notes:

- This cycle does not add new backend calls.
- The main frontend state transition is `setMainTab()`.
- Account moved from bottom nav to header, but backend dependencies for account/profile remain unchanged.
- Polymarket reference shows Settings/profile outside the four bottom tabs, so future backend/profile work should treat account/settings as a top-level utility route rather than a primary market-browsing tab.

## Cycle U - Event Page Top Shell/Action Controls

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail top shell | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional; bearer token sent if runtime API key exists | None | event id/slug/title/status/startsAt, markets, outcomes, probabilities, prices, volume/liquidity/depth-like fields when present | Events, markets, outcomes | `worldCupEvents` local event detail data | Backend should expose enough metadata to identify primary market and top-shell context consistently. |
| Event Order Book overlay | No dedicated route in this cycle; derived from loaded market/outcome data | N/A | N/A | N/A | primary market title/outcomes, bestBid, bestAsk, bidSize/askSize or equivalent fallback values | Markets, outcomes, order book/depth snapshots, liquidity | Local deterministic depth rows from primary market outcomes | A dedicated live order-book/depth route is needed, for example `/api/markets/:id/book`, or included market depth snapshots in `/api/events/:slug`. |
| Event share sheet | No backend route | N/A | N/A | N/A | event title/slug and app-generated share copy/link | Events/shareable routes | Local share panel only | Production share links need canonical deep-link/web-link generation and localized copy. |

Cycle U implementation notes:

- This cycle does not create or modify backend routes.
- The top book action now maps to Order Book behavior, matching the Polymarket reference better than the previous watchlist notice.
- The future backend/schema milestone should treat order-book depth as a first-class data contract for mobile.

## Cycle V - Futures Market Rows

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures market rows | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` when server discovery is active | GET | Optional; bearer token sent if runtime API key exists | None | future market id/title/type, outcome id/label/probability/color, volume/liquidity when available | Events, markets, outcomes, sports/league taxonomy | `worldCupFutures` local fallback data | Backend should expose complete futures outcome catalogs, outcome-level volume, and ordering. |
| Futures Buy Yes ticket | Existing ticket/order flow after local selection | Client state, then existing order routes when submitting | Auth required for server order submit; mock mode local | Ticket submit uses selected market/outcome/side/amount through existing order services | market id, outcome id, side, probability/price, liquidity/depth | Orders, positions, fills, wallets | Fake-token mock ticket and portfolio state | Route contracts need explicit binary YES/NO side semantics beyond generic buy/sell. |
| Futures Buy No button | No dedicated backend route in this cycle | N/A until submit | N/A | N/A | Uses selected outcome and `side: sell` approximation locally | Binary outcome order book, NO shares, order side model | Opens sell/no-side approximation | Backend/mobile contract needs true NO share or complementary-outcome order semantics. |

Cycle V implementation notes:

- This cycle does not create or modify backend routes.
- The mobile UI now expects outcome-level futures data that the backend should eventually own.

## Cycle AK - Futures Catalog Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Collapsed World Cup Winner futures catalog | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` when server discovery is active | GET | Optional; bearer token sent if runtime API key exists | None | future market id/title/type, ordered outcomes, probability/price, outcome display label, volume/liquidity when available | Events, markets, outcomes, sports/league taxonomy | `worldCupFutures` now provides 21 local World Cup Winner outcomes and collapses to the first three plus `18 more` | Backend should own full futures catalogs, ordering, and the collapsed row count. |
| Expanded futures catalog | Same discovery/detail payload when available | GET | Optional | None | all outcomes for a futures market, stable outcome ids, yes/no price, outcome volume, visual metadata | Futures markets, outcomes, quote snapshots, market stats | Expanded local fallback list renders all 21 outcomes | Backend should return full outcome catalogs and pagination/expansion hints for large markets. |
| Expanded-row ticket open | Existing ticket/order state after local selection | Client state; existing order routes when submitting | Auth required for server submit; fake-token mock can run without auth | Ticket submit uses selected market/outcome/side/amount through existing order services | market id, outcome id, contract side, probability/price | Orders, positions, fills, wallets | England expanded-row Buy Yes opens fake-token ticket locally | Backend order/quote routes should accept canonical outcome ids from expanded futures catalogs. |

Cycle AK implementation notes:

- No backend route was created or changed.
- The mobile fallback catalog now mirrors the logged-in Polymarket collapse/expand structure, but backend discovery should eventually replace the static catalog and provide live ranking, prices, volume, and availability states.

## Cycle W - Futures Chart Range

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures chart/ranges | No dedicated route in this cycle; rendered from local future market/outcome data | N/A | N/A | N/A | outcome label, probability, color, market-level volume | Market history, outcome price history, time buckets | Local deterministic chart lines and local `selectedRange` state | Backend should expose market/outcome history series by range, for example `/api/markets/:id/history?range=1D`. |

Cycle W implementation notes:

- No backend route was created or changed.
- The future API should return timestamped probability/price points per outcome, volume per range, and unavailable/empty states.

## Cycle X - Match Market Tabs And Cards

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail market tabs/cards | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional; bearer token sent if runtime API key exists | None | event id/slug/title/status/startsAt, market groups, outcomes, probabilities, prices, volume/liquidity when available | Events, markets, market groups, outcomes, line markets | Local `worldCupEvents` detail data and local tab/card renderers | Backend should expose explicit market tabs/groups such as Game Lines, Exact Score, Halves, and Player Props. |
| Team to Advance card | No dedicated route in this cycle; derived from loaded event/primary outcome data | N/A | N/A | N/A | outcome label/probability/color, card volume, depth-like rows | Markets, outcomes, order book/depth snapshots | Local card volume `$60.9K Vol.` and deterministic depth rows | Backend should identify card type, card volume, outcome prices, and market depth for `Team to Advance`. |
| Inline card graph | No dedicated route in this cycle | N/A | N/A | N/A | selected card/outcome identity and local graph state | Market history, outcome history | Local inline graph text/visual state | Backend should provide chart/history data for card-level market detail. |
| Exact Score tab | `/api/events/:slug` if server event detail eventually includes exact-score group | GET | Optional | None | exact score outcomes, prices/probabilities, volume/depth | Exact score markets, outcomes, order books | Local sample score rows | Backend should provide exact-score market groups and prices. |
| Halves tab | `/api/events/:slug` if server event detail includes halves groups | GET | Optional | None | first-half and second-half markets/outcomes | Half markets, outcomes, line groups | Existing local first-half/second-half groups | Backend should expose grouped first-half/second-half markets with ordering and prices. |

Cycle X implementation notes:

- This cycle does not create or modify backend routes.
- The mobile UI now expects event detail payloads to support explicit market tabs, card-level depth, card-level history, and grouped exact-score/halves markets.

## Cycle Y - Line Adjustment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spread line selector | `/api/events/:slug` when server event detail is active | GET | Optional; bearer token sent if runtime API key exists | None | spread market group, line options, selected line, outcomes, prices/probabilities, period | Events, markets, line markets, outcomes, line quotes | Local line options and deterministic probability math | Backend should expose all spread lines by period with outcome ids, labels, prices, and market ids. |
| Totals line selector | `/api/events/:slug` when server event detail is active | GET | Optional | None | totals market group, line options, selected line, over/under outcomes, prices/probabilities, period | Events, markets, line markets, outcomes, line quotes | Local line options and deterministic probability math | Backend should expose all totals lines by period with stable market ids and prices. |
| Line ticket carry-through | Existing ticket/order flow after local selection | Client state, then existing order routes when submitting | Auth required for server order submit; mock mode local | Ticket submit uses selected market/outcome/side/amount plus line selection metadata | selected market type, line, period, display label, price/probability | Orders, positions, fills, wallets, line-market orders | Fake-token mock ticket and portfolio state | Backend order routes need explicit line market ids and line metadata to preserve identity in positions/history/open orders. |

Cycle Y implementation notes:

- No backend route was created or changed.
- Future backend work should treat line markets as first-class markets, not display-only modifiers.

## Cycle Z - Trade Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket open from event outcome | Loaded event data from `/api/events/:slug` when server mode is active | GET | Optional for viewing | None | event title, market id/title, outcome id/label/probability, selection metadata | Events, markets, outcomes | Local `worldCupEvents` fallback data | Backend should provide canonical market/outcome ids and line selection metadata for every ticket entry point. |
| Ticket amount and estimate | No dedicated route in this cycle; computed client-side | N/A | N/A | N/A | outcome probability, balance, side, amount | Quotes, order book, wallet balance | Local fake-token balance and deterministic estimates | Backend quote route should return live price, fees, estimated shares, payout/proceeds, and slippage impact. |
| Ticket submit readiness | Existing fake-token order path; server order routes when enabled | POST on existing order route when server mode submits | Required for real server order | market id, outcome id, side, amount, selection metadata | order id/status, filled shares, execution price, portfolio updates | Orders, fills, wallets, positions, open orders | Mock order state in fake-token mode | Server orders must preserve selected line/period/outcome and return enough data for portfolio/open-order/activity parity. |

Cycle Z implementation notes:

- No backend route was created or changed.
- Mobile now expects the same quick amount presets observed in Polymarket, but estimates still need backend quote support for production parity.

## Cycle AA - Portfolio

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fake-token Portfolio after mock order | Local mock state; `/api/portfolio` when server mode is active | GET in server mode | Required for server user data; not required for fake-token mock mode | None | balance, positions, open orders, recent activity, closed trades | Users, wallets, positions, orders, fills, activities | Local fake balance, local positions/activity after mock order | Server Portfolio must preserve selected line market ids and fill economics. |
| Open-order cancel | Local mock cancel path; `DELETE /api/orders/:id` in server mode | DELETE in server mode | Required for server cancel | order id | canceled order id/status, remaining/fill state, canceled activity metadata | Orders, order status, activity/history | Local open-order fixture and local canceled receipt | Server same-cycle Portfolio cancel proof should be rerun when backend parity is next prioritized. |
| Position re-trade/close entry points | Existing ticket open and close handlers | Client state; server order routes when submitting | Required for server trading | selected position, side, amount when ticket submits | position market/outcome/selection metadata | Positions, orders, fills | Local fake-token position actions | Backend should return canonical close/retrade quote and order status for each position. |

Cycle AA implementation notes:

- No backend route was created or changed.
- Portfolio docs now explicitly require server contracts to preserve selected line-market identity across positions, open orders, and activity.

## Cycle AB - Search/Explore

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search/Explore default list | `/api/events` through existing event hydration path when server mode is active | GET | Optional for public discovery | Query params currently handled by existing event list behavior | event id/title/status/tag/teams/markets/outcomes/probabilities | Events, markets, outcomes, market stats | Local `worldCupEvents` sorted by market/outcome depth | Backend should expose Search/Explore-ranked rows, not only raw event lists. |
| Typed World Cup query | `/api/events?search=<query>` when server mode is active | GET | Optional | Search query in URL params | matching events, teams, markets, outcomes | Event search index, team aliases, market text index | Client filters local events/teams/markets/outcomes | Backend should support ranked search across event, team, market, outcome, and localized names. |
| Search filter/sort | No dedicated route in this cycle; state is client-side over loaded events | N/A | N/A | status filter and sort mode | filtered/sorted rows | Search facets, status aggregates, market category counts | Local status filter and popular/live-first sort | Backend should provide category/facet counts, server-side rank, and cursor pagination. |
| Search result navigation | Existing event detail path after selecting an event | GET `/api/events/:slug` when server detail is active | Optional for viewing | event slug/id | full event detail markets and outcomes | Events, market groups, outcomes, order books | Local selected event opens detail | Backend route should preserve selected search result id/slug and hydrate detail consistently. |

Cycle AB implementation notes:

- No backend route was created or changed.
- Mobile now presents Search as an Explore-style page, so future backend work should treat Search as a ranked discovery endpoint with facets and row metrics.

## Cycle AC - Account/settings

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account/settings shell | `/api/profile/preferences` when profile sync is enabled | GET | Required when server profile sync is active | None | locale, saved event ids, ticket defaults, profile sync status | Users, profile preferences | Local AsyncStorage and app state | Backend should provide full account/settings menu state and auth/session state. |
| Mock login/logout | Local AsyncStorage only in this cycle | N/A | N/A | N/A | signed-in boolean | User session | Local mock session flag | Production auth route is intentionally deferred. |
| Fake-token balance safety | Portfolio/account state; `/api/portfolio` when server mode is active | GET | Required for server mode | None | wallet balance, open positions/orders, total exposure | Wallets, positions, orders | Local 10,000 USDT fake balance | Real deposit/withdraw/EBPay routes are intentionally not implemented. |

Cycle AC implementation notes:

- No backend route was created or changed.
- Account documentation now requires a future session/profile contract before production auth or real-money wallet actions.

## Cycle AD - Chart Behavior

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail chart display | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional for public viewing | None | event id/slug/title/status, primary market/outcome probability, selected outcome label, current event status | Events, markets, outcomes | Local `worldCupEvents` event detail data and deterministic chart point math | Event detail does not provide timestamped chart/history series, target/reference line metadata, or per-outcome historical probabilities. |
| Chart press/tooltip state | No dedicated route in this cycle; computed client-side from selected point | N/A | N/A | N/A | selected chart point label/value/time derived locally | Market history, outcome history, time buckets | Local `latest`/`mid`/`target` point states | Backend should expose nearest-point chart data so tooltip values reflect real historical ticks. |
| Chart filter state | No dedicated route in this cycle | N/A | N/A | N/A | local chart filter labels such as All/Game/Live | Market history ranges, period filters, live tick history | Local filter state and event status | Backend should support range/filter query params for market chart series. |

Cycle AD implementation notes:

- No backend route was created or changed.
- A future route such as `/api/markets/:id/history?range=1D&outcomeId=<id>` or `/api/mobile/events/:slug/chart` should return timestamped probability/price points, selected outcome metadata, target/reference lines when applicable, loading/empty states, and range/filter support.

## Cycle AE - Market Page

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Market/Live stats body switch | No dedicated route in this cycle; event context comes from `/api/events/:slug` when server mode is active | GET for event context | Optional for public viewing | None | event id/slug/title/status, teams, volume, current market probabilities | Events, teams, match state | Local `activeBodyTab` state | Backend should identify whether live stats are available and expose a stats route/state. |
| Live Stats panel | No backend route in this cycle | N/A | N/A | N/A | possession, shots, shots on target, corners, expected goals, match-flow events | Match stats, live feeds, timeline events | Local deterministic stats rows | Add route such as `/api/events/:slug/live-stats` with home/away stats, timestamps, availability, and empty/error states. |
| Grouped market tabs/cards | `/api/events/:slug` when server detail is active | GET | Optional for viewing | None | market groups/tabs, outcomes, probabilities, line metadata | Events, markets, market groups, line markets | Existing local/fallback event groups | Backend still needs richer group metadata for exact Polymarket-style ordering and Player Props scoping. |

Cycle AE implementation notes:

- No backend route was created or changed.
- Mobile now expects a future live-stats data contract in addition to grouped market metadata, line-market identity, market depth, and chart history.

## Cycle AF - Reference Device Preflight Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reference device preflight | None | N/A | N/A | N/A | N/A | N/A | N/A | None; this is an ADB/device harness. |

Cycle AF implementation notes:

- No backend route was created or changed.
- The harness only inspects ADB device state and writes `docs/mobile/harness/cycle-current-polymarket-reference-device-preflight.json`.

## Cycle AG - Trade Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket open from event outcome | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event id/slug/title/status, market id/title/type, outcome id/label/probability/color, quote/depth fields when present | Events, markets, outcomes, order books | Local `worldCupEvents` event/outcome objects | Backend should provide ticket-ready market title, display period, selected outcome, opposite outcome, binary side semantics, and price/quote metadata. |
| Ticket amount and payout calculation | No dedicated route in this cycle; computed client-side from selected outcome probability | N/A | N/A | N/A | selected outcome probability, balance | Quotes, market depth, wallet balance | Local probability math and fake balance | Backend quote route should return executable price, payout, fees, min/max order size, and slippage bounds. |
| Advanced ticket details | Existing quote/orderbook fields when available through event/outcome hydration | GET for source event/quote context | Optional for viewing | None | best bid/ask, sizes, spread, trading mode | Order books, quote snapshots | Local fallback depth sizes and fake-token mode | Add a dedicated ticket quote/depth endpoint if event hydration is too coarse. |
| Submit fake-token order | Existing ticket order flow through `submitTicketOrder()`; server mode uses order API when enabled | POST in server mode | Required for server mode | market id, outcome id, side, amount, price/selection metadata | order id/status/fill/open-order/position metadata | Orders, fills, positions, activity | Mock order placement in fake-token mode | Binary NO/share side and production trading eligibility gates are not fully modeled. |

Cycle AG implementation notes:

- No backend route was created or changed.
- Mobile first-view ticket now expects market/outcome identity, quote/price, payout, and advanced depth/estimate data to be available in a ticket-ready shape.

## Cycle AH - Binary Side Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures Buy No ticket | Existing futures data from local/server event hydration | GET for market context | Optional for viewing | None | market id/title/type, outcome id/label/probability/color | Markets, outcomes, binary contracts | Local `worldCupFutures` rows | Backend should expose YES and NO contract ids/prices separately for each binary outcome. |
| Submit Buy No order | `/api/orders` through `PolyApi.placeLimitOrder()` in server mode | POST | Required in server mode | `marketId`, `outcomeId`, transaction `side`, `contractSide`, `price`, `size`, optional `selection`, `type`, `clientOrderId` | order id/status/size/remaining/fills | Fake-token mock order in local mode | Backend must accept and persist `contractSide` as separate from transaction side. |
| Portfolio display for No contracts | `/api/portfolio` and `/api/portfolio/history` in server mode | GET | Required in server mode | None | positions/orders/history need selected outcome plus `contractSide` | Positions, orders, fills, activity/history | Local Portfolio state stores `contractSide` | Backend snapshot/history routes should return `contractSide` for positions, orders, canceled orders, and recent trades. |

Cycle AH implementation notes:

- Mobile now sends `contractSide: "YES" | "NO"` with server-mode order payloads.
- No backend route was changed in this cycle; this is a forward-compatible mobile contract update.

## Cycle AI - Trade Ticket Surface

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tall ticket open from game outcome | `/api/events/:slug` when server detail is active | GET | Optional for viewing | None | event title/status, market title/type, outcome label/probability/color, selection metadata | Events, markets, outcomes | Local event/outcome data | Backend should return ticket-ready display metadata and eligibility state with event detail or a ticket quote route. |
| Swipe-ready amount state | No dedicated route in this cycle; calculated client-side | N/A | N/A | N/A | amount, selected side, selected contract side, probability | Quotes, wallet, eligibility | Local fake-token balance and probability math | A future ticket quote route should return executable price, payout/proceeds, fee, max/min, and whether swipe confirmation is allowed. |
| Production eligibility/location state | Not implemented in Holiwyn fake-token mode | N/A | Required for real-money mode later | N/A | eligibility status, block reason, support action, login/location state | Users, sessions, geo/eligibility checks | Fake-token mode always allows mock submit when amount is valid | Add server-authoritative `tradingEligibility` before real-money trading. |

Cycle AI implementation notes:

- No backend route was created or changed.
- This cycle changes the mobile ticket surface only; server-mode order submission continues to use the existing order path.

## Cycle AJ - Game Page Compact Scrolled Header

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact scrolled match header | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event title/status/start time, teams, primary outcome probabilities/colors | Events, teams, markets, outcomes | Local event/team/outcome data | Backend should provide stable team codes, localized short names, and current probabilities for compact game headers. |
| Scrolled market rows proof | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | market groups, line values, periods, outcome probabilities | Market groups, line markets, outcomes | Local deterministic game-line groups and probabilities | Backend should provide Polymarket-style ordered market groups, line selectors, and per-period prices. |

Cycle AJ implementation notes:

- No backend route was created or changed.
- This is a presentation-layer parity cycle; future backend work should make compact header and market rows server-authoritative.

## Cycle AL - Game Page Sticky Market Tabs

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sticky market tab rail | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event title/status/start time, teams, primary outcome probabilities, market tab/group availability | Events, teams, markets, market groups | Local event/team/outcome data and local tab list | Backend should expose ordered market tabs/groups and whether Player Props is available or empty for a given match. |
| Sticky Player Props switch | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | player props group rows, player names, stat type, prices, probabilities | Markets, player props, players, outcomes | Local Player Props rows | Backend should provide soccer player-prop availability and empty/loading states rather than relying on local fallback props. |

Cycle AL implementation notes:

- No backend route was created or changed.
- This is a presentation-layer parity cycle; future backend work should return market-tab metadata and grouped rows in the same order the mobile page displays them.

## Cycle AM - Player Props Unavailable State

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Player Props unavailable state | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event id/slug/title and eventual Player Props availability flag | Events, markets, players, player props | Local unavailable state | Backend should eventually provide `playerPropsAvailability` and prop rows only when supported. |

Cycle AM implementation notes:

- No backend route was created or changed.
- Mobile intentionally avoids local fake player-prop rows until backend-supported Player Props data exists.

## Cycle AV - Live Orderbook Depth Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event orderbook overlay | `/api/orderbook/:marketId/book?outcomeId=<optional>&maxLevels=<optional>` | GET | Public viewing | None | `marketId`, `outcomeId`, `generatedAt`, `emptyState`, `levels[]`, legacy `bids[]`, legacy `asks[]` | Markets, outcomes, orders/orderbook snapshots | Embedded `market.orderbookDepth[]` remains visible and labeled as fallback when route data is unavailable | Real provider/orderbook ingestion, server-hydrated device proof, stale/delayed route states, and richer depth aggregation remain open. |
| Route-backed market depth hydration | `PolyApi.getOrderbook()` consuming `/api/orderbook/:marketId/book` | GET | Public viewing | None | `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `emptyState`, `generatedAt` | Market/outcome identity, orderbook depth rows | `marketDepthService` only applies route-shaped data when the route returns levels; otherwise it preserves fallback rows and records `empty`/`error` state | Backend must guarantee that `marketId`/`outcomeId` match ticket/order/portfolio identity for selected line markets. |

Cycle AV implementation notes:

- The existing public orderbook route now returns a mobile-ready `levels[]` ladder while preserving legacy `bids[]` and `asks[]`.
- `maxLevels` is accepted and clamped server-side to avoid unbounded mobile responses.
- Mobile is wired to consume the route in server mode and exposes source/status labels so fallback proof cannot be confused with route-backed parity.
- Tablet proof was fallback-mode because backend health was unavailable; the backend route contract is covered by route/API tests.

## Cycle AW - Route-Backed Live Depth Seed Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event orderbook proof data | `/api/orderbook/:marketId/book?maxLevels=24` after `mobile:live-orderbook-depth-seed` | GET | Public viewing | None | `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | `User`, `Order`, `Market`, `Outcome` | Existing fixture depth still drives tablet UI in mock mode | Mobile server-mode proof still needs an event/detail payload path that can hydrate the seeded market quickly and select the same market. |
| Live depth seeding harness | `mobile:live-orderbook-depth-seed` script | Local script | Local development only | Optional `--eventSlug`; default first live public World Cup orderbook event | Summary artifact with event id/slug/title, market id/title/type/group, proof users, deleted/created order counts, and preview rows | `User`, `Order`, `Market`, `Outcome` | N/A | Real provider/liquidity ingestion remains missing; this is deterministic proof data only. |

Cycle AW implementation notes:

- The depth seed harness created 12 open proof orders for `world-cup-2026-curacao-vs-cote-divoire-2026-06-25` / `aca976d2-2bad-416c-b010-c874c0ee493f`.
- A direct orderbook route probe returned seeded `levels[]` with `emptyState: null`.
- `/api/events/:slug` returned a very large event-detail payload, while `/api/markets/:id/chart?range=1D` timed out during a 20-second probe. This promotes a mobile-optimized live detail/chart/depth payload to active structural work.

## Cycle CW - Provider Sports Event Discovery Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider candidate discovery by exact sports event | `/api/mobile/events/:slug/provider-candidates?providerSearchMode=sports-events&providerEventSlug=fifwc-col-gha-2026-07-03` | GET | Internal admin guard | None | `targets[].bestCandidate`, `attachProposal.mapping`, candidate `slug`, `externalMarketId`, `conditionId`, outcome `tokenId`, relevance result | `Event`, `Market`, `Outcome`; provider identity fields on markets/outcomes | None for exact provider-event proof; broad tag discovery remains available when no exact event slug is supplied | More exact event/market slugs are needed for spreads, totals, team totals, halves, and props. |
| Provider identity attach for compact live markets | `attachMobileLiveProviderIdentities()` local/service path, same contract as protected provider-mapping route | Service/API contract | Internal admin guard when called through route | provider mappings with market id, external slug/id, condition id, outcome token ids | readiness moves to provider-refreshable compact markets | `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel` | None for the proof event | UI/admin apply workflow should eventually review/apply mappings outside the proof harness. |
| Provider refresh and CLOB depth | `/api/mobile/events/:slug/provider-refresh` equivalent service path | POST/service | Internal admin guard through route | `allowContractProofFallback=false` | refreshed count, snapshots updated, CLOB depth rows, post-refresh snapshot status | `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Contract fallback explicitly disabled | Broader provider ingestion scheduler remains needed. |
| Server-backed live detail proof | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None | `event`, compact `markets[]`, `availability`, `providerQuoteSnapshot`, `providerOrderbookDepth`, `orderbookDepth`, contract readiness counts | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Mobile fallback remains for non-server mode | First dev compile can be slow; production/dev-build route warmup should be included in harness setup. |

Cycle CW implementation notes:

- Exact provider event slug fallback prevents broad World Cup futures from being attached to the live match.
- The Samsung tablet proof uses `world-cup-2026-colombia-vs-ghana-2026-07-03` and confirms route-backed Book UI after provider refresh.

## Cycle DG - Provider Fixture Metadata Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider mapping readiness with fixture metadata | `/api/mobile/events/:slug/provider-mapping` | GET | Internal admin guard | None | Existing readiness fields plus `providerFixture.providerEventSlug`, `opticOddsFixtureId`, `opticOddsGameId`, `opticOddsNumericalId`, `sportradarGameId`, `teams[]`, `moneylineMarkets[]`, and `lineMarketSourceContract` | `Event.metadata.providerFixture`; existing `Event`, `Market`, `Outcome` provider identity fields | None; proof extracts from real Gamma event metadata and stores the contract-shaped object on the local proof event | Real OpticOdds/API ingestion route for line-market families is still missing. |
| Provider fixture extraction proof | `scripts/prove_mobile_provider_fixture_metadata_contract.ts` against `https://gamma-api.polymarket.com/events?slug=fifwc-col-gha-2026-07-03` | Local proof script | Local development only | Exact provider event slug | Extracted fixture IDs, provider team IDs, 3 moneyline markets, readiness compact-market counts, and future line-market source contract | `Event.metadata` stores the extracted provider fixture contract for later route use | None | Production importer should persist this metadata automatically for every trusted World Cup fixture. |

Cycle DG implementation notes:

- No public user route changed.
- The provider mapping readiness route now surfaces stored fixture metadata so future admin/operator and ingestion cycles can target the correct provider fixture instead of repeating broad Gamma line searches.
- The intended line-market source is recorded as `optic_odds`; this is a contract definition, not proof that line odds have been ingested.

## Cycle DH - OpticOdds Line Ingestion Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line provider refresh report | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin guard | Existing body: optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | Existing refresh report plus `lineProvider.source`, `attempted`, `status`, `fixtureId`, `matchedMarketCount`, `snapshotRowsBuilt`, `snapshotsUpdated`, `skippedReason` | `Event.metadata.providerFixture`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | None. Missing credentials return `skippedReason=missing_optic_odds_api_key`. | Real OpticOdds credentials and reviewed per-line identity before applying live line rows. |
| OpticOdds fixture odds fetch | Official OpticOdds `https://api.opticodds.com/api/v3/fixtures/odds` | GET | `X-Api-Key: OPTIC_ODDS_API_KEY` | Query: repeated `sportsbook`, repeated `market`, `fixture_id`, `odds_format=PROBABILITY` | Fixture `id`, `game_id`, competitors, odds `id`, `sportsbook`, `market_id`, `selection`, `selection_line`, `team_id`, `price`, `points`, `is_main` | `ReferenceQuoteSnapshot` rows with `source=optic_odds`; eventual first-class provider line mapping table if line identity review becomes durable | Contract proof uses official-response-shaped fixture data only; it does not write fake live rows | OpticOdds orderbook/depth support is not implemented; quote snapshots only. |

Cycle DH implementation notes:

- The endpoint contract follows the official OpticOdds docs for `/fixtures/odds`, including repeated sportsbook/market query params and API-key header auth.
- The current event diagnostic intentionally reports `readyForLiveProviderApply=false` until credentials and reviewed per-line provider market identity exist.
- This cycle moves the backend closer to real line ingestion without weakening the provider relevance gate.

## Cycle DI - Reviewed Line Provider Identity Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reviewed line-provider identity readiness | Future protected provider-mapping/admin workflow using `reviewMobileLiveLineProviderIdentities()` | Future POST/service | Internal admin guard when routed | `reviews[]` containing `marketId`, `providerSource=optic_odds`, provider market id/name/type/period/points, and every local outcome mapped to a provider odd id | Readiness counts and validation failures for exact market/line/outcome identity | `Market.referenceMetadata.lineProviderIdentity`, `Outcome.referenceMetadata.lineProviderIdentity`; existing `Market`, `Outcome` | None. Dry-run projection is contract-shaped and does not mutate the database. | Protected route/UI for collecting confirmed line identity reviews and applying them with `confirmApply=true`. |
| OpticOdds row matching with reviewed identity | `/api/mobile/events/:slug/provider-refresh` through existing refresh service once credentials and reviews exist | POST/service | Internal admin guard through route | Existing refresh request plus stored reviewed metadata | `ReferenceQuoteSnapshot` rows matched by provider market and provider odd ID when reviewed identity exists | `ReferenceQuoteSnapshot`, `Market.referenceMetadata`, `Outcome.referenceMetadata` | None. Missing reviews fall back to existing family/line/outcome matching for contract tests only. | Real `OPTIC_ODDS_API_KEY`, approved sportsbooks, and confirmed reviewed identities before live apply. |

Cycle DI implementation notes:

- No public user route changed.
- The service can apply reviewed line identity later, but the Cycle DI proof stayed dry-run to avoid writing unreviewed provider identity into the local database.
- The row builder now supports exact reviewed provider IDs, closing the ambiguity between same-family lines before the next live OpticOdds refresh attempt.

## Cycle DJ - Line Provider Refresh Execution

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reviewed line identity apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin guard | `lineIdentityReviews[]`, `dryRun`, `confirmApply`; each review includes local `marketId`, `providerSource=optic_odds`, provider fixture/market/line/period, and every outcome's provider odd id | Route returns review validation, before/after `lineProviderIdentityReadiness`, `applied`, `blocked`, and `nextRequiredAction` | `Market.referenceMetadata.lineProviderIdentity`, `Outcome.referenceMetadata.lineProviderIdentity` | None. Route defaults to dry-run and requires `confirmApply=true` for mutation. | Operator/admin UI fields for line identity capture can be added on top of the route. |
| Line-provider refresh execution | `/api/mobile/events/:slug/provider-refresh` plus service `refreshMobileLiveProviderQuoteSnapshots()` | POST | Internal admin guard | Existing refresh body; production uses env `OPTIC_ODDS_API_KEY`/sportsbooks, proof injects official-shaped provider response | Mobile consumes refreshed `markets[].providerQuoteSnapshot` and `contract.batchedProviderQuoteSnapshot*` from `/api/mobile/events/:slug/live-detail` | `ReferenceQuoteSnapshot` rows with `source=optic_odds`; reviewed market/outcome metadata | Contract fallback remains disabled in Cycle DJ proof. | Real API key/network proof, provider-owned ladder depth, and lifecycle ticket/order/portfolio/history proof. |

Cycle DJ implementation notes:

- `/api/mobile/events/:slug/provider-mapping` now exposes the reviewed line identity apply path instead of requiring direct script access.
- The proof harness shows target line markets moving from stale/refresh-due to ready in the same live-detail contract that the mobile page reads.
- Cache invalidation remains owned by `/provider-refresh` through `revalidatePath` for live-detail, event-detail, and affected orderbook paths.

## Cycle DK - Polymarket-First Provider Path

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Polymarket event discovery and mapping | Polymarket Gamma `https://gamma-api.polymarket.com/events?slug=fifwc-col-gha-2026-07-03` through provider candidate services | GET/service | Public provider API; internal apply path remains guarded | Exact event slug plus generated manual slug fallbacks | Provider event title/slug, candidate market slug/question, external market id, condition id, outcome token ids, family/relevance fields | `Event`, `Market`, `Outcome`; provider identity fields on market/outcome records | None for the match-winner proof; irrelevant candidates are rejected instead of mocked | Exact line-family provider markets remain absent for this event through current Gamma discovery. |
| Provider identity attach | Existing provider mapping service path, same contract as `/api/mobile/events/:slug/provider-mapping` | POST/service | Internal admin guard when routed | 3 verified Polymarket match-winner mappings for Colombia, draw, and Ghana | Readiness changes to 3 provider-refreshable markets and 6 provider-refreshable outcomes | `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel` | None | Operator UI can reuse this route for reviewed exact slugs. |
| Polymarket quote and CLOB depth refresh | Existing provider refresh service path, same contract as `/api/mobile/events/:slug/provider-refresh` | POST/service | Internal admin guard when routed | `allowContractProofFallback=false`; `OPTIC_ODDS_API_KEY` unset | `providerQuoteSnapshot.status=ready`, provider source, bid/ask/spread, `providerOrderbookDepth`, depth rows | `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Contract-proof fallback disabled | Scheduled/background refresh still needs production orchestration. |
| Server-backed live detail and orderbook proof | `/api/mobile/events/:slug/live-detail`; `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Event slug and selected market id | `liveDataStatus`, `liveDataSource`, compact markets, selected orderbook route source/status, levels, empty state | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Expo/mobile fallback remains for offline mode, but Cycle DK tablet proof is server-backed | Chart history remains fallback until Polymarket-backed history is wired. |

Cycle DK implementation notes:

- Polymarket Gamma/CLOB is the default provider source for markets that exist on Polymarket.
- Missing OpticOdds credentials are optional/unconfigured and must not block this parity milestone.
- The relevance gate now blocks wrong-team binary winner attachment before provider identity is applied.

## Cycle DL - Polymarket CLOB Chart History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider chart history ingestion | Polymarket CLOB `https://clob.polymarket.com/prices-history?market=:tokenId&interval=1d&fidelity=5` | GET/service | Public provider API | Token ID in `market` query param, interval, fidelity | Provider points `{ t, p }` converted to timestamp, price, probability | `Market`, `Outcome.referenceTokenId`, `MarketOutcomeSnapshot` | None in Cycle DL proof; empty history is recorded as skipped | First-class snapshot source column is still missing. |
| Mobile market chart route | `/api/markets/:id/chart?range=1D` | GET | Public viewing with existing market visibility guard | Market id and range | `source`, `history[]`, `lastUpdated`, `emptyState`, `range`, `series` | `MarketOutcomeSnapshot`, `Market.referenceSource`, `Outcome` | If no rows exist, route returns `source=empty` and `emptyState=no-history` | Range downsampling/pagination can be added later if history grows. |
| Provider refresh orchestration | `/api/mobile/events/:slug/provider-refresh` service path | POST/service | Internal admin guard through route | Existing refresh request | New `providerHistory` report with source, interval, fidelity, refreshed count, snapshots created, skipped rows | `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | Contract fallback still applies only to quote snapshots, not chart history | Background scheduler remains open. |
| Samsung tablet live-detail proof | `/api/mobile/events/:slug/live-detail` plus `/api/markets/:id/chart` from the mobile app | GET | Public viewing | Event slug and selected primary market id | EventDetail XML marker `chart-source-polymarket-clob-prices-history chart-status-ready chart-range-1D` | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot` | None for the chart marker in Cycle DL | Provider event is closed/resolved, so live-data status is stale by design. |

Cycle DL implementation notes:

- Official Polymarket docs name the CLOB price-history query parameter `market`, but it takes the outcome token ID.
- The current Colombia vs Ghana provider event is closed/resolved. Holiwyn keeps a live-detail proof page for parity work, while the provider freshness label remains stale.

## Cycle DM - Provider Token Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server-backed live event provider identity | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `markets[].referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `outcomes[].referenceTokenId`, `referenceOutcomeLabel` | `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel` | Mobile fallback events have null provider fields and are not marked provider-backed | None for Polymarket match-winner identity; line-family markets remain unavailable unless mapped. |
| Ticket order provider selection | `/api/orders` | POST | Canonical API key with `orders:write` and internal trading beta | Existing limit-order body plus `selection` provider fields | Order response id/status/size/remaining; request metadata later consumed by portfolio routes | `ApiOrderRequest.requestBody.selection`; existing `Order`, `Market`, `Outcome` | Mock orders preserve the same selection object locally | First-class `Order.selection` column is not present. |
| Portfolio provider identity echo | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection` and `openOrders[].selection` include market/outcome plus provider market/condition/token fields | `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Server-unavailable mobile fallback omits provider fields | No production migration yet for storing selection directly on positions/orders. |
| Portfolio history provider identity echo | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection`, `recentTrades[].selection` provider fields | `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None for Cycle DM proof | Recent trades without original request body rely on market/outcome provider fields. |

Cycle DM implementation notes:

- Provider lifecycle proof is Polymarket-first and does not depend on `OPTIC_ODDS_API_KEY`.
- Android proof uses accessibility markers only; provider IDs are not visible UI copy.
- `mobile/scripts/smoke.ps1` now honors `-BackendBaseUrl` for server live-detail proof and asserts provider identity on the server-backed page and ticket.

## Super Round DN - Provider Chart Cache + Visible Orderbook

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider refresh cache lifecycle | `/api/mobile/events/:slug/provider-refresh` | POST | Provider refresh admin/internal guard | Optional refresh execution options | `cacheInvalidation.chartPaths`, `cacheInvalidation.orderbookPaths`, `postRefreshHistory` | `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot`, orderbook depth rows | None | Scheduled/background refresh remains future work. |
| Visible orderbook ladder | `/api/orderbook/:marketId/book?maxLevels=...` through live-detail hydration | GET | Public viewing | Market id and max levels | `market.orderbookDepth[]`, `orderbookDepthStatus`, `orderbookDepthSource`, bid/ask price, shares, total | Orderbook depth snapshots keyed by market/outcome/side | Deterministic quote-shaped UI fallback when route levels are absent | Full provider-owned line-family depth remains unavailable unless Polymarket exposes matching line markets. |

Super Round DN implementation notes:

- Cache invalidation now includes `/api/markets/:marketId/chart` for every compact provider market, using the same market set as orderbook invalidation.
- Samsung tablet proof asserts `route-depth-ladder`, bid/ask level labels, provider source, provider market, provider condition, and provider token markers.

## Cycle DO - Provider Filled Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed filled order creation | `/api/orders` equivalent canonical service path in proof | POST | Canonical mobile API key with `orders:write` and internal trading beta | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, `selection` with provider fields | Filled order id/status, fills, position | `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome` | None in backend proof | Production route/device proof with a currently active real Polymarket market remains future work. |
| Portfolio provider position | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `referenceTokenId`, `referenceOutcomeLabel` | `Position`, `Market`, `Outcome` | None in proof | First-class immutable order/trade selection columns remain future hardening. |
| Recent provider trade activity | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `recentTrades[].selection` provider fields | `Trade`, `Market`, `Outcome` | None in proof | Resolved-history settlement proof remains separate from filled-trade activity proof. |

Cycle DO implementation notes:

- `scripts/prove_mobile_filled_trade.ts` now creates provider-shaped market/outcome identity and submits the taker order through canonical order submission so the original ticket selection is preserved in `ApiOrderRequest`.
- Samsung tablet proof uses the existing Portfolio history smoke and asserts the provider-filled proof trade is visible.

## Super Round DT Integrated - Orderbook Interaction And Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book surface selected market/depth | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Market id and max levels | `marketId`, `depthSource`, `availability.status`, `marketIdentity.selectorKey`, `marketIdentity.marketFamily`, `marketIdentity.marketType`, `marketIdentity.marketGroupKey`, `marketIdentity.period`, `marketIdentity.line`, `marketIdentity.outcomes[]`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `providerOrderbookDepth.status` | `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot`, open `Order` rows when non-provider depth is used | DT-B tablet proof uses deterministic contract-shaped mobile fixtures for interaction proof when provider route data is not active in the Expo session | Same visible UI run still needs provider-backed ready depth; sibling selector route may be needed for all family/period/line choices. |
| Book tab/selector/ticket interaction | Mobile client state plus existing ticket/order services | Client state -> eventual order route | Fake-token trading only for this milestone | `TicketSelection` includes selected market, outcome, side, family, line, period, odds/probability when present | Existing order routes consume selected market/outcome IDs; portfolio/history later depend on the same identity | Fixture markets carry backend-shaped IDs, market type, line/period fields, and outcome IDs | Spread/period/line identity must be proven with a live backend-shaped route payload, not only fixture `line-none`/`period-none`. |

DT integrated implementation notes:

- Backend proof `docs/mobile/harness/cycle-DT-integrated-ready-orderbook-depth-proof.json` shows `provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, and 12 Price/Shares/Value rows.
- Tablet proof `docs/mobile/harness/cycle-DT-B-orderbook-interactions/cycle-DT-B-holiwyn-orderbook-proof.json` shows Yes/No side switching, selector carry-through into ticket, and side-labelled bid/ask ladder markers.
- The backend contract is ahead of the visible UI proof. Do not mark PM-GAP-075 complete until the same tablet UI run consumes provider-backed ready depth and proves Spread/period/line carry-through.

## Cycle DV - Same-Market Provider-Ready Book UI

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed live detail market hydration | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug `cycle-du-a-world-cup-provider-line-depth` launched through the mobile deep link | Event title, markets, market group/type, period, line, outcome ids/labels, provider source, external market id, condition id, outcome token id, orderbook route status/source | `Event`, `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot` | None in DV proof. The route uses the seeded provider-backed disposable event. | Broader sibling selector/options route is still useful for full Polymarket Book selector parity. |
| Provider-ready Book ladder | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Market id `d08da13e-80b8-4452-9067-f91d08f6fba4` and max levels | `marketId`, `depthSource=provider-orderbook-depth`, `availability.status=ready`, `marketIdentity.selectorKey=spreads:first-half:1.5`, `marketIdentity.marketType=spread`, `marketIdentity.period=first-half`, `marketIdentity.line=1.5`, `levels[].side`, `price`, `shares`, `value`, `providerOrderbookDepth.status=ready` | `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot` | None for DV route proof. | Current route is selected-market focused; full Polymarket selector sheet may need event/family sibling market data. |
| Ticket identity from provider-backed Book | Existing mobile ticket state and order service contract | Client state -> future `/api/orders` | Fake-token trading only for current milestone | `TicketSelection` built from selected provider-backed market/outcome | Event, market id, outcome id, side, market type, line, period, provider source, external market id, condition id, provider token marker | Existing mobile ticket/order service types and eventual `ApiOrderRequest.requestBody.selection` | None in DV proof. | Submit/order/portfolio/history lifecycle for this exact provider-ready Spread path remains future scope if required. |

Cycle DV implementation notes:

- The focused smoke command first runs the backend provider depth proof and then the Samsung tablet proof, so the app-visible markers are tied to the same seeded market id and selector key as the route JSON.
- The mobile UI now exposes `selected-selector-key-*` accessibility metadata for audit proof only; provider ids are not user-facing copy.
- DV closes the previous backend-only evidence gap for PM-GAP-075 without weakening the requirement that provider-backed ready depth must be Android-visible.

## Cycle DW-A - Provider Orderbook State Matrix

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider Book ready/non-ready state matrix | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public visibility guard; private markets still use existing access checks | Query params only: optional `outcomeId`, optional `maxLevels` capped at 200 | `depthSource`, `availability.status`, `providerOrderbookDepth.status`, `providerOrderbookDepth.reason`, `emptyState`, `marketIdentity.marketId`, `marketIdentity.selectorKey`, `marketIdentity.period`, `marketIdentity.line`, `marketIdentity.outcomes[].id`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].value` | `Market`, active `Outcome`, `ReferenceOrderbookDepthSnapshot`; proof clears local `Order` rows and `ReferenceQuoteSnapshot` rows for the disposable market | None. The unavailable state returns `depthSource=empty`, `providerOrderbookDepth.status=unavailable`, and `emptyState=no-depth`; it is not counted as ready route depth | Event-level sibling selector/options and production recurring provider refresh remain outside this focused backend state proof. |
| Focused DW-A proof harness | `scripts/prove_mobile_dw_provider_orderbook_state_matrix.ts` | Local script calling route | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | Writes `docs/mobile/harness/cycle-DW-A-provider-orderbook-state-matrix.json` with unavailable, stale, and ready route snapshots for one provider-shaped totals market | Upserts a disposable World Cup-style `Event`/`Market`/`Outcome` set, clears proof-market local and quote fallback inputs, then writes stale and fresh provider ladder rows | None. The proof fails if fresh ready state is not `provider-orderbook-depth` or if empty/unavailable is treated as ready evidence | Requires an available local database and Next server for the HTTP route probe. |

Cycle DW-A implementation notes:

- The DW-A matrix closes the DV harness gap by proving one provider-shaped selected market can report unavailable/empty, stale, and ready provider ladder states through the same Book route contract.
- Ready evidence is accepted only when `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`; the unavailable state clears quote snapshots so fallback quote rows cannot satisfy the ready assertion.
- The artifact records selector identity (`totals:regulation:2.5`), period, line, selected market id, and outcome ids in each matrix state.

## Cycle DX-A - Selected Line Order, Portfolio, And History Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected World Cup line order creation | Canonical order service backing `/api/orders` | POST | Canonical API key with `orders:write` | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` containing `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, provider source/market/condition/token ids | Order response now echoes `order.contractSide` and `order.selection` | `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None in backend proof | First-class immutable `Order.selection` column remains future hardening. |
| Selected line open order and position snapshot | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection` with selected line and provider identity | `Order`, `ApiOrderRequest`, `Position`, `Market`, `Outcome` | Mobile fallback fixtures are separate and not used in DX-A proof | Positions infer display label/contract side from market/outcome rows when original order request is not directly joined. |
| Selected line history activity | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection`, `recentTrades[].selection` with selected line and provider identity | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome` | None in backend proof | Trade rows still rely on market/outcome metadata rather than an immutable trade selection snapshot. |

Cycle DX-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json`.
- The proof creates a disposable World Cup Spread line market and verifies the same `marketId`, `outcomeId`, `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, `contractSide`, `referenceSource`, `externalMarketId`, `conditionId`, and `referenceTokenId` through request, order response, portfolio open order, canceled activity, portfolio position, and recent trade activity.
- No visible UI, smoke script, Prisma schema, or central tracker edits were required.

## Cycle ED-A - Book Provider Identity Through Order, Portfolio, And History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected provider-backed Book line order creation | `/api/orderbook/:marketId/book?maxLevels=24` for selected identity, then canonical order service backing `/api/orders` | GET, POST | Book route uses public visibility guard; order submit uses canonical API key with `orders:write` | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` containing Book/provider identity: `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, `providerSource`/`referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `tokenId`/`referenceTokenId` | Book `marketIdentity.outcomes[].tokenId`; order response `order.contractSide` and `order.selection` with both provider and reference source/token aliases | `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot`, `ApiOrderRequest`, `Order` | None in backend proof | First-class immutable `Order.selection` column remains future hardening. |
| Selected Book open order and position snapshot | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection` and `positions[].selection` preserve provider source, external market id, condition id, token id, line, period, side, and contract side | `Order`, `ApiOrderRequest`, `Position`, `Market`, `Outcome` | None in backend proof | Positions still infer identity from current market/outcome rows when original request metadata is not joined. |
| Selected Book history activity | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection` and `recentTrades[].selection` preserve provider source, external market id, condition id, token id, line, period, side, and contract side | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome` | None in backend proof | Trade rows still rely on market/outcome metadata rather than an immutable trade selection snapshot. |

Cycle ED-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`.
- The proof creates a disposable provider-backed Spread Book market, seeds provider ladder rows, reads `/api/orderbook/:marketId/book`, and verifies the selected outcome token survives through order request, order response, portfolio open order, canceled activity, portfolio position, and recent trade activity.
- `selection.providerSource`/`selection.tokenId` are now preserved alongside existing `selection.referenceSource`/`selection.referenceTokenId`, so Book-style and current mobile-style names can round-trip without a schema migration.
- No visible UI, smoke script, Prisma schema, or audit/tracker files were changed.

## Cycle EE-A - Book Lifecycle Selection Snapshots

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected Book order response/open order/cancel lifecycle | `/api/orders` backed by canonical order service, `/api/portfolio`, `/api/portfolio/history` | POST, GET | Canonical API key with `orders:write` for submit and `account:read` for portfolio reads | Order submit includes normalized `selection` from Book: `marketId`, `outcomeId`, `marketType`, `marketGroupId`, `line`, `period`, `side`, provider source/market/condition/token, and `contractSide` | `order.selection`, `openOrders[].selection`, `canceledOrders[].selection` are normalized by the shared ticket selection snapshot helper | `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None in backend proof | First-class order selection columns remain future production hardening. |
| Selected Book filled position and recent trade snapshot | `/api/portfolio`, `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection` and `recentTrades[].selection` prefer the latest matching same-user/same-market/same-outcome `ApiOrderRequest.requestBody.selection`, guarded by matching `marketId` and `outcomeId`, then fall back to current `Market`/`Outcome` metadata | `Position`, `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None in backend proof | There is still no immutable `Trade`/`Position` selection snapshot column; same market/outcome multiple-selection history can only use the latest matching request snapshot until schema work is approved. |

Cycle EE-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EE-A-lifecycle-snapshots.json`.
- `sanitizeTicketSelectionSnapshot()` is now shared by canonical order submission and portfolio metadata serialization, so Book aliases (`providerSource`, `tokenId`) and reference aliases (`referenceSource`, `referenceTokenId`) normalize identically.
- Filled position and recent trade routes now avoid moneyline/default fallback for a selected Spread/line/period/provider token when a matching order request snapshot exists.
- No visible mobile UI, mobile scripts, Prisma schema, migrations, audit-gate docs, or Polymarket gate/index files were changed.

## Cycle EF-A - Snapshot Durability After Metadata Drift

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Historical Portfolio open/canceled/filled selection display after mutable metadata changes | `/api/portfolio`, `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection`, `canceledOrders[].selection`, and `recentTrades[].selection` prefer the matching order-time/fill-time `ApiOrderRequest.requestBody.selection` for market/outcome/type/group/line/period/side/display label/source/market/condition/token fields | `ApiOrderRequest`, `Order`, `Position`, `Trade`, `Market`, `Outcome` | Current `Market`/`Outcome` fields remain a guarded fallback only when no matching request snapshot exists | First-class immutable `Trade`/`Position` selection columns remain future production hardening for arbitrary remaps and same market/outcome multi-selection history. |

Cycle EF-A implementation notes:

- Proof artifact/status: `docs/mobile/harness/cycle-EF-A-snapshot-durability.json`.
- The EF proof script creates a selected provider-backed Book Spread order, then mutates current market/outcome labels, selector-like defaults, and provider metadata to moneyline/default-looking values before reading Portfolio/history. The local run was blocked by missing `DATABASE_URL`; focused route/helper tests cover the durability assertions in this worktree.
- Focused route tests now assert open orders, filled positions, canceled history, and recent trades keep the selected Spread/line/period/provider token snapshot and do not fall back to mutated moneyline/current metadata.
- No mobile source, mobile scripts, Prisma schema, or migration files were changed.

## Cycle EB-A - Live Detail Selector And Selected Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live game selected market/line selector | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `markets[].selection.selectorKey`, `marketId`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `marketType`, `marketFamily`, `displayLabel`, `period`, `line`, `lineValue`, `unit`, `outcomes[]` | `Event`, `Market`, active `Outcome` | None in the route contract. UI fixtures, when used, should match this shape exactly. | Event-level sibling selector breadth is still limited to compact markets returned by the route. |
| Selected market chart state | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `markets[].chartHistory[]`, `markets[].chartHistoryStatus`, `markets[].selection.chart.targetMarketId`, `status`, `source`, `pointCount`, `outcomeCount`, `range`, `ranges`, `emptyState` | `MarketOutcomeSnapshot` keyed by compact `marketId`/`outcomeId` | None. Empty history is represented as `selection.chart.status=unavailable` and `emptyState=no-history`. | Real CLOB history for line-family markets requires mapped Polymarket token IDs or an explicitly optional enrichment source. |

Cycle EB-A implementation notes:

- The live-detail response now carries a backend-owned `selection` block per compact market so mobile can change selected market, period, line, and chart state without constructing UI-only selector structures.
- `scripts/probe_mobile_live_detail_route.ts` now fails its route proof if any compact market lacks a matching `selection.marketId`, selector key containing the market id, or chart target matching the market id.
- No schema change was required. Existing `Market` fields (`marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, `unit`), active `Outcome` rows, provider outcome fields, and `MarketOutcomeSnapshot` rows cover the contract.

## Cycle EU - Route-Backed Retail Ticket Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend event open for Local MVP retail ticket | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from deep link `forceBackendEventSlug` | `event.title`, `event.liveDataStatus`, `markets[].id`, `marketType`, `period`, `line`, `referenceSource`, `externalMarketId`, `conditionId`, `outcomes[].id`, `outcomes[].referenceTokenId`, `outcomes[].referenceOutcomeLabel`, `outcomes[].price/bestBid/bestAsk` | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots for proof event | None for spread/totals in EU proof. If a matching backend line is absent, mobile falls back to deterministic contract-shaped fixture and the row is not counted as route-backed. | Team-total provider rows are not covered by the disposable EU route event. |
| Local MVP fake-token order from route-backed ticket | Local mobile mock order path using backend-shaped ticket selection | Client-side mock | No auth for MVP fake-token order | Ticket amount/side plus market/outcome/selection identity | Portfolio cards consume order-time selection fields generated from backend market/outcome fallback metadata | Mobile local state only for EU order/Portfolio proof | This is intentional for the Local MVP. Market data is server-backed, order placement is mock/fake-token. | Server order lifecycle for this exact retail path remains a later milestone when fake-token order APIs are promoted. |

Cycle EU implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-route-backed-retail-event.json`.
- Backend proof artifact slug: `mobile-el-a-provider-breadth-4f35da22`; tablet proof slug: `mobile-el-a-provider-breadth-b917234c`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE` unset, proving server market data plus mock fake-token trading.
- `full-game` backend line periods are treated as retail `Reg. Time`; `first-half` and `second-half` remain distinct and period-safe.

## Cycle EV - Route-Backed Server Order Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend event open for Local MVP server-order ticket | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from deep link `forceBackendEventSlug` | `event.title`, `event.liveDataStatus.source`, `markets[].id`, `marketType`, `period`, `line`, `referenceSource`, `externalMarketId`, `conditionId`, `outcomes[].id`, `outcomes[].referenceTokenId`, `outcomes[].price/bestBid/bestAsk` | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots for proof event | None for the selected spread proof. If a backend line is absent, deterministic fixtures are not accepted as EV P0 evidence. | Production active-event provider line-family breadth remains incomplete. |
| Local MVP fake-token order from route-backed ticket | `/api/orders` via mobile order service | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` with `marketType=spread`, line `1.5`, period `Reg. Time`, provider source/market/condition/token identity | Order response success plus order identity; mobile transitions to Portfolio after submit | `ApiKey`, `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None. EV runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Filled lifecycle/history for this exact route-backed retail path remains follow-up. |
| Server Portfolio sync after route-backed order | `/api/portfolio` | GET | Same mobile dev API key with account read scope | None | `openOrders[]`, `openOrders[].selection`, open order count, side, label, provider source/token, line, period | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, optional `Position` if filled later | None. EV requires `Server portfolio synced`. | Longer activity/history proof beyond open order is not covered in EV. |

Cycle EV implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-route-backed-retail-event.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-5f9e2d3f`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, proving server market data plus server fake-token order placement.
- The proof uses LAN backend URL `http://172.16.200.14:3002` because wireless tablet ADB reverse/localhost is unreliable for this device.

## Cycle EW - Route-Backed Server Cancel And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed server order cancel | `/api/orders/:id` | DELETE | Mobile dev API key with order cancel scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | Order id from server open order row | Cancel response status; mobile then refreshes Portfolio state | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, user balance/locked funds | None. EW runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Filled lifecycle for this retail path remains follow-up. |
| Server Portfolio/history sync after cancel | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `openOrders[]` count drops, `canceledOrders[]` maps into mobile activity with selected spread/provider identity | `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None. EW requires `Server portfolio synced` and Android-visible canceled activity. | Recent filled trade history is not covered in EW. |

Cycle EW implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-route-backed-retail-event.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-35441a1a`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then used the visible Portfolio Cancel control to hit server cancel.
- The proof uses LAN backend URL `http://172.16.200.14:3002`.

## Cycle EX - Route-Backed Server Filled Trade And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed filled retail order | `/api/orders` | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price near `0.52`, size from `$25`, `contractSide=YES`, and selected spread/provider metadata | Order response status `FILLED`, filled shares, execution price, selection identity | `ApiKey`, `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome` | None. EX runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Production non-disposable liquidity and line-family breadth are still follow-up. |
| Counterparty liquidity seed | `scripts/seed_mobile_route_spread_counterparty.ts` using `mintCompleteSetForPublicOrderbook` and `placeOrderAndMatch` | Local script/service | Local development/server only | Event slug; selects spread/home outcome and seeds SELL `0.52` size `60` | Writes seeded maker order, market id, outcome id, provider source/condition/token | `User`, `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | None. The seed is proof liquidity, not UI fallback. | Production liquidity provider strategy remains separate. |
| Server Portfolio/history sync after fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `positions[]`, `recentTrades[]`, `latest-activity-card`, position and activity selection metadata | `Position`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None. EX requires Android-visible position and recent activity. | Totals/team-total filled lifecycle is not covered in EX. |

Cycle EX implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-retail-event.json`.
- Counterparty liquidity proof: `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-counterparty.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-9bd275c5`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then filled the visible simple retail spread ticket against the seeded maker ask.

## Cycle EY - Route-Backed Server Filled Totals Trade And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed filled totals retail order | `/api/orders` | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price near `0.46`, size from `$25`, `contractSide=YES`, and selected totals/provider metadata | Order response status `FILLED`, filled shares, execution price, selection identity | `ApiKey`, `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome` | None. EY runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Team-total route-backed filled lifecycle is not covered yet. |
| Counterparty liquidity seed for totals | `scripts/seed_mobile_route_spread_counterparty.ts` using `mintCompleteSetForPublicOrderbook` and `placeOrderAndMatch` | Local script/service | Local development/server only | Event slug, `marketGroupKey=totals`, `outcomeSide=over`, `askPrice=0.46`, `askSize=60` | Writes seeded maker order, market id, outcome id, provider source/condition/token | `User`, `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | None. The seed is proof liquidity, not UI fallback. | Production liquidity provider strategy remains separate. |
| Server Portfolio/history sync after totals fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `positions[]`, `recentTrades[]`, `latest-activity-card`, position and activity selection metadata for totals line `2.5` | `Position`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None. EY requires Android-visible position and recent activity. | Team-total filled lifecycle and production active-event provider liquidity remain follow-up. |

Cycle EY implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-route-backed-retail-event.json`.
- Counterparty liquidity proof: `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-route-backed-totals-counterparty.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-62990515`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then filled the visible simple retail Totals ticket against the seeded maker ask.

## Cycle EZ - Route-Backed Server Filled Team Total Trade And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed Team Total provider fixture | `/api/mobile/events/:slug/live-detail`, `/api/mobile/events/:slug/provider-refresh` | GET / refresh helper | Public viewing for live-detail; local proof helper for refresh | Event slug from deep link `forceBackendEventSlug`; provider refresh uses event slug | Compact `markets[]` now includes `marketGroupKey=team-totals`, `marketType=team_total_goals`, `marketFamily=team_total`, line `1.5`, provider market/condition/token fields, quote/depth/history ready states | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots | None for EZ proof. Team Total is route-backed provider-shaped data. | Production active-event provider mapping still depends on real Gamma/CLOB event matching. |
| Route-backed filled Team Total retail order | `/api/orders` | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price near `0.52`, size from `$25`, `contractSide=YES`, and selected team-total/provider metadata | Order response status `FILLED`, filled shares, execution price, selection identity | `ApiKey`, `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome` | None. EZ runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Production non-disposable liquidity remains follow-up. |
| Counterparty liquidity seed for Team Total | `scripts/seed_mobile_route_spread_counterparty.ts` using `mintCompleteSetForPublicOrderbook` and `placeOrderAndMatch` | Local script/service | Local development/server only | Event slug, `marketGroupKey=team-totals`, `outcomeSide=over`, `askPrice=0.52`, `askSize=60` | Writes seeded maker order, market id, outcome id, provider source/condition/token | `User`, `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | None. The seed is proof liquidity, not UI fallback. | Production liquidity provider strategy remains separate. |
| Server Portfolio/history sync after Team Total fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `positions[]`, `recentTrades[]`, `latest-activity-card`, position and activity selection metadata for team-total line `1.5` | `Position`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None. EZ requires Android-visible position and recent activity. | Production active-event provider liquidity remains follow-up. |

Cycle EZ implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-retail-event.json`.
- Counterparty liquidity proof: `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-team-total-counterparty.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-477e6b35`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then filled the visible simple retail Team Total ticket against the seeded maker ask.

## Cycle FA - Route-Backed Retail Status States

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed retail status event | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from deep link `forceBackendEventSlug` | `event.liveDataStatus`, `markets[].availability.source/status/marketStatus/reason`, `marketType`, `period`, `line`, provider source/market/condition/token fields, outcome prices | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots | None for FA proof. The route creates provider-backed ready/stale/unavailable states. | Production active-event stale/unavailable status breadth still needs real mapped Polymarket data. |
| Provider-status disposable setup | `scripts/prove_mobile_ej_a_provider_status_breadth.ts` | Local script/route handler call | Local development only | Output path | Creates disposable live event and reads `/api/mobile/events/:slug/live-detail` to verify ready, stale, unavailable route states | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | None. Disposable provider-shaped data is used as contract proof data. | This is not production provider ingestion. |
| Simple TradeTicket status rendering | Mobile local component state from selected route market | N/A | N/A | Selected market/outcome from EventDetail | `ticket.market.availability.status`, `reason`, provider identity, line/period/marketType | No additional backend model | None. The ticket reads route-shaped selected market data. | Backend order rejection for unavailable provider markets should be hardened separately. |

Cycle FA implementation notes:

- `availability.source=provider-lifecycle` is now emitted for provider-backed stale/unavailable compact markets.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE` unset, and `EXPO_PUBLIC_SHOW_ORDERBOOK` unset.
- Tablet proof slug: `mobile-ej-a-provider-status-breadth-6b9b3845`.

## Cycle FB - Provider Unavailable Order Guard

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server fake-token order on provider-backed ticket | `/api/orders` | POST | Mobile/API credential with `orders:write`; internal trading gate enabled | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, optional `contractSide`, and `selection` | Success path unchanged; unavailable path returns/stores `{ error: { code: "MARKET_UNAVAILABLE" } }` with HTTP `409` | `ApiOrderRequest`, `Market`, `ReferenceQuoteSnapshot`, `Order` only on accepted path | None. Provider-backed unavailable markets require provider quote data. | Future: expose this server rejection in mobile only if a submit bypass/error path becomes visible. |
| Provider quote tradability guard | Latest `ReferenceQuoteSnapshot` for market/outcome | Internal Prisma read | Backend only | Selected `marketId` and `outcomeId` from order payload | `acceptingOrders`, `reason`, `fetchedAt`, provider identity on `Market` | `ReferenceQuoteSnapshot`, provider identity fields on `Market` | Non-provider markets keep existing local behavior. | Production provider refresh breadth must keep quote snapshots fresh for real active events. |

## Cycle FC - Route-Backed Event Discovery Cards

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live World Cup discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | None | `events[].slug`, title/team/status/live clock fields, `marketCount`, `activeMarketCount`, and opt-in `events[].markets[]` compact market data | `Event`, `Market`, `Outcome`, quote/depth read models via `serializeMarketReadModel` | Mobile keeps local World Cup fixtures if backend discovery fails or returns no usable markets. | Production active Polymarket event breadth remains P1. |
| Compact route-backed event card markets | `events[].markets[]` from `/api/events` opt-in payload | GET payload field | Public viewing | Query param `includeMobileMarkets=1` | `id`, `marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, provider source/market/condition/token fields, outcomes, best bid/ask, price | `Market`, `Outcome`, `ReferenceQuoteSnapshot`, orderbook pricing read model | None for returned events; no ad hoc frontend-only market structure is created. | The route currently returns compact market data, not full event-detail chart/live stats. Detail route still owns rich game-page data. |

Cycle FC implementation notes:

- Mobile discovery no longer sends a default text search for `World Cup`; structured `sportKey=soccer` and `leagueKey=world_cup` prevent valid team-titled World Cup events from being hidden.
- Tablet evidence proves the route-backed disposable event `mobile-el-a-provider-breadth-e0acffe0` appears on Home with compact outcomes and no default orderbook UI.

## Cycle FD - Route Discovery Opens Route-Backed Event Detail

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live discovery card entry | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | None | `events[].slug`, `events[].id`, `events[].title`, status/live clock fields, compact `events[].markets[]`, outcome labels/prices, provider source markers | `Event`, `Market`, `Outcome`, provider quote/read-model fields | If the event list route fails or has no usable markets, mobile still has local fixtures as fallback. FD proof requires the route-backed card. | Production active Polymarket World Cup breadth remains P1. |
| Event Detail hydration from discovery card | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event id/slug from the selected discovery event | Full event title/status, chart/probability fields, Game Lines market groups, market/outcome identity, provider source/market/condition/token fields | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, chart history snapshots | If hydration fails, the compact event remains selected; FD proof requires successful same-event route hydration. | A later cycle should prove the same Home-opened event through Buy/Sell ticket, server fake-token order, and Portfolio/history. |

Cycle FD implementation notes:

- `openEventDetail` uses the compact discovery event for instant navigation, then hydrates the same event through the live-detail route when server market-data mode is active.
- This cycle does not add or expose orderbook, chat, live stats, deposit, location, or social routes.
- Tablet proof slug: `mobile-el-a-provider-breadth-de83f85d`.

## Cycle FE - Home Route Event Opens Simple Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to ticket-ready Event Detail | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | None | Event slug/id/title/status, compact markets/outcomes, provider source markers | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FE proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket World Cup breadth remains P1. |
| Spread ticket opened from Home-opened detail | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event id/slug from Home card | Chart/probability fields, Game Lines, `marketType=spread`, line `1.5`, period mapped to `Reg. Time`, outcome id, provider source, provider token | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, chart history snapshots | No arbitrary frontend-only data. The ticket consumes route-shaped market/outcome identity. | Submit/Portfolio proof from this Home-opened path remains follow-up. |

Cycle FE implementation notes:

- No route or schema changes were made.
- The same backend contract from FD now proves the next visible user step: selected Spread outcome -> simple ticket.
- Tablet proof slug: `mobile-el-a-provider-breadth-3eeba606`.

## Cycle FF - Home Route Ticket Submit And Portfolio History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to fake-token order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FE/FF use local mock fake-token order state after route-backed market selection. | Production active Polymarket event breadth remains P1. |
| Fake-token order and Portfolio/history from Home-opened ticket | Mobile local mock order path | Client state | No auth for MVP fake-token order | Ticket amount `$25`, side `buy`, contract side `yes`, and selected Spread identity | Portfolio/latest order/latest activity/position consume order-time selected identity and fake-token status | Mobile local state only for FF order/Portfolio proof | Intentional Local MVP mock mode. | Server order mode for this exact Home-opened path remains follow-up. |

Cycle FF implementation notes:

- No route or schema changes were made.
- FF uses route-backed market data, then local fake-token order state.
- Tablet proof slug: `mobile-el-a-provider-breadth-ad48c541`.

## Cycle FG - Home Route Server Order And Portfolio Open Order

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to server fake-token order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FG proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket event breadth remains P1. |
| Server fake-token order submit from Home-opened ticket | `/api/orders` | POST | Temporary mobile dev API credential with order scope | Ticket amount `$25`, side `buy`, order type/price/size, selected `marketId`, `outcomeId`, contract side `yes`, and selected Spread metadata | Order success state and Portfolio navigation after submit | `ApiOrderRequest`, `Order`, `Market`, `Outcome`, provider snapshot/read-model fields | None for FG. The order submit uses server mode. | Filled/cancel lifecycle from the exact Home-opened path remains P1. |
| Server Portfolio/history sync after Home-opened order | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `latest-order-card`, `portfolio-open-order-count`, open order row, market type `spread`, line `1.5`, period `Reg. Time`, provider source/token | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FG. Portfolio is server-synced. | Production active-event provider liquidity remains follow-up. |

Cycle FG implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-event.json`.
- A temporary mobile dev credential was created by `npm run mobile:dev-credential`.
- Tablet proof slug: `mobile-el-a-provider-breadth-61978ca5`.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a real in-process mobile API key.

## Cycle FH - Home Route Server Cancel And Portfolio Activity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to cancelable server order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FH proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket event breadth remains P1. |
| Server fake-token order submit from Home-opened ticket | `/api/orders` | POST | Temporary mobile dev API credential with order scope | Ticket amount `$25`, side `buy`, order type/price/size, selected `marketId`, `outcomeId`, contract side `yes`, and selected Spread metadata | Order success state and Portfolio navigation after submit | `ApiOrderRequest`, `Order`, `Market`, `Outcome`, provider snapshot/read-model fields | None for FH. The order submit uses server mode. | Filled lifecycle from the exact Home-opened path remains P1. |
| Server order cancel from Portfolio | `/api/orders/:id` | DELETE | Same mobile dev API key with order cancel scope | Order id from visible open order row | Canceled state via refreshed Portfolio/history, `activity-canceled`, `status-canceled`, selected market metadata | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FH. The cancel uses server mode. | Production active-event provider liquidity remains follow-up. |
| Server Portfolio/history sync after cancel | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `latest-activity-card`, canceled activity row, market type `spread`, line `1.5`, period `Reg. Time`, provider source/token | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FH. Portfolio/history is server-synced. | Production active-event provider liquidity remains follow-up. |

Cycle FH implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-event.json`.
- A temporary mobile dev credential was created by `npm run mobile:dev-credential`.
- Tablet proof slug: `mobile-el-a-provider-breadth-4f7f2397`.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a real in-process mobile API key.

## Cycle FI - Home Route Server Filled Position And Activity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to fillable server order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FI proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket event breadth remains P1. |
| Server fake-token order submit from Home-opened ticket | `/api/orders` | POST | Temporary mobile dev API credential with order scope | Ticket amount `$25`, side `buy`, order type/price/size, selected `marketId`, `outcomeId`, contract side `yes`, and selected Spread metadata | Filled order state and Portfolio navigation after submit | `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome`, provider snapshot/read-model fields | None for FI. The order submit uses server mode and fills against seeded liquidity. | Production active-event provider liquidity remains follow-up. |
| Counterparty liquidity seed for fill proof | `scripts/seed_mobile_route_spread_counterparty.ts` | Local script/Prisma write | Local development only | Event slug, optional market group/outcome/price/size | Creates a maker SELL order at `0.52` for the selected route-backed spread outcome | `User`, `Order`, `Market`, `Outcome` | None. This is deterministic backend-shaped proof liquidity. | Replace with real production liquidity/provider depth when active event breadth is ready. |
| Server Portfolio/history sync after fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `latest-order-card`, `latest-activity-card`, `position-card-`, `status-filled`, filled shares, exec price, market type `spread`, line `1.5`, period `Reg. Time`, provider source/token | `Order`, `Trade`, `Position`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FI. Portfolio/history is server-synced. | Production active-event provider liquidity remains follow-up. |

Cycle FI implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-event.json`.
- Counterparty liquidity was created by `scripts/seed_mobile_route_spread_counterparty.ts` into `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-counterparty.json`.
- A temporary mobile dev credential was created by `npm run mobile:dev-credential`.
- Tablet proof slug: `mobile-el-a-provider-breadth-0ca8dfb3`.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a real in-process mobile API key.

## Cycle FU - Portfolio Value History Backend Route

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio performance chart range data | `/api/portfolio/value-history?range=1D|1W|1M|All` | GET | Session user or mobile API key with `account:read` | Query param `range`; defaults to `1D` when omitted | `range`, `ranges`, `source=portfolio-value-history-route`, `status`, `generatedAt`, `lastUpdated`, `emptyState`, `points[].timestamp/value/cash/positionsValue/pnl` | `UserBalance`, `Position`, `MarketOutcomeSnapshot` | Standalone mobile still has deterministic fallback data with the same response shape until route wiring is enabled. | Persisted account-level value snapshots remain future work; this route reconstructs value history from market outcome snapshots and current wallet/position state. |

Cycle FU implementation notes:

- The route reuses the same auth model as `/api/portfolio`.
- Invalid ranges return `400` before account state queries.
- Empty accounts return `status=empty`, `emptyState=no-history`, and no points.
- No orderbook, deposit, withdraw, chat, live stats, or social behavior was added.

## Cycle LA - Cashout/Sell Safety Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/Event Detail Cash out all | `/api/orders` | POST | Mobile API key with `orders:write` and internal trading beta gate enabled | Server close submits `side=SELL`, `marketId`, `outcomeId`, current price, and full held share size from the position | Success creates a server SELL order; Portfolio refresh then consumes open order/reserved-share state from `/api/portfolio` | `Order`, `Position`, `Market`, `Outcome`, `ApiOrderRequest`; matching reserves owned shares before creating the order | Mock-mode close remains local Portfolio state only. Server-mode invalid cashout is blocked before API when shares are missing/zero. | No P0 gap for focused cashout/sell safety. Provider-backed production close replay remains P1. |
| Naked sell/oversell route guard | `/api/orders`, `/api/portfolio` | POST, GET | Same mobile API key | SELL order size greater than owned/available shares, or no position at all | `409` errors with `Insufficient shares` or `Insufficient available shares`; Portfolio remains unchanged with no open order | `Position.shares`, `Position.reservedShares`, matching transaction locks | None in server mode. The backend rejects even if frontend fails. | None for focused route-backed sell safety. |

Cycle LA implementation notes:

- `mobile/src/services/positionCloseService.ts` now exposes cashout eligibility and cashout-all estimate helpers.
- Portfolio and Event Detail disable visible server cashout/sell actions when the position has no positive server share quantity.
- The backend route guard was already present in matching; LA refreshes proof with current loop env and documents the frontend safety layer.

## Cycle LB - Event Detail Line Availability Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines line/period controls | `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from route-backed summary card | `markets[].marketType`, `markets[].selection.marketFamily`, `markets[].line`, `markets[].period`, outcomes, availability | `Event`, `Market`, `Outcome`; market group/type/line/period fields | Local/offline Event Detail keeps deterministic fallback line options. Route-backed Event Detail derives line/period options only from backend markets. | No focused P0 gap for visible line availability. Production provider breadth remains P1. |
| Team Total line identity | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | Backend team-total `line` and `period` drive visible label and ticket metadata | `Market.marketType`, `Market.line`, `Market.period`, selection metadata | Local fallback still uses the existing `1.5` regulation team-total fixture. | No focused P0 gap. |

Cycle LB implementation notes:

- Added `eventDetailLineAvailabilityService` so route-backed line controls are backend-derived instead of static frontend guesses.
- Spread/Totals period and line rails now use backend-supported values for route-backed Event Detail.
- Team Total now uses backend line/period for visible label and ticket selection instead of always pretending `1.5` regulation.

## Cycle LF - Portfolio Position Availability Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position re-trade from server positions | `/api/portfolio` | GET | Session user or mobile API key with `account:read` | None | `positions[].market.status`, `positions[].market.availability`, `marketId`, `outcomeId`, current quote/depth fields | `Position`, `Market`, `Outcome`, orderbook quote snapshots | Mock-mode Portfolio positions remain local. Server-mode positions now preserve backend market availability before opening fallback tickets. | No P0 gap for focused position availability. |
| Portfolio position Buy/Sell ticket submit guard | `/api/orders` | POST | Mobile API key with `orders:write` | Existing ticket submit payload; no new request fields | Existing order error path plus frontend pre-submit block when fallback market availability is `suspended` or `unavailable` | `Order`, `Market`, `Outcome`, matching safety layer | Local/offline fallback still works for mock positions. | Richer row-level closed/paused-market copy remains optional P2. |

Cycle LF implementation notes:

- `/api/portfolio` now maps market status into a small availability object for position and open-order markets.
- Mobile maps `position.marketAvailability` and carries it into backend-only position fallback tickets.
- The existing ticket submit availability guard now blocks unavailable Portfolio re-trade fallback targets before `/api/orders`.

## Cycle LG - Event Detail Quote Failure Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail server quote refresh | `/api/markets/:id/quote` | GET | Public market data | Market id and optional outcome id | Quote price/depth fields when successful; per-market failure state when route call fails | `Market`, `Outcome`, quote/read-model source behind quote route | Mock/offline mode still uses local market probabilities. Server-mode Event Detail now marks failed quote markets unavailable instead of silently keeping guessed prices. | No P0 gap for focused quote failure handling. |
| Quote-failed ticket submit | `/api/orders` | POST | Mobile API key with `orders:write` | Existing ticket payload | Existing client-side submit block from market availability before route call | `Order`, `Market`, `Outcome` | None in server mode for quote-failed markets. | Richer retry UI/copy remains optional P2. |

Cycle LG implementation notes:

- Added `loadMarketQuoteStateById` so quote batching returns both successful quotes and failed market ids.
- Event Detail server quote refresh applies quote-failure availability to failed markets.
- The existing ticket submit guard blocks `source=market-quote-route`, `status=unavailable` markets.

## Cycle LH - Discovery Quote Failure Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Live/Search discovery quote hydration | `/api/events?includeMobileMarkets=1`, `/api/events?statusGroup=live&includeMobileMarkets=1`, `/api/events?search=...`, `/api/markets/:id/quote` | GET | Public market data | Event list filters plus market ids for quote refresh | Compact event markets, quote price/depth fields, and per-market quote failure state | `Event`, `Market`, `Outcome`, quote/read-model source behind quote route | Mock/offline mode still uses local markets. Server-mode discovery now marks quote-failed markets unavailable. | No P0 gap for focused discovery quote failure handling. |
| Futures discovery quote hydration | `/api/events?marketType=future&includeMobileMarkets=1`, `/api/markets/:id/quote` | GET | Public market data | Future market filter and market ids for quote refresh | Future markets, quote price/depth fields, and per-market quote failure state | `Market`, `Outcome`, quote/read-model source behind quote route | Local fallback futures remain only outside server mode. Server-mode future quote failures are unavailable. | No focused P0 gap. |

Cycle LH implementation notes:

- Home, Live, Search, and Futures server discovery now use `loadMarketQuoteStateById`.
- Discovery event and market-list hydration applies quote-failure availability instead of silently keeping stale/local probabilities.
- The existing ticket submit guard blocks quote-failed discovery markets before `/api/orders`.

## Cycle LI - Account Bootstrap Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account balance/profile/menu bootstrap | `/api/account/balance`, `/api/account/profile`, `/api/account/navigation` | GET | Mobile API key with `account:read` or session user | None | Balance USDC fields, account display name/sign-in state, navigation item metadata, and visible account data sync status | `User`, `UserBalance`, account navigation metadata service | Mock/offline mode keeps local account defaults. Server-mode bootstrap now reports visible error on partial route failure while applying successful data. | No P0 gap for focused Account bootstrap contract. |
| Account visible error handling | Same account routes | GET | Same account read auth | None | `account-data-sync` status row and menu source labels | Same account models/services | Local defaults remain only where route data failed. | Per-route retry controls remain optional P2. |

Cycle LI implementation notes:

- Added `resolveAccountBootstrapResults` to require balance, profile, and navigation success for a fully synced Account state.
- Account bootstrap applies successful partial data but sets visible `accountDataStatus=error` when any route fails.
- Account screen now shows account data sync state separately from profile preferences sync state.

## Cycle LJ - Cancel No Optimistic Server Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order cancel in server mode | `/api/orders/:id`, `/api/portfolio`, `/api/portfolio/history` | DELETE then GET + GET | Mobile API key with `orders:write` and `account:read` | Order id from visible open order row | Same order id with `status=CANCELED`, followed by refreshed open-order/history state | `Order`, `UserBalance`, `ApiOrderRequest`, `Market`, `Outcome` | Mock mode still removes the open order and appends canceled activity locally. Server mode no longer mutates local Portfolio before backend confirmation. | No P0 gap for focused no-optimistic server cancel contract. |

Cycle LJ implementation notes:

- Added `shouldApplyOptimisticCancel` so only mock mode applies local cancel mutation before confirmation.
- Server-mode cancel now waits for `DELETE /api/orders/:id` confirmation and Portfolio/history refresh.
- Failed server cancel keeps existing visible state and marks Portfolio sync error.

## Cycle LK - Sorted Event Cursor Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search sorted discovery pagination | `/api/events?includeMobileMarkets=1&sortBy=popular|live&limit=...&cursor=...` | GET | Public viewing | Query params: sport/league filters, optional search/status/saved ids, sort, limit, cursor | `events[]`, `nextCursor`, `page.limit`, `page.nextCursor`, `page.hasMore`, `page.sortBy`, or `400` cursor error | `Event`, `Market`, `Outcome`; compact mobile market read model | Local/offline discovery is unchanged. Server mode uses backend page/cursor metadata. | No focused P0 gap. Production ranking metrics remain governed by prior Search/Home metric P1s if product wants richer provider metrics. |

Cycle LK implementation notes:

- Sorted mobile event pages now require the cursor id to exist inside the filtered and sorted backend result set.
- Valid sorted cursors start after the cursor event.
- Stale or filtered-out sorted cursors return `400` with `Invalid event cursor for filtered mobile page.` instead of duplicating page one.

## Cycle LL - Mobile Event Listed Market Filter Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live event list visibility | `/api/events?...&includeMobileMarkets=1` | GET | Public viewing | Query params: sport/league filters, optional search/status/saved ids, market type, sort, limit, cursor | `events[]`, compact `markets[]`, metrics, `nextCursor`, `page` | `Event`, `Market`, `Outcome`; public listed market filter | Local/offline discovery is unchanged. Server mode now receives only events with at least one listed public market. | No focused P0 gap. Existing provider metric/ranking breadth remains separate P1 work if required. |
| Home futures event list visibility | `/api/events?marketType=future&includeMobileMarkets=1` | GET | Public viewing | Query params include `marketType=future` | Futures/outright events and compact futures markets | `Event`, `Market`, `Outcome`; `Market.marketType` future/outright aliases | Local/offline futures fallback is unchanged. | No focused P0 gap. Fuller production futures catalog breadth remains tracked separately. |

Cycle LL implementation notes:

- `/api/events` now applies `markets.some({ visibility: PUBLIC, isListed: true })` in the event `where` clause before pagination.
- `marketType=future|futures|outright` also applies the future/outright market type constraint before pagination.
- Post-fetch filtering remains a defensive last check, not the primary page contract.

## Cycle LM - Mobile Event Status Group Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home Live and Live tab feed | `/api/events?statusGroup=live&includeMobileMarkets=1` | GET | Public viewing | Query params: sport/league filters, optional limit/cursor | Live `events[]`, compact `markets[]`, `nextCursor`, `page` | `Event.status`, `Event.liveStatus`, listed `Market` rows | Local/offline feed remains unchanged. Server mode now treats `liveStatus=in_progress` as live. | No focused P0 gap. |
| Search Upcoming filter | `/api/events?statusGroup=upcoming&includeMobileMarkets=1` | GET | Public viewing | Query params: search, optional sort/saved ids, limit/cursor | Upcoming `events[]`, compact `markets[]`, `nextCursor`, `page` | `Event.status`, `Event.liveStatus`, `Event.startTime`, listed `Market` rows | Local/offline Search remains unchanged. Server mode now excludes live/today/terminal events from Upcoming. | P2 optional user-local timezone semantics for Today. |
| Home Today filter | `/api/events?statusGroup=today&includeMobileMarkets=1` | GET | Public viewing | Query params: sport/league filters, optional limit/cursor | Today `events[]`, compact `markets[]`, `nextCursor`, `page` | `Event.status`, `Event.startTime`, listed `Market` rows | Local/offline Home remains unchanged. | P2 optional user-local timezone semantics; current contract is UTC day. |

Cycle LM implementation notes:

- `statusGroup=live` now matches `Event.status=live` or `Event.liveStatus=live|in_progress`.
- `statusGroup=upcoming` now requires scheduled/upcoming status or future `startTime`, while excluding live, today, closed, ended, resolved, settled, canceled, and related terminal statuses.
- `statusGroup=today` remains backend-owned UTC-day filtering.

## Cycle LN - Mobile Saved Event Identity Filter Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home Saved event filter | `/api/events?eventIds=<saved-id-or-slug>&includeMobileMarkets=1` | GET | Public viewing | Saved event identity values from mobile/profile preferences | Saved `events[]`, compact `markets[]`, `nextCursor`, `page` | `Event.id`, `Event.slug`, listed `Market` rows | Empty saved state remains handled locally without an unfiltered route fallback. | P1 first-class saved/followed route if saved state outgrows profile preferences. |
| Search Saved event filter | `/api/events?search=...&eventIds=<saved-id-or-slug>&includeMobileMarkets=1` | GET | Public viewing | Search query plus saved event identity values | Saved search `events[]`, compact `markets[]`, `nextCursor`, `page` | `Event.id`, `Event.slug`, listed `Market` rows | Empty saved state remains handled locally without an unfiltered route fallback. | P1 first-class saved/followed route if needed later. |

Cycle LN implementation notes:

- Mobile saves normalized event identity as `event.slug || event.id`.
- `/api/events?eventIds=...` now matches each saved value against both `Event.id` and `Event.slug`.
- This keeps existing profile-preference saved state compatible with backend-filtered Home/Search Saved pages.

## Cycle LO - Portfolio Route Shape Validation Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio snapshot apply | `/api/portfolio` | GET | Mobile API key/session with `account:read` | None | `walletAvailableUSDC`, `positions[]`, `positions[].shares/avgCost/currentPrice/valueTokens/costBasisTokens/pnlTokens`, `openOrders[]`, `openOrders[].price/size/remaining` | `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | Mock/offline Portfolio remains local. Server mode now rejects malformed snapshot route shape before applying visible state. | P2 optional route-specific retry copy. |
| Portfolio history/activity apply | `/api/portfolio/history` | GET | Mobile API key/session with `account:read` | None | `history[]`, `canceledOrders[]`, `recentTrades[]`, numeric amount/share/price fields | `Order`, `Trade`, `Market`, `Outcome`, settlement/history read models | Mock/offline activity remains local. Server mode now rejects malformed history route shape before applying visible activity. | P2 optional route-specific retry copy. |

Cycle LO implementation notes:

- `loadPortfolioSnapshot` validates required arrays and finite numeric fields before mapping server state.
- `loadPortfolioHistoryActivities` validates required arrays and finite numeric fields before mapping activity rows.
- Rejected snapshot/history loaders feed the existing partial-sync resolver, causing visible Portfolio sync error instead of false synced state.

## Cycle LP - Order Response Numeric Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket order submit lifecycle state | `/api/orders` | POST | Mobile API key with `orders:write` | Canonical limit order request with selected market/outcome/contract side/selection | `order.id`, optional `order.status`, optional `order.size`, optional `order.remaining`, optional `fills[].size`, selected line echo | `Order`, `Trade`, `Market`, `Outcome`, matching response | Mock orders remain local. Server mode accepts id-only confirmations but validates lifecycle numeric fields when present. | P2 optional richer inline submit error copy. |

Cycle LP implementation notes:

- Id-only server confirmations remain valid for legacy/older route responses.
- When `/api/orders` returns lifecycle numbers, mobile now requires `size`, `remaining`, and `fills[].size` to parse as finite numbers.
- Malformed lifecycle fields reject before visible latest-order/open-order state is updated.

## Cycle LQ - Live Feed Route Shape Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live tab route-backed event feed apply | `/api/events?statusGroup=live&includeMobileMarkets=1` | GET | Public viewing | Query params: sport/league filters, `limit`, optional `cursor` | `events[]`, `events[].id/slug/title/status/liveStatus/startTime`, compact `markets[]`, `markets[].outcomes[]`, outcome prices/quotes/tradability, `nextCursor`, `page` | `Event`, `Market`, `Outcome`; compact mobile event list read model | Local/offline Live feed remains local. Server mode now validates route page shape before normalizing visible Live cards. | P2 optional Live-tab-specific retry/error copy. |

Cycle LQ implementation notes:

- `loadLiveEventFeed` validates the backend page, event, market, outcome, cursor, and page metadata shape before applying route data.
- Outcome `price`, `bestBid`, `bestAsk`, `bestBidSize`, and `bestAskSize` must be finite numeric values or null/blank.
- Malformed Live route payloads reject before the Live tab can render partial cards or fallback-derived odds.

## Cycle LR - Event List Route Shape Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home event list apply | `/api/events?includeMobileMarkets=1` | GET | Public viewing | Query params: sport/league filters, optional status/saved ids, limit, cursor | `events[]`, compact `markets[]`, compact `outcomes[]`, outcome prices/quotes/tradability, `nextCursor`, `page` | `Event`, `Market`, `Outcome`; compact mobile event list read model | Local/offline Home remains local. Server mode validates route shape before normalizing Home cards. | P2 optional Home-specific retry/error copy. |
| Search event list apply | `/api/events?includeMobileMarkets=1&search=...` | GET | Public viewing | Query params: search, saved ids, status group, sort, limit, cursor | `events[]`, compact `markets[]`, compact `outcomes[]`, outcome prices/quotes/tradability, `nextCursor`, `page` | `Event`, `Market`, `Outcome`; compact mobile event list read model | Search server failures show existing unavailable copy. Server mode validates route shape before applying results. | P2 optional field-level Search error copy. |
| Home futures list apply | `/api/events?marketType=future&includeMobileMarkets=1` | GET | Public viewing | Query params: `marketType=future`, limit | Futures/outright compact `markets[]` and outcome price/quote fields | `Event`, `Market`, `Outcome`; future/outright market filter | Local futures remain local if the route is unavailable. Malformed server payload is ignored instead of applied. | P2 optional futures-specific error copy. |

Cycle LR implementation notes:

- Added shared `assertEventListRoutePayloadShape` and applied it to Home, Search, Live, and Futures event-list route responses.
- The validator rejects missing event market arrays, malformed page cursors, and non-finite outcome price/quote fields before normalization.
- This prevents Home/Search/Futures from applying fallback odds or partial route cards when `/api/events` returns malformed compact mobile data.

## Cycle LS - Quote Route Shape Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket/card quote refresh | `/api/markets/:id/quote` | GET | Public viewing | Path market id, optional `outcomeId` query | `marketId`, `quotes[]`, `quotes[].outcomeId`, `outcomeName`, `bestBid`, `bestAsk`, optional `bestBidSize`, optional `bestAskSize`, `midPrice`, `lastPrice` | `Market`, `Outcome`, quote/depth read model or provider quote snapshot source | Local/mock quote conversion remains tolerant for direct unit conversion. Server-mode route loading now validates payload shape before applying visible odds. | P2 optional inline retry copy for malformed quote payloads. |

Cycle LS implementation notes:

- `loadTicketQuotes` now validates the quote route envelope and quote rows before converting odds.
- Required quote numeric fields must be finite, non-negative numbers or numeric strings, or `null`; optional size fields may be omitted.
- Wrong-market quote payloads and malformed numeric fields reject. Bulk quote loading classifies those markets in `failedMarketIds`, so existing availability guards mark them unavailable instead of applying fallback odds.

## Cycle LT - Market Chart Route Shape Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart route apply | `/api/markets/:id/chart?range=1D|1W` | GET | Public viewing | Path market id and selected chart range | `marketId`, `range`, `ranges[]`, `generatedAt`, `lastUpdated`, `emptyState`, `outcomes[]`, `history[].outcomeId/timestamp/price/probability` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, provider history source | Embedded/local chart history remains fallback. Server-mode chart route now validates before applying visible history. | P2 optional chart-specific retry copy. |
| Home Futures chart route apply | `/api/markets/:id/chart?range=1H|1D|1W|1M|MAX` | GET | Public viewing | Path market id and visible futures chart range | Same chart route fields as Event Detail | `Market`, `Outcome`, `MarketOutcomeSnapshot`, provider history source | Local futures chart remains fallback if route fails. Server-mode futures chart route validates before applying visible history. | P2 optional chart-specific retry copy. |

Cycle LT implementation notes:

- Added shared `assertMarketChartRoutePayloadShape` and applied it to Event Detail and Futures chart loaders.
- The validator rejects wrong-market payloads, wrong-range payloads, malformed ranges, malformed identity fields, invalid `emptyState`, and non-finite/out-of-range chart history numbers.
- Malformed chart route payloads reject before visible chart state is applied.

## Cycle LU - Orderbook Route Shape Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail selected-market depth apply | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Path market id and max levels | `marketId`, `outcomeId`, `generatedAt`, `availability`, `emptyState`, `levels[]`, `bids[]`, `asks[]`; level `outcomeId/side/price/shares/total`; bid/ask `outcomeId/price/size` | `Market`, `Outcome`, local orderbook rows, provider depth snapshots, provider quote snapshots | Embedded/local depth remains fallback. Server-mode selected depth validates route shape before applying visible depth. | P2 optional depth-specific retry copy. |

Cycle LU implementation notes:

- Added shared `assertOrderbookRoutePayloadShape` and applied it to Event Detail depth loading.
- The validator rejects wrong-market payloads, malformed availability state, malformed empty state, malformed level arrays, and non-finite/negative price/share/total values.
- Malformed depth payloads reject before route-backed rows are written into visible market depth state.
