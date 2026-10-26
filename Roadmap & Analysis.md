# 🗺️ Elevanceskills Internship — Complete Roadmap & Technical Analysis

> **Purpose**: This document is a detailed, step-by-step guide for building all 6 internship tasks. It serves as a roadmap that any developer or AI assistant can follow to implement each task accurately.

> **🔗 Quick Links:**
> - **GitHub Repository**: https://github.com/Saumojyoti-Shiv/Elevanceskills-Internship-tasks
> - **AI Activity Log**: See [AI Activity Log.md](./AI%20Activity%20Log.md) — tracks every action taken by AI assistants with reasoning. **Read this first** if you're a new AI picking up this project.
> - **Google Drive (Datasets)**: _To be added after all tasks are complete._ Large datasets (MedQuAD, arXiv) will be hosted on Google Drive and linked here.

---

## 📌 Global Context & Constraints

| Constraint | Detail |
|---|---|
| **Build Model** | All tasks are **extensions** of the same training project (chatbot). **No new unrelated projects.** |
| **Hosting** | Everything must be on **GitHub** with a clear README. |
| **UI Framework** | **Streamlit** (explicitly required for Tasks 3 & 4; we'll use it for all tasks for consistency). |
| **LLM Strategy** | Use **open-source LLMs** (e.g., Mistral, Phi, LLaMA) via HuggingFace or Ollama. |
| **Embeddings** | Sentence-Transformers (`all-MiniLM-L6-v2` or `all-mpnet-base-v2`). |
| **Vector DB** | **ChromaDB** (lightweight, Python-native, easy to set up). |
| **Language** | **Python 3.10+** |
| **Delivery** | 6 tasks, submitted one by one on GitHub. |

---

## 🛠️ Unified Tech Stack

Below is the **single tech stack** that will power all six tasks. Each task adds features on top of this base.

### Core Dependencies

| Category | Library / Tool | Purpose |
|---|---|---|
| **UI** | `streamlit` | Web-based chat interface for all tasks |
| **LLM** | `transformers`, `torch`, `accelerate` | Load and run open-source LLMs (Mistral-7B / Phi-3 / LLaMA) |
| **LLM (Alternative)** | `ollama` (local) or `langchain` | Simpler LLM orchestration if GPU is limited |
| **Embeddings** | `sentence-transformers` | Convert text to vector embeddings |
| **Vector Database** | `chromadb` | Store and retrieve document embeddings |
| **Image Understanding** | `transformers` (LLaVA / BLIP-2) or `Pillow` | Multi-modal (Task 2) |
| **NLP / NER** | `spacy`, `scispacy` | Medical entity recognition (Task 3) |
| **Sentiment Analysis** | `transformers` pipeline (`sentiment-analysis`) or `TextBlob` | Detect emotions (Task 5) |
| **Language Detection** | `langdetect` or `lingua-py` | Auto-detect language (Task 6) |
| **Translation** | `argostranslate` or `Helsinki-NLP/opus-mt-*` models | Multilingual support (Task 6) |
| **Data Handling** | `pandas`, `datasets` | Load and process MedQuAD / arXiv datasets |
| **Scheduling** | `APScheduler` or `schedule` | Periodic knowledge base updates (Task 1) |
| **Visualization** | `matplotlib`, `plotly` | Concept visualization (Task 4) |

### Project Structure (Final)

```
Elevanceskills Internship tasks/
├── README.md                       # Main README with project overview
├── Internship tasks.md             # Original task descriptions
├── Roadmap & Analysis.md           # THIS FILE — the roadmap
├── requirements.txt                # All Python dependencies
├── app.py                          # Main Streamlit entry point
├── config.py                       # Centralized configuration
├── core/
│   ├── __init__.py
│   ├── chatbot.py                  # Base chatbot logic (LLM + memory)
│   ├── embeddings.py               # Embedding generation utilities
│   └── vector_store.py             # ChromaDB wrapper
├── tasks/
│   ├── __init__.py
│   ├── task1_dynamic_kb/           # Dynamic Knowledge Base
│   │   ├── __init__.py
│   │   ├── updater.py              # Scheduled data ingestion
│   │   └── sources.py              # Source management (RSS, web, docs)
│   ├── task2_multimodal/           # Multi-Modal Assistant
│   │   ├── __init__.py
│   │   ├── image_analyzer.py       # Image understanding (BLIP/LLaVA)
│   │   └── multimodal_chat.py      # Combined text+image reasoning
│   ├── task3_medical/              # Medical Q&A
│   │   ├── __init__.py
│   │   ├── medquad_loader.py       # MedQuAD dataset loader
│   │   ├── medical_ner.py          # Medical entity recognition
│   │   └── medical_chat.py         # Medical Q&A chat logic
│   ├── task4_domain_expert/        # Domain Expert (arXiv)
│   │   ├── __init__.py
│   │   ├── arxiv_loader.py         # arXiv dataset processing
│   │   ├── summarizer.py           # Paper summarization
│   │   └── expert_chat.py          # Domain expert chat logic
│   ├── task5_sentiment/            # Sentiment-Aware Chatbot
│   │   ├── __init__.py
│   │   ├── sentiment_detector.py   # Sentiment analysis pipeline
│   │   └── adaptive_responses.py   # Sentiment-adapted response generation
│   └── task6_multilingual/         # Multilingual Support
│       ├── __init__.py
│       ├── language_detector.py    # Auto language detection
│       ├── translator.py           # Translation layer
│       └── multilingual_chat.py    # Cross-lingual conversation manager
├── data/                           # Raw and processed data (gitignored for large files)
│   ├── medquad/
│   └── arxiv/
├── tests/                          # Unit tests for each task
└── assets/                         # Screenshots, diagrams for README
```

---

## 📋 Task-by-Task Implementation Guide

---

## Task 1: Dynamic Knowledge Base Expansion

### 🎯 Objective
Build a system that **automatically and periodically** updates the chatbot's vector database with new information from specified sources.

### 📦 What We Use
| Component | Tool | Why |
|---|---|---|
| Vector DB | ChromaDB | Easy to add/delete/update documents dynamically |
| Embeddings | `sentence-transformers` | Fast, accurate text embeddings |
| Scheduler | `APScheduler` | Schedule periodic ingestion jobs |
| Data Sources | RSS feeds, web pages, local files | Diverse source types |
| Web Scraping | `requests` + `BeautifulSoup` | Extract text from web sources |

### 🔧 Step-by-Step Implementation

1. **Set up ChromaDB collection**
   - Create a persistent ChromaDB collection with metadata tracking (source URL, ingestion timestamp, document hash).
   - Use `all-MiniLM-L6-v2` for embeddings.

2. **Build the Source Manager (`sources.py`)**
   - Define a `Source` dataclass: `{name, url, type: "rss"|"web"|"file", last_updated}`.
   - Maintain a JSON/YAML config listing all sources.
   - Support adding/removing sources from the Streamlit UI.

3. **Build the Updater (`updater.py`)**
   - `fetch_new_content(source)` → scrape or parse content from each source.
   - `chunk_content(text, chunk_size=500, overlap=50)` → split into overlapping chunks.
   - `compute_hash(chunk)` → avoid re-ingesting duplicate content.
   - `upsert_to_vectordb(chunks, metadata)` → add new chunks to ChromaDB.

4. **Schedule periodic updates**
   - Use `APScheduler` with a `BackgroundScheduler`.
   - Default interval: every 6 hours (configurable from UI).
   - Log each update cycle: number of new chunks added, sources processed.

5. **Integrate with chatbot**
   - When user asks a question → query ChromaDB → pass top-k results as context to LLM.
   - Show source attribution in responses (which source, when ingested).

6. **Streamlit UI elements**
   - Sidebar: List of sources, add/remove source form.
   - Status indicator: Last update time, next scheduled update.
   - Manual "Update Now" button.
   - Chat interface with source citations.

### ✅ Expected Outcome
A chatbot that **automatically incorporates new information** into its responses over time, with visible proof of dynamic updates.

### 📊 Evaluation Checklist
- [ ] ChromaDB persists across restarts
- [ ] New sources can be added via UI
- [ ] Scheduler runs periodically and ingests new data
- [ ] Duplicate content is detected and skipped
- [ ] Chatbot responses include source attribution
- [ ] Update logs are visible in UI

---

## Task 2: Multi-Modal AI Assistant (Text + Image)

### 🎯 Objective
Build an assistant that understands **both text and images**, maintains conversational context, and generates evidence-based responses with reasoning.

### 📦 What We Use
| Component | Tool | Why |
|---|---|---|
| Image Model | BLIP-2 (`Salesforce/blip2-opt-2.7b`) or LLaVA | Image captioning + visual Q&A |
| Text LLM | Mistral-7B / Phi-3 | Text reasoning and response generation |
| Image Processing | `Pillow`, `torchvision` | Image loading and preprocessing |
| Context Memory | Python list / LangChain memory | Maintain multi-turn context |

### 🔧 Step-by-Step Implementation

1. **Set up the Image Analyzer (`image_analyzer.py`)**
   - Load BLIP-2 model for image captioning.
   - `analyze_image(image) → {caption, objects, text_in_image, scene_description}`.
   - Extract: objects detected, scene type, text (OCR if needed), colors, spatial relationships.

2. **Build contextual reasoning (`multimodal_chat.py`)**
   - Maintain a conversation history: `[{role, content, image_analysis?, timestamp}]`.
   - When image is uploaded: run image analyzer → store analysis in context.
   - When text query follows: combine image analysis + text query + history → send to LLM.
   - **Ambiguity handling**: If the query is vague, ask clarifying questions before responding.
   - **Response validation**: Cross-check generated response against image analysis facts.

3. **Implement evidence-based responses**
   - Structure responses with: `[Answer] + [Evidence from image] + [Confidence level]`.
   - Show what the model "sees" in the image (display extracted info in expandable section).

4. **Contextual reasoning across turns**
   - User uploads image → asks "What's this?" → then asks "How much does it cost?" → bot must remember the image context.
   - Implement sliding window memory (last N turns).

5. **Streamlit UI elements**
   - File uploader for images (jpg, png, webp).
   - Image preview with analysis overlay.
   - Chat interface supporting mixed text + image messages.
   - Expandable "What I see" section showing model's image analysis.
   - Confidence indicator on responses.

### ✅ Expected Outcome
An assistant that can **analyze images, reason about them contextually, handle ambiguity, and validate its responses** — not just a simple image captioner.

### 📊 Evaluation Checklist
- [ ] Correctly describes uploaded images
- [ ] Maintains context across multiple turns
- [ ] Handles ambiguous queries with clarifying questions
- [ ] Shows evidence/reasoning behind responses
- [ ] Supports mixed text+image conversations
- [ ] Response validation is visible to user

---

## Task 3: Medical Q&A Chatbot (MedQuAD)

### 🎯 Objective
Build a medical question-answering chatbot using the **MedQuAD dataset** with retrieval-based answers and medical entity recognition.

### 📦 What We Use
| Component | Tool | Why |
|---|---|---|
| Dataset | MedQuAD (XML files from GitHub) | Curated medical Q&A pairs |
| NER | `spacy` + `scispacy` (`en_core_sci_sm`) | Recognize diseases, symptoms, treatments |
| Retrieval | ChromaDB + sentence-transformers | Find relevant Q&A pairs |
| LLM | Mistral-7B / Phi-3 | Generate natural responses from retrieved context |
| UI | Streamlit | Simple medical Q&A interface |

### 🔧 Step-by-Step Implementation

1. **Download and parse MedQuAD (`medquad_loader.py`)**
   - Clone the MedQuAD repo: `https://github.com/abachaa/MedQuAD`.
   - Parse XML files → extract Q&A pairs with metadata (source, category, focus area).
   - Expected: ~47,000+ Q&A pairs across 12+ medical sources.
   - Store parsed data as structured JSON/DataFrame.

2. **Build the retrieval index**
   - Embed all questions using sentence-transformers.
   - Store in ChromaDB with metadata: `{question, answer, source, category, focus}`.
   - Index by question text for semantic search.

3. **Implement Medical NER (`medical_ner.py`)**
   - Load scispacy model: `en_core_sci_sm` or `en_core_sci_md`.
   - `extract_medical_entities(text) → {diseases: [], symptoms: [], treatments: [], drugs: []}`.
   - Highlight recognized entities in the UI.

4. **Build the Medical Chat Logic (`medical_chat.py`)**
   - User asks question → extract entities → semantic search ChromaDB → retrieve top-5 matches.
   - Pass retrieved Q&A pairs as context to LLM → generate a coherent response.
   - Include **disclaimer**: "This is for informational purposes only. Consult a healthcare professional."

5. **Streamlit UI elements**
   - Clean medical-themed interface (use medical icons, calming colors).
   - Entity highlighting in user queries (color-coded: diseases=red, symptoms=orange, treatments=green).
   - Source attribution showing which MedQuAD source provided the answer.
   - Sidebar with category filters (e.g., Cancer, Genetic Diseases, Drug Info).
   - Medical disclaimer banner.

### ✅ Expected Outcome
A chatbot that accurately answers medical questions using MedQuAD data, recognizes medical entities, and shows source attribution.

### 📊 Evaluation Checklist
- [ ] MedQuAD dataset is fully parsed and indexed
- [ ] Semantic search returns relevant Q&A pairs
- [ ] Medical entities are correctly identified and highlighted
- [ ] Responses cite their source within MedQuAD
- [ ] Disclaimer is always visible
- [ ] Category filtering works

---

## Task 4: Domain Expert Chatbot (arXiv Papers)

### 🎯 Objective
Build a chatbot that serves as a **scientific domain expert**, capable of searching papers, summarizing research, and explaining complex concepts.

### 📦 What We Use
| Component | Tool | Why |
|---|---|---|
| Dataset | arXiv dataset (Kaggle — CS subset) | Scientific paper metadata + abstracts |
| Summarization | LLM (Mistral/Phi) or `transformers` summarization pipeline | Condense papers |
| Visualization | `plotly`, `matplotlib`, `wordcloud` | Concept maps, topic trends |
| Retrieval | ChromaDB + sentence-transformers | Semantic paper search |
| UI | Streamlit | Paper search + chat + visualization |

### 🔧 Step-by-Step Implementation

1. **Download and process arXiv dataset (`arxiv_loader.py`)**
   - Download from Kaggle: `Cornell-University/arxiv` (JSON lines format).
   - **Filter to CS subset** (categories starting with `cs.`).
   - Extract: `{id, title, abstract, authors, categories, update_date}`.
   - Limit to recent papers (e.g., last 5 years) to keep dataset manageable.

2. **Build the search index**
   - Embed paper abstracts using sentence-transformers.
   - Store in ChromaDB with full metadata.
   - Support both semantic search and keyword filtering.

3. **Implement Summarization (`summarizer.py`)**
   - `summarize_paper(abstract, title) → concise summary`.
   - `explain_concept(concept, context) → simplified explanation`.
   - Use the LLM with specific prompts for summarization vs. explanation.

4. **Build the Expert Chat (`expert_chat.py`)**
   - User asks a question → search for relevant papers → retrieve top-5.
   - Generate response using paper abstracts as context.
   - Support follow-up questions about specific papers.
   - Handle: "Explain [concept]", "Summarize [paper]", "What's the latest research on [topic]?"

5. **Concept Visualization**
   - **Topic distribution**: Bar chart of paper categories.
   - **Word cloud**: Key terms from retrieved papers.
   - **Timeline**: Research trend over years for a given topic.
   - **Citation network** (simplified): Related papers graph using `plotly`.

6. **Streamlit UI elements**
   - Search bar with filters (category, year range, author).
   - Paper cards showing: title, authors, abstract preview, categories.
   - Chat interface for asking questions about papers.
   - Visualization tab with interactive charts.
   - "Explain this simply" button on each paper card.

### ✅ Expected Outcome
A chatbot that discusses advanced CS topics, provides paper summaries, explains complex concepts, handles follow-ups, and visualizes research trends.

### 📊 Evaluation Checklist
- [ ] arXiv CS subset is loaded and indexed
- [ ] Semantic paper search returns relevant results
- [ ] Paper summaries are concise and accurate
- [ ] Concept explanations are clear and accessible
- [ ] Follow-up questions maintain context
- [ ] Visualizations are interactive and informative
- [ ] Category/year filtering works

---

## Task 5: Sentiment-Aware Chatbot

### 🎯 Objective
Integrate **sentiment analysis** so the chatbot detects user emotions and responds appropriately.

### 📦 What We Use
| Component | Tool | Why |
|---|---|---|
| Sentiment Model | `transformers` pipeline (`distilbert-base-uncased-finetuned-sst-2-english`) or `cardiffnlp/twitter-roberta-base-sentiment-latest` | Accurate sentiment classification |
| Emotion Detection | `j-hartmann/emotion-english-distilroberta-base` | Fine-grained emotions (joy, anger, sadness, etc.) |
| Response Adaptation | Prompt engineering with LLM | Adjust tone based on sentiment |
| UI | Streamlit | Visual sentiment indicators |

### 🔧 Step-by-Step Implementation

1. **Set up Sentiment Detection (`sentiment_detector.py`)**
   - Load sentiment pipeline: classify as `positive`, `negative`, `neutral`.
   - Optionally load emotion model: classify as `joy`, `anger`, `sadness`, `fear`, `surprise`, `disgust`.
   - `analyze_sentiment(text) → {label, score, emotions: [{label, score}]}`.

2. **Build Adaptive Response System (`adaptive_responses.py`)**
   - Define response strategies per sentiment:
     - **Positive**: Match enthusiasm, encourage, reinforce.
     - **Negative**: Show empathy, offer help, de-escalate.
     - **Neutral**: Be informative and professional.
     - **Frustrated/Angry**: Acknowledge frustration, apologize if needed, offer solutions.
     - **Sad**: Be gentle, supportive, compassionate.
   - Inject sentiment-aware instructions into the LLM prompt.

3. **Integrate with the base chatbot**
   - Before generating a response: analyze user message sentiment.
   - Modify the system prompt dynamically based on detected sentiment.
   - Track sentiment over the conversation to detect trends (e.g., user becoming frustrated).

4. **Sentiment tracking and analytics**
   - Maintain a list of sentiment scores per message.
   - Detect sentiment shifts (e.g., positive → negative = something went wrong).
   - Trigger special handling for sustained negative sentiment.

5. **Streamlit UI elements**
   - Emoji indicator next to each user message (😊 😐 😞 😡).
   - Sentiment score badge (e.g., "Positive 92%").
   - Conversation sentiment timeline chart.
   - Sidebar showing overall conversation mood.
   - Response tone indicator (showing how the bot adapted).

### ✅ Expected Outcome
A chatbot that recognizes user emotions and adjusts its tone accordingly, with visible sentiment tracking.

### 📊 Evaluation Checklist
- [ ] Sentiment is correctly detected (positive/negative/neutral)
- [ ] Bot tone changes based on detected sentiment
- [ ] Empathetic responses for negative sentiment
- [ ] Sentiment indicators visible in UI
- [ ] Conversation sentiment trend is tracked
- [ ] Sustained negative sentiment triggers special handling

---

## Task 6: Multilingual Conversational Support

### 🎯 Objective
Extend the chatbot to support **3+ additional languages**, with automatic language detection, mid-conversation language switching, and context preservation.

### 📦 What We Use
| Component | Tool | Why |
|---|---|---|
| Language Detection | `lingua-py` or `langdetect` | Identify input language |
| Translation | `Helsinki-NLP/opus-mt-*` models (HuggingFace) or `argostranslate` | Translate between languages |
| Languages | Hindi, Spanish, French (+ English = 4 total) | 3 additional languages as required |
| Context Memory | Unified conversation history | Preserve context across language switches |

### 🔧 Step-by-Step Implementation

1. **Set up Language Detection (`language_detector.py`)**
   - Use `lingua-py` (more accurate) or `langdetect`.
   - `detect_language(text) → {language_code, language_name, confidence}`.
   - Handle mixed-language inputs (e.g., "Can you tell me about मधुमेह?").

2. **Build Translation Layer (`translator.py`)**
   - Load Helsinki-NLP OPUS-MT models for each language pair:
     - `en→hi`, `hi→en` (Hindi)
     - `en→es`, `es→en` (Spanish)
     - `en→fr`, `fr→en` (French)
   - `translate(text, source_lang, target_lang) → translated_text`.
   - Cache translations to avoid redundant model calls.

3. **Build Multilingual Chat Manager (`multilingual_chat.py`)**
   - **Strategy**: Translate user input to English → process with LLM → translate response back to user's language.
   - Maintain a **unified context** in English internally.
   - When user switches language mid-conversation:
     - Detect the new language.
     - Continue the conversation seamlessly.
     - Translate the response to the new language.
   - Handle **ambiguous queries** across languages (e.g., words that exist in multiple languages).

4. **Cross-lingual reasoning**
   - If user asks in Hindi about a concept discussed earlier in English → retrieve from context → respond in Hindi.
   - Maintain entity consistency across languages (e.g., "diabetes" = "मधुमेह" = "diabetes" (Spanish) = "diabète" (French)).

5. **Streamlit UI elements**
   - Language indicator badge on each message (🇺🇸 🇮🇳 🇪🇸 🇫🇷).
   - Language selector dropdown (optional manual override).
   - Auto-detection indicator with confidence.
   - "Show original" toggle to see untranslated text.
   - Sidebar showing conversation language history.

### ✅ Expected Outcome
A chatbot that seamlessly handles multilingual conversations with context preservation across language switches.

### 📊 Evaluation Checklist
- [ ] Auto-detects language correctly
- [ ] Supports at least 3 additional languages (Hindi, Spanish, French)
- [ ] Translates user input and bot response accurately
- [ ] Context is preserved across language switches
- [ ] Mixed-language input is handled
- [ ] Language indicators visible in UI
- [ ] Entity consistency across languages

---

## 🚀 Implementation Order & Dependencies

### Recommended Build Order

| Order | Task | Reason |
|---|---|---|
| **0** | **Core Setup** | Set up the base chatbot, ChromaDB, embeddings, and Streamlit shell. Everything builds on this. |
| **1** | Task 1 — Dynamic KB | Establishes the vector DB pipeline. All other tasks reuse this. |
| **2** | Task 3 — Medical Q&A | Straightforward retrieval task. Validates the core pipeline works. |
| **3** | Task 4 — arXiv Expert | Similar to Task 3 but with summarization + visualization added. |
| **4** | Task 2 — Multi-Modal | Adds image understanding. Needs the context/memory system from Task 1. |
| **5** | Task 5 — Sentiment | Adds a sentiment layer on top of the existing chatbot. Can be integrated last. |
| **6** | Task 6 — Multilingual | Wraps the entire chatbot with translation. Best done last so all features are multilingual. |

### Dependency Flow

```
Core Setup (LLM + ChromaDB + Streamlit Base)
    ├── Task 1: Dynamic KB (vector DB pipeline)
    ├── Task 3: Medical Q&A (retrieval + NER)
    ├── Task 4: arXiv Expert (retrieval + summarization + visualization)
    ├── Task 2: Multi-Modal (image + context memory)
    ├── Task 5: Sentiment (sentiment layer)
    └── Task 6: Multilingual (translation wrapper — best done last)
```

---

## 📝 GitHub Submission Checklist

For each task submission:

- [ ] Code is clean, commented, and follows the project structure
- [ ] `requirements.txt` is updated with any new dependencies
- [ ] `README.md` is updated with:
  - [ ] Task description
  - [ ] Setup instructions
  - [ ] Screenshots/GIFs of the working feature
  - [ ] Known limitations
- [ ] Streamlit app runs without errors
- [ ] All new features are accessible from the main app
- [ ] Git commit messages are descriptive (e.g., "feat(task1): add dynamic knowledge base updater")

---

## ⚠️ Important Notes

### 🔴 Do NOT use paid APIs
Do NOT use paid APIs (OpenAI, Claude, etc.) unless you have budget. Stick to open-source models that run locally or on free tiers.

### 🟠 Same project — always
All tasks must build on the SAME project. Each task adds features to the base chatbot. Do NOT create separate projects.

### 🟢 Start minimal
Start with a minimal working version of each task, then iterate. A working demo is better than a broken ambitious implementation.

### 🔵 GPU considerations
If you don't have a GPU, use smaller models (Phi-3-mini, TinyLlama) or quantized versions (GGUF via `llama-cpp-python`). Alternatively, use Ollama for easy local LLM management.

---

*This roadmap was generated on 2026-08-05. Follow the implementation order above for the smoothest development experience.*
