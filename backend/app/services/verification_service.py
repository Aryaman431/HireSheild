from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.verification_check import VerificationCheck, EntityType, CheckType, CheckResult
from app.models.company import Company, VerificationStatus as CompanyVerificationStatus
from app.models.recruiter import Recruiter
from app.models.job_posting import JobPosting
from app.models.risk_signal import RiskSignal, RiskLevel
from app.risk.rules import RiskSignalType
import httpx
import socket
import ipaddress
import asyncio
from typing import Optional, Tuple

class SafeURLFetcher:
    @staticmethod
    async def is_safe_ip(hostname: str) -> bool:
        try:
            loop = asyncio.get_running_loop()
            ip_addr = await loop.run_in_executor(None, socket.gethostbyname, hostname)
            ip = ipaddress.ip_address(ip_addr)
            return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified)
        except Exception:
            return False

    @classmethod
    async def fetch(cls, url: str) -> Tuple[Optional[httpx.Response], str]:
        """
        Safely fetch a URL following redirects up to 3 times, checking each step for SSRF.
        Returns (Response, Final_URL, ErrorMessage).
        """
        try:
            parsed = urlparse(url)
            if parsed.scheme not in ('http', 'https'):
                return None, "Unsupported protocol."
                
            if not parsed.hostname:
                return None, "Invalid hostname."
                
            if not await cls.is_safe_ip(parsed.hostname):
                return None, "Unsafe or unresolvable hostname."
                
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=False) as client:
                current_url = url
                for _ in range(3):
                    resp = await client.get(current_url)
                    if 300 <= resp.status_code < 400 and 'location' in resp.headers:
                        next_url = resp.headers['location']
                        # Handle relative redirects
                        if not next_url.startswith('http'):
                            from urllib.parse import urljoin
                            next_url = urljoin(current_url, next_url)
                        parsed_next = urlparse(next_url)
                        if parsed_next.scheme not in ('http', 'https') or not await cls.is_safe_ip(parsed_next.hostname):
                            return None, "Unsafe redirect target."
                        current_url = next_url
                    else:
                        return resp, ""
                return None, "Too many redirects."
        except httpx.RequestError as e:
            return None, f"Network error: {str(e)}"
        except Exception as e:
            return None, "Failed to resolve URL."

class VerificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def extract_domain(self, source: str) -> str | None:
        """
        Extracts the bare domain from a URL or email.
        e.g., https://www.example.com/jobs -> example.com
        e.g., recruiter@gmail.com -> gmail.com
        """
        if not source:
            return None
            
        source = source.strip().lower()
        
        # Handle emails
        if '@' in source:
            parts = source.split('@')
            if len(parts) == 2:
                domain = parts[1]
                return domain
        
        # Handle URLs
        if not source.startswith('http'):
            source = 'http://' + source
            
        try:
            parsed = urlparse(source)
            domain = parsed.netloc
            # Remove www.
            if domain.startswith('www.'):
                domain = domain[4:]
            # Remove port if exists
            domain = domain.split(':')[0]
            return domain if domain else None
        except Exception:
            return None

    async def verify_company_domain(self, company: Company) -> list[VerificationCheck]:
        checks = []
        if not company.official_domain:
            return checks
            
        url = f"https://{company.official_domain}"
        resp, err = await SafeURLFetcher.fetch(url)
        
        if resp and resp.status_code < 400:
            checks.append(VerificationCheck(
                entity_type=EntityType.COMPANY,
                entity_id=company.id,
                check_type=CheckType.COMPANY_DOMAIN,
                result=CheckResult.VERIFIED,
                evidence=f"Official domain {company.official_domain} is reachable over HTTPS."
            ))
            checks.append(VerificationCheck(
                entity_type=EntityType.COMPANY,
                entity_id=company.id,
                check_type=CheckType.HTTPS,
                result=CheckResult.VERIFIED,
                evidence=f"HTTPS successfully established."
            ))
        else:
            # Fallback to HTTP
            http_url = f"http://{company.official_domain}"
            resp2, err2 = await SafeURLFetcher.fetch(http_url)
            if resp2 and resp2.status_code < 400:
                checks.append(VerificationCheck(
                    entity_type=EntityType.COMPANY,
                    entity_id=company.id,
                    check_type=CheckType.COMPANY_DOMAIN,
                    result=CheckResult.VERIFIED,
                    evidence=f"Official domain {company.official_domain} is reachable (HTTP)."
                ))
                checks.append(VerificationCheck(
                    entity_type=EntityType.COMPANY,
                    entity_id=company.id,
                    check_type=CheckType.HTTPS,
                    result=CheckResult.UNVERIFIED,
                    evidence=f"HTTPS could not be established."
                ))
            else:
                checks.append(VerificationCheck(
                    entity_type=EntityType.COMPANY,
                    entity_id=company.id,
                    check_type=CheckType.COMPANY_DOMAIN,
                    result=CheckResult.UNVERIFIED,
                    evidence=f"Official domain {company.official_domain} could not be reached. Error: {err or err2}"
                ))
        
        for c in checks:
            self.db.add(c)
        return checks

    async def verify_recruiter(self, company: Company, recruiter: Recruiter) -> list[VerificationCheck]:
        checks = []
        if not company or not recruiter or not recruiter.email:
            checks.append(VerificationCheck(
                entity_type=EntityType.RECRUITER,
                entity_id=recruiter.id if recruiter else "unknown",
                check_type=CheckType.RECRUITER_EMAIL_DOMAIN,
                result=CheckResult.UNVERIFIED,
                evidence="No recruiter email or company domain available to verify."
            ))
            for c in checks: self.db.add(c)
            return checks
            
        recruiter_domain = self.extract_domain(recruiter.email)
        company_domain = self.extract_domain(company.official_domain)
        
        if not company_domain or not recruiter_domain:
            checks.append(VerificationCheck(
                entity_type=EntityType.RECRUITER,
                entity_id=recruiter.id,
                check_type=CheckType.RECRUITER_EMAIL_DOMAIN,
                result=CheckResult.UNVERIFIED,
                evidence="Domain information missing for comparison."
            ))
        elif recruiter_domain == company_domain:
            checks.append(VerificationCheck(
                entity_type=EntityType.RECRUITER,
                entity_id=recruiter.id,
                check_type=CheckType.RECRUITER_EMAIL_DOMAIN,
                result=CheckResult.VERIFIED,
                evidence=f"Recruiter email domain ({recruiter_domain}) matches the company's known official domain."
            ))
        else:
            checks.append(VerificationCheck(
                entity_type=EntityType.RECRUITER,
                entity_id=recruiter.id,
                check_type=CheckType.RECRUITER_EMAIL_DOMAIN,
                result=CheckResult.SUSPICIOUS,
                evidence=f"Recruiter email uses {recruiter_domain} while the known company domain is {company_domain}."
            ))
            
        for c in checks:
            self.db.add(c)
        return checks

    async def verify_application_url(self, job: JobPosting, company: Company) -> list[VerificationCheck]:
        checks = []
        if not job.source_url:
            checks.append(VerificationCheck(
                entity_type=EntityType.JOB,
                entity_id=job.id,
                check_type=CheckType.APPLICATION_URL,
                result=CheckResult.UNVERIFIED,
                evidence="No application URL provided."
            ))
            for c in checks: self.db.add(c)
            return checks
            
        url_domain = self.extract_domain(job.source_url)
        company_domain = self.extract_domain(company.official_domain) if company else None
        
        resp, err = await SafeURLFetcher.fetch(job.source_url)
        
        if not resp:
            checks.append(VerificationCheck(
                entity_type=EntityType.JOB,
                entity_id=job.id,
                check_type=CheckType.APPLICATION_URL,
                result=CheckResult.UNVERIFIED,
                evidence=f"Application URL is unreachable or unsafe. Error: {err}"
            ))
        else:
            # Check redirect mismatch
            final_domain = self.extract_domain(str(resp.url))
            if url_domain != final_domain:
                checks.append(VerificationCheck(
                    entity_type=EntityType.JOB,
                    entity_id=job.id,
                    check_type=CheckType.APPLICATION_URL,
                    result=CheckResult.SUSPICIOUS,
                    evidence=f"Application URL redirects from {url_domain} to {final_domain}."
                ))
            elif company_domain and url_domain != company_domain:
                checks.append(VerificationCheck(
                    entity_type=EntityType.JOB,
                    entity_id=job.id,
                    check_type=CheckType.APPLICATION_URL,
                    result=CheckResult.PARTIALLY_VERIFIED,
                    evidence=f"Application URL points to {url_domain}, which differs from company domain {company_domain}."
                ))
            else:
                checks.append(VerificationCheck(
                    entity_type=EntityType.JOB,
                    entity_id=job.id,
                    check_type=CheckType.APPLICATION_URL,
                    result=CheckResult.VERIFIED,
                    evidence="Application URL is valid and reachable."
                ))
                
        for c in checks:
            self.db.add(c)
        return checks
        
    async def _cleanup_old_checks(self, entity_id: str):
        # We manually delete old checks for this entity_id to keep the DB clean for rechecks
        # In SQLAlchemy 2.0 async
        from sqlalchemy import delete
        await self.db.execute(delete(VerificationCheck).where(VerificationCheck.entity_id == entity_id))

    async def perform_verification_for_job(self, job_id: str, force_recheck: bool = False):
        """
        Orchestrates verification for a job, its company, and recruiter.
        """
        # Fetch Job, Company, Recruiter
        result = await self.db.execute(select(JobPosting).where(JobPosting.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return
            
        company = None
        if job.company_id:
            res_comp = await self.db.execute(select(Company).where(Company.id == job.company_id))
            company = res_comp.scalar_one_or_none()
            
        recruiter = None
        if job.recruiter_id:
            res_rec = await self.db.execute(select(Recruiter).where(Recruiter.id == job.recruiter_id))
            recruiter = res_rec.scalar_one_or_none()
            
        if force_recheck:
            if company: await self._cleanup_old_checks(company.id)
            if recruiter: await self._cleanup_old_checks(recruiter.id)
            await self._cleanup_old_checks(job.id)
        
        # Verify Company
        if company:
            # check if recent checks exist
            res = await self.db.execute(select(VerificationCheck).where(VerificationCheck.entity_id == company.id))
            if force_recheck or not res.scalars().first():
                comp_checks = await self.verify_company_domain(company)
                
                # Aggregate Company status
                if comp_checks:
                    has_suspicious = any(c.result == CheckResult.SUSPICIOUS for c in comp_checks)
                    has_verified = any(c.result == CheckResult.VERIFIED for c in comp_checks)
                    has_unverified = any(c.result == CheckResult.UNVERIFIED for c in comp_checks)
                    
                    if has_suspicious:
                        company.verification_status = CompanyVerificationStatus.SUSPICIOUS
                    elif has_verified and not has_unverified:
                        company.verification_status = CompanyVerificationStatus.VERIFIED
                    elif has_verified and has_unverified:
                        company.verification_status = CompanyVerificationStatus.PARTIALLY_VERIFIED
                    else:
                        company.verification_status = CompanyVerificationStatus.UNVERIFIED
                
        # Verify Recruiter
        if recruiter and company:
            res = await self.db.execute(select(VerificationCheck).where(VerificationCheck.entity_id == recruiter.id))
            if force_recheck or not res.scalars().first():
                rec_checks = await self.verify_recruiter(company, recruiter)
                
                if rec_checks:
                    has_suspicious = any(c.result == CheckResult.SUSPICIOUS for c in rec_checks)
                    has_verified = any(c.result == CheckResult.VERIFIED for c in rec_checks)
                    
                    if has_suspicious:
                        recruiter.verification_status = CompanyVerificationStatus.SUSPICIOUS
                        # Inject RiskSignal if not present
                        await self._inject_risk_signal(
                            job.id, job.analysis_runs[0].id if job.analysis_runs else None,
                            RiskSignalType.POSSIBLE_IMPERSONATION,
                            20,
                            "Recruiter email domain does not match company domain."
                        )
                    elif has_verified:
                        recruiter.verification_status = CompanyVerificationStatus.VERIFIED
                    else:
                        recruiter.verification_status = CompanyVerificationStatus.UNVERIFIED
                        
        # Verify Application URL
        res = await self.db.execute(select(VerificationCheck).where(VerificationCheck.entity_id == job.id))
        if force_recheck or not res.scalars().first():
            app_checks = await self.verify_application_url(job, company)
            
            if app_checks:
                has_suspicious = any(c.result == CheckResult.SUSPICIOUS for c in app_checks)
                if has_suspicious:
                    await self._inject_risk_signal(
                        job.id, job.analysis_runs[0].id if job.analysis_runs else None,
                        RiskSignalType.SUSPICIOUS_APPLICATION_URL,
                        25,
                        "Application URL is unreachable, unsafe, or redirects unexpectedly."
                    )
                    
        await self.db.commit()

    async def _inject_risk_signal(self, job_id: str, run_id: str, signal_type: RiskSignalType, score: int, reasoning: str):
        # Check if already exists to avoid double counting
        res = await self.db.execute(
            select(RiskSignal).where(RiskSignal.job_posting_id == job_id).where(RiskSignal.signal_type == signal_type)
        )
        if not res.scalars().first():
            signal = RiskSignal(
                job_posting_id=job_id,
                analysis_run_id=run_id,
                signal_type=signal_type,
                severity=RiskLevel.HIGH,
                confidence=90,
                reasoning=reasoning,
                score_contribution=score
            )
            self.db.add(signal)
            
            # Update job risk score
            res_job = await self.db.execute(select(JobPosting).where(JobPosting.id == job_id))
            job = res_job.scalar_one()
            job.risk_score = min(100, (job.risk_score or 0) + score)
            from app.risk.aggregation import RiskAggregation
            job.risk_level = RiskAggregation.get_risk_level(job.risk_score)
