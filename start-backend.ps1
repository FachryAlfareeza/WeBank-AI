# ============================================================================
# Start the Loan Copilot backend API (FastAPI / uvicorn).
#
# Directory-independent — run from anywhere:
#   .\start-backend.ps1
#   .\start-backend.ps1 -Port 9000 -NoReload
#
# Assumes .\setup.ps1 has been run (creates backend/.venv and wires in
# copilot_engine). If the venv is missing it tells you to run setup first.
# ============================================================================

param(
    [int]$Port = 8000,
    [string]$BindHost = "127.0.0.1",
    [switch]$NoReload
)

$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$beDir = Join-Path $root "backend"
$py    = Join-Path $beDir ".venv\Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Error "backend venv not found. Run .\setup.ps1 first."
    exit 1
}

# UTF-8 so engine output (emoji / Chinese) never crashes the console.
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

$reload = if ($NoReload) { @() } else { @("--reload") }

Write-Host "Starting backend on http://${BindHost}:$Port  (health: /health)" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor DarkGray

# Run uvicorn with cwd = backend/ so `app.main:app` resolves, without making
# the caller cd there.
Push-Location $beDir
try {
    & $py -m uvicorn app.main:app --host $BindHost --port $Port @reload
} finally {
    Pop-Location
}
