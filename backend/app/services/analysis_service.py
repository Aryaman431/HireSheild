from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.ai.provider import AIProvider
from app.risk.engine import RiskEngine
from app.models.job_posting import JobPosting
from app.models.analysis_run import AnalysisRun, AnalysisStatus
from app.models.risk_signal import RiskSignal
from app.models.evidence_item import EvidenceItem, SourceType
from app.services.company_service import CompanyService
from app.services.recruiter_service import RecruiterService
from app.services.verification_service import VerificationService
from app.services.historical_service import HistoricalService
from app.services.community_service import CommunityService
from app.embeddings.gemini import GeminiEmbeddingProvider
from app.embeddings.service import EmbeddingService
from app.risk.aggregation import RiskAggregation
from app.risk.rules import RiskSignalType, get_signal_score

class AnalysisService:
    def __init__(self, ai_provider: AIProvider, db: AsyncSession):
        self.ai = ai_provider
        self.db = db
        self.company_service = CompanyService(db)
        self.recruiter_service = RecruiterService(db)
        self.verification_service = VerificationService(db)
        self.historical_service = HistoricalService(db)
        
        provider = GeminiEmbeddingProvider()
        self.embedding_service = EmbeddingService(provider, db)

    async def analyze_job_text(self, text: str) -> str:
        """
        Coordinates the analysis pipeline.
        Returns the JobPosting ID.
        """
        # 1. Create JobPosting record with raw text
        job = JobPosting(
            extracted_text=text,
        )
        self.db.add(job)
        await self.db.commit() # get ID
        await self.db.refresh(job)
        
        # 2. Create AnalysisRun record
        run = AnalysisRun(
            job_posting_id=job.id,
            status=AnalysisStatus.PROCESSING,
            provider="gemini",
            started_at=datetime.utcnow().isoformat()
        )
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)

        try:
            # 3. AI Extraction
            extraction = await self.ai.extract_job_information(text)
            
            # 4. Entity Resolution (Company & Recruiter)
            company = None
            if extraction.company:
                extracted_domain = self.verification_service.extract_domain(extraction.application_url)
                company = await self.company_service.resolve_company(extraction.company, extracted_domain)
                if company:
                    job.company_id = company.id

            recruiter = None
            if extraction.recruiter or extraction.recruiter_email or extraction.recruiter_phone:
                recruiter = await self.recruiter_service.resolve_recruiter(
                    name=extraction.recruiter,
                    email=extraction.recruiter_email,
                    phone=extraction.recruiter_phone,
                    company_id=company.id if company else None
                )
                if recruiter:
                    job.recruiter_id = recruiter.id
                    
            # 5. Basic Consistency Checks
            if company and recruiter:
                await self.verification_service.check_recruiter_domain_match(company, recruiter)
            
            # 6. Risk Engine Calculation
            risk_result = RiskEngine.calculate_risk(extraction)
            
            # 7. Update JobPosting with extracted metadata
            job.title = extraction.job_title
            job.description = extraction.description
            job.salary = extraction.compensation
            job.location = extraction.location
            job.source_url = extraction.application_url
            job.risk_score = risk_result["risk_score"]
            job.risk_level = risk_result["risk_level"]
            job.confidence = risk_result["confidence"]
            
            # 8. Persist Risk Signals & Evidence
            for sig_detail in risk_result["signal_details"]:
                signal = RiskSignal(
                    job_posting_id=job.id,
                    analysis_run_id=run.id,
                    signal_type=sig_detail["signal_type"],
                    severity=job.risk_level, # Simplification: inherit overall risk level or derive from score
                    confidence=sig_detail["confidence"],
                    reasoning=sig_detail["reasoning"],
                    score_contribution=sig_detail["score_contribution"]
                )
                self.db.add(signal)
                await self.db.flush() # Get signal ID for evidence
                
                if sig_detail["evidence"]:
                    evidence = EvidenceItem(
                        risk_signal_id=signal.id,
                        source_type=SourceType.TEXT_INPUT,
                        quote=sig_detail["evidence"],
                        confidence=sig_detail["confidence"]
                    )
                    self.db.add(evidence)
            
            # 9. Mark Success
            run.status = AnalysisStatus.COMPLETED
            run.completed_at = datetime.utcnow().isoformat()
            
            # 10. Update persistent entity risk scores
            if company:
                await self.db.refresh(company, ['jobs'])
                score, level = RiskAggregation.calculate_company_risk(company.jobs)
                company.risk_score = score
                company.risk_level = level
                
            if recruiter:
                await self.db.refresh(recruiter, ['jobs'])
                score, level = RiskAggregation.calculate_recruiter_risk(recruiter.jobs)
                recruiter.risk_score = score
            
            await self.db.commit() # Save everything up to here so job is queryable
            
            # 11. Historical Intelligence (Fail-safe)
            try:
                from app.models.risk_signal import RiskLevel
                # We need the signals we just inserted
                await self.db.refresh(job, ['risk_signals'])
                
                emb_id = await self.embedding_service.generate_and_persist_job_embedding(
                    job=job,
                    signals=job.risk_signals,
                    company_name=company.name if company else None
                )
                
                if emb_id:
                    # Retrieve the vector we just persisted
                    from app.models.embedding import Embedding
                    result = await self.db.execute(self.db.query(Embedding).filter(Embedding.id == emb_id).statement)
                    emb = result.scalar_one_or_none()
                    if emb and emb.vector:
                        similar_jobs = await self.historical_service.find_similar_jobs(job.id, emb.vector)
                        patterns = self.historical_service.aggregate_patterns(similar_jobs)
                        
                        if patterns["high_risk_count"] > 0:
                            # Add historical risk signal dynamically
                            sig_type = RiskSignalType.SIMILAR_HISTORICAL_RISK_FOUND
                            score_contribution = get_signal_score(sig_type.value)
                            
                            hist_signal = RiskSignal(
                                job_posting_id=job.id,
                                analysis_run_id=run.id,
                                signal_type=sig_type,
                                severity=RiskLevel.HIGH,
                                confidence=80,
                                reasoning=f"Found {patterns['high_risk_count']} highly similar historical opportunities with high/critical risk.",
                                score_contribution=score_contribution
                            )
                            self.db.add(hist_signal)
                            
                            # Bump job score
                            new_score = min(100, (job.risk_score or 0) + score_contribution)
                            job.risk_score = new_score
                            job.risk_level = RiskAggregation.get_risk_level(new_score)
                            
                            await self.db.commit()
            except Exception as e:
                print(f"Historical intelligence failed (non-fatal): {e}")

            return job.id
            
        except Exception as e:
            # 12. Mark Failure
            await self.db.rollback()
            run.status = AnalysisStatus.FAILED
            run.completed_at = datetime.utcnow().isoformat()
            self.db.add(run)
            await self.db.commit()
            raise RuntimeError(f"Analysis failed: {str(e)}")

    async def analyze_job_file(self, file_bytes: bytes, filename: str, mime_type: str) -> str:
        """
        Coordinates the analysis pipeline for documents (screenshots and PDFs).
        Returns the JobPosting ID.
        """
        from app.models.job_posting import InputSource
        from pypdf import PdfReader
        import io

        is_pdf = mime_type == 'application/pdf'
        extracted_text = None
        input_source = InputSource.PDF if is_pdf else InputSource.IMAGE

        # 1. Local PDF Extraction Fallback
        if is_pdf:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                text_parts = []
                # limit to first 20 pages (or config)
                for page in reader.pages[:20]:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                
                pdf_text = "\n".join(text_parts).strip()
                if len(pdf_text) > 100:
                    # Treat as text input
                    extracted_text = pdf_text
            except Exception as e:
                print(f"pypdf extraction failed, falling back to multimodal: {e}")

        # 2. Create JobPosting record
        job = JobPosting(
            extracted_text=extracted_text,
            input_source=input_source
        )
        self.db.add(job)
        await self.db.commit() # get ID
        await self.db.refresh(job)
        
        # 3. Create AnalysisRun record
        run = AnalysisRun(
            job_posting_id=job.id,
            status=AnalysisStatus.PROCESSING,
            provider="gemini",
            started_at=datetime.utcnow().isoformat()
        )
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)

        try:
            # 4. AI Extraction
            if extracted_text:
                extraction = await self.ai.extract_job_information(extracted_text)
            else:
                extraction = await self.ai.extract_job_information_from_document(file_bytes, mime_type)
            
            # The remainder of the pipeline is perfectly identical to analyze_job_text
            # To avoid duplicating 100+ lines of code, I will abstract the pipeline.
            # But wait, python doesn't easily let me jump into the middle of another method.
            # I will refactor the rest of the pipeline into a private method `_process_extraction`.
            await self._process_extraction(job, run, extraction)
            return job.id
            
        except Exception as e:
            await self.db.rollback()
            run.status = AnalysisStatus.FAILED
            run.completed_at = datetime.utcnow().isoformat()
            self.db.add(run)
            await self.db.commit()
            raise RuntimeError(f"Analysis failed: {str(e)}")

    async def _process_extraction(self, job: JobPosting, run: AnalysisRun, extraction: any) -> None:
        """
        Shared pipeline for resolving entities, calculating risk, saving signals, and building intelligence.
        """
        # 4. Entity Resolution (Company & Recruiter)
        company = None
        if extraction.company:
            extracted_domain = self.verification_service.extract_domain(extraction.application_url)
            company = await self.company_service.resolve_company(extraction.company, extracted_domain)
            if company:
                job.company_id = company.id

        recruiter = None
        if extraction.recruiter or extraction.recruiter_email or extraction.recruiter_phone:
            recruiter = await self.recruiter_service.resolve_recruiter(
                name=extraction.recruiter,
                email=extraction.recruiter_email,
                phone=extraction.recruiter_phone,
                company_id=company.id if company else None
            )
            if recruiter:
                job.recruiter_id = recruiter.id
                

        # 6. Community Intelligence check
        approved_reports = []
        if company:
            comp_reports = await CommunityService.get_entity_approved_reports(self.db, 'company', company.id)
            approved_reports.extend(comp_reports)
        if recruiter:
            rec_reports = await CommunityService.get_entity_approved_reports(self.db, 'recruiter', recruiter.id)
            approved_reports.extend(rec_reports)
            
        # 7. Risk Engine Calculation
        risk_result = RiskEngine.calculate_risk(extraction)
        
        # Inject HISTORICAL_REPORTS if community reports found
        if len(approved_reports) > 0:
            score_val = get_signal_score(RiskSignalType.HISTORICAL_REPORTS.value)
            risk_result["signal_details"].append({
                "signal_type": RiskSignalType.HISTORICAL_REPORTS,
                "confidence": 95,
                "reasoning": f"Found {len(approved_reports)} approved community report(s) associated with this company or recruiter.",
                "evidence": None,
                "score_contribution": score_val
            })
            # Recalculate basic sum logic to update risk_result score
            new_score = min(100, risk_result["risk_score"] + score_val)
            risk_result["risk_score"] = new_score
            risk_result["risk_level"] = RiskAggregation.get_risk_level(new_score)
            
        # 8. Update JobPosting with extracted metadata
        job.title = extraction.job_title
        job.description = extraction.description
        job.salary = extraction.compensation
        job.location = extraction.location
        job.source_url = extraction.application_url
        job.risk_score = risk_result["risk_score"]
        job.risk_level = risk_result["risk_level"]
        job.confidence = risk_result["confidence"]
        
        # 6. Persist Risk Signals & Evidence
        for sig_detail in risk_result["signal_details"]:
            signal = RiskSignal(
                job_posting_id=job.id,
                analysis_run_id=run.id,
                signal_type=sig_detail["signal_type"],
                severity=job.risk_level, 
                confidence=sig_detail["confidence"],
                reasoning=sig_detail["reasoning"],
                score_contribution=sig_detail["score_contribution"]
            )
            self.db.add(signal)
            await self.db.flush() 
            
            if sig_detail["evidence"]:
                evidence = EvidenceItem(
                    risk_signal_id=signal.id,
                    source_type=SourceType.TEXT_INPUT,
                    quote=sig_detail["evidence"],
                    confidence=sig_detail["confidence"]
                )
                self.db.add(evidence)
        
        # 9. Mark Success
        run.status = AnalysisStatus.COMPLETED
        run.completed_at = datetime.utcnow().isoformat()
        
        # 10. Update persistent entity risk scores
        if company:
            await self.db.refresh(company, ['jobs'])
            score, level = RiskAggregation.calculate_company_risk(company.jobs)
            company.risk_score = score
            company.risk_level = level
            
        if recruiter:
            await self.db.refresh(recruiter, ['jobs'])
            score, level = RiskAggregation.calculate_recruiter_risk(recruiter.jobs)
            recruiter.risk_score = score
        
        await self.db.commit() 
        
        # 11. Verification Checks
        try:
            await self.verification_service.perform_verification_for_job(job.id, force_recheck=True)
        except Exception as e:
            print(f"Verification check failed (non-fatal): {e}")
            
        
        # 11. Historical Intelligence (Fail-safe)
        try:
            await self.db.refresh(job, ['risk_signals'])
            emb_id = await self.embedding_service.generate_and_persist_job_embedding(
                job=job,
                signals=job.risk_signals,
                company_name=company.name if company else None
            )
            
            if emb_id:
                from app.models.embedding import Embedding
                from sqlalchemy.future import select
                result = await self.db.execute(select(Embedding).filter(Embedding.id == emb_id))
                emb = result.scalar_one_or_none()
                if emb and emb.vector:
                    similar_jobs = await self.historical_service.find_similar_jobs(job.id, emb.vector)
                    patterns = self.historical_service.aggregate_patterns(similar_jobs)
                    
                    if patterns["high_risk_count"] > 0:
                        sig_type = RiskSignalType.SIMILAR_HISTORICAL_RISK_FOUND
                        score_contribution = get_signal_score(sig_type.value)
                        
                        hist_signal = RiskSignal(
                            job_posting_id=job.id,
                            analysis_run_id=run.id,
                            signal_type=sig_type,
                            severity=RiskLevel.HIGH,
                            confidence=80,
                            reasoning=f"Found {patterns['high_risk_count']} highly similar historical opportunities with high/critical risk.",
                            score_contribution=score_contribution
                        )
                        self.db.add(hist_signal)
                        
                        new_score = min(100, (job.risk_score or 0) + score_contribution)
                        job.risk_score = new_score
                        job.risk_level = RiskAggregation.get_risk_level(new_score)
                        
                        await self.db.commit()
        except Exception as e:
            print(f"Historical intelligence failed (non-fatal): {e}")

    async def get_analysis_result(self, job_id: str) -> dict:
        """
        Retrieves the aggregated analysis result for the frontend.
        """
        from sqlalchemy.orm import selectinload
        from sqlalchemy.future import select
        
        from app.models.company import Company
        from app.models.recruiter import Recruiter
        
        result = await self.db.execute(
            select(JobPosting)
            .options(
                selectinload(JobPosting.risk_signals).selectinload(RiskSignal.evidence_items),
                selectinload(JobPosting.company),
                selectinload(JobPosting.recruiter)
            )
            .where(JobPosting.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            return None
            
        signals = []
        for s in job.risk_signals:
            evidences = [e.quote for e in s.evidence_items if e.quote]
            signals.append({
                "type": s.signal_type,
                "contribution": s.score_contribution,
                "reasoning": s.reasoning,
                "evidence": evidences[0] if evidences else None
            })
            
        return {
            "id": job.id,
            "title": job.title,
            "company": {
                "id": job.company.id,
                "name": job.company.name,
                "domain": job.company.official_domain,
                "verification_status": job.company.verification_status.value if job.company.verification_status else "UNVERIFIED"
            } if job.company else None,
            "recruiter": {
                "id": job.recruiter.id,
                "name": job.recruiter.name,
                "email": job.recruiter.email,
                "verification_status": job.recruiter.verification_status.value if job.recruiter.verification_status else "UNVERIFIED"
            } if job.recruiter else None,
            "risk_score": job.risk_score,
            "risk_level": job.risk_level.value if job.risk_level else "UNKNOWN",
            "confidence": job.confidence,
            "input_source": job.input_source.value if job.input_source else "TEXT",
            "signals": signals
        }
