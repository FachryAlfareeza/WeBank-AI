# ============================================================================
# Start the Loan Copilot backend API (FastAPI / uvicorn).
#
# Directory-independent — run from anywhere:
#   .\start-backend.ps1
#   .\start-backend.ps1 -Port 9000
#   .\start-backend.ps1 -Reload          # code auto-reload, but DISABLES the LLM
#
# Assumes .\setup.ps1 has been run (creates backend/.venv and wires in
# copilot_engine). If the venv is missing it tells you to run setup first.
#
# NOTE ON --reload: uvicorn's auto-reloader runs the app in a WatchFiles child
# process where the Qwen2.5 GPU model fails to load (the LLM layer silently
# falls back to rule-engine templates). So reload is OFF by default, which is
# what makes live LLM explanations work. Only pass -Reload if you are editing
# backend code and don't care about the LLM layer. -NoReload is still accepted
# (it is now the default) for backward compatibility.
# ============================================================================

param(
    [int]$Port = 8000,
    [string]$BindHost = "127.0.0.1",
    [switch]$NoReload,
    [switch]$Reload
)

$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$beDir = Join-Path $root "backend"
$aiPy  = Join-Path $root "ai\.venv\Scripts\python.exe"
$bePy  = Join-Path $beDir ".venv\Scripts\python.exe"

# Prefer the ai venv: it carries BOTH the web stack (fastapi/uvicorn) and the
# GPU/LLM stack (torch/transformers/peft), so the live API can serve real
# Qwen2.5 explanations (orchestrator_v2). The backend-only venv lacks the ML
# deps, so the LLM layer silently falls back there. We fall back to the backend
# venv only if the ai venv is missing (rule-engine explanations only).
if (Test-Path $aiPy) {
    $py = $aiPy
    Write-Host "Using ai venv (web + GPU/LLM stack) — live LLM explanations enabled." -ForegroundColor DarkGray
} elseif (Test-Path $bePy) {
    $py = $bePy
    Write-Host "ai venv not found — using backend venv. LLM explanations will be rule-engine fallbacks." -ForegroundColor Yellow
} else {
    Write-Error "No venv found (ai\.venv or backend\.venv). Run .\setup.ps1 first."
    exit 1
}

# UTF-8 so engine output (emoji / Chinese) never crashes the console.
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

# Reload is OFF by default so the GPU LLM loads in-process. Opt in with -Reload.
$reload = @()
if ($Reload) {
    $reload = ,"--reload"
    Write-Host "WARNING: -Reload enabled. The LLM layer will NOT load under the" -ForegroundColor Yellow
    Write-Host "         reloader; explanations will be rule-engine fallbacks." -ForegroundColor Yellow
}

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
