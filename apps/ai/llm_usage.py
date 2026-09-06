"""
LLM Usage, Token Accounting & Cost Attribution for CasePilot.
Ported and adapted from JIVA 2.0 (shared/llm_usage).

Tracks prompt tokens, completion tokens, total tokens, and exact dollar/rupee cost
per call and cumulative per session using Python ContextVars.
"""

from contextvars import ContextVar
import time
import uuid
from typing import Dict, Any, Optional

# Context variables for per-request trace attribution
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")
request_start_time_var: ContextVar[float] = ContextVar("start_time", default=0.0)

# Model pricing in USD per 1,000,000 tokens
# Synced with OpenAI pricing for gpt-4o-mini
MODEL_PRICING_PER_1M_USD: Dict[str, Dict[str, float]] = {
    "gpt-4o-mini": {
        "input_per_1m_usd": 0.15,
        "output_per_1m_usd": 0.60,
    },
    "gpt-4o": {
        "input_per_1m_usd": 2.50,
        "output_per_1m_usd": 10.00,
    },
}

# Conversion rate USD to INR (approx 86.5 INR per USD)
USD_TO_INR_RATE = 86.50

class UsageTracker:
    """Session-level cumulative usage telemetry."""
    total_calls: int = 0
    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    total_tokens: int = 0
    total_cost_usd: float = 0.0

    @classmethod
    def record_usage(
        cls,
        model: str,
        prompt_tokens: int,
        completion_tokens: int
    ) -> Dict[str, Any]:
        """Calculates precise cost and increments cumulative totals."""
        prices = MODEL_PRICING_PER_1M_USD.get(model, MODEL_PRICING_PER_1M_USD["gpt-4o-mini"])
        
        cost_input = (prompt_tokens / 1_000_000.0) * prices["input_per_1m_usd"]
        cost_output = (completion_tokens / 1_000_000.0) * prices["output_per_1m_usd"]
        call_cost_usd = round(cost_input + cost_output, 7)
        call_cost_inr = round(call_cost_usd * USD_TO_INR_RATE, 5)

        cls.total_calls += 1
        cls.total_prompt_tokens += prompt_tokens
        cls.total_completion_tokens += completion_tokens
        cls.total_tokens += (prompt_tokens + completion_tokens)
        cls.total_cost_usd = round(cls.total_cost_usd + call_cost_usd, 6)

        return {
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "cost_usd": call_cost_usd,
            "cost_inr": call_cost_inr,
            "cumulative_total_tokens": cls.total_tokens,
            "cumulative_cost_usd": cls.total_cost_usd,
            "cumulative_cost_inr": round(cls.total_cost_usd * USD_TO_INR_RATE, 4)
        }

def start_trace(existing_id: Optional[str] = None) -> str:
    """Sets the correlation ID and start time for the current request context."""
    cid = existing_id or f"cp-{uuid.uuid4().hex[:8]}"
    correlation_id_var.set(cid)
    request_start_time_var.set(time.time())
    return cid

def get_correlation_id() -> str:
    """Returns the current request's correlation ID."""
    cid = correlation_id_var.get()
    return cid if cid else "cp-unknown"

def get_elapsed_ms() -> float:
    """Returns elapsed milliseconds since start_trace was called."""
    st = request_start_time_var.get()
    if st <= 0:
        return 0.0
    return round((time.time() - st) * 1000.0, 2)
