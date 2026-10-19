"""FastAPI entrypoint — HTTP wrapper around copilot_engine.

Exposes the loan-application session endpoint. The engine itself lives in the
`ai` package (`copilot_engine.py`); make sure it is importable (install the ai
package or add it to PYTHONPATH).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import session

app = FastAPI(title="Loan Copilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
