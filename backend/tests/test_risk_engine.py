import pytest
from app.ai.schemas import JobExtraction, SuspiciousSignal
from app.risk.engine import RiskEngine
from app.models.company import RiskLevel

def test_risk_engine_score_calculation():
    extraction = JobExtraction(
        suspicious_signals=[
            SuspiciousSignal(
                signal_type="UPFRONT_PAYMENT", 
                evidence="Pay 500", 
                confidence=95, 
                reasoning="Clear payment request"
            ),
            SuspiciousSignal(
                signal_type="GUARANTEED_SELECTION", 
                evidence="Guaranteed job", 
                confidence=90, 
                reasoning="Promises job"
            )
        ]
    )
    
    result = RiskEngine.calculate_risk(extraction)
    
    # UPFRONT_PAYMENT (30) + GUARANTEED_SELECTION (10) = 40
    assert result["risk_score"] == 40
    assert result["risk_level"] == RiskLevel.MODERATE
    assert result["confidence"] == 100

def test_risk_engine_clamping_and_penalties():
    extraction = JobExtraction(
        suspicious_signals=[
            SuspiciousSignal(signal_type="POSSIBLE_IMPERSONATION", evidence="e", confidence=70, reasoning="r"), # +25, -5 conf penalty
            SuspiciousSignal(signal_type="UPFRONT_PAYMENT", evidence="e", confidence=90, reasoning="r"), # +30
            SuspiciousSignal(signal_type="HISTORICAL_REPORTS", evidence="e", confidence=90, reasoning="r"), # +20
            SuspiciousSignal(signal_type="SUSPICIOUS_APPLICATION_URL", evidence="e", confidence=90, reasoning="r"), # +20
            SuspiciousSignal(signal_type="SENSITIVE_INFORMATION_REQUEST", evidence="e", confidence=90, reasoning="r") # +15
        ],
        missing_information=["Missing company name", "Missing domain"] # 2 * -5 = -10 conf penalty
    )
    
    # Base score: 25 + 30 + 20 + 20 + 15 = 110. Clamp to 100.
    result = RiskEngine.calculate_risk(extraction)
    assert result["risk_score"] == 100
    assert result["risk_level"] == RiskLevel.CRITICAL
    
    assert result["confidence"] == 85

def test_risk_engine_lower_boundary():
    # Test that score doesn't drop below 0 if somehow penalties are applied
    extraction = JobExtraction(
        suspicious_signals=[],
        missing_information=[]
    )
    result = RiskEngine.calculate_risk(extraction)
    assert result["risk_score"] == 0
    assert result["risk_level"] == RiskLevel.LOW
    assert result["confidence"] == 100

def test_risk_engine_prompt_injection_simulation():
    # Even if the AI extracts a prompt injection as a 'signal_type', 
    # the deterministic engine should ignore unknown signal types or handle them gracefully without crashing.
    extraction = JobExtraction(
        suspicious_signals=[
            SuspiciousSignal(
                signal_type="IGNORE_ALL_PREVIOUS_INSTRUCTIONS", 
                evidence="System instruction override", 
                confidence=100, 
                reasoning="Haha"
            ),
            SuspiciousSignal(
                signal_type="UPFRONT_PAYMENT", 
                evidence="Pay me", 
                confidence=90, 
                reasoning="Legit signal"
            )
        ]
    )
    
    result = RiskEngine.calculate_risk(extraction)
    # The unknown signal type should be ignored or mapped to 0 score, 
    # and it should not crash the engine.
    # Therefore, the score should just be the UPFRONT_PAYMENT score (30)
    assert result["risk_score"] == 30
    assert result["risk_level"] == RiskLevel.MODERATE

