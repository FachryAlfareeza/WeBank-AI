"""Bill Analysis / ingestion — re-export from the real engine.

`copilot_engine.DocumentVoiceIngestionAgent` parses natural-language intent and
ingests the transactions DataFrame into a `FinancialProfile`. It also provides
`generate_synthetic_wechat_efapiao(...)` for synthetic test data.

Real OCR of scanned e-fapiao images is a future extension; today the ingestion
agent reads structured CSV/transaction data.
"""

from copilot_engine import DocumentVoiceIngestionAgent, FinancialProfile

__all__ = ["DocumentVoiceIngestionAgent", "FinancialProfile"]
