import json
import os
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Optional

@dataclass
class Source:
    name: str
    url: str
    source_type: str  # 'web', 'rss', 'file'
    last_updated: Optional[str] = None
    is_active: bool = True

class SourceManager:
    def __init__(self, config_path='sources.json'):
        self.config_path = config_path
        self.sources: List[Source] = []
        
        # Load existing or create default
        if os.path.exists(self.config_path):
            self.load()
        else:
            self._init_defaults()

    def _init_defaults(self):
        """Initialize with some default demo sources."""
        self.add_source(
            name="Python Wikipedia", 
            url="https://en.wikipedia.org/wiki/Python_(programming_language)", 
            source_type="web"
        )
        self.add_source(
            name="Hacker News RSS", 
            url="https://news.ycombinator.com/rss", 
            source_type="rss"
        )
        self.save()

    def add_source(self, name: str, url: str, source_type: str) -> Source:
        """Add a new source if it doesn't exist."""
        for src in self.sources:
            if src.name == name or src.url == url:
                return src
        
        new_source = Source(name=name, url=url, source_type=source_type)
        self.sources.append(new_source)
        self.save()
        return new_source

    def remove_source(self, name: str) -> bool:
        """Remove a source by name."""
        initial_len = len(self.sources)
        self.sources = [src for src in self.sources if src.name != name]
        if len(self.sources) < initial_len:
            self.save()
            return True
        return False

    def get_all_sources(self) -> List[Source]:
        """Return all sources."""
        return self.sources

    def get_active_sources(self) -> List[Source]:
        """Return only active sources."""
        return [src for src in self.sources if src.is_active]

    def update_source_timestamp(self, name: str):
        """Mark a source as recently updated."""
        for src in self.sources:
            if src.name == name:
                src.last_updated = datetime.now().isoformat()
                self.save()
                break

    def save(self):
        """Persist sources to JSON."""
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(src) for src in self.sources], f, indent=4)

    def load(self):
        """Load sources from JSON."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.sources = [Source(**item) for item in data]
        except (json.JSONDecodeError, FileNotFoundError):
            self._init_defaults()
