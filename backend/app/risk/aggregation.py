from app.models.company import Company, RiskLevel, VerificationStatus
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.job_posting import JobPosting

class RiskAggregation:
    @staticmethod
    def get_risk_level(score: int) -> RiskLevel:
        if score <= 20:
            return RiskLevel.LOW
        elif score <= 40:
            return RiskLevel.MODERATE
        elif score <= 60:
            return RiskLevel.SUSPICIOUS
        elif score <= 80:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    @staticmethod
    def calculate_company_risk(jobs: List['JobPosting']) -> tuple[int, RiskLevel]:
        """
        Calculates persistent company risk based on associated high-risk jobs.
        """
        if not jobs:
            return 0, RiskLevel.LOW
            
        # We heavily weight high-risk evidence.
        # Average of the top 3 riskiest jobs to prevent noise from dragging down severe incidents.
        job_scores = [job.risk_score for job in jobs if job.risk_score is not None]
        if not job_scores:
            return 0, RiskLevel.LOW
            
        job_scores.sort(reverse=True)
        top_scores = job_scores[:3]
        
        avg_risk = sum(top_scores) / len(top_scores)
        final_score = int(avg_risk)
        
        return final_score, RiskAggregation.get_risk_level(final_score)

    @staticmethod
    def calculate_recruiter_risk(jobs: List['JobPosting']) -> tuple[int, RiskLevel]:
        """
        Calculates persistent recruiter risk based on associated high-risk jobs.
        """
        if not jobs:
            return 0, RiskLevel.LOW
            
        job_scores = [job.risk_score for job in jobs if job.risk_score is not None]
        if not job_scores:
            return 0, RiskLevel.LOW
            
        job_scores.sort(reverse=True)
        top_scores = job_scores[:3]
        
        avg_risk = sum(top_scores) / len(top_scores)
        final_score = int(avg_risk)
        
        # NOTE: Verification discrepancies (handled later) could add to this score.
        # Keeping it simple and deterministic for this phase based on job scores.
        return final_score, RiskAggregation.get_risk_level(final_score)
