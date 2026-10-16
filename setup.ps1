# ============================================================================
# One-shot setup for the Event-Driven Loan Copilot (Windows / PowerShell).
#
# Run this ONCE from anywhere. It is directory-independent — it figures out its
# own location, so you never have to `cd` around:
#
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# What it does (idempotent — safe to re-run):
#   1. Creates the AI venv (ai/.venv) and installs the rule-engine deps.
#   2. Creates the backend venv (backend/.venv) and installs its deps.
#   3. Wires copilot_engine into the backend venv via a .pth file, so the API
#      can `import copilot_engine` with NO PYTHONPATH juggling.
#   4. Generates .env files for ai / backend / frontend from their examples.
#   5. Installs frontend npm dependencies.
#
# It does NOT install the optional GPU LLM layer (torch/transformers). See
# ai/README.md for that — the product runs fully on the rule engine without it.
# ============================================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "    [skip] $msg" -ForegroundColor DarkGray }

# --- locate python -----------------------------------------------------------
$pythonCmd = $null
foreach ($cand in @("python", "py")) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) { $pythonCmd = $cand; break }
}
if (-not $pythonCmd) {
    Write-Error "Python not found on PATH. Install Python 3.10+ and re-run."
    exit 1
}

# --- helper: ensure a venv exists & return its python.exe --------------------
function Ensure-Venv($dir) {
    $venv = Join-Path $dir ".venv"
    $py   = Join-Path $venv "Scripts\python.exe"
    if (-not (Test-Path $py)) {
        & $pythonCmd -m venv $venv
    }
    return $py
}

# --- helper: copy an example env if the real one is missing ------------------
function Ensure-Env($dir, $example, $target) {
    $ex = Join-Path $dir $example
    $tg = Join-Path $dir $target
    if ((Test-Path $ex) -and (-not (Test-Path $tg))) {
        Copy-Item $ex $tg
        Write-Ok "created $target"
    } elseif (Test-Path $tg) {
        Write-Skip "$target already exists"
    }
}

# ----------------------------------------------------------------------------
# 1. AI engine
# ----------------------------------------------------------------------------
Write-Step "AI engine (ai/)"
$aiDir = Join-Path $root "ai"
$aiPy  = Ensure-Venv $aiDir
& $aiPy -m pip install --upgrade pip --quiet
& $aiPy -m pip install -r (Join-Path $aiDir "requirements.txt") --quiet
Write-Ok "rule-engine deps installed (ai/.venv)"
Ensure-Env $aiDir ".env.example" ".env"

# ----------------------------------------------------------------------------
# 2. Backend
# ----------------------------------------------------------------------------
Write-Step "Backend API (backend/)"
$beDir = Join-Path $root "backend"
$bePy  = Ensure-Venv $beDir
& $bePy -m pip install --upgrade pip --quiet
& $bePy -m pip install -r (Join-Path $beDir "requirements.txt") --quiet
Write-Ok "backend deps installed (backend/.venv)"

# 3. Make copilot_engine importable from the backend venv (no PYTHONPATH needed).
#    Drop a .pth file into the venv's site-packages pointing at ai/.
Write-Step "Wiring copilot_engine into the backend venv"
$sitePackages = & $bePy -c "import sysconfig; print(sysconfig.get_paths()['purelib'])"
$pthPath = Join-Path $sitePackages "copilot_engine_path.pth"
Set-Content -Path $pthPath -Value $aiDir -Encoding ASCII
# verify it actually imports
& $bePy -c "import copilot_engine; print('    [OK] import copilot_engine works')"
Ensure-Env $beDir ".env.example" ".env"

# ----------------------------------------------------------------------------
# 4. Frontend
# ----------------------------------------------------------------------------
Write-Step "Frontend (frontend/)"
$feDir = Join-Path $root "frontend"
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Push-Location $feDir
    try {
        npm install --no-fund --no-audit
        Write-Ok "npm dependencies installed"
    } finally {
        Pop-Location
    }
    Ensure-Env $feDir ".env.example" ".env.local"
} else {
    Write-Skip "npm not found — install Node.js 18+ to run the frontend"
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " Setup complete." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

$nextSteps = @"

Next steps (each from anywhere — the scripts find their own paths):

  1. Try the engine with no servers at all:
       .\demo.ps1

  2. Run the full stack (two terminals):
       Terminal A:  .\start-backend.ps1
       Terminal B:  .\start-frontend.ps1   -Live
     then open the URL Vite prints (http://localhost:5173).

  To use a GPU / remote LLM, edit ai\.env  (see ai\README.md).
"@
Write-Host $nextSteps -ForegroundColor Gray
