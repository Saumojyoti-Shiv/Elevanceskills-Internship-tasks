# 🧠 AI Knowledge Assistant — Elevanceskills Internship

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Streamlit](https://img.shields.io/badge/UI-Streamlit-FF4B4B)
![ChromaDB](https://img.shields.io/badge/VectorStore-ChromaDB-orange)
![License](https://img.shields.io/badge/License-MIT-green)

An intelligent, multi-feature AI chatbot built as part of the **Elevanceskills Internship Program**. This project implements 6 progressive tasks — from dynamic knowledge bases to multilingual support — all integrated into a single cohesive application.

> 📄 **See also**: [Roadmap & Analysis](./Roadmap%20%26%20Analysis.md) | [AI Activity Log](./AI%20Activity%20Log.md)

---

## 🌟 Features

### ✅ Task 1 — Dynamic Knowledge Base Expansion
- Ingest content from **web pages, RSS feeds, and local files**
- **Automatic periodic updates** using APScheduler
- Vector-based semantic search with **ChromaDB**
- Source management (add/remove/toggle sources from UI)
- Deduplication via content hashing
- Source citations in chatbot responses

### ✅ Task 2 — Multi-Modal AI Assistant (Text + Image)
- Upload images (JPG, PNG, WEBP) for AI-powered analysis
- **Evidence-based responses** with confidence indicators
- Structured image analysis: caption, objects, scene, text, colors
- **Contextual reasoning** across multiple turns
- Mixed text+image conversations with history
- Expandable "What I See" section showing model's observations
### 🔲 Task 3 — Medical Q&A Chatbot (MedQuAD)
### 🔲 Task 4 — Domain Expert Chatbot (arXiv Papers)
### 🔲 Task 5 — Sentiment-Aware Chatbot
### 🔲 Task 6 — Multilingual Conversational Support

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **UI** | Streamlit |
| **Vector Store** | ChromaDB |
| **Embeddings** | sentence-transformers (`all-MiniLM-L6-v2`) — runs locally |
| **LLM** | Google Gemini API (`gemini-3.8-flash`) — free tier |
| **Scraping** | BeautifulSoup4, requests, feedparser |
| **Scheduling** | APScheduler |
| **Language** | Python 3.10+ |

---

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Saumojyoti-Shiv/Elevanceskills-Internship-tasks.git
cd Elevanceskills-Internship-tasks
```

### 2. Create a Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Up Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key
2. Create a `.env` file in the project root:
```bash
GEMINI_API_KEY=your_api_key_here
```

### 5. Run the Application
```bash
streamlit run app.py
```

> 💡 **Note**: On first run, the embedding model (~90MB) will download automatically. The LLM runs via Google's Gemini API (free tier) — no GPU required, responses in seconds.

---

## 📁 Project Structure

```
Elevanceskills-Internship-tasks/
├── app.py                          # Main Streamlit application
├── config.py                       # Centralized configuration
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── Roadmap & Analysis.md           # Full technical roadmap
├── AI Activity Log.md              # AI action history with reasoning
├── Internship tasks.md             # Original task descriptions
├── core/                           # Core modules (shared across all tasks)
│   ├── __init__.py
│   ├── embeddings.py               # Embedding model wrapper
│   ├── vector_store.py             # ChromaDB interface
│   └── chatbot.py                  # LLM-based chatbot logic
├── tasks/                          # Task-specific implementations
│   └── task1_dynamic_kb/
│       ├── __init__.py
│       ├── sources.py              # Source management (dataclass + JSON persistence)
│       └── updater.py              # Web/RSS/file scraping & KB updates
├── data/                           # Datasets (gitignored for large files)
├── tests/                          # Unit tests
└── assets/                         # Screenshots, diagrams
```

---

## 📸 Screenshots

*(Screenshots will be added once the UI is running)*

---

## 📊 Google Drive (Datasets)

> _Datasets link will be added here after all tasks are completed._

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Check the [issues page](https://github.com/Saumojyoti-Shiv/Elevanceskills-Internship-tasks/issues).

---

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for the Elevanceskills Internship Program**
