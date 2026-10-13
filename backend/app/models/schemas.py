"""Request/response schemas for the loan-application API.

The response is the engine's result dict (serialized by engine_bridge), so the
response model stays permissive. Mirrors frontend/src/types/index.ts.
"""

from typing import Any

from pydantic import BaseModel, Field


class SessionRequest(BaseModel):
    merchant_id: str = Field(..., examples=["MERCH_SH_88921"])
    merchant_name: str = Field(..., examples=["Xingfu Coffee Shop"])
    user_input_text: str = Field(
        ...,
        examples=["I need 50,000 RMB to restock coffee beans, 6-month tenor."],
    )
    # Raw CSV content of the uploaded transactions file.
    csv_text: str = Field(..., description="Transactions CSV content (see sample_data_*.csv)")
    auto_confirm: bool = True


class SessionResponse(BaseModel):
    session_id: str
    status: str  # APPROVED | ADJUSTMENT_REQUIRED | REJECTED_SECURITY_VIOLATION
    # Remaining engine keys (evaluation, profile, zkp_proof, strain_analysis,
    # amortization_schedule, webank_api_payload, kill_switch_receipt, ...).
    # Kept open since the shape varies by status.
    result: dict[str, Any]
