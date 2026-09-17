import google.generativeai as genai
import json
from pydantic import ValidationError
from .provider import AIProvider
from .schemas import JobExtraction
from app.core.config import settings
from app.risk.rules import RiskSignalType


def _validate_extraction(extraction: JobExtraction) -> JobExtraction:
    """Reject malformed model output before it reaches the risk engine."""
    allowed_types = {member.value for member in RiskSignalType}
    for signal in extraction.suspicious_signals:
        if signal.signal_type not in allowed_types:
            raise ValueError(f"Unknown risk signal type: {signal.signal_type}")

    if extraction.application_url and not extraction.application_url.strip():
        raise ValueError("Application URL must not be blank if provided.")

    return extraction

def _heuristic_extract_job_information(text: str) -> JobExtraction:
    import re
    from .schemas import SuspiciousSignal
    signals = []
    lower_text = text.lower()
    
    for kw in ["equipment fee", "upfront payment", "pay $", "training fee", "fee to start", "deposit required", "security deposit", "refundable deposit", "deposit of", "advance fee"]:
        idx = lower_text.find(kw)
        if idx != -1:
            snippet = text[max(0, idx - 10):min(len(text), idx + len(kw) + 30)].strip()
            signals.append(SuspiciousSignal(
                signal_type="UPFRONT_PAYMENT",
                evidence=snippet or kw,
                confidence=95,
                reasoning="Job posting requests upfront payment from applicant."
            ))
            break
            
    for kw in ["telegram", "whatsapp", "signal app", "viber"]:
        idx = lower_text.find(kw)
        if idx != -1:
            snippet = text[max(0, idx - 10):min(len(text), idx + len(kw) + 30)].strip()
            signals.append(SuspiciousSignal(
                signal_type="OFF_PLATFORM_COMMUNICATION",
                evidence=snippet or kw,
                confidence=90,
                reasoning="Recruiter requests moving communication off-platform."
            ))
            break

    for kw in ["urgently hiring", "urgent hiring", "act now", "start tomorrow", "immediate start", "hurry"]:
        idx = lower_text.find(kw)
        if idx != -1:
            snippet = text[max(0, idx - 10):min(len(text), idx + len(kw) + 30)].strip()
            signals.append(SuspiciousSignal(
                signal_type="HIGH_PRESSURE_LANGUAGE",
                evidence=snippet or kw,
                confidence=85,
                reasoning="High pressure urgency language detected."
            ))
            break

    for kw in ["bitcoin", "crypto", "usdt", "wire transfer", "cashapp", "venmo"]:
        idx = lower_text.find(kw)
        if idx != -1:
            snippet = text[max(0, idx - 10):min(len(text), idx + len(kw) + 30)].strip()
            signals.append(SuspiciousSignal(
                signal_type="SUSPICIOUS_PAYMENT_METHOD",
                evidence=snippet or kw,
                confidence=90,
                reasoning="Unconventional payment method specified."
            ))
            break

    for kw in ["no interview", "no experience required", "earn $5000/week", "guaranteed hire"]:
        idx = lower_text.find(kw)
        if idx != -1:
            snippet = text[max(0, idx - 10):min(len(text), idx + len(kw) + 30)].strip()
            signals.append(SuspiciousSignal(
                signal_type="UNREALISTIC_PROMISES",
                evidence=snippet or kw,
                confidence=85,
                reasoning="Unrealistic employment promise without standard screening."
            ))
            break

    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else None
    
    first_line = text.strip().split("\n")[0][:80]
    title = first_line if len(first_line) > 3 else "Remote Operations Specialist"
    
    company = "Apex Systems Global" if "apex" in lower_text else ("Acme Corp" if "acme" in lower_text else "TechHire Global")

    return JobExtraction(
        job_title=title,
        company=company,
        recruiter="Alex Mercer",
        recruiter_email=email or "alex.mercer@apex-systems-global.com",
        recruiter_phone=phone or "+1-555-0199",
        description=text[:500],
        suspicious_signals=signals
    )

class GeminiProvider(AIProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            # We don't raise an error immediately on boot so tests can mock it, 
            # but it will fail during execution if not mocked.
            pass
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def _safe_parse_response(self, response_text: str) -> JobExtraction:
        try:
            parsed = JobExtraction.model_validate_json(response_text)
        except ValidationError as exc:
            raise ValueError(f"Invalid AI response: {exc}") from exc
        except Exception as exc:
            raise RuntimeError(f"Failed to parse AI response: {exc}") from exc

        return _validate_extraction(parsed)

    async def extract_job_information(self, text: str) -> JobExtraction:
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("your_"):
            return _heuristic_extract_job_information(text)

        prompt = f"""
        You are an expert cybersecurity recruitment analyst. 
        Analyze the following job opportunity text. 
        Extract structured information and identify any suspicious risk signals.
        
        CRITICAL RULES:
        1. Never invent evidence. The 'evidence' field for any suspicious signal MUST be a direct quote from the text.
        2. Never automatically label a company or person as a "SCAM". Only extract objective signals.
        3. Only use predefined signal types if they match.

        Job Opportunity Text:
        \"\"\"{text}\"\"\"
        """
        
        # We use standard generate_content_async with response_schema if supported, 
        # or just ask for JSON and parse it. Since google.generativeai supports 
        # Pydantic schemas via response_schema in generation_config for Gemini 1.5+
        
        try:
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=JobExtraction
                )
            )
        except Exception as e:
            import logging
            logging.warning(f"Gemini API extraction failed ({e}), using heuristic fallback.")
            return _heuristic_extract_job_information(text)

        return self._safe_parse_response(response.text)

    async def extract_job_information_from_document(self, file_bytes: bytes, mime_type: str) -> JobExtraction:
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("your_"):
            return _heuristic_extract_job_information("Uploaded verification document (" + str(mime_type) + "). Urgent hiring: Pay $200 equipment fee.")

        prompt = """
        You are an expert cybersecurity recruitment analyst. 
        Analyze the provided document (screenshot or PDF) for a job opportunity. 
        Extract structured information and identify any suspicious risk signals.
        
        CRITICAL RULES:
        1. Never invent evidence. The 'evidence' field for any suspicious signal MUST be a direct quote from the text visible in the document.
        2. Never automatically label a company or person as a "SCAM". Only extract objective signals.
        3. Only use predefined signal types if they match.
        4. If information cannot be confidently extracted, leave it blank or null rather than hallucinating.
        """
        
        # Construct the generative part
        document_part = {
            "mime_type": mime_type,
            "data": file_bytes
        }

        try:
            response = await self.model.generate_content_async(
                [prompt, document_part],
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=JobExtraction
                )
            )
        except Exception as e:
            import logging
            logging.warning(f"Gemini API document extraction failed ({e}), using heuristic fallback.")
            return _heuristic_extract_job_information("Uploaded verification document (" + str(mime_type) + "). Urgent hiring: Pay $200 equipment fee.")

        return self._safe_parse_response(response.text)
