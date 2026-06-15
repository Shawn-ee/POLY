# Visible Browser Agent Testing

This repo includes a Playwright smoke test for frontend agents that need to verify UI changes in a real visible Chrome window.

## What It Tests

The first smoke flow focuses on Sports UI:

- Opens `/sports`.
- Opens `/sports/soccer/world-cup`.
- Clicks a seeded event such as France vs Argentina.
- Verifies the event detail page shows grouped markets and outcomes.
- Clicks an outcome link into the existing market trading page.
- Captures screenshots at each step.

It does not submit orders, use real accounts, or require production credentials.

## Local Browser Profile

Visible browser state is stored under:

```text
state/job-chrome-profile
```

This directory is ignored by git. Do not commit it. It may contain local cookies, cache, and browser session state.

## Run The Dev Server

Start the app in one terminal:

```sh
npm run dev
```

By default the smoke test targets:

```text
http://127.0.0.1:3000
```

Override it with:

```powershell
$env:APP_BASE_URL = "http://127.0.0.1:3001"
```

## Run The Normal Sports Smoke Test

From the repo root:

```sh
npm run e2e:sports
```

On Windows, the helper checks whether the local app is reachable first:

```powershell
.\scripts\e2e\run-visible-sports-smoke.ps1
```

The sports test launches installed Chrome in headed mode using the dedicated local profile. It does not use your personal Chrome profile.

Normal smoke mode is intended for fast validation. It may open and close Chrome quickly, and if it is run by an agent process outside your interactive Windows desktop session, you may not see the browser even though the test is headed.

## Run The Visible Watch Mode

Use watch mode when you want to visually observe the browser clicking through the app:

```powershell
npm run e2e:sports:watch
```

or directly:

```powershell
.\scripts\e2e\watch-visible-sports-smoke.ps1
```

Watch mode:

- checks that the local dev server is reachable,
- sets `E2E_SLOW_MODE=1`,
- sets `E2E_PAUSE_AT_END=1`,
- runs `playwright test tests/e2e/sports-ui.spec.ts --headed --debug --workers=1`,
- opens Playwright Inspector,
- slows actions down,
- pauses at the end before closing the browser.

For Chrome to appear on your desktop, run the command from a PowerShell window in the same Windows desktop session you are watching. If Codex or another agent runs the command from a hidden, service, remote, or sessionless process, the browser may be headed but not visible on your monitor.

The test also supports these environment variables manually:

```powershell
$env:E2E_SLOW_MODE = "1"
$env:E2E_PAUSE_AT_END = "1"
npx playwright test tests/e2e/sports-ui.spec.ts --headed --debug --workers=1
```

## Screenshots, Videos, And Traces

Playwright stores artifacts in:

```text
test-results/
playwright-report/
```

The sports smoke captures:

- `sports-landing.png`
- `world-cup.png`
- `event-detail.png`
- `after-outcome-click.png`

If a test fails, Playwright also retains trace/video artifacts according to `playwright.config.ts`.

## Browser Availability

The smoke test prefers installed Chrome through Playwright's `channel: "chrome"` setting. If Chrome is unavailable, install Chrome or run:

```sh
npx playwright install chromium
```

Do not download browsers on shared machines unless needed.

## Authenticated Order Testing

This first pass does not block on real login. If a future flow needs to submit orders, add one of:

- a safe test user seed,
- a dev-only login helper,
- or a Playwright `storageState` file for a non-production test user.

Do not use real production accounts or commit saved secrets.

## Agent Workflow

After frontend changes, agents should:

1. Start the local dev server.
2. Run `npm run e2e:sports`.
3. Inspect visible Chrome while it clicks through the app.
4. Review screenshots in `test-results/`.
5. Report failures with the route, screenshot, and visible behavior.
