import google.generativeai as genai
from typing import List
import asyncio
from app.core.config import settings
from .provider import EmbeddingProvider

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = "models/text-embedding-004"
        self.dimension = 768

    async def embed_text(self, text: str) -> List[float]:
        """
        Embeds text using Gemini.
        """
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is missing.")

        def _embed():
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']

        # Run synchronous SDK call in threadpool
        vector = await asyncio.to_thread(_embed)
        
        if len(vector) != self.dimension:
            raise ValueError(f"Vector dimension mismatch. Expected {self.dimension}, got {len(vector)}")
            
        return vector
