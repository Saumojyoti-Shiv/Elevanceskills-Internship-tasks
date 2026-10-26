# Knowledge Assistant — Elevanceskills Internship

This repository contains the implementation for all six tasks of the Elevanceskills Internship project. It is built as a unified web application using Node.js, Express, React, and TypeScript, with all retrieval, computer vision, and natural language processing running locally without external API keys.

## Project Modules

### Task 1: Dynamic Knowledge Base Expansion
- Ingests content from web pages, RSS feeds, workspace files, and user-uploaded documents.
- Splits documents into overlapping chunks with SHA-256 hash deduplication.
- Uses an n-gram TF-IDF vector index with cosine similarity for retrieval-augmented responses and source citations.

### Task 2: Multi-Modal Assistant (Text + Image)
- Processes uploaded images (`JPG`, `PNG`, `WEBP`) using `sharp` pixel buffer inspection, HSL color quantization, and Sobel edge gradient detection.
- Extracts resolution, lighting conditions, dominant color palettes, edge density, and spatial focal composition.
- Retains visual observations in conversation history to answer follow-up questions across turns.

### Task 3: Medical Q&A Chatbot (MedQuAD)
- Retrieves clinical question-answer pairs from the NIH MedQuAD corpus (`NIDDK`, `NCI`, `NHLBI`, `NINDS`, `GARD`, `MedlinePlus`).
- Includes an option to sync live XML entries directly from the `abachaa/MedQuAD` GitHub repository.
- Performs clinical named entity recognition (NER) to highlight diseases, symptoms, treatments, and medications.

### Task 4: Domain Expert Chatbot (arXiv Computer Science)
- Indexes Computer Science papers (`cs.AI`, `cs.CL`, `cs.LG`, `cs.CV`, `cs.IR`) with support for querying the Cornell arXiv API.
- Provides paper search, category/year filtering, abstract summarization, simplified concept explanations, and citation-backed Q&A.
- Includes category distribution, publication timeline, and concept frequency charts.

### Task 5: Sentiment-Aware Chatbot
- Evaluates user messages using a lexicon and valence-based sentiment analyzer (`positive`, `negative`, `neutral`) with polarity scoring (`-1.0` to `+1.0`).
- Detects fine-grained emotions (`joy`, `gratitude`, `curiosity`, `frustration`, `anger`, `sadness`, `anxiety`) and adjusts response tone accordingly.
- Tracks polarity across conversation turns and flags consecutive negative sentiment.

### Task 6: Multilingual Conversational Support
- Supports English, Hindi, Spanish, French, German, and Bengali.
- Identifies input language using Unicode script ranges and lexical markers, including mixed-language (code-switched) inputs.
- Maintains a canonical English context representation to preserve conversation continuity when switching languages mid-session.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server (runs on `http://localhost:3000`):
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```
