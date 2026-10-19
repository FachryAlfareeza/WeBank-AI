"""Loan-application session endpoint.

Runs the full engine pipeline (guardrail -> ingestion -> risk -> ZKP ->
drafting -> PIPL purge) and returns the serialized result.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import SessionRequest, SessionResponse
from app.services.engine_bridge import run_session

router = APIRouter(prefix="/api/session", tags=["session"])


@router.post("", response_model=SessionResponse)
def create_session(req: SessionRequest) -> SessionResponse:
    try:
        result = run_session(
            merchant_id=req.merchant_id,
            merchant_name=req.merchant_name,
            user_input_text=req.user_input_text,
            csv_text=req.csv_text,
            auto_confirm=req.auto_confirm,
            explain=req.explain,
            language=req.language,
        )
    except Exception as exc:  # noqa: BLE001 — surface parse/engine errors to the client
        raise HTTPException(status_code=400, detail=f"Session failed: {exc}") from exc

    return SessionResponse(
        session_id=result.get("session_id", ""),
        status=result.get("status", ""),
        result=result,
    )
