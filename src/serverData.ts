export interface MedQuADPair {
  id: string;
  question: string;
  answer: string;
  source: string;
  category: string;
  focus: string;
  url: string;
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  primary_category: string;
  year: number;
  update_date: string;
  key_concepts: string[];
  url: string;
}

export const INITIAL_MEDQUAD_DATA: MedQuADPair[] = [
  {
    id: 'MEDQUAD-NIDDK-001',
    question: 'What is Type 2 Diabetes and what are its main causes?',
    answer:
      'Type 2 diabetes is a chronic metabolic disorder characterized by high blood glucose (hyperglycemia) resulting from insulin resistance and relative insulin deficiency. Primary causes include genetic predisposition, obesity, physical inactivity, and metabolic syndrome. Over time, elevated blood glucose can damage blood vessels, nerves, kidneys (nephropathy), eyes (retinopathy), and the cardiovascular system.',
    source: 'NIDDK (National Institute of Diabetes and Digestive and Kidney Diseases)',
    category: 'Diabetes & Digestive',
    focus: 'Type 2 Diabetes',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/3_GHR_QA',
  },
  {
    id: 'MEDQUAD-NIDDK-002',
    question: 'What are the common symptoms and treatments for Type 2 Diabetes?',
    answer:
      'Common symptoms of Type 2 diabetes include increased thirst (polydipsia), frequent urination (polyuria), increased hunger (polyphagia), fatigue, blurred vision, slow-healing sores, and tingling or numbness in the hands or feet (neuropathy). Treatments include lifestyle modifications (dietary management, weight loss, regular aerobic exercise), oral medications such as Metformin, sulfonylureas, SGLT2 inhibitors, GLP-1 receptor agonists, and injectable insulin therapy when needed.',
    source: 'NIDDK (National Institute of Diabetes and Digestive and Kidney Diseases)',
    category: 'Diabetes & Digestive',
    focus: 'Type 2 Diabetes',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/4_MPlus_Health_Topics_QA',
  },
  {
    id: 'MEDQUAD-NHLBI-001',
    question: 'What is Hypertension (High Blood Pressure) and how is it treated?',
    answer:
      'Hypertension is a chronic medical condition in which blood pressure in the arteries is persistently elevated (typically >= 130/80 mmHg). Often called a "silent killer" because it rarely causes early symptoms, severe hypertension can cause headaches, shortness of breath, dizziness, or chest pain. Treatments include the DASH diet (reduced sodium intake), regular physical activity, stress reduction, and antihypertensive medications including ACE inhibitors (lisinopril), ARBs (losartan), calcium channel blockers (amlodipine), and thiazide diuretics (hydrochlorothiazide).',
    source: 'NHLBI (National Heart, Lung, and Blood Institute)',
    category: 'Heart, Lung & Blood',
    focus: 'Hypertension',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/7_SeniorHealth_QA',
  },
  {
    id: 'MEDQUAD-NHLBI-002',
    question: 'What are the warning signs and treatments for Asthma?',
    answer:
      'Asthma is a chronic inflammatory airway disease characterized by bronchospasm and reversible airflow obstruction. Symptoms include wheezing, shortness of breath (dyspnea), chest tightness, and chronic coughing, especially at night or early morning. Treatment involves quick-relief bronchodilators such as short-acting beta-agonists (Albuterol) and long-term control medications such as inhaled corticosteroids (Fluticasone, Budesonide), leukotriene modifiers (Montelukast), and biologics.',
    source: 'NHLBI (National Heart, Lung, and Blood Institute)',
    category: 'Heart, Lung & Blood',
    focus: 'Asthma',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/8_NHLBI_QA_XML',
  },
  {
    id: 'MEDQUAD-NCI-001',
    question: 'What are the symptoms, screening methods, and treatments for Non-Small Cell Lung Cancer?',
    answer:
      'Non-small cell lung cancer (NSCLC) accounts for about 85% of lung cancers. Symptoms include a persistent cough, coughing up blood (hemoptysis), chest pain, hoarseness, unexplained weight loss, and recurrent pneumonia or bronchitis. Screening uses low-dose computed tomography (LDCT) for high-risk individuals. Treatments include surgical resection (lobectomy), radiation therapy, platinum-based chemotherapy, targeted therapies (EGFR inhibitors like Osimertinib, ALK inhibitors), and immunotherapy (pembrolizumab, nivolumab).',
    source: 'NCI (National Cancer Institute)',
    category: 'Cancer',
    focus: 'Non-Small Cell Lung Cancer',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/1_CancerGov_QA',
  },
  {
    id: 'MEDQUAD-NCI-002',
    question: 'How is Breast Cancer diagnosed and what treatment options exist?',
    answer:
      'Breast cancer presents with a painless breast lump, skin dimpling, nipple retraction, or abnormal discharge. Diagnosis involves screening mammography, breast ultrasound, MRI, and core needle biopsy to evaluate hormone receptor status (ER/PR) and HER2 expression. Treatments include lumpectomy or mastectomy, radiation therapy, chemotherapy, hormone therapy (Tamoxifen, aromatase inhibitors), and targeted HER2 therapy (Trastuzumab).',
    source: 'NCI (National Cancer Institute)',
    category: 'Cancer',
    focus: 'Breast Cancer',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/1_CancerGov_QA',
  },
  {
    id: 'MEDQUAD-NINDS-001',
    question: 'What is Migraine and what medications are used for acute relief and prevention?',
    answer:
      'Migraine is a neurological disorder causing recurrent moderate-to-severe throbbing headaches, often unilateral, accompanied by nausea, vomiting, photophobia (light sensitivity), phonophobia (sound sensitivity), and visual aura. Acute treatments include triptans (Sumatriptan, Rizatriptan), NSAIDs (Ibuprofen, Naproxen), gepants, and anti-emetics. Preventive treatments include beta-blockers (Propranolol), anticonvulsants (Topiramate), CGRP monoclonal antibodies (Erenumab), and lifestyle trigger management.',
    source: 'NINDS (National Institute of Neurological Disorders and Stroke)',
    category: 'Neurological Disorders',
    focus: 'Migraine',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/6_NINDS_QA',
  },
  {
    id: 'MEDQUAD-NINDS-002',
    question: "What are the symptoms and progression of Alzheimer's Disease?",
    answer:
      "Alzheimer's disease is a progressive neurodegenerative disorder characterized by amyloid plaques and neurofibrillary tau tangles in the brain. Early symptoms include memory loss affecting recent events, difficulty finding words, disorientation, and impaired judgment. Treatments to manage cognitive symptoms include cholinesterase inhibitors (Donepezil, Rivastigmine, Galantamine), NMDA receptor antagonists (Memantine), and anti-amyloid monoclonal antibodies (Lecanemab).",
    source: 'NINDS (National Institute of Neurological Disorders and Stroke)',
    category: 'Neurological Disorders',
    focus: "Alzheimer's Disease",
    url: 'https://github.com/abachaa/MedQuAD/tree/master/6_NINDS_QA',
  },
  {
    id: 'MEDQUAD-GARD-001',
    question: 'What is Cystic Fibrosis and how does it affect the lungs and digestive system?',
    answer:
      'Cystic fibrosis (CF) is an inherited autosomal recessive disorder caused by mutations in the CFTR gene, leading to thick, sticky mucus in the respiratory and gastrointestinal tracts. Symptoms include chronic productive cough, recurrent lung infections, bronchiectasis, pancreatic insufficiency, malabsorption, and salty-tasting skin. Treatments include CFTR modulators (Elexacaftor/Tezacaftor/Ivacaftor), airway clearance therapy, inhaled dornase alfa, bronchodilators, antibiotics, and pancreatic enzyme replacement therapy.',
    source: 'GARD (Genetic and Rare Diseases Information Center)',
    category: 'Genetic & Rare Diseases',
    focus: 'Cystic Fibrosis',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/2_GARD_QA',
  },
  {
    id: 'MEDQUAD-GARD-002',
    question: 'What is Sickle Cell Disease and what complications and treatments are associated with it?',
    answer:
      'Sickle cell disease is an inherited hemoglobinopathy caused by a mutation in the HBB gene producing abnormal hemoglobin S (HbS). Red blood cells become rigid and sickle-shaped, causing vaso-occlusive pain crises, hemolytic anemia, acute chest syndrome, stroke, and splenic sequestration. Treatments include Hydroxyurea, L-glutamine, Voxelotor, Crizanlizumab, blood transfusions, pain management, prophylactic penicillin, and curative hematopoietic stem cell transplantation or gene therapy.',
    source: 'GARD (Genetic and Rare Diseases Information Center)',
    category: 'Genetic & Rare Diseases',
    focus: 'Sickle Cell Disease',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/2_GARD_QA',
  },
  {
    id: 'MEDQUAD-MPLUS-001',
    question: 'What are the side effects and precautions when taking Metformin?',
    answer:
      'Metformin is a biguanide oral antidiabetic medication used as first-line therapy for Type 2 diabetes. It works by decreasing hepatic glucose production and improving insulin sensitivity. Common side effects include nausea, diarrhea, abdominal cramping, metallic taste, and vitamin B12 deficiency with long-term use. A rare but serious risk is lactic acidosis, particularly in patients with severe renal impairment (low eGFR), liver disease, or acute heart failure.',
    source: 'MedlinePlus Drug Information',
    category: 'Medications & Treatments',
    focus: 'Metformin',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/5_NIDDK_QA',
  },
  {
    id: 'MEDQUAD-MPLUS-002',
    question: 'How do Antibiotics work and why is antibiotic resistance a concern?',
    answer:
      'Antibiotics are antimicrobial drugs (such as Amoxicillin, Azithromycin, Ciprofloxacin, Doxycycline) that treat bacterial infections by killing bacteria or inhibiting their cell wall synthesis, protein synthesis, or DNA replication. They are ineffective against viral infections like the common cold or influenza. Overuse or incomplete courses promote antibiotic-resistant bacteria (such as MRSA), making future infections harder to treat and increasing the risk of Clostridioides difficile colitis.',
    source: 'MedlinePlus Health Topics',
    category: 'Medications & Treatments',
    focus: 'Antibiotics',
    url: 'https://github.com/abachaa/MedQuAD/tree/master/4_MPlus_Health_Topics_QA',
  },
];

export const MEDICAL_ENTITY_LEXICON = {
  diseases: [
    'diabetes',
    'type 2 diabetes',
    'type 1 diabetes',
    'hypertension',
    'high blood pressure',
    'asthma',
    'cancer',
    'lung cancer',
    'breast cancer',
    'migraine',
    'alzheimer',
    'cystic fibrosis',
    'sickle cell',
    'anemia',
    'pneumonia',
    'bronchitis',
    'neuropathy',
    'retinopathy',
    'nephropathy',
    'stroke',
    'heart failure',
    'colitis',
    'infection',
    'obesity',
    'metabolic syndrome',
    'hyperglycemia',
    'lactic acidosis',
  ],
  symptoms: [
    'headache',
    'pain',
    'chest pain',
    'cough',
    'wheezing',
    'shortness of breath',
    'dyspnea',
    'fatigue',
    'nausea',
    'vomiting',
    'dizziness',
    'fever',
    'thirst',
    'polydipsia',
    'polyuria',
    'blurred vision',
    'numbness',
    'tingling',
    'weight loss',
    'hoarseness',
    'diarrhea',
    'cramping',
    'lump',
    'aura',
    'photophobia',
    'memory loss',
    'bleeding',
  ],
  treatments: [
    'chemotherapy',
    'radiation therapy',
    'surgery',
    'immunotherapy',
    'lobectomy',
    'mastectomy',
    'lumpectomy',
    'biopsy',
    'mammography',
    'ultrasound',
    'mri',
    'exercise',
    'diet',
    'dash diet',
    'blood transfusion',
    'stem cell transplant',
    'gene therapy',
    'airway clearance',
    'lifestyle modifications',
    'screening',
  ],
  drugs: [
    'metformin',
    'insulin',
    'albuterol',
    'lisinopril',
    'losartan',
    'amlodipine',
    'hydrochlorothiazide',
    'fluticasone',
    'budesonide',
    'montelukast',
    'osimertinib',
    'pembrolizumab',
    'nivolumab',
    'tamoxifen',
    'trastuzumab',
    'sumatriptan',
    'rizatriptan',
    'ibuprofen',
    'naproxen',
    'propranolol',
    'topiramate',
    'donepezil',
    'memantine',
    'lecanemab',
    'hydroxyurea',
    'amoxicillin',
    'azithromycin',
    'ciprofloxacin',
    'doxycycline',
    'antibiotics',
    'corticosteroids',
  ],
};

export const INITIAL_ARXIV_PAPERS: ArxivPaper[] = [
  {
    id: '1706.03762',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'],
    abstract:
      'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    categories: ['cs.CL', 'cs.LG', 'cs.AI'],
    primary_category: 'cs.CL',
    year: 2017,
    update_date: '2017-06-12',
    key_concepts: ['Transformer', 'Self-Attention', 'Multi-Head Attention', 'Sequence Transduction', 'Positional Encoding'],
    url: 'https://arxiv.org/abs/1706.03762',
  },
  {
    id: '2005.11401',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus', 'Fabio Petroni', 'Vladimir Karpukhin', 'Naman Goyal', 'Heinrich Küttler', 'Mike Lewis', 'Wen-tau Yih', 'Tim Rocktäschel', 'Sebastian Riedel', 'Douwe Kiela'],
    abstract:
      'Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited. We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation.',
    categories: ['cs.CL', 'cs.IR', 'cs.AI'],
    primary_category: 'cs.CL',
    year: 2020,
    update_date: '2020-05-22',
    key_concepts: ['Retrieval-Augmented Generation', 'Dense Passage Retrieval', 'Non-Parametric Memory', 'Knowledge-Intensive NLP', 'Vector Search'],
    url: 'https://arxiv.org/abs/2005.11401',
  },
  {
    id: '2010.11929',
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    authors: ['Alexey Dosovitskiy', 'Lucas Beyer', 'Alexander Kolesnikov', 'Dirk Weissenborn', 'Xiaohua Zhai', 'Thomas Unterthiner', 'Mostafa Dehghani', 'Matthias Minderer', 'Georg Heigold', 'Sylvain Gelly', 'Jakob Uszkoreit', 'Neil Houlsby'],
    abstract:
      'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. We show that reliance on CNNs is not necessary and a pure transformer applied directly to sequences of image patches can perform very well on image classification tasks. When pre-trained on large amounts of data, Vision Transformer (ViT) attains excellent results compared to state-of-the-art convolutional networks.',
    categories: ['cs.CV', 'cs.AI', 'cs.LG'],
    primary_category: 'cs.CV',
    year: 2021,
    update_date: '2021-06-03',
    key_concepts: ['Vision Transformer', 'Patch Embeddings', 'Image Classification', 'Self-Attention', 'Representation Learning'],
    url: 'https://arxiv.org/abs/2010.11929',
  },
  {
    id: '2201.11903',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma', 'Brian Ichter', 'Fei Xia', 'Ed Chi', 'Quoc Le', 'Denny Zhou'],
    abstract:
      'We explore how generating a chain of thought — a series of intermediate reasoning steps — significantly improves the ability of large language models to perform complex reasoning. In particular, we show how such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain-of-thought prompting, achieving state-of-the-art accuracy on arithmetic, commonsense, and symbolic reasoning benchmarks.',
    categories: ['cs.CL', 'cs.AI'],
    primary_category: 'cs.CL',
    year: 2022,
    update_date: '2022-01-28',
    key_concepts: ['Chain-of-Thought', 'In-Context Learning', 'Emergent Reasoning', 'Prompt Engineering', 'Symbolic Reasoning'],
    url: 'https://arxiv.org/abs/2201.11903',
  },
  {
    id: '2106.09685',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yuanzhi Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'],
    abstract:
      'An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to particular tasks or domains. We propose Low-Rank Adaptation, or LoRA, which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.',
    categories: ['cs.LG', 'cs.CL', 'cs.AI'],
    primary_category: 'cs.LG',
    year: 2021,
    update_date: '2021-10-16',
    key_concepts: ['Low-Rank Adaptation', 'Parameter-Efficient Fine-Tuning', 'Rank Decomposition', 'Transformer Adaptation', 'Model Compression'],
    url: 'https://arxiv.org/abs/2106.09685',
  },
  {
    id: '2210.03629',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    authors: ['Shunyu Yao', 'Jeffrey Zhao', 'Dian Yu', 'Nan Du', 'Izhak Shafran', 'Karthik Narasimhan', 'Yuan Cao'],
    abstract:
      'While large language models have demonstrated impressive capabilities across tasks in language understanding and interactive decision making, their abilities for reasoning (e.g. chain-of-thought prompting) and acting (e.g. action plan generation) have primarily been studied as separate topics. In this paper, we explore the use of LLMs to generate both reasoning traces and task-specific actions in an interleaved manner, overcoming hallucination and error propagation.',
    categories: ['cs.AI', 'cs.CL', 'cs.LG'],
    primary_category: 'cs.AI',
    year: 2023,
    update_date: '2023-03-10',
    key_concepts: ['Autonomous Agents', 'Interleaved Reasoning', 'Tool Use', 'Chain-of-Thought', 'Decision Making'],
    url: 'https://arxiv.org/abs/2210.03629',
  },
  {
    id: '2305.18290',
    title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
    authors: ['Rafael Rafailov', 'Archit Sharma', 'Eric Mitchell', 'Stefano Ermon', 'Christopher D. Manning', 'Chelsea Finn'],
    abstract:
      'While large-scale unsupervised language models learn broad world knowledge and some reasoning skills, achieving precise control of their behavior is difficult due to the completely unsupervised nature of their training. Existing methods such as RLHF are complex and often unstable. We introduce Direct Preference Optimization (DPO), a stable, performant, and computationally lightweight algorithm that optimizes policy directly on human preference data without explicit reward modeling or reinforcement learning.',
    categories: ['cs.LG', 'cs.AI', 'cs.CL'],
    primary_category: 'cs.LG',
    year: 2023,
    update_date: '2023-05-29',
    key_concepts: ['Direct Preference Optimization', 'RLHF', 'Human Alignment', 'Bradley-Terry Model', 'Policy Optimization'],
    url: 'https://arxiv.org/abs/2305.18290',
  },
  {
    id: '2312.00752',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: ['Albert Gu', 'Tri Dao'],
    abstract:
      'Foundation models, now powering most of the exciting applications in deep learning, are almost universally based on the Transformer architecture and its core attention module. To address the computational inefficiency of Transformers on long sequences, we introduce Mamba, a selective state space model (SSM) architecture that achieves fast inference (5x higher throughput than Transformers) and linear scaling in sequence length.',
    categories: ['cs.LG', 'cs.AI'],
    primary_category: 'cs.LG',
    year: 2024,
    update_date: '2024-05-31',
    key_concepts: ['Selective State Space Models', 'Linear-Time Complexity', 'Hardware-Aware Parallel Scan', 'Long Context Modeling', 'Sequence Architecture'],
    url: 'https://arxiv.org/abs/2312.00752',
  },
  {
    id: '2401.15884',
    title: 'Corrective Retrieval Augmented Generation (CRAG)',
    authors: ['Shi-Qi Yan', 'Jia-Chen Gu', 'Yun Zhu', 'Zhen-Hua Ling'],
    abstract:
      'Large language models inevitably exhibit hallucinations since the accuracy of generated texts cannot be secured solely by the parametric knowledge they encapsulate. Although retrieval-augmented generation (RAG) is a practicable complement to LLMs, it relies heavily on the relevance of retrieved documents. We propose Corrective Retrieval Augmented Generation (CRAG) with a lightweight retrieval evaluator to assess document quality and trigger web-scale corrective knowledge actions.',
    categories: ['cs.CL', 'cs.AI', 'cs.IR'],
    primary_category: 'cs.AI',
    year: 2024,
    update_date: '2024-02-16',
    key_concepts: ['Corrective RAG', 'Retrieval Evaluation', 'Hallucination Mitigation', 'Self-Reflective Retrieval', 'Knowledge Decomposition'],
    url: 'https://arxiv.org/abs/2401.15884',
  },
  {
    id: '2308.09687',
    title: 'Graph of Thoughts: Solving Elaborate Problems with Large Language Models',
    authors: ['Maciej Besta', 'Nils Blach', 'Aleš Kubicek', 'Robert Gerstenberger', 'Michal Podstawski', 'Lukas Gianinazzi', 'Joanna Gajda', 'Tomasz Lehmann', 'Hubert Niewiadomski', 'Piotr Nyczyk', 'Torsten Hoefler'],
    abstract:
      'We introduce Graph of Thoughts (GoT): a framework that advances prompting capabilities in large language models beyond those offered by paradigms such as Chain-of-Thought or Tree of Thoughts (ToT). The key idea and primary advantage of GoT is the ability to model the information generated by an LLM as an arbitrary graph, where units of information ("LLM thoughts") are vertices, and edges correspond to dependencies between these vertices.',
    categories: ['cs.AI', 'cs.CL', 'cs.LG'],
    primary_category: 'cs.AI',
    year: 2024,
    update_date: '2024-02-06',
    key_concepts: ['Graph of Thoughts', 'Structured Reasoning', 'Thought Aggregation', 'Tree of Thoughts', 'Prompt Engineering'],
    url: 'https://arxiv.org/abs/2308.09687',
  },
];
