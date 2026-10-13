"""Credit scoring / risk engine — re-export from the real engine.

`copilot_engine.WeiyedaiRiskEngine` computes DSCR, CV-based risk tier, credit
ceiling, and pricing. It does not persist sensitive financial data.
"""

from copilot_engine import WeiyedaiRiskEngine

__all__ = ["WeiyedaiRiskEngine"]
