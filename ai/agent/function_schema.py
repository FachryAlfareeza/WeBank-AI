"""Function-calling schema for the LLM layer.

The Qwen2.5 adapter is trained to extract financial intents into structured JSON
and hand off to the rule engine. The deterministic steps below are performed by
`copilot_engine` classes, not invented by the model.

Pipeline stages the model coordinates with:
  - extract_intent        -> DocumentVoiceIngestionAgent.parse_natural_language_intent
  - evaluate_loan         -> WeiyedaiRiskEngine.evaluate_loan_request
  - prove_eligibility     -> ZKPPrivacyGate.generate_proof / verify_proof
  - draft_payload         -> LoanDraftingAdvisoryAgent.build_webank_api_payload

Expected model output for intent extraction (see README_HuggingFace.md):
  {
    "action": "ingest_and_evaluate",
    "extracted_entities": {
      "requested_amount": float,
      "requested_tenor_months": int,
      "stated_purpose": str
    },
    "status": "READY_FOR_RULE_ENGINE"
  }
"""

TOOLS = [
    {
        "name": "extract_intent",
        "description": "Parse amount, tenor, and purpose from free text into JSON.",
        "handler": "DocumentVoiceIngestionAgent.parse_natural_language_intent",
    },
    {
        "name": "evaluate_loan",
        "description": "Compute DSCR, credit ceiling, pricing, and approval decision.",
        "handler": "WeiyedaiRiskEngine.evaluate_loan_request",
    },
    {
        "name": "prove_eligibility",
        "description": "Generate/verify the HMAC-SHA256 ZKP eligibility proof.",
        "handler": "ZKPPrivacyGate.generate_proof",
    },
    {
        "name": "draft_payload",
        "description": "Build the simulated WeBank API loan-approval payload.",
        "handler": "LoanDraftingAdvisoryAgent.build_webank_api_payload",
    },
]
