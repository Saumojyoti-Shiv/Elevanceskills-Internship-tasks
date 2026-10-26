import hashlib
import os
from datetime import datetime
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup
import feedparser

from core.embeddings import EmbeddingManager
from core.vector_store import VectorStore
from tasks.task1_dynamic_kb.sources import Source, SourceManager


class KnowledgeBaseUpdater:
    def __init__(self, vector_store: VectorStore, source_manager: SourceManager, embedding_manager: EmbeddingManager):
        self.vector_store = vector_store
        self.source_manager = source_manager
        self.embedding_manager = embedding_manager
        self._log: List[Dict[str, Any]] = []

    def fetch_web_content(self, url: str) -> str:
        """Scrape text from web page using requests and BeautifulSoup."""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            # Remove scripts and styles
            for script in soup(["script", "style"]):
                script.extract()
            text = soup.get_text(separator=' ', strip=True)
            return text
        except Exception as e:
            print(f"Error fetching web content from {url}: {e}")
            return ""

    def fetch_rss_content(self, url: str) -> List[Dict[str, str]]:
        """Parse RSS feed and return list of items."""
        try:
            feed = feedparser.parse(url)
            items = []
            for entry in feed.entries:
                content = entry.get('description', entry.get('summary', ''))
                items.append({
                    'title': entry.get('title', ''),
                    'content': BeautifulSoup(content, 'html.parser').get_text(separator=' ', strip=True),
                    'link': entry.get('link', '')
                })
            return items
        except Exception as e:
            print(f"Error fetching RSS content from {url}: {e}")
            return []

    def fetch_file_content(self, path: str) -> str:
        """Read local file content."""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {path}: {e}")
            return ""

    def compute_content_hash(self, text: str) -> str:
        """Compute SHA256 hash for deduplication."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def update_source(self, source: Source) -> Dict[str, Any]:
        """Fetch, chunk, embed, store source content."""
        stats = {"source": source.name, "new_chunks": 0, "skipped_duplicates": 0, "status": "success"}
        
        try:
            if source.source_type == 'web':
                content = self.fetch_web_content(source.url)
                if content:
                    self._process_content(content, source, stats, url=source.url)
            
            elif source.source_type == 'rss':
                items = self.fetch_rss_content(source.url)
                for item in items:
                    full_text = f"{item['title']}\n\n{item['content']}"
                    self._process_content(full_text, source, stats, url=item['link'])
            
            elif source.source_type == 'file':
                content = self.fetch_file_content(source.url)
                if content:
                    self._process_content(content, source, stats, url=source.url)
            
            self.source_manager.update_source_timestamp(source.name)
            
        except Exception as e:
            stats["status"] = "error"
            stats["error"] = str(e)
            
        self._log.append({
            "timestamp": datetime.now().isoformat(),
            "source": source.name,
            "stats": stats
        })
        return stats

    def _process_content(self, text: str, source: Source, stats: Dict[str, Any], url: str):
        """Helper to chunk and store text in the vector database."""
        # Use EmbeddingManager's chunking (respects config.CHUNK_SIZE and CHUNK_OVERLAP)
        chunks = self.embedding_manager.chunk_text(text)
        
        texts_to_add = []
        metadatas_to_add = []
        ids_to_add = []
        
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
                
            chunk_hash = self.compute_content_hash(chunk)
            chunk_id = f"{source.name}_{chunk_hash[:16]}_{i}"
            
            metadata = {
                "source": source.name,
                "url": url,
                "type": source.source_type,
                "hash": chunk_hash,
                "ingested_at": datetime.now().isoformat()
            }
            
            texts_to_add.append(chunk)
            metadatas_to_add.append(metadata)
            ids_to_add.append(chunk_id)
        
        if texts_to_add:
            try:
                # VectorStore.add_documents handles embedding internally
                self.vector_store.add_documents(
                    texts=texts_to_add,
                    metadatas=metadatas_to_add,
                    ids=ids_to_add
                )
                stats["new_chunks"] += len(texts_to_add)
            except Exception as e:
                print(f"Error storing chunks for {source.name}: {e}")
                stats["status"] = "partial_error"

    def update_all_sources(self) -> Dict[str, Any]:
        """Update all active sources."""
        active_sources = self.source_manager.get_active_sources()
        aggregate_stats = {"total_new_chunks": 0, "total_skipped": 0, "sources_updated": 0}
        
        for source in active_sources:
            stats = self.update_source(source)
            if stats["status"] == "success":
                aggregate_stats["total_new_chunks"] += stats["new_chunks"]
                aggregate_stats["total_skipped"] += stats["skipped_duplicates"]
                aggregate_stats["sources_updated"] += 1
                
        self._log.append({
            "timestamp": datetime.now().isoformat(),
            "type": "aggregate",
            "stats": aggregate_stats
        })
        return aggregate_stats

    def get_update_log(self) -> List[Dict[str, Any]]:
        """Return history of updates."""
        return self._log
