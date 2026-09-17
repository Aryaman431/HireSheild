from urllib.parse import urljoin, urlsplit
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.verification_check import VerificationCheck, EntityType, CheckType, CheckResult
from app.models.company import Company, VerificationStatus as CompanyVerificationStatus
from app.models.recruiter import Recruiter
from app.models.job_posting import JobPosting
from app.models.risk_signal import RiskSignal, RiskLevel
from app.risk.rules import RiskSignalType, get_signal_score
from app.risk.aggregation import RiskAggregation
import httpx
import socket
import ipaddress
import asyncio
from typing import Optional, Tuple

class SafeURLFetcher:
    MAX_REDIRECTS = 3
    MAX_RESPONSE_BYTES = 1024 * 1024
    client_factory = httpx.AsyncClient

    @staticmethod
    def _is_public_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        return ip.is_global

    @classmethod
    def _parse_url(cls, url: str):
        try:
            parsed = urlsplit(url)
            if parsed.scheme not in {"http", "https"}:
                return None, "Unsupported protocol."
            if not parsed.hostname or parsed.username or parsed.password:
                return None, "Invalid URL."
            if parsed.port is not None and not 1 <= parsed.port <= 65535:
                return None, "Invalid URL."
            return parsed, ""
        except ValueError:
            return None, "Invalid URL."

    @staticmethod
    async def is_safe_ip(hostname: str) -> bool:
        try:
            loop = asyncio.get_running_loop()
            try:
                ip = ipaddress.ip_address(hostname)
                return SafeURLFetcher._is_public_ip(ip)
            except ValueError:
                if hostname.lower() == "localhost" or hostname.lower().endswith((".localhost", ".local", ".internal")):
                    return False

            addresses = await loop.run_in_executor(
                None,
                lambda: socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM),
            )
            if not addresses:
                return False
            return all(SafeURLFetcher._is_public_ip(ipaddress.ip_address(address[4][0])) for address in addresses)
        except Exception:
            return False

    @classmethod
    async def fetch(cls, url: str) -> Tuple[Optional[httpx.Response], str]:
        """
        Safely fetch a URL with manually validated, bounded redirects.
        Returns (Response, ErrorMessage).
        """
        current_url = url
        try:
            async with cls.client_factory(timeout=5.0, follow_redirects=False) as client:
                for redirect_count in range(cls.MAX_REDIRECTS + 1):
                    parsed, parse_error = cls._parse_url(current_url)
                    if not parsed:
                        return None, parse_error
                    if not await cls.is_safe_ip(parsed.hostname):
                        return None, "Unsafe or unresolvable hostname."

                    async with client.stream("GET", current_url) as response:
                        if 300 <= response.status_code < 400:
                            location = response.headers.get("location")
                            if not location:
                                return None, "Invalid redirect target."
                            if redirect_count >= cls.MAX_REDIRECTS:
                                return None, "Too many redirects."
                            current_url = urljoin(str(response.url), location)
                            continue

                        response_size = 0
                        async for chunk in response.aiter_bytes():
                            response_size += len(chunk)
                            if response_size > cls.MAX_RESPONSE_BYTES:
                                return None, "Verification response is too large."
                        return response, ""

                return None, "Too many redirects."
        except httpx.RequestError:
            return None, "Network error while fetching URL."
        except Exception:
            return None, "Failed to fetch URL safely."

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
            parsed = urlsplit(source)
            domain = parsed.hostname
            # Remove www.
            if domain.startswith('www.'):
                domain = domain[4:]
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
        result = await self.db.execute(
            select(JobPosting)
            .options(selectinload(JobPosting.analysis_runs))
            .where(JobPosting.id == job_id)
        )
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

                    if any(
                        check.check_type == CheckType.COMPANY_DOMAIN and check.result == CheckResult.VERIFIED
                        for check in comp_checks
                    ):
                        await self._inject_risk_signal(
                            job.id,
                            job.analysis_runs[0].id if job.analysis_runs else None,
                            RiskSignalType.VERIFIED_COMPANY_DOMAIN,
                            reasoning="The company domain was reachable and verified over HTTPS or HTTP.",
                        )
                
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
                            "Recruiter email domain does not match company domain."
                        )
                    elif has_verified:
                        recruiter.verification_status = CompanyVerificationStatus.VERIFIED
                        await self._inject_risk_signal(
                            job.id,
                            job.analysis_runs[0].id if job.analysis_runs else None,
                            RiskSignalType.VERIFIED_RECRUITER,
                            reasoning="The recruiter email domain matches the company's known domain.",
                        )
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
                        "Application URL is unreachable, unsafe, or redirects unexpectedly."
                    )

                if (
                    any(c.result == CheckResult.VERIFIED for c in app_checks)
                    and company
                    and self.extract_domain(job.source_url) == self.extract_domain(company.official_domain)
                ):
                    await self._inject_risk_signal(
                        job.id,
                        job.analysis_runs[0].id if job.analysis_runs else None,
                        RiskSignalType.VERIFIED_OFFICIAL_JOB,
                        "The application URL is reachable and matches the company's known domain.",
                    )

        if company:
            company_jobs = await self.db.execute(select(JobPosting).where(JobPosting.company_id == company.id))
            company.risk_score, company.risk_level = RiskAggregation.calculate_company_risk(company_jobs.scalars().all())
        if recruiter:
            recruiter_jobs = await self.db.execute(select(JobPosting).where(JobPosting.recruiter_id == recruiter.id))
            recruiter.risk_score, _ = RiskAggregation.calculate_recruiter_risk(recruiter_jobs.scalars().all())
                    
        await self.db.commit()

    async def _inject_risk_signal(self, job_id: str, run_id: str, signal_type: RiskSignalType, reasoning: str):
        # Check if already exists to avoid double counting
        signal_value = getattr(signal_type, "value", signal_type)
        res = await self.db.execute(
            select(RiskSignal).where(RiskSignal.job_posting_id == job_id).where(RiskSignal.signal_type == signal_value)
        )
        if not res.scalars().first():
            score = get_signal_score(signal_value)
            signal = RiskSignal(
                job_posting_id=job_id,
                analysis_run_id=run_id,
                signal_type=signal_value,
                severity=RiskAggregation.get_risk_level(max(0, min(100, score))),
                confidence=90,
                reasoning=reasoning,
                score_contribution=score
            )
            self.db.add(signal)
            
            # Update job risk score
            res_job = await self.db.execute(select(JobPosting).where(JobPosting.id == job_id))
            job = res_job.scalar_one()
            job.risk_score = max(0, min(100, (job.risk_score or 0) + score))
            job.risk_level = RiskAggregation.get_risk_level(job.risk_score)
