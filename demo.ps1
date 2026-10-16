# ============================================================================
# Run the Loan Copilot engine end-to-end against the sample datasets — no
# servers, no frontend, no manual config. The fastest "does it work?" check.
#
# Directory-independent — run from anywhere:
#   .\demo.ps1            # rule engine only (fast, no GPU)
#   .\demo.ps1 -Explain   # + natural-language LLM explanation (needs the GPU
#                           layer installed and ai\.env configured)
#
# Assumes .\setup.ps1 has been run (creates ai/.venv).
# ============================================================================

param(
    [switch]$Explain,
    [string]$Language = "en"
)

$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $root "ai"
$py    = Join-Path $aiDir ".venv\Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Error "ai venv not found. Run .\setup.ps1 first."
    exit 1
}

$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

# Inline driver script — kept here so there is nothing extra to find or run.
$driver = @'
import sys, pandas as pd

SCENARIOS = [
    ("data/sample_data_xingfu_coffee.csv", "MERCH_SH_88921", "Xingfu Coffee Shop",
     "I need 50,000 RMB to restock coffee beans, 6-month tenor."),
    ("data/sample_data_lianhua_mart.csv",  "MERCH_SH_77012", "Lianhua Mini Mart",
     "I want to borrow 120,000 RMB for 6 months to expand inventory."),
]

explain = "--explain" in sys.argv
language = "en"
for a in sys.argv:
    if a.startswith("--lang="):
        language = a.split("=", 1)[1]

if explain:
    from copilot_engine import orchestrator_v2 as orch
else:
    from copilot_engine import orchestrator as orch

for csv_path, mid, name, text in SCENARIOS:
    df = pd.read_csv(csv_path)
    print("=" * 70)
    print(f"Merchant : {name}")
    print(f"Request  : {text}")
    if explain:
        res = orch.process_application_session_v2(
            merchant_id=mid, merchant_name=name, user_input_text=text,
            df_transactions=df, auto_confirm=True, explain_mode=True, language=language,
        )
    else:
        res = orch.process_application_session(
            merchant_id=mid, merchant_name=name, user_input_text=text,
            df_transactions=df, auto_confirm=True,
        )
    ev = res["evaluation"]
    print(f"Status   : {res['status']}")
    print(f"DSCR     : {ev.dscr}  (safe threshold >= 1.25)")
    print(f"Ceiling  : RMB {ev.credit_ceiling:,.0f}")
    print(f"Risk tier: {ev.risk_tier}")
    print(f"ZKP valid: {res['zkp_verification_passed']}")
    if res["status"] == "ADJUSTMENT_REQUIRED" and ev.recommended_adjustment:
        adj = ev.recommended_adjustment
        print(f"Option A : reduce to RMB {adj['safe_reduced_amount']:,.0f}")
        print(f"Option B : extend to {adj['safe_extended_tenor']} months "
              f"(DSCR {adj['extended_tenor_dscr']})")
    if explain and res.get("llm_explanation"):
        print(f"LLM says : {res['llm_explanation']}")
    print(f"Kill sw. : {res['kill_switch_receipt']['status']}")

print("=" * 70)
print("Done. The rule engine is the source of truth; the LLM only explains.")
'@

$driverArgs = @()
if ($Explain) { $driverArgs += "--explain"; $driverArgs += "--lang=$Language" }

Push-Location $aiDir
try {
    $driver | & $py - @driverArgs
} finally {
    Pop-Location
}
