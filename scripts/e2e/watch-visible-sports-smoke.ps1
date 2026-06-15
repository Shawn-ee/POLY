$ErrorActionPreference = "Stop"

$baseUrl = if ($env:APP_BASE_URL) { $env:APP_BASE_URL } else { "http://127.0.0.1:3000" }

Write-Host "Checking local app at $baseUrl ..."

try {
  $response = Invoke-WebRequest -Uri $baseUrl -Method Head -TimeoutSec 5 -UseBasicParsing
  if ($response.StatusCode -ge 400) {
    throw "HTTP $($response.StatusCode)"
  }
} catch {
  Write-Host ""
  Write-Host "Local dev server is not reachable at $baseUrl."
  Write-Host "Start it in another terminal:"
  Write-Host "  npm run dev"
  Write-Host ""
  Write-Host "Then run:"
  Write-Host "  npm run e2e:sports:watch"
  exit 1
}

$env:APP_BASE_URL = $baseUrl
$env:E2E_SLOW_MODE = "1"
$env:E2E_PAUSE_AT_END = "1"

Write-Host "Launching headed Chrome with Playwright Inspector."
Write-Host "The test uses state\job-chrome-profile and pauses at the end."

npx playwright test tests/e2e/sports-ui.spec.ts --headed --debug --workers=1
exit $LASTEXITCODE
