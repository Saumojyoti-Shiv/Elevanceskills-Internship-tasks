# Project Datasets (`/Dataset`)

This directory contains the curated datasets, lexicons, and evaluation corpora used across the six features of the Knowledge Assistant project.

## Directory Contents

| File | Feature | Format | Description |
| --- | --- | --- | --- |
| `knowledge_base_corpus.json` | Feature 1 | JSON | Initial knowledge base seed documents covering Web, RSS, and Local File sources. |
| `medquad_qa.json` | Feature 3 | JSON | Curated clinical Question-Answer pairs from the NIH MedQuAD dataset (`NIDDK`, `NHLBI`, `NCI`, `NINDS`, `GARD`, `MedlinePlus`). |
| `medquad_qa.csv` | Feature 3 | CSV | Tabular CSV export of the MedQuAD clinical Q&A dataset. |
| `medical_ner_lexicon.json` | Feature 3 | JSON | Clinical Named Entity Recognition (NER) dictionary categorizing diseases, symptoms, treatments, and medications. |
| `arxiv_cs_papers.json` | Feature 4 | JSON | Subset of Computer Science research papers (`cs.AI`, `cs.CL`, `cs.LG`, `cs.CV`, `cs.IR`) from the Cornell University arXiv dataset. |
| `arxiv_cs_papers.csv` | Feature 4 | CSV | Tabular CSV export of the arXiv Computer Science papers dataset. |
| `sentiment_emotion_lexicon.json` | Feature 5 | JSON | Valence and emotion classification lexicon (`joy`, `gratitude`, `frustration`, `anger`, `sadness`, `anxiety`) and benchmark evaluation utterances. |
| `multilingual_parallel_corpus.json` | Feature 6 | JSON | Parallel multilingual corpus and cross-lingual entity alignment glossary across English, Hindi, Spanish, French, German, Bengali, and Code-Mixed Hinglish. |

## Upstream Benchmark References
- **MedQuAD (Medical Question Answering Dataset)**: [https://github.com/abachaa/MedQuAD](https://github.com/abachaa/MedQuAD)
- **Cornell University arXiv Dataset**: [https://www.kaggle.com/datasets/Cornell-University/arxiv](https://www.kaggle.com/datasets/Cornell-University/arxiv)
