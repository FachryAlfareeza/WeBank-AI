"""WeBank API payload generator — re-export from the real engine.

`copilot_engine.LoanDraftingAdvisoryAgent.build_webank_api_payload(...)`
assembles the loan-approval draft payload. Simulated only — never sent to a
real banking endpoint.
"""

from copilot_engine import LoanDraftingAdvisoryAgent

__all__ = ["LoanDraftingAdvisoryAgent"]
