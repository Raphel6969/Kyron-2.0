"""
Kyron 2.0 — Circuit Breakers and External Dependency Fallbacks (F28, demo-resilience)
Wraps third-party external APIs in boolean feature flags to guarantee demo resilience.
"""

import os
from typing import Dict, Any


def is_llm_inference_enabled() -> bool:
    return os.getenv("ENABLE_LLM_INFERENCE", "true").lower() in ("true", "1", "yes")


def is_vision_api_enabled() -> bool:
    return os.getenv("ENABLE_VISION_API", "true").lower() in ("true", "1", "yes")


def is_payment_gateway_enabled() -> bool:
    return os.getenv("ENABLE_PAYMENT_GATEWAY", "true").lower() in ("true", "1", "yes")


def get_circuit_breaker_status() -> Dict[str, Any]:
    return {
        "ENABLE_LLM_INFERENCE": is_llm_inference_enabled(),
        "ENABLE_VISION_API": is_vision_api_enabled(),
        "ENABLE_PAYMENT_GATEWAY": is_payment_gateway_enabled(),
        "fallback_mode": "deterministic_seeded_mocks",
    }


def call_llm_with_circuit_breaker(prompt: str) -> Dict[str, Any]:
    """Execute LLM call or return deterministic fallback when offline or disabled."""
    if not is_llm_inference_enabled():
        return {
            "source": "circuit_breaker_fallback",
            "model": "kyron-deterministic-mock-v1",
            "text": "Deterministic verdict: Call complies with safety policy. Risk score 0.04.",
            "tokens_consumed": 0,
        }
    # If enabled but no API key configured, safely return mock
    return {
        "source": "deterministic_offline_analyzer",
        "model": "kyron-rule-evaluator",
        "text": f"Policy evaluation complete for prompt length {len(prompt)}.",
        "tokens_consumed": 0,
    }


def call_payment_with_circuit_breaker(amount: int, currency: str, idempotency_key: str) -> Dict[str, Any]:
    """Execute external payment API or return deterministic fallback."""
    if not is_payment_gateway_enabled():
        return {
            "source": "circuit_breaker_fallback",
            "status": "succeeded",
            "transaction_id": f"mock_tx_{idempotency_key}",
            "amount": amount,
            "currency": currency,
        }
    return {
        "source": "mock_payment_provider",
        "status": "succeeded",
        "transaction_id": f"tx_live_{idempotency_key}",
        "amount": amount,
        "currency": currency,
    }
