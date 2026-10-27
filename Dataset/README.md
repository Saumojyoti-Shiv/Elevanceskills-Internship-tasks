# Project Datasets (`/Dataset`)

This directory contains the curated datasets, lexicons, and evaluation corpora used across the six tasks of the Elevanceskills Internship project.

## Directory Contents

| File | Task | Format | Description |
| --- | --- | --- | --- |
| `task1_knowledge_base_corpus.json` | Task 1 | JSON | Initial knowledge base seed documents covering Web, RSS, and Local File sources. |
| `task3_medquad_qa.json` | Task 3 | JSON | Curated clinical Question-Answer pairs from the NIH MedQuAD dataset (`NIDDK`, `NHLBI`, `NCI`, `NINDS`, `GARD`, `MedlinePlus`). |
| `task3_medquad_qa.csv` | Task 3 | CSV | Tabular CSV export of the MedQuAD clinical Q&A dataset. |
| `task3_medical_ner_lexicon.json` | Task 3 | JSON | Clinical Named Entity Recognition (NER) dictionary categorizing diseases, symptoms, treatments, and medications. |
| `task4_arxiv_cs_papers.json` | Task 4 | JSON | Subset of Computer Science research papers (`cs.AI`, `cs.CL`, `cs.LG`, `cs.CV`, `cs.IR`) from the Cornell University arXiv dataset. |
| `task4_arxiv_cs_papers.csv` | Task 4 | CSV | Tabular CSV export of the arXiv Computer Science papers dataset. |
| `task5_sentiment_emotion_lexicon.json` | Task 5 | JSON | Valence and emotion classification lexicon (`joy`, `gratitude`, `frustration`, `anger`, `sadness`, `anxiety`) and benchmark evaluation utterances. |
| `task6_multilingual_parallel_corpus.json` | Task 6 | JSON | Parallel multilingual corpus and cross-lingual entity alignment glossary across English, Hindi, Spanish, French, German, Bengali, and Code-Mixed Hinglish. |

## Upstream Benchmark References
- **MedQuAD (Medical Question Answering Dataset)**: [https://github.com/abachaa/MedQuAD](https://github.com/abachaa/MedQuAD)
- **Cornell University arXiv Dataset**: [https://www.kaggle.com/datasets/Cornell-University/arxiv](https://www.kaggle.com/datasets/Cornell-University/arxiv)
