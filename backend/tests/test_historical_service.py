import pytest
from app.services.historical_service import HistoricalService
from app.models.job_posting import JobPosting
from app.models.risk_signal import RiskSignal
from app.models.company import RiskLevel
from app.risk.rules import RiskSignalType

def test_aggregate_patterns():
    service = HistoricalService(db=None)
    
    j1 = JobPosting(risk_level=RiskLevel.HIGH)
    j1.risk_signals = [RiskSignal(signal_type=RiskSignalType.UPFRONT_PAYMENT)]
    
    j2 = JobPosting(risk_level=RiskLevel.CRITICAL)
    j2.risk_signals = [
        RiskSignal(signal_type=RiskSignalType.UPFRONT_PAYMENT),
        RiskSignal(signal_type=RiskSignalType.HIGH_PRESSURE_LANGUAGE)
    ]
    
    j3 = JobPosting(risk_level=RiskLevel.LOW)
    j3.risk_signals = [RiskSignal(signal_type=RiskSignalType.HIGH_PRESSURE_LANGUAGE)]
    
    patterns = service.aggregate_patterns([j1, j2, j3])
    
    assert patterns["similar_count"] == 3
    assert patterns["high_risk_count"] == 2
    assert "UPFRONT_PAYMENT" in patterns["common_signals"]
    assert "HIGH_PRESSURE_LANGUAGE" in patterns["common_signals"]

def test_aggregate_patterns_empty():
    service = HistoricalService(db=None)
    patterns = service.aggregate_patterns([])
    
    assert patterns["similar_count"] == 0
    assert patterns["high_risk_count"] == 0
    assert patterns["common_signals"] == []
