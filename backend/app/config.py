"""Application settings."""

import os
from dataclasses import dataclass


@dataclass
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    # Primary dev origin. FRONTEND_ORIGIN may be a single origin or a
    # comma-separated list.
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    @property
    def cors_origins(self) -> list[str]:
        """Allowed CORS origins for the browser frontend.

        Always includes the common Vite dev origins on both `localhost` and
        `127.0.0.1` so the UI works regardless of which host the browser uses,
        plus anything set in FRONTEND_ORIGIN (comma-separated supported).
        """
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
        configured = [o.strip() for o in self.frontend_origin.split(",") if o.strip()]
        # De-duplicate while preserving order.
        seen: set[str] = set()
        origins: list[str] = []
        for origin in configured + defaults:
            if origin not in seen:
                seen.add(origin)
                origins.append(origin)
        return origins


settings = Settings()
