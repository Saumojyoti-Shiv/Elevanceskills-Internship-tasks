"""
ChromaDB wrapper for persistent vector storage.
"""
import logging
from typing import List, Dict, Any
import chromadb
import config
from .embeddings import EmbeddingManager

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Manages vector storage and semantic search operations using ChromaDB.
    """
    def __init__(self, collection_name: str, persist_dir: str = config.CHROMA_PERSIST_DIR, embedding_manager=None) -> None:
        """
        Initializes the VectorStore, loading or creating a persistent ChromaDB collection.
        
        Args:
            collection_name (str): Name of the collection.
            persist_dir (str): Directory for persistent storage.
            embedding_manager: Optional pre-loaded EmbeddingManager to avoid duplicate loading.
        """
        try:
            self.client = chromadb.PersistentClient(path=persist_dir)
            self.collection = self.client.get_or_create_collection(name=collection_name)
            if embedding_manager is not None:
                self.embedding_manager = embedding_manager
            else:
                self.embedding_manager = EmbeddingManager()
            logger.info(f"Successfully initialized VectorStore with collection: {collection_name}")
        except Exception as e:
            logger.error(f"Failed to initialize VectorStore: {e}")
            raise

    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]], ids: List[str]) -> None:
        """
        Adds documents to the vector store with deduplication by ID.
        
        Args:
            texts (List[str]): The document texts.
            metadatas (List[Dict[str, Any]]): Metadata for each document.
            ids (List[str]): Unique identifiers for the documents.
        """
        try:
            embeddings = self.embedding_manager.embed_texts(texts)
            self.collection.upsert(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Successfully added/updated {len(texts)} documents.")
        except Exception as e:
            logger.error(f"Error adding documents to VectorStore: {e}")

    def query(self, query_text: str, n_results: int = config.TOP_K_RESULTS) -> Dict[str, Any]:
        """
        Performs semantic search to retrieve the most relevant documents.
        
        Args:
            query_text (str): The search query.
            n_results (int): Number of results to return.
            
        Returns:
            Dict[str, Any]: The search results containing documents, distances, etc.
        """
        try:
            query_embedding = self.embedding_manager.embed_text(query_text)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            return results
        except Exception as e:
            logger.error(f"Error querying VectorStore: {e}")
            return {}

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Retrieves statistics about the current collection.
        
        Returns:
            Dict[str, Any]: Statistics such as total count.
        """
        try:
            count = self.collection.count()
            return {"total_documents": count}
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"total_documents": 0}

    def delete_by_source(self, source_name: str) -> None:
        """
        Removes documents originating from a specific source.
        
        Args:
            source_name (str): The source identifier to match in metadata.
        """
        try:
            self.collection.delete(where={"source": source_name})
            logger.info(f"Successfully deleted documents from source: {source_name}")
        except Exception as e:
            logger.error(f"Error deleting documents by source {source_name}: {e}")
