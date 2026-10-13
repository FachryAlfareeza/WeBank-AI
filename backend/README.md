# Backend — Loan Copilot API

FastAPI HTTP wrapper around the real engine (`copilot_engine.py`). It accepts a loan-application request plus the uploaded transactions CSV, runs one full engine session, and returns the serialized result for the frontend.

## Layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI app + CORS, mounts the session router
│   ├── config.py               # env-driven settings
│   ├── api/routes/session.py   # POST /api/session
│   ├── models/schemas.py       # request/response models
│   └── services/engine_bridge.py  # calls orchestrator, serializes dataclasses + DataFrame
└── requirements.txt
```

## Engine dependency

The API imports `copilot_engine`. Make it importable one of these ways:

- add the `ai/` folder to `PYTHONPATH`, or
- copy `ai/copilot_engine.py` next to the backend, or
- package `ai/` and `pip install -e` it.

## Run

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
# ensure copilot_engine is importable, e.g.:
#   $env:PYTHONPATH = "..\ai"
uvicorn app.main:app --reload
```

## Endpoint

`POST /api/session`

```json
{
  "merchant_id": "MERCH_SH_88921",
  "merchant_name": "Xingfu Coffee Shop",
  "user_input_text": "I need 50,000 RMB to restock coffee beans, 6-month tenor.",
  "csv_text": "<raw contents of sample_data_xingfu_coffee.csv>",
  "auto_confirm": true
}
```

Response: `{ session_id, status, result }` where `result` is the full engine
output (evaluation, profile, zkp_proof, strain_analysis, amortization_schedule,
webank_api_payload, kill_switch_receipt). `status` is one of `APPROVED`,
`ADJUSTMENT_REQUIRED`, `REJECTED_SECURITY_VIOLATION`.

`GET /health` → liveness probe.
