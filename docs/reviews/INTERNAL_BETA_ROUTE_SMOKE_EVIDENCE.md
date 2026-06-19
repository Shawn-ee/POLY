# Internal Beta Route Smoke Evidence

Date: 2026-06-19

## Scope

Phase 10 collected local route smoke evidence for controlled internal funding beta readiness.

This was a local-only smoke pass against a temporary Next.js dev server. It did not use production, real credentials, real funds, wallet private keys, admin actions, bot actions, or deployment.

## Environment

- Repo: `C:\Users\hecto\Desktop\projects\PolyProj\poly`
- Branch: `agent/beta-internal-ux-smoke-evidence`
- Local URL: `http://127.0.0.1:3001`
- Server command: `npm run dev -- -p 3001`
- Existing port 3000 listener: yes, owned by another local process.
- Production deployment: not used.
- Real login: not used.
- `.env` file: present and loaded by Next.js, but not opened or printed.

## Server Startup

The first `Start-Process` attempt failed because PowerShell does not allow `RedirectStandardOutput` and `RedirectStandardError` to point to the same file.

The second start used separate stdout/stderr log files. The dev server became ready after about 68 seconds.

Observed server startup notes:

- Next.js 16.1.6 started on port 3001.
- Next.js loaded `.env`.
- Next.js warned that workspace root inference detected multiple lockfiles.

## Browser Smoke Attempt

A full Chrome/Playwright route smoke script was attempted against the temporary server.

Result: **blocked by timeout**.

The timeout happened before the script could print a complete structured result. No production URLs, credentials, funding actions, admin actions, bot actions, or wallet actions were used.

Fallback: a lighter local HTTP smoke pass was run with `Invoke-WebRequest`.

## Local HTTP Route Smoke

Secret-pattern check used on HTML responses:

- private-key markers.
- GitHub token markers.
- OpenAI-style API token marker.
- mnemonic/seed phrase markers.
- `encryptedPrivateKey`.
- `privateKey`.
- `TREASURY_PRIVATE_KEY`.
- `DEPOSIT_WALLET_ENCRYPTION_KEY`.

Results:

| Route | Result | Notes |
|---|---:|---|
| `/` | 200 after retry | Initial pass timed out, retry returned 200 in 201 ms. No secret-pattern match. |
| `/login` | 200 after retry | Initial pass timed out, retry returned 200 in 172 ms. No secret-pattern match. |
| `/sports` | 200 | No secret-pattern match. |
| `/sports/soccer` | 200 | No secret-pattern match. |
| `/sports/soccer/world-cup` | 200 | No secret-pattern match. |
| `/events` | 200 | No secret-pattern match. |
| `/markets` | 200 | No secret-pattern match. |
| `/portfolio` | 200 | No secret-pattern match. |
| `/wallet` | 200 | No secret-pattern match. |
| `/my-pools` | 200 | No secret-pattern match. |
| `/create` | 200 | No secret-pattern match. |
| `/admin` | 200 | SSR returned shell HTML. Admin API checks below verify anonymous API access is blocked. |
| `/admin/deposits` | 200 | SSR returned shell HTML. Admin API checks below verify anonymous API access is blocked. |
| `/admin/withdrawals` | 200 | SSR returned shell HTML. Admin API checks below verify anonymous API access is blocked. |
| `/admin/bots` | 200 | SSR returned shell HTML. Admin API checks below verify anonymous API access is blocked. |
| `/admin/agents` | 200 | SSR returned shell HTML. Admin API checks below verify anonymous API access is blocked. |
| `/admin/system` | 200 | SSR returned shell HTML. Admin API checks below verify anonymous API access is blocked. |

## Anonymous Funding/Admin API Smoke

Results:

| API Route | Result | Expected |
|---|---:|---|
| `/api/deposits/address` | 401 | Pass: anonymous blocked. |
| `/api/deposits` | 401 | Pass: anonymous blocked. |
| `/api/withdrawals` | 401 | Pass: anonymous blocked. |
| `/api/admin/withdrawals` | 401 | Pass: anonymous blocked. |
| `/api/admin/deposits` | 401 | Pass: anonymous blocked. |

The sampled error bodies were generic `Unauthorized` responses and did not match the secret-pattern scan.

## Not Run

- Authenticated allowlisted browser session smoke.
- Google OAuth login.
- Admin browser session smoke.
- Real deposit.
- Real withdrawal request.
- Admin manual payout drill.
- Live chain monitor.
- Full Playwright route suite.
- Screenshot capture.
- Production or private server deployment.

## Findings

Pass:

- Major public and account/funding/admin shell routes returned local HTTP 200 after compilation.
- Anonymous funding APIs returned 401.
- Anonymous admin funding APIs returned 401.
- No secret-pattern matches were found in smoke HTML or sampled API bodies.

Warnings:

- Full browser smoke timed out and should be rerun before final deployment readiness.
- Initial `/` and `/login` requests timed out during local compilation but passed on retry.
- Admin pages return SSR shell HTML with 200 for anonymous users; this is not by itself proof of admin UI authorization, so admin APIs remain the stronger access-control evidence.
- Authenticated allowlisted funding UI still depends on resolving PR #220.

## Recommendation

Proceed to Phase 11 server deployment readiness documentation.

Do not claim server deploy readiness until PR #220 is resolved and the owner runs private-server smoke with real env values kept secret.
