import pytest
from app.risk.aggregation import RiskAggregation
from app.models.job_posting import JobPosting
from app.models.company import RiskLevel

def test_risk_aggregation():
    # Empty jobs
    score, level = RiskAggregation.calculate_company_risk([])
    assert score == 0
    assert level == RiskLevel.LOW
    
    # Jobs without scores
    j1 = JobPosting(risk_score=None)
    score, level = RiskAggregation.calculate_company_risk([j1])
    assert score == 0
    
    # Multiple jobs, taking top 3 average
    j2 = JobPosting(risk_score=10)
    j3 = JobPosting(risk_score=90) # Severe incident
    j4 = JobPosting(risk_score=80)
    j5 = JobPosting(risk_score=85)
    
    # Top 3 are 90, 85, 80 -> Average 85
    score, level = RiskAggregation.calculate_company_risk([j1, j2, j3, j4, j5])
    assert score == 85
    assert level == RiskLevel.CRITICAL
