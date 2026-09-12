from abc import ABC, abstractmethod
from typing import List

class EmbeddingProvider(ABC):
    """
    Abstract base class for vector embedding generation.
    """
    
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """
        Takes a semantic string and returns a vector embedding.
        Must return exactly 768 dimensions for compatibility with current DB.
        """
        pass
