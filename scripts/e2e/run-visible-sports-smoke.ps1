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
  Write-Host "  npm run e2e:sports"
  exit 1
}

npm run e2e:sports
$exitCode = $LASTEXITCODE

if (Test-Path "playwright-report\index.html") {
  Write-Host "Playwright report: playwright-report\index.html"
  Start-Process "playwright-report\index.html"
}

exit $exitCode
