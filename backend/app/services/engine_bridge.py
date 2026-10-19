"""Bridge between the FastAPI layer and the real copilot engine.

Runs a loan-application session and serializes the engine's result (which
contains dataclasses and a pandas DataFrame) into plain JSON-friendly dicts
for the frontend.

Uses the V2 orchestrator, which runs the deterministic rule engine and then
adds an optional natural-language explanation from the Qwen2.5 LLM layer. The
LLM only explains the decision; it never changes the DSCR / pricing math. If
the LLM layer fails to load or errors out, the session still returns the full
rule-engine result (with `llm_available: false`) instead of failing.
"""

from dataclasses import asdict, is_dataclass
from io import StringIO
from typing import Any

import pandas as pd

from copilot_engine import orchestrator, orchestrator_v2


def _jsonable(value: Any) -> Any:
    """Recursively convert dataclasses / DataFrames to JSON-friendly values."""
    if value is None:
        return None
    if is_dataclass(value) and not isinstance(value, type):
        return {k: _jsonable(v) for k, v in asdict(value).items()}
    if isinstance(value, pd.DataFrame):
        return value.to_dict("records")
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    return value


def run_session(
    merchant_id: str,
    merchant_name: str,
    user_input_text: str,
    csv_text: str,
    auto_confirm: bool = True,
    explain: bool = True,
    language: str = "en",
) -> dict:
    """Parse the uploaded CSV text and run one full engine session.

    When ``explain`` is True, the V2 orchestrator adds an ``llm_explanation``
    string (and ``llm_available`` flag) to the result. If the LLM layer raises,
    we fall back to the rule-engine-only result so the API never 500s on a GPU
    or model-loading problem.
    """
    df = pd.read_csv(StringIO(csv_text))

    if explain:
        try:
            result = orchestrator_v2.process_application_session_v2(
                merchant_id=merchant_id,
                merchant_name=merchant_name,
                user_input_text=user_input_text,
                df_transactions=df,
                auto_confirm=auto_confirm,
                explain_mode=True,
                language=language,
            )
            return _jsonable(result)
        except Exception as exc:  # noqa: BLE001 — LLM failure must not break the session
            # Degrade gracefully: run the deterministic engine only and flag
            # that the explanation was unavailable.
            result = orchestrator.process_application_session(
                merchant_id=merchant_id,
                merchant_name=merchant_name,
                user_input_text=user_input_text,
                df_transactions=df,
                auto_confirm=auto_confirm,
            )
            serialized = _jsonable(result)
            serialized["llm_explanation"] = None
            serialized["llm_available"] = False
            serialized["llm_error"] = str(exc)
            return serialized

    result = orchestrator.process_application_session(
        merchant_id=merchant_id,
        merchant_name=merchant_name,
        user_input_text=user_input_text,
        df_transactions=df,
        auto_confirm=auto_confirm,
    )
    serialized = _jsonable(result)
    serialized["llm_explanation"] = None
    serialized["llm_available"] = False
    return serialized
