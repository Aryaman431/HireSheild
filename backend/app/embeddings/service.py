from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.embedding import Embedding, ReferenceType
from app.models.job_posting import JobPosting
from .provider import EmbeddingProvider

class EmbeddingService:
    def __init__(self, provider: EmbeddingProvider, db: AsyncSession):
        self.provider = provider
        self.db = db

    def construct_job_text(self, job: JobPosting, signals: list, company_name: str | None) -> str:
        """
        Creates a dense semantic representation of the job opportunity for vector embedding.
        """
        parts = []
        if job.title:
            parts.append(f"JOB TITLE:\n{job.title}")
            
        if company_name:
            parts.append(f"COMPANY:\n{company_name}")
            
        if job.description:
            parts.append(f"DESCRIPTION:\n{job.description}")
            
        if job.salary:
            parts.append(f"COMPENSATION:\n{job.salary}")
            
        if job.location:
            parts.append(f"LOCATION:\n{job.location}")
            
        if signals:
            sig_list = "\n".join([getattr(s.signal_type, "value", s.signal_type) for s in signals])
            parts.append(f"RISK SIGNALS:\n{sig_list}")
            
            # Add top evidence securely (avoiding PII, focusing on mechanics)
            evidence_parts = []
            for sig in signals:
                for ev in sig.evidence_items:
                    if ev.quote:
                        evidence_parts.append(f'"{ev.quote}"')
            if evidence_parts:
                parts.append(f"EVIDENCE:\n" + "\n".join(evidence_parts))
                
        return "\n\n".join(parts)

    async def generate_and_persist_job_embedding(self, job: JobPosting, signals: list, company_name: str | None) -> str | None:
        """
        Generates and stores an embedding. Fails gracefully by returning None.
        """
        try:
            semantic_text = self.construct_job_text(job, signals, company_name)
            vector = await self.provider.embed_text(semantic_text)
            
            result = await self.db.execute(
                select(Embedding).where(
                    Embedding.reference_id == job.id,
                    Embedding.reference_type == ReferenceType.JOB,
                )
            )
            emb = result.scalar_one_or_none()
            if emb:
                emb.vector = vector
            else:
                emb = Embedding(
                    reference_id=job.id,
                    reference_type=ReferenceType.JOB,
                    vector=vector
                )
                self.db.add(emb)
            await self.db.flush()
            return emb.id
            
        except Exception as e:
            print(f"Embedding generation failed: {e}")
            return None
