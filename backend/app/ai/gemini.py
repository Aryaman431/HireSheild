import google.generativeai as genai
import json
from .provider import AIProvider
from .schemas import JobExtraction
from app.core.config import settings

class GeminiProvider(AIProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            # We don't raise an error immediately on boot so tests can mock it, 
            # but it will fail during execution if not mocked.
            pass
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def extract_job_information(self, text: str) -> JobExtraction:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")

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
        
        response = await self.model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=JobExtraction
            )
        )
        
        try:
            return JobExtraction.model_validate_json(response.text)
        except Exception as e:
            raise RuntimeError(f"Failed to parse AI response: {e}")

    async def extract_job_information_from_document(self, file_bytes: bytes, mime_type: str) -> JobExtraction:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")

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

        response = await self.model.generate_content_async(
            [prompt, document_part],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=JobExtraction
            )
        )
        
        try:
            return JobExtraction.model_validate_json(response.text)
        except Exception as e:
            raise RuntimeError(f"Failed to parse AI response: {e}")
