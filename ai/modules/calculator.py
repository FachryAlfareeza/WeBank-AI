"""Loan math — re-export from the real engine.

Deterministic DSCR, flat/effective pricing, credit ceiling, and amortization
live in `copilot_engine.WeiyedaiRiskEngine` and
`copilot_engine.LoanDraftingAdvisoryAgent`. All financial math stays here so
numbers are auditable and never inferred by the LLM.

    DSCR = avg_monthly_net_cash_flow / monthly_installment_effective  (threshold 1.25)
"""

from copilot_engine import WeiyedaiRiskEngine, LoanDraftingAdvisoryAgent

__all__ = ["WeiyedaiRiskEngine", "LoanDraftingAdvisoryAgent"]
