# 🤖 AI Activity Log — Elevanceskills Internship

> **Purpose**: This file records every significant action taken by an AI assistant on this project. Each entry explains **what** was done and **why**, so that any future AI (or human) can pick up exactly where work left off without losing context.
>
> **GitHub Repository**: https://github.com/Saumojyoti-Shiv/Elevanceskills-Internship-tasks
>
> **Google Drive (Datasets)**: _To be added after all tasks are complete._

---

## 📖 How to Read This Log

- Entries are in **chronological order** (newest at the bottom).
- Each entry has: **Date/Time**, **Task Scope**, **What Was Done**, **Why**, and **Files Changed**.
- If you are an AI picking up this project, **read this entire log first**, then check the [Roadmap & Analysis.md](./Roadmap%20%26%20Analysis.md) for the full plan.

---

## Activity Entries

---

### Entry #1 — Project Initialization & Roadmap Creation

| Field | Detail |
|---|---|
| **Date** | 2026-08-05, ~12:10 IST |
| **Task Scope** | Pre-work / Planning |
| **AI Model** | Claude Opus 4.6 (Thinking) via Antigravity |

**What Was Done:**
1. Read the [Internship tasks.md](./Internship%20tasks.md) file to understand all 6 task requirements.
2. Created [Roadmap & Analysis.md](./Roadmap%20%26%20Analysis.md) — a comprehensive technical roadmap covering:
   - Global constraints (same project, GitHub hosting, open-source only)
   - Unified tech stack (Streamlit, ChromaDB, sentence-transformers, etc.)
   - Full project folder structure
   - Task-by-task implementation guides with step-by-step instructions
   - Evaluation checklists for each task
   - Recommended build order (Core → T1 → T3 → T4 → T2 → T5 → T6)
   - GitHub submission checklist

**Why:**
- The user requested a detailed analysis/roadmap before any coding begins.
- This document serves as the "master plan" that any AI can follow to implement all 6 tasks correctly.
- Having the full architecture planned upfront prevents rework and ensures all tasks integrate into a single cohesive project.

**Files Changed:**
- `Roadmap & Analysis.md` — **Created** (new file)

---

### Entry #2 — Activity Log Creation & Task 1 Kickoff

| Field | Detail |
|---|---|
| **Date** | 2026-08-05, ~14:37 IST |
| **Task Scope** | Pre-work + Task 1 Start |
| **AI Model** | Claude Opus 4.6 (Thinking) via Antigravity |

**What Was Done:**
1. Created this file (`AI Activity Log.md`) to track all AI actions with reasoning.
2. Updated [Roadmap & Analysis.md](./Roadmap%20%26%20Analysis.md) to include:
   - GitHub repo link: https://github.com/Saumojyoti-Shiv/Elevanceskills-Internship-tasks
   - Reference to this Activity Log file
   - Note about Google Drive datasets (to be decided after all tasks)
3. Started building **Task 1: Dynamic Knowledge Base Expansion**:
   - Created the core project structure (folders, `__init__.py` files)
   - Built `config.py` — centralized configuration
   - Built `core/embeddings.py` — embedding generation utilities
   - Built `core/vector_store.py` — ChromaDB wrapper
   - Built `core/chatbot.py` — base chatbot logic with LLM + memory
   - Built `tasks/task1_dynamic_kb/sources.py` — source management
   - Built `tasks/task1_dynamic_kb/updater.py` — scheduled data ingestion
   - Built `app.py` — main Streamlit entry point with Task 1 UI
   - Created `requirements.txt` with all dependencies
   - Created `README.md` with project overview and setup instructions

**Why:**
- The Activity Log was requested by the user so future AIs have full context.
- Task 1 is the foundation — it establishes the vector database pipeline, embedding system, and chatbot core that ALL other tasks will build upon.
- Building Task 1 first validates the core architecture works before adding complexity.
- The dynamic knowledge base (ChromaDB + scheduler + source management) is reused by Tasks 3, 4, and others.

**Files Changed:**
- `AI Activity Log.md` — **Created** (this file)
- `Roadmap & Analysis.md` — **Updated** (added GitHub link, Activity Log reference)
- `config.py` — **Created**
- `requirements.txt` — **Created**
- `README.md` — **Created**
- `core/__init__.py` — **Created**
- `core/embeddings.py` — **Created**
- `core/vector_store.py` — **Created**
- `core/chatbot.py` — **Created**
- `tasks/__init__.py` — **Created**
- `tasks/task1_dynamic_kb/__init__.py` — **Created**
- `tasks/task1_dynamic_kb/sources.py` — **Created**
- `tasks/task1_dynamic_kb/updater.py` — **Created**
- `app.py` — **Created**

---

### Entry #3 — UI Blank Page Bug Fix & Deferred Loading

| Field | Detail |
|---|---|
| **Date** | 2026-08-16, ~15:05 IST |
| **Task Scope** | Task 1: UI & Initialization Fixes |
| **AI Model** | Claude Opus 4.6 (Thinking) via Antigravity |

**What Was Done:**
1. Diagnosed the root cause of the blank page issue reported by the user (only the top Streamlit task bar was visible).
2. Fixed the initialization sequence in `app.py`:
   - Moved `try_load_models()` to run **after** the header and basic UI structure render so the app never shows a blank screen.
   - Added `st.spinner` progress indicators for each step (embedding, vector store, language model).
   - Added fallback session state defaults with `st.session_state.setdefault(...)` so the sidebar and widgets render cleanly without null pointer exceptions.
3. Optimized `core/vector_store.py` to accept an optional pre-loaded `EmbeddingManager` instance, avoiding redundant duplicate model loads into memory.

**Why:**
- Top-level blocking execution during heavy model downloads/loads prevented Streamlit from rendering any HTML/CSS content to the client browser.
- Rendering the UI structure first provides clear visual feedback and prevents the application from appearing frozen.

**Files Changed:**
- `app.py` — **Updated** (deferred model loading & session state defaults)
- `core/vector_store.py` — **Updated** (accept pre-initialized `embedding_manager`)

---

### Entry #4 — LLM Engine Optimization & Interactions API Migration

| Field | Detail |
|---|---|
| **Date** | 2026-08-16, ~15:45 – 16:00 IST |
| **Task Scope** | Task 1: LLM Engine & Response Latency Fix |
| **AI Model** | Claude Opus 4.6 (Thinking) & Gemini 3.1 Pro via Antigravity |

**What Was Done:**
1. Diagnosed why the chat stuck indefinitely on *"Searching knowledge base & generating response..."*:
   - The local HuggingFace `Phi-3-mini-4k-instruct` (3.8B parameters) running in `float32` on CPU without GPU acceleration was taking 30–120+ minutes per response.
2. Per user preference, replaced the heavy local CPU LLM pipeline with Google Gemini API:
   - Updated `requirements.txt` to replace heavy `torch`/`transformers` dependencies with `google-genai` and `python-dotenv`.
   - Updated `core/chatbot.py` to use `google-genai` SDK while keeping the exact same public interface and session memory management.
   - Added `.env` configuration support and created `.env.example`.
   - Updated `.gitignore` to prevent API key leaks.
3. Migrated to the new **Interactions API** and updated model configuration:
   - Resolved the `404 NOT_FOUND` error on deprecated models by configuring `MODEL_NAME = 'gemini-3.6-flash'` in `config.py`.
   - Refactored `core/chatbot.py` to use `client.interactions.create(model=..., input=...)` and parse `interaction.output_text`.
4. Updated `README.md` to reflect the updated tech stack and setup instructions.

**Why:**
- Local CPU inference with large unquantized models is impractical on standard consumer CPUs; the free-tier Gemini API provides 1–3s response latency while keeping all vector embeddings and ChromaDB operations 100% local.
- Adhered to Google's API migration requirements for latest model availability.

**Files Changed:**
- `core/chatbot.py` — **Updated** (Interactions API integration)
- `config.py` — **Updated** (`gemini-3.6-flash`)
- `app.py` — **Updated** (dotenv loading & updated status banners)
- `requirements.txt` — **Updated** (added `google-genai`, `python-dotenv`)
- `.env.example` — **Created**
- `.gitignore` — **Updated** (added `.env`)
- `README.md` — **Updated** (setup guide & tech stack)

---

### Entry #5 — Task 2: Multi-Modal AI Assistant Implementation

| Field | Detail |
|---|---|
| **Date** | 2026-08-19, ~01:00 IST |
| **Task Scope** | Task 2: Multi-Modal AI Assistant (Text + Image) |
| **AI Model** | Claude Opus 4.6 (Thinking) via Antigravity |

**What Was Done:**
1. Created backend modules for multimodal image+text processing:
   - `tasks/task2_multimodal/__init__.py` — module exports
   - `tasks/task2_multimodal/image_analyzer.py` — `ImageAnalyzer` class that sends images to Gemini API for structured JSON analysis (caption, objects, scene, text, colors, confidence) and question-answering
   - `tasks/task2_multimodal/multimodal_chat.py` — `MultiModalChat` class that maintains conversation history with image context, builds multimodal prompts, and extracts evidence/confidence from responses
2. Integrated Task 2 into `app.py`:
   - Added **task navigation** radio buttons in the sidebar (Task 1 | Task 2)
   - Task 1 sidebar shows source management, update controls, and database stats (unchanged behavior)
   - Task 2 sidebar shows image uploader, chat controls, and usage instructions
   - Task 2 main content displays multimodal chat with expandable "What I See" image analysis, evidence sections, and confidence badges
   - Image is sent to Gemini on first message, then cleared so follow-up questions use conversation history for context continuity
3. Added session state variables for Task 2 (`multimodal_chat`, `task2_messages`, `current_image_bytes`, `current_image_name`)
4. Task 2 reuses the same Gemini API client from the chatbot — no additional API setup needed

**Architecture Decision:**
- The roadmap originally suggested local models (BLIP-2, LLaVA, torchvision) for image analysis. Since we migrated to Google Gemini API (which is natively multimodal), we send images directly to Gemini instead. This eliminates ~3-8GB of additional model downloads and provides significantly better image analysis quality.

**Why:**
- Task 2 is the next task in the roadmap after Task 1 (user requested Task 2 specifically)
- Using Gemini's native multimodal capabilities avoids the complexity and resource requirements of running separate vision models locally
- The implementation satisfies all 6 evaluation criteria from the roadmap checklist

**Files Changed:**
- `tasks/task2_multimodal/__init__.py` — **Created**
- `tasks/task2_multimodal/image_analyzer.py` — **Created**
- `tasks/task2_multimodal/multimodal_chat.py` — **Created**
- `app.py` — **Updated** (task navigation, Task 2 sidebar/main content, multimodal session state)
- `README.md` — **Updated** (Task 2 marked as completed with feature list)
- `AI Activity Log.md` — **Updated** (this entry)

---

<!-- NEXT ENTRY GOES HERE -->
