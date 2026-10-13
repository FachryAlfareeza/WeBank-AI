"""ZKP privacy gate — re-export from the real engine.

The real, working implementation lives in `copilot_engine.ZKPPrivacyGate`.
It uses HMAC-SHA256 commitments + signatures (NOT a mock) to prove the merchant
meets WeBank's minimum criteria without exposing raw revenue.
"""

from copilot_engine import ZKPPrivacyGate, ZKPEligibilityProof

__all__ = ["ZKPPrivacyGate", "ZKPEligibilityProof"]
