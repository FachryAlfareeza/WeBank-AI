# ============================================================================
# Start the Loan Copilot frontend (React + Vite dev server).
#
# Directory-independent — run from anywhere:
#   .\start-frontend.ps1           # uses the built-in mock engine (no backend)
#   .\start-frontend.ps1 -Live     # calls the real backend API
#   .\start-frontend.ps1 -Live -ApiBaseUrl http://localhost:9000
#
# -Live writes frontend/.env.local for you (VITE_USE_MOCKS=false + API URL),
# so there is no manual .env editing.
# ============================================================================

param(
    [switch]$Live,
    [string]$ApiBaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$feDir = Join-Path $root "frontend"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node.js 18+ and re-run."
    exit 1
}
if (-not (Test-Path (Join-Path $feDir "node_modules"))) {
    Write-Host "node_modules missing — running npm install..." -ForegroundColor Yellow
    Push-Location $feDir; try { npm install --no-fund --no-audit } finally { Pop-Location }
}

# Configure mock vs live by writing .env.local (Vite reads it automatically).
$useMocks = if ($Live) { "false" } else { "true" }
$envLocal = Join-Path $feDir ".env.local"
@(
    "VITE_API_BASE_URL=$ApiBaseUrl",
    "VITE_USE_MOCKS=$useMocks"
) | Set-Content -Path $envLocal -Encoding UTF8

if ($Live) {
    Write-Host "Mode: LIVE backend at $ApiBaseUrl" -ForegroundColor Cyan
    Write-Host "  (make sure .\start-backend.ps1 is running in another terminal)" -ForegroundColor DarkGray
} else {
    Write-Host "Mode: MOCK engine (no backend needed)" -ForegroundColor Cyan
    Write-Host "  Pass -Live to call the real backend." -ForegroundColor DarkGray
}
Write-Host ""

Push-Location $feDir
try {
    npm run dev
} finally {
    Pop-Location
}
