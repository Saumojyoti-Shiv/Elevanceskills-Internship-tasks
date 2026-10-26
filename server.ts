import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import {
  INITIAL_MEDQUAD_DATA,
  INITIAL_ARXIV_PAPERS,
  MedQuADPair,
  ArxivPaper,
} from './src/serverData';
import {
  analyzeImageLocally,
  answerImageQuestionLocally,
  synthesizeLocalKBResponse,
  generateLocalMedicalResponse,
  summarizeArxivLocally,
  generateLocalArxivResponse,
  analyzeSentimentLocally,
  processMultilingualLocally,
  StructuredImageAnalysis,
} from './src/localAiEngine';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const TOP_K_RESULTS = 5;
const SOURCES_FILE = path.resolve(process.cwd(), 'sources.json');

export interface Source {
  name: string;
  url: string;
  source_type: 'web' | 'rss' | 'file';
  last_updated: string | null;
  is_active: boolean;
}

export interface VectorDocument {
  id: string;
  text: string;
  tokens: Map<string, number>;
  metadata: {
    source: string;
    url: string;
    type: string;
    hash: string;
    ingested_at: string;
  };
}

export interface UpdateLogEntry {
  timestamp: string;
  source?: string;
  type?: string;
  stats: {
    source?: string;
    new_chunks?: number;
    total_new_chunks?: number;
    skipped_duplicates?: number;
    total_skipped?: number;
    sources_updated?: number;
    status?: string;
    error?: string;
  };
}

// Text chunking and n-gram vector similarity utilities
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let start = 0;
  const textLength = text.length;

  while (start < textLength) {
    const end = Math.min(start + chunkSize, textLength);
    chunks.push(text.slice(start, end));
    if (end === textLength) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

function tokenizeAndVectorize(text: string): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const freq = new Map<string, number>();
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    freq.set(w, (freq.get(w) || 0) + 1);
    // Add word bigrams for stronger local semantic matching
    if (i < words.length - 1) {
      const bigram = `${w}_${words[i + 1]}`;
      freq.set(bigram, (freq.get(bigram) || 0) + 0.6);
    }
  }
  let norm = 0;
  for (const val of freq.values()) {
    norm += val * val;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [k, val] of freq.entries()) {
    freq.set(k, val / norm);
  }
  return freq;
}

function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dot = 0;
  for (const [k, valA] of vecA.entries()) {
    const valB = vecB.get(k);
    if (valB !== undefined) {
      dot += valA * valB;
    }
  }
  return dot;
}

// In-memory stores for KB, MedQuAD, and arXiv
const vectorStore = new Map<string, VectorDocument>();
const updateLogs: UpdateLogEntry[] = [];
let lastUpdateTime: string | null = null;

const medquadStore: MedQuADPair[] = [...INITIAL_MEDQUAD_DATA];
const arxivStore: ArxivPaper[] = [...INITIAL_ARXIV_PAPERS];

function loadSources(): Source[] {
  try {
    if (fs.existsSync(SOURCES_FILE)) {
      const raw = fs.readFileSync(SOURCES_FILE, 'utf-8');
      const parsed: Source[] = JSON.parse(raw);
      // Ensure our local README.md source is also included by default to showcase local file ingestion
      if (!parsed.some((s) => s.source_type === 'file')) {
        parsed.push({
          name: 'Project README (Local File)',
          url: 'README.md',
          source_type: 'file',
          last_updated: new Date().toISOString(),
          is_active: true,
        });
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read sources.json, using defaults:', err);
  }
  return [
    {
      name: 'Python Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Python_(programming_language)',
      source_type: 'web',
      last_updated: null,
      is_active: true,
    },
    {
      name: 'Hacker News RSS',
      url: 'https://news.ycombinator.com/rss',
      source_type: 'rss',
      last_updated: null,
      is_active: true,
    },
    {
      name: 'Project README (Local File)',
      url: 'README.md',
      source_type: 'file',
      last_updated: new Date().toISOString(),
      is_active: true,
    },
  ];
}

let sources: Source[] = loadSources();

function saveSources() {
  try {
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 4), 'utf-8');
  } catch (err) {
    console.warn('Could not persist sources.json:', err);
  }
}

function computeContentHash(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
}

function processContent(
  text: string,
  source: Source,
  stats: { new_chunks: number; skipped_duplicates: number; status: string },
  url: string
) {
  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.trim()) continue;
    const chunkHash = computeContentHash(chunk);
    const chunkId = `${source.name}_${chunkHash.slice(0, 16)}_${i}`;

    if (vectorStore.has(chunkId)) {
      stats.skipped_duplicates += 1;
      continue;
    }

    vectorStore.set(chunkId, {
      id: chunkId,
      text: chunk,
      tokens: tokenizeAndVectorize(chunk),
      metadata: {
        source: source.name,
        url,
        type: source.source_type,
        hash: chunkHash,
        ingested_at: new Date().toISOString(),
      },
    });
    stats.new_chunks += 1;
  }
}

function seedInitialKnowledge() {
  const seedDocs = [
    {
      sourceName: 'Python Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Python_(programming_language)',
      type: 'web' as const,
      content:
        'Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically type-checked and garbage-collected. It supports multiple programming paradigms, including structured (particularly procedural), object-oriented and functional programming. Guido van Rossum began working on Python in the late 1980s as a successor to the ABC programming language, and first released it in 1991 as Python 0.9.0. Python 2.0 was released in 2000 and introduced list comprehensions, cycle-detecting garbage collection, reference counting, and Unicode support. Python 3.0, released in 2008, was a major revision not completely backward-compatible with earlier versions.',
    },
    {
      sourceName: 'Hacker News RSS',
      url: 'https://news.ycombinator.com/rss',
      type: 'rss' as const,
      content:
        'Hacker News is a social news website focusing on computer science, software engineering, artificial intelligence, and entrepreneurship. It is run by the investment fund and startup incubator Y Combinator. Recent discussions highlight advances in local multimodal AI models, retrieval-augmented generation (RAG) pipelines, vector databases, edge inference, and open-source developer tools.',
    },
  ];

  for (const item of seedDocs) {
    const matchingSource = sources.find((s) => s.name === item.sourceName) || {
      name: item.sourceName,
      url: item.url,
      source_type: item.type,
      last_updated: null,
      is_active: true,
    };
    processContent(
      item.content,
      matchingSource,
      { new_chunks: 0, skipped_duplicates: 0, status: 'success' },
      item.url
    );
  }

  // Also ingest local files (`README.md` and `Internship tasks.md`) on startup
  const localFilesToSeed = [
    { name: 'Project README (Local File)', filePath: 'README.md' },
    { name: 'Internship Tasks Spec (Local File)', filePath: 'Internship tasks.md' },
  ];

  for (const lf of localFilesToSeed) {
    const resolved = path.resolve(process.cwd(), lf.filePath);
    if (fs.existsSync(resolved)) {
      try {
        const content = fs.readFileSync(resolved, 'utf-8');
        const srcObj = sources.find((s) => s.url === lf.filePath) || {
          name: lf.name,
          url: lf.filePath,
          source_type: 'file' as const,
          last_updated: new Date().toISOString(),
          is_active: true,
        };
        processContent(
          content,
          srcObj,
          { new_chunks: 0, skipped_duplicates: 0, status: 'success' },
          lf.filePath
        );
      } catch (e) {
        console.warn('Could not seed local file:', lf.filePath, e);
      }
    }
  }
}

seedInitialKnowledge();

async function fetchWebContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIKnowledgeAssistant/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();
    return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 25000);
  } catch (err) {
    console.warn(`Error fetching web content from ${url}:`, err);
    return '';
  }
}

async function fetchRssContent(url: string): Promise<Array<{ title: string; content: string; link: string }>> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIKnowledgeAssistant/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: Array<{ title: string; content: string; link: string }> = [];

    $('item, entry').each((_, el) => {
      const title = $(el).find('title').first().text().trim();
      const rawDesc =
        $(el).find('description').first().text() ||
        $(el).find('summary').first().text() ||
        $(el).find('content').first().text() ||
        '';
      const cleanDesc = cheerio.load(rawDesc).text().replace(/\s+/g, ' ').trim();
      const link =
        $(el).find('link').first().text().trim() ||
        $(el).find('link').first().attr('href') ||
        url;
      if (title || cleanDesc) {
        items.push({ title, content: cleanDesc, link });
      }
    });
    return items.slice(0, 30);
  } catch (err) {
    console.warn(`Error fetching RSS content from ${url}:`, err);
    return [];
  }
}

async function fetchFileContent(filePath: string): Promise<string> {
  try {
    const resolved = path.resolve(process.cwd(), filePath);
    if (!resolved.startsWith(process.cwd())) {
      throw new Error('File path must be inside workspace');
    }
    return await fs.promises.readFile(resolved, 'utf-8');
  } catch (err) {
    console.warn(`Error reading file ${filePath}:`, err);
    return '';
  }
}

async function updateSingleSource(source: Source) {
  const stats = {
    source: source.name,
    new_chunks: 0,
    skipped_duplicates: 0,
    status: 'success',
    error: undefined as string | undefined,
  };

  try {
    if (source.source_type === 'web') {
      const content = await fetchWebContent(source.url);
      if (content) {
        processContent(content, source, stats, source.url);
      }
    } else if (source.source_type === 'rss') {
      const items = await fetchRssContent(source.url);
      for (const item of items) {
        const fullText = `${item.title}\n\n${item.content}`;
        processContent(fullText, source, stats, item.link);
      }
    } else if (source.source_type === 'file') {
      const content = await fetchFileContent(source.url);
      if (content) {
        processContent(content, source, stats, source.url);
      }
    }

    source.last_updated = new Date().toISOString();
    saveSources();
  } catch (err: any) {
    stats.status = 'error';
    stats.error = err?.message || String(err);
  }

  updateLogs.push({
    timestamp: new Date().toISOString(),
    source: source.name,
    stats,
  });

  return stats;
}

function queryVectorStoreWithScores(queryText: string, nResults = TOP_K_RESULTS) {
  const queryVec = tokenizeAndVectorize(queryText);
  const scored: Array<{ doc: VectorDocument; score: number }> = [];

  for (const doc of vectorStore.values()) {
    const score = cosineSimilarity(queryVec, doc.tokens);
    scored.push({ doc, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, nResults).map((item) => ({
    text: item.doc.text,
    source: item.doc.metadata.source,
    url: item.doc.metadata.url,
    score: item.score,
  }));
}

function searchMedQuAD(queryText: string, category = 'All', topK = 4): MedQuADPair[] {
  const queryVec = tokenizeAndVectorize(queryText);
  const candidates =
    category && category !== 'All'
      ? medquadStore.filter((item) => item.category.toLowerCase() === category.toLowerCase())
      : medquadStore;

  const scored = candidates.map((pair) => {
    const docVec = tokenizeAndVectorize(`${pair.focus} ${pair.question} ${pair.answer}`);
    return { pair, score: cosineSimilarity(queryVec, docVec) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.pair);
}

function searchArxivStore(
  queryText: string,
  category = 'All',
  minYear = 2017,
  maxYear = 2026
): ArxivPaper[] {
  const filtered = arxivStore.filter((paper) => {
    const yearMatch = paper.year >= minYear && paper.year <= maxYear;
    const catMatch =
      !category ||
      category === 'All' ||
      paper.categories.some((c) => c.toLowerCase() === category.toLowerCase());
    return yearMatch && catMatch;
  });

  if (!queryText.trim()) {
    return filtered;
  }

  const queryVec = tokenizeAndVectorize(queryText);
  const lowerQ = queryText.toLowerCase();
  const scored = filtered.map((paper) => {
    const docVec = tokenizeAndVectorize(
      `${paper.title} ${paper.abstract} ${paper.authors.join(' ')} ${paper.key_concepts.join(' ')}`
    );
    let score = cosineSimilarity(queryVec, docVec);
    if (paper.title.toLowerCase().includes(lowerQ)) score += 0.4;
    if (paper.authors.some((a) => a.toLowerCase().includes(lowerQ))) score += 0.35;
    if (paper.key_concepts.some((k) => k.toLowerCase().includes(lowerQ))) score += 0.3;
    return { paper, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.paper);
}

// Express server setup
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Task 1: Dynamic Knowledge Base
  app.get('/api/state', (_req, res) => {
    res.json({
      sources,
      stats: {
        total_documents: vectorStore.size,
        total_sources: sources.length,
      },
      updateLogs: updateLogs.slice(-20),
      lastUpdateTime,
      modelsReady: true,
    });
  });

  app.post('/api/sources', async (req, res) => {
    const { name, url, source_type } = req.body || {};
    if (!name || !url || !source_type) {
      res.status(400).json({ error: 'Both name and URL/file path are required.' });
      return;
    }
    let targetSource = sources.find((s) => s.name === name || s.url === url);
    if (!targetSource) {
      targetSource = {
        name: String(name).trim(),
        url: String(url).trim(),
        source_type: source_type as 'web' | 'rss' | 'file',
        last_updated: null,
        is_active: true,
      };
      sources.push(targetSource);
      saveSources();
    }

    // Automatically ingest the new source right away so its chunks are immediately available
    const stats = await updateSingleSource(targetSource);
    res.json({
      sources,
      total_documents: vectorStore.size,
      ingested_chunks: stats.new_chunks,
      updateLogs: updateLogs.slice(-20),
    });
  });

  // Upload a local file directly from the user's computer into the knowledge base
  app.post('/api/sources/upload-file', (req, res) => {
    const { filename, content } = req.body || {};
    if (!filename || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Filename and non-empty file content are required.' });
      return;
    }

    const sourceName = `Local File: ${filename}`;
    let fileSource = sources.find((s) => s.name === sourceName);
    if (!fileSource) {
      fileSource = {
        name: sourceName,
        url: `local://${filename}`,
        source_type: 'file',
        last_updated: new Date().toISOString(),
        is_active: true,
      };
      sources.push(fileSource);
    } else {
      fileSource.last_updated = new Date().toISOString();
    }

    const stats = { new_chunks: 0, skipped_duplicates: 0, status: 'success' };
    processContent(content, fileSource, stats, `local://${filename}`);
    saveSources();

    updateLogs.push({
      timestamp: new Date().toISOString(),
      source: sourceName,
      stats,
    });

    res.json({
      sources,
      total_documents: vectorStore.size,
      new_chunks: stats.new_chunks,
      updateLogs: updateLogs.slice(-20),
    });
  });

  app.delete('/api/sources/:name', (req, res) => {
    const targetName = decodeURIComponent(req.params.name);
    sources = sources.filter((s) => s.name !== targetName);
    saveSources();

    for (const [id, doc] of vectorStore.entries()) {
      if (doc.metadata.source === targetName) {
        vectorStore.delete(id);
      }
    }

    res.json({ sources, total_documents: vectorStore.size });
  });

  app.post('/api/kb/update', async (_req, res) => {
    try {
      const activeSources = sources.filter((s) => s.is_active);
      const aggregateStats = {
        total_new_chunks: 0,
        total_skipped: 0,
        sources_updated: 0,
      };

      for (const src of activeSources) {
        if (src.url.startsWith('local://')) {
          aggregateStats.sources_updated += 1;
          continue;
        }
        const st = await updateSingleSource(src);
        if (st.status === 'success') {
          aggregateStats.total_new_chunks += st.new_chunks;
          aggregateStats.total_skipped += st.skipped_duplicates;
          aggregateStats.sources_updated += 1;
        }
      }

      const nowFormatted = new Date().toISOString().slice(0, 16).replace('T', ' ');
      lastUpdateTime = nowFormatted;

      updateLogs.push({
        timestamp: new Date().toISOString(),
        type: 'aggregate',
        stats: aggregateStats,
      });

      res.json({
        stats: aggregateStats,
        sources,
        total_documents: vectorStore.size,
        updateLogs: updateLogs.slice(-20),
        lastUpdateTime,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Update failed' });
    }
  });

  // Task 1 Chat — 100% Local RAG Synthesis over Internet + Local File Chunks
  app.post('/api/chat/kb', (req, res) => {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const retrieved = queryVectorStoreWithScores(message, TOP_K_RESULTS);
    const result = synthesizeLocalKBResponse(
      message,
      retrieved,
      vectorStore.size,
      sources.map((s) => s.name)
    );

    res.json(result);
  });

  // Task 2: Multi-Modal Image + Text Analysis
  app.post('/api/chat/multimodal', async (req, res) => {
    const { text = '', image_base64 = null, image_filename = '', history = [] } = req.body || {};

    let imageAnalysis: StructuredImageAnalysis | null = null;

    if (image_base64) {
      const cleanBase64 = String(image_base64).includes(',')
        ? String(image_base64).split(',')[1]
        : String(image_base64);
      const buffer = Buffer.from(cleanBase64, 'base64');
      imageAnalysis = await analyzeImageLocally(buffer, image_filename || 'uploaded_image.jpg');
    }

    const result = answerImageQuestionLocally(
      text,
      imageAnalysis,
      Array.isArray(history) ? history : []
    );

    res.json(result);
  });

  // Task 3: MedQuAD Medical Q&A
  app.get('/api/medquad/state', (_req, res) => {
    const categories = Array.from(new Set(medquadStore.map((m) => m.category)));
    res.json({
      total_pairs: medquadStore.length,
      categories: ['All', ...categories],
      pairs: medquadStore,
    });
  });

  app.post('/api/medquad/sync-github', async (_req, res) => {
    const sampleXmlUrls = [
      {
        url: 'https://raw.githubusercontent.com/abachaa/MedQuAD/master/1_CancerGov_QA/0000001_1.xml',
        category: 'Cancer',
      },
      {
        url: 'https://raw.githubusercontent.com/abachaa/MedQuAD/master/3_GHR_QA/0000001.xml',
        category: 'Genetic & Rare Diseases',
      },
      {
        url: 'https://raw.githubusercontent.com/abachaa/MedQuAD/master/5_NIDDK_QA/0000001.xml',
        category: 'Diabetes & Digestive',
      },
    ];

    let added = 0;
    for (const item of sampleXmlUrls) {
      try {
        const resp = await fetch(item.url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) continue;
        const xml = await resp.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const source = $('Document').attr('source') || 'MedQuAD GitHub XML';
        const docUrl = $('Document').attr('url') || item.url;
        const focus = $('Focus').first().text().trim() || 'Medical Topic';

        $('QAPair').each((idx, el) => {
          const pid = $(el).attr('pid') || `${idx}`;
          const q = $(el).find('Question').text().trim();
          const a = $(el).find('Answer').text().replace(/\s+/g, ' ').trim();
          if (q && a) {
            const pairId = `GH-${source}-${focus}-${pid}`.replace(/\s+/g, '_');
            if (!medquadStore.some((p) => p.id === pairId || p.question === q)) {
              medquadStore.push({
                id: pairId,
                question: q,
                answer: a,
                source: `${source} (MedQuAD XML)`,
                category: item.category,
                focus,
                url: docUrl,
              });
              added += 1;
            }
          }
        });
      } catch (err) {
        console.warn('Could not fetch sample MedQuAD XML:', err);
      }
    }

    const categories = Array.from(new Set(medquadStore.map((m) => m.category)));
    res.json({
      added_pairs: added,
      total_pairs: medquadStore.length,
      categories: ['All', ...categories],
      pairs: medquadStore,
    });
  });

  app.post('/api/chat/medical', (req, res) => {
    const { message, category = 'All' } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Medical question is required' });
      return;
    }

    const matchedPairs = searchMedQuAD(message, category, 4);
    const result = generateLocalMedicalResponse(message, matchedPairs);
    res.json(result);
  });

  // Task 4: arXiv Domain Expert
  app.get('/api/arxiv/papers', (req, res) => {
    const query = String(req.query.q || '');
    const category = String(req.query.category || 'All');
    const minYear = Number(req.query.minYear || 2017);
    const maxYear = Number(req.query.maxYear || 2026);

    const results = searchArxivStore(query, category, minYear, maxYear);

    const categoryCounts: Record<string, number> = {};
    const yearCounts: Record<number, number> = {};
    const conceptCounts: Record<string, number> = {};

    for (const p of arxivStore) {
      for (const cat of p.categories) {
        if (cat.startsWith('cs.')) {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }
      yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
      for (const c of p.key_concepts) {
        conceptCounts[c] = (conceptCounts[c] || 0) + 1;
      }
    }

    res.json({
      papers: results,
      total_indexed: arxivStore.length,
      analytics: {
        categoryCounts,
        yearCounts,
        conceptCounts,
      },
    });
  });

  app.post('/api/arxiv/fetch-live', async (req, res) => {
    const { searchQuery = 'large language models retrieval', category = 'cs.AI' } = req.body || {};
    try {
      const encodedQuery = encodeURIComponent(`cat:${category} AND all:${searchQuery}`);
      const url = `http://export.arxiv.org/api/query?search_query=${encodedQuery}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) throw new Error(`arXiv API returned ${resp.status}`);
      const xml = await resp.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      let added = 0;
      $('entry').each((_, el) => {
        const rawId = $(el).find('id').first().text().trim();
        const arxivId = rawId.split('/abs/').pop()?.replace(/v\d+$/, '') || rawId;
        const title = $(el).find('title').first().text().replace(/\s+/g, ' ').trim();
        const abstract = $(el).find('summary').first().text().replace(/\s+/g, ' ').trim();
        const published = $(el).find('published').first().text().trim();
        const year = published ? Number(published.slice(0, 4)) : new Date().getFullYear();
        const update_date = published ? published.slice(0, 10) : new Date().toISOString().slice(0, 10);

        const authors: string[] = [];
        $(el)
          .find('author > name')
          .each((__, aEl) => {
            authors.push($(aEl).text().trim());
          });

        const categories: string[] = [];
        $(el)
          .find('category')
          .each((__, cEl) => {
            const term = $(cEl).attr('term');
            if (term) categories.push(term);
          });

        if (title && abstract && !arxivStore.some((p) => p.id === arxivId || p.title === title)) {
          const words = title
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 4)
            .slice(0, 4);
          arxivStore.unshift({
            id: arxivId,
            title,
            authors: authors.length ? authors : ['arXiv Researcher'],
            abstract,
            categories: categories.length ? categories : [category],
            primary_category: categories[0] || category,
            year,
            update_date,
            key_concepts: words.length ? words : ['Computer Science', category],
            url: `https://arxiv.org/abs/${arxivId}`,
          });
          added += 1;
        }
      });

      res.json({
        added,
        total_indexed: arxivStore.length,
        papers: arxivStore,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch live arXiv papers' });
    }
  });

  app.post('/api/arxiv/summarize', (req, res) => {
    const { paperId, mode = 'summary' } = req.body || {};
    const paper = arxivStore.find((p) => p.id === paperId);
    if (!paper) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    const result = summarizeArxivLocally(
      paper,
      mode === 'explain_simply' ? 'explain_simply' : 'summary'
    );
    res.json({
      paperId: paper.id,
      mode,
      result,
    });
  });

  app.post('/api/chat/arxiv', (req, res) => {
    const { message, category = 'All' } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const topPapers = searchArxivStore(message, category, 2017, 2026).slice(0, 4);
    const result = generateLocalArxivResponse(message, topPapers);
    res.json(result);
  });

  // Task 5: Sentiment Analysis
  app.post('/api/chat/sentiment', (req, res) => {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const result = analyzeSentimentLocally(message);
    res.json(result);
  });

  // Task 6: Multilingual Support
  app.post('/api/chat/multilingual', (req, res) => {
    const { message, targetLanguage = 'auto', history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const result = processMultilingualLocally(
      message,
      targetLanguage,
      Array.isArray(history) ? history : []
    );
    res.json(result);
  });

  // Mount Vite dev server or static production assets
  const distPath = path.resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:3000');
  });
}

startServer();
