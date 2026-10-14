# Run helper for the AI engine (Windows / PowerShell).
#
# Activates the local venv, forces UTF-8 console output (so the LLM's
# emoji/Chinese explanation text does not crash on Windows' cp1252 default),
# then runs the given Python script with any extra args.
#
# Usage:
#   .\run.ps1                      # runs copilot_engine.py self-test
#   .\run.ps1 my_script.py         # runs a specific script
#   .\run.ps1 my_script.py --flag  # extra args are forwarded

param(
    [string]$Script = "copilot_engine.py",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $here ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Error "venv not found. Create it first: python -m venv .venv"
    exit 1
}

# Force UTF-8 so model output (emoji / Chinese) prints without UnicodeEncodeError.
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

& $python (Join-Path $here $Script) @Args
exit $LASTEXITCODE
