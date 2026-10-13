"""Agent orchestration — re-export from the real engine.

The working orchestrator is `copilot_engine.orchestrator` (an instance of
`EventDrivenCopilotOrchestrator`). It runs the full three-session pipeline and
the PIPL event-kill switch.

    from copilot_engine import orchestrator
    result = orchestrator.process_application_session(
        merchant_id, merchant_name, user_input_text, df_transactions, auto_confirm=True
    )

The optional LLM-explanation variant is `orchestrator_v2` (requires GPU for the
Qwen2.5 LoRA adapter).
"""

from copilot_engine import orchestrator, EventDrivenCopilotOrchestrator

__all__ = ["orchestrator", "EventDrivenCopilotOrchestrator"]
