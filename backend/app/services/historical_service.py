from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.models.embedding import Embedding, ReferenceType
from app.models.job_posting import JobPosting
from app.models.risk_signal import RiskSignal
from app.models.company import RiskLevel
from app.models.report import ReportStatus

# Configurable threshold for cosine distance (<=>). 
# Distance of 0.2 means 0.8 cosine similarity.
HISTORICAL_SIMILARITY_THRESHOLD = 0.20
TOP_K = 5

class HistoricalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_similar_jobs(self, current_job_id: str, vector: list[float]) -> list[JobPosting]:
        """
        Uses pgvector <=> operator (cosine distance) to find historically similar jobs.
        """
        if not vector:
            return []
            
        # 1. Search EMBEDDINGS table via vector index/scan
        try:
            result = await self.db.execute(
                select(Embedding, Embedding.vector.cosine_distance(vector).label("distance"))
                .filter(Embedding.reference_type == ReferenceType.JOB)
                .filter(Embedding.reference_id != current_job_id) # exclude self
                .filter(Embedding.vector.cosine_distance(vector) <= HISTORICAL_SIMILARITY_THRESHOLD)
                .order_by(Embedding.vector.cosine_distance(vector))
                .limit(TOP_K)
            )
            matches = result.all()
        except Exception:
            import math
            res_embs = await self.db.execute(
                select(Embedding)
                .filter(Embedding.reference_type == ReferenceType.JOB)
                .filter(Embedding.reference_id != current_job_id)
            )
            candidates = res_embs.scalars().all()
            scored = []
            for e in candidates:
                if e.vector:
                    dot = sum(a * b for a, b in zip(vector, e.vector))
                    n1 = math.sqrt(sum(a * a for a in vector))
                    n2 = math.sqrt(sum(b * b for b in e.vector))
                    dist = 1.0 - (dot / (n1 * n2)) if (n1 > 0 and n2 > 0) else 1.0
                    if dist <= HISTORICAL_SIMILARITY_THRESHOLD:
                        scored.append((e, dist))
            scored.sort(key=lambda x: x[1])
            class _Match:
                def __init__(self, emb, dist):
                    self.Embedding = emb
                    self.distance = dist
            matches = [_Match(e, d) for e, d in scored[:TOP_K]]

        if not matches:
            return []
            
        # 2. Retrieve fully populated JobPosting records for the matches
        job_ids = [m.Embedding.reference_id for m in matches]
        
        jobs_result = await self.db.execute(
            select(JobPosting)
            .options(
                selectinload(JobPosting.company),
                selectinload(JobPosting.recruiter),
                selectinload(JobPosting.risk_signals),
                selectinload(JobPosting.reports)
            )
            .filter(JobPosting.id.in_(job_ids))
        )
        
        jobs = jobs_result.scalars().all()
        
        # Sort jobs to match the ranked similarity order
        jobs_by_id = {j.id: j for j in jobs}
        sorted_jobs = []
        for m in matches:
            job = jobs_by_id.get(m.Embedding.reference_id)
            if job:
                # Attach distance metric temporarily if needed by UI
                job._similarity_distance = m.distance 
                sorted_jobs.append(job)
                
        return sorted_jobs

    def aggregate_patterns(self, similar_jobs: list[JobPosting]) -> dict:
        """
        Calculates aggregate patterns from similar historical jobs.
        """
        if not similar_jobs:
            return {
                "similar_count": 0,
                "high_risk_count": 0,
                "common_signals": [],
                "approved_reports_count": 0
            }
            
        similar_count = len(similar_jobs)
        high_risk_count = sum(1 for j in similar_jobs if j.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL])
        
        approved_reports_count = 0
        signal_counts = {}
        for job in similar_jobs:
            for sig in job.risk_signals:
                sig_type = getattr(sig.signal_type, "value", sig.signal_type)
                signal_counts[sig_type] = signal_counts.get(sig_type, 0) + 1
            for rep in job.reports:
                if rep.status == ReportStatus.APPROVED:
                    approved_reports_count += 1
                
        # Get signals appearing in > 1 job
        common_signals = [sig for sig, count in signal_counts.items() if count > 1]
        
        return {
            "similar_count": similar_count,
            "high_risk_count": high_risk_count,
            "common_signals": common_signals,
            "approved_reports_count": approved_reports_count
        }
