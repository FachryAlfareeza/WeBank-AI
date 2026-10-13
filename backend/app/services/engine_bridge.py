"""Bridge between the FastAPI layer and the real copilot engine.

Runs a loan-application session and serializes the engine's result (which
contains dataclasses and a pandas DataFrame) into plain JSON-friendly dicts
for the frontend.
"""

from dataclasses import asdict, is_dataclass
from io import StringIO
from typing import Any

import pandas as pd

from copilot_engine import orchestrator


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
) -> dict:
    """Parse the uploaded CSV text and run one full engine session."""
    df = pd.read_csv(StringIO(csv_text))
    result = orchestrator.process_application_session(
        merchant_id=merchant_id,
        merchant_name=merchant_name,
        user_input_text=user_input_text,
        df_transactions=df,
        auto_confirm=auto_confirm,
    )
    return _jsonable(result)
