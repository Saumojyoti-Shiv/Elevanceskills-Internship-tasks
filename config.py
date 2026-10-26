"""
Centralized configuration file for the AI chatbot project.
"""

MODEL_NAME = 'gemini-3.8-flash'
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
CHROMA_PERSIST_DIR = './chroma_db'
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K_RESULTS = 5
UPDATE_INTERVAL_HOURS = 6
SUPPORTED_SOURCE_TYPES = ['web', 'rss', 'file']
MAX_CONVERSATION_HISTORY = 20
