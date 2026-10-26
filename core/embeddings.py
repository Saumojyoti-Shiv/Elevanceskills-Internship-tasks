"""
Embedding utilities for text processing.
"""
import logging
from typing import List
from sentence_transformers import SentenceTransformer
import config

logger = logging.getLogger(__name__)

class EmbeddingManager:
    """
    Manages text embeddings and chunking.
    """
    def __init__(self, model_name: str = config.EMBEDDING_MODEL) -> None:
        """
        Initializes the EmbeddingManager with a sentence transformer model.
        
        Args:
            model_name (str): The name of the embedding model to load.
        """
        try:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Successfully loaded embedding model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model {model_name}: {e}")
            raise

    def embed_text(self, text: str) -> List[float]:
        """
        Generates an embedding for a single text string.
        
        Args:
            text (str): The text to embed.
            
        Returns:
            List[float]: The resulting embedding vector.
        """
        return self.model.encode(text).tolist()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a list of text strings.
        
        Args:
            texts (List[str]): The texts to embed.
            
        Returns:
            List[List[float]]: The resulting embedding vectors.
        """
        return self.model.encode(texts).tolist()

    def chunk_text(self, text: str, chunk_size: int = config.CHUNK_SIZE, overlap: int = config.CHUNK_OVERLAP) -> List[str]:
        """
        Splits text into overlapping chunks.
        
        Args:
            text (str): The text to chunk.
            chunk_size (int): The maximum size of each chunk.
            overlap (int): The number of characters to overlap between chunks.
            
        Returns:
            List[str]: A list of text chunks.
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunks.append(text[start:end])
            if end == text_length:
                break
            start += chunk_size - overlap
            
        return chunks
