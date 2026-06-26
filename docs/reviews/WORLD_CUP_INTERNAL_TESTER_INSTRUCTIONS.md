# World Cup Internal Tester Instructions

Date: 2026-06-26

Audience: allowlisted internal testers only.

## What You Can Test

- Open the World Cup sports page.
- Browse matches grouped as events.
- Open a match/event page.
- Review related markets such as winner, spread, totals, team totals, both teams to score, and first team to score.
- Select outcomes and change amount/quantity.
- Confirm cost, payout, and profit estimates update.
- Build different-event combos.
- Observe clear blocked reason messages for unsupported combos.
- View portfolio/open combo state after an approved internal test trade.
- Review admin settlement evidence only if you have admin access.

## What You Cannot Test

- Public deposits.
- Public withdrawals.
- Wallet custody.
- Private keys or wallet recovery material.
- Real-money external fund movement.
- Production live bots with real funds.
- Same-event correlated combos.
- Combo cash-out.
- Cash-out execution.
- Public beta flows.

## Expected Safe Behavior

- Anonymous users cannot place internal trades.
- Non-allowlisted users cannot place internal trades.
- Trading remains blocked when `TRADING_KILL_SWITCH=true`.
- Funding remains blocked when `FUNDING_KILL_SWITCH=true`.
- Combo quote rejects unsafe combinations with reason codes.
- Cash-out estimate is read-only and does not submit a sell order.
- Live bots remain disabled unless explicitly approved in a future owner goal.

## Report Issues With This Information

- Page/route.
- Tester account email, if safe to disclose internally.
- Market/event name.
- Expected result.
- Actual result.
- Screenshot if it does not contain sensitive account/session data.
- Whether trading flags were enabled or kill-switched at the time.

Do not paste cookies, private credentials, private env values, wallet material, or session tokens into reports.
