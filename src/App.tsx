import React, { useState, useEffect, useRef } from 'react';

type TaskId = 'task1' | 'task2' | 'task3' | 'task4' | 'task5' | 'task6';

interface Source {
  name: string;
  url: string;
  source_type: 'web' | 'rss' | 'file';
  last_updated: string | null;
  is_active: boolean;
}

interface UpdateLogEntry {
  timestamp: string;
  source?: string;
  type?: string;
  stats: {
    new_chunks?: number;
    total_new_chunks?: number;
  };
}

interface KBMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface ImageAnalysis {
  caption: string;
  objects: string[];
  scene_description: string;
  text_in_image: string;
  colors: string[];
  confidence: string;
  dimensions?: string;
  lighting?: string;
  edge_density?: string;
  focal_region?: string;
}

interface Task2Message {
  role: 'user' | 'assistant';
  content: string;
  has_image?: boolean;
  image_analysis?: ImageAnalysis | null;
  evidence?: string[];
  confidence?: string;
}

interface MedicalEntities {
  diseases: string[];
  symptoms: string[];
  treatments: string[];
  drugs: string[];
}

interface MedQuADPair {
  id: string;
  question: string;
  answer: string;
  source: string;
  category: string;
  focus: string;
  url: string;
}

interface Task3Message {
  role: 'user' | 'assistant';
  content: string;
  entities?: MedicalEntities;
  matched_pairs?: MedQuADPair[];
}

interface ArxivPaper {
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

interface Task4Message {
  role: 'user' | 'assistant';
  content: string;
  cited_papers?: ArxivPaper[];
}

interface SentimentData {
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  polarity: number;
  primary_emotion: string;
  emotions: Array<{ emotion: string; score: number }>;
}

interface Task5Message {
  role: 'user' | 'assistant';
  content: string;
  sentiment?: SentimentData;
  adaptive_strategy?: string;
}

interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  confidence?: number;
  is_code_mixed?: boolean;
}

interface EntityAlignment {
  concept: string;
  en: string;
  hi: string;
  es: string;
  fr: string;
}

interface Task6Message {
  role: 'user' | 'assistant';
  content: string;
  english_canonical?: string;
  detected_language?: LanguageInfo;
  ambiguity_note?: string;
  entity_alignments?: EntityAlignment[];
}

/**
 * Parses inline markdown (**bold**, *italic*, `code`) into React nodes
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={idx}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Renders markdown-formatted AI output into clean ChatGPT/Gemini-style HTML blocks
 * with bold headlines, paragraphs, and structured lists.
 */
function FormattedMessage({ content }: { content: string }) {
  const lines = (content || '').split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!listItems) return;
    if (listItems.type === 'ul') {
      elements.push(
        <ul key={`${keyPrefix}-ul`}>
          {listItems.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`${keyPrefix}-ol`}>
          {listItems.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      );
    }
    listItems = null;
  };

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList(`line-${index}`);
      return;
    }

    if (trimmed === '---' || trimmed === '***') {
      flushList(`line-${index}`);
      elements.push(<hr key={`hr-${index}`} />);
      return;
    }

    if (trimmed.startsWith('#### ')) {
      flushList(`line-${index}`);
      elements.push(<h4 key={`h4-${index}`}>{renderInlineMarkdown(trimmed.slice(5))}</h4>);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList(`line-${index}`);
      elements.push(<h3 key={`h3-${index}`}>{renderInlineMarkdown(trimmed.slice(4))}</h3>);
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList(`line-${index}`);
      elements.push(<h2 key={`h2-${index}`}>{renderInlineMarkdown(trimmed.slice(3))}</h2>);
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList(`line-${index}`);
      elements.push(<h2 key={`h1-${index}`}>{renderInlineMarkdown(trimmed.slice(2))}</h2>);
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.slice(2);
      if (!listItems || listItems.type !== 'ul') {
        flushList(`line-${index}`);
        listItems = { type: 'ul', items: [] };
      }
      listItems.items.push(renderInlineMarkdown(itemText));
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const itemText = numberedMatch[2];
      if (!listItems || listItems.type !== 'ol') {
        flushList(`line-${index}`);
        listItems = { type: 'ol', items: [] };
      }
      listItems.items.push(renderInlineMarkdown(itemText));
      return;
    }

    flushList(`line-${index}`);
    elements.push(<p key={`p-${index}`}>{renderInlineMarkdown(trimmed)}</p>);
  });

  flushList('end');

  return <div className="formatted-output">{elements}</div>;
}

function Expander({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultExpanded);
  return (
    <div className="expander">
      <button type="button" className="expander-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="expander-body">{children}</div>}
    </div>
  );
}

export default function App() {
  const [activeTask, setActiveTask] = useState<TaskId>('task1');

  // ── Feature 1 State (Dynamic KB — Internet + Local Files) ──────────────────
  const [sources, setSources] = useState<Source[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [updateLogs, setUpdateLogs] = useState<UpdateLogEntry[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(false);
  const [isUpdatingKB, setIsUpdatingKB] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState<'web' | 'rss' | 'file'>('web');
  const [sourceToRemove, setSourceToRemove] = useState('');
  const [kbMessages, setKbMessages] = useState<KBMessage[]>([]);
  const [kbInput, setKbInput] = useState('');
  const [isKbGenerating, setIsKbGenerating] = useState(false);
  const kbFileUploadRef = useRef<HTMLInputElement | null>(null);

  // ── Feature 2 State (Multi-Modal Local Vision + Text) ──────────────────────
  const [task2Messages, setTask2Messages] = useState<Task2Message[]>([]);
  const [task2Input, setTask2Input] = useState('');
  const [isTask2Generating, setIsTask2Generating] = useState(false);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
  const [currentImageName, setCurrentImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Feature 3 State (Medical Q&A - MedQuAD) ────────────────────────────────
  const [medCategories, setMedCategories] = useState<string[]>(['All']);
  const [selectedMedCategory, setSelectedMedCategory] = useState<string>('All');
  const [totalMedPairs, setTotalMedPairs] = useState<number>(12);
  const [isSyncingMedGithub, setIsSyncingMedGithub] = useState<boolean>(false);
  const [medSyncNotice, setMedSyncNotice] = useState<string | null>(null);
  const [task3Messages, setTask3Messages] = useState<Task3Message[]>([]);
  const [task3Input, setTask3Input] = useState('');
  const [isTask3Generating, setIsTask3Generating] = useState(false);

  // ── Feature 4 State (arXiv Domain Expert) ──────────────────────────────────
  const [arxivSubTab, setArxivSubTab] = useState<'chat' | 'search' | 'viz'>('chat');
  const [arxivPapers, setArxivPapers] = useState<ArxivPaper[]>([]);
  const [arxivTotalIndexed, setArxivTotalIndexed] = useState<number>(10);
  const [arxivSearchQuery, setArxivSearchQuery] = useState<string>('');
  const [arxivCategory, setArxivCategory] = useState<string>('All');
  const [arxivMinYear, setArxivMinYear] = useState<number>(2017);
  const [arxivAnalytics, setArxivAnalytics] = useState<{
    categoryCounts: Record<string, number>;
    yearCounts: Record<string, number>;
    conceptCounts: Record<string, number>;
  }>({ categoryCounts: {}, yearCounts: {}, conceptCounts: {} });
  const [isFetchingLiveArxiv, setIsFetchingLiveArxiv] = useState<boolean>(false);
  const [paperSummaries, setPaperSummaries] = useState<Record<string, { mode: string; text: string }>>({});
  const [summarizingPaperId, setSummarizingPaperId] = useState<string | null>(null);
  const [task4Messages, setTask4Messages] = useState<Task4Message[]>([]);
  const [task4Input, setTask4Input] = useState<string>('');
  const [isTask4Generating, setIsTask4Generating] = useState<boolean>(false);

  // ── Feature 5 State (Sentiment-Aware Chatbot) ──────────────────────────────
  const [task5Messages, setTask5Messages] = useState<Task5Message[]>([]);
  const [task5Input, setTask5Input] = useState<string>('');
  const [isTask5Generating, setIsTask5Generating] = useState<boolean>(false);

  // ── Feature 6 State (Multilingual Support) ─────────────────────────────────
  const [targetLanguage, setTargetLanguage] = useState<string>('auto');
  const [showCanonicalEnglish, setShowCanonicalEnglish] = useState<boolean>(true);
  const [task6Messages, setTask6Messages] = useState<Task6Message[]>([]);
  const [task6Input, setTask6Input] = useState<string>('');
  const [isTask6Generating, setIsTask6Generating] = useState<boolean>(false);
  const [entityGlossary, setEntityGlossary] = useState<EntityAlignment[]>([]);

  // Initial Data Load
  useEffect(() => {
    fetch('/api/state')
      .then((r) => r.json())
      .then((data) => {
        if (data.sources) {
          setSources(data.sources);
          if (data.sources.length > 0) setSourceToRemove(data.sources[0].name);
        }
        if (data.stats) setTotalDocuments(data.stats.total_documents || 0);
        if (data.updateLogs) setUpdateLogs(data.updateLogs);
        if (data.lastUpdateTime) setLastUpdateTime(data.lastUpdateTime);
      })
      .catch((err) => console.error('Failed to load initial KB state:', err));

    fetch('/api/medquad/state')
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setMedCategories(data.categories);
        if (data.total_pairs) setTotalMedPairs(data.total_pairs);
      })
      .catch((err) => console.error('Failed to load MedQuAD state:', err));

    loadArxivPapers('', 'All', 2017);
  }, []);

  const loadArxivPapers = (q: string, category: string, minYear: number) => {
    const params = new URLSearchParams({
      q,
      category,
      minYear: String(minYear),
      maxYear: '2026',
    });
    fetch(`/api/arxiv/papers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.papers) setArxivPapers(data.papers);
        if (data.total_indexed) setArxivTotalIndexed(data.total_indexed);
        if (data.analytics) setArxivAnalytics(data.analytics);
      })
      .catch((err) => console.error('Failed to load arXiv papers:', err));
  };

  // ── Feature 1 Handlers ─────────────────────────────────────────────────────
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      setStatusNotice({ type: 'error', text: 'Both name and URL/file path are required.' });
      return;
    }
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSourceName.trim(),
          url: newSourceUrl.trim(),
          source_type: newSourceType,
        }),
      });
      const data = await res.json();
      if (data.sources) {
        setSources(data.sources);
        if (!sourceToRemove && data.sources.length > 0) setSourceToRemove(data.sources[0].name);
      }
      if (typeof data.total_documents === 'number') {
        setTotalDocuments(data.total_documents);
      }
      if (data.updateLogs) {
        setUpdateLogs(data.updateLogs);
      }
      setNewSourceName('');
      setNewSourceUrl('');
      setStatusNotice({
        type: 'success',
        text: `Added and ingested: ${newSourceName.trim()} (+${data.ingested_chunks || 0} chunks)`,
      });
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: `Failed to add source: ${err.message}` });
    }
  };

  const handleLocalFileUploadToKB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const content = String(reader.result || '');
      try {
        const res = await fetch('/api/sources/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            content,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        if (data.sources) setSources(data.sources);
        if (typeof data.total_documents === 'number') setTotalDocuments(data.total_documents);
        if (data.updateLogs) setUpdateLogs(data.updateLogs);
        setStatusNotice({
          type: 'success',
          text: `Uploaded "${file.name}" (+${data.new_chunks || 0} chunks indexed locally)`,
        });
      } catch (err: any) {
        setStatusNotice({ type: 'error', text: `File upload failed: ${err.message}` });
      } finally {
        if (kbFileUploadRef.current) kbFileUploadRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveSource = async () => {
    const target = sourceToRemove || sources[0]?.name;
    if (!target) return;
    try {
      const res = await fetch(`/api/sources/${encodeURIComponent(target)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.sources) {
        setSources(data.sources);
        setSourceToRemove(data.sources[0]?.name || '');
      }
      if (typeof data.total_documents === 'number') setTotalDocuments(data.total_documents);
      setStatusNotice({ type: 'success', text: `Removed source: ${target}` });
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: `Failed to remove source: ${err.message}` });
    }
  };

  const handleUpdateNow = async () => {
    setIsUpdatingKB(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/kb/update', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSources(data.sources || sources);
      setTotalDocuments(data.total_documents ?? totalDocuments);
      setUpdateLogs(data.updateLogs || updateLogs);
      setLastUpdateTime(data.lastUpdateTime || null);
      setStatusNotice({
        type: 'success',
        text: `Update complete: +${data.stats?.total_new_chunks || 0} new chunks (${data.total_documents} total in local store)`,
      });
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: `Update failed: ${err.message}` });
    } finally {
      setIsUpdatingKB(false);
    }
  };

  const sendKbQuery = async (queryText: string) => {
    const prompt = queryText.trim();
    if (!prompt || isKbGenerating) return;

    setKbMessages((prev) => [...prev, { role: 'user', content: prompt, sources: [] }]);
    setKbInput('');
    setIsKbGenerating(true);

    try {
      const res = await fetch('/api/chat/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: kbMessages }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.response_text
        : `Error generating response: ${data.error || 'Unknown error'}`;

      setKbMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, sources: data.sources || [] },
      ]);
    } catch (err: any) {
      setKbMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}`, sources: [] },
      ]);
    } finally {
      setIsKbGenerating(false);
    }
  };

  const handleKbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendKbQuery(kbInput);
  };

  // ── Feature 2 Handlers ─────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setCurrentImagePreview(dataUrl);
      setCurrentImageBase64(base64Part);
      setCurrentImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const clearCurrentImage = () => {
    setCurrentImageBase64(null);
    setCurrentImagePreview(null);
    setCurrentImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTask2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = task2Input.trim();
    if (!prompt || isTask2Generating) return;

    let userDisplay = prompt;
    if (currentImageBase64 && currentImageName) {
      userDisplay = `[Attached Image: ${currentImageName}]\n\n${prompt}`;
    }

    const historySnapshot = [...task2Messages];
    setTask2Messages((prev) => [
      ...prev,
      { role: 'user', content: userDisplay, has_image: Boolean(currentImageBase64) },
    ]);
    setTask2Input('');
    setIsTask2Generating(true);

    const sentImageBase64 = currentImageBase64;
    const sentImageName = currentImageName || '';
    clearCurrentImage();

    try {
      const res = await fetch('/api/chat/multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          image_base64: sentImageBase64,
          image_filename: sentImageName,
          history: historySnapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error processing multimodal request');

      setTask2Messages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response_text,
          image_analysis: data.image_analysis || null,
          evidence: data.evidence || [],
          confidence: data.confidence || 'high',
        },
      ]);
    } catch (err: any) {
      setTask2Messages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error processing your request: ${err.message}`,
          image_analysis: null,
          evidence: [],
          confidence: 'low',
        },
      ]);
    } finally {
      setIsTask2Generating(false);
    }
  };

  // ── Feature 3 Handlers (MedQuAD Medical Q&A) ───────────────────────────────
  const handleSyncMedGithub = async () => {
    setIsSyncingMedGithub(true);
    setMedSyncNotice(null);
    try {
      const res = await fetch('/api/medquad/sync-github', { method: 'POST' });
      const data = await res.json();
      if (data.categories) setMedCategories(data.categories);
      if (data.total_pairs) setTotalMedPairs(data.total_pairs);
      setMedSyncNotice(`Synced +${data.added_pairs || 0} XML Q&A pairs from abachaa/MedQuAD.`);
    } catch (err: any) {
      setMedSyncNotice(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncingMedGithub(false);
    }
  };

  const sendMedicalQuery = async (questionText: string) => {
    const prompt = questionText.trim();
    if (!prompt || isTask3Generating) return;

    const historySnapshot = [...task3Messages];
    setTask3Messages((prev) => [...prev, { role: 'user', content: prompt }]);
    setTask3Input('');
    setIsTask3Generating(true);

    try {
      const res = await fetch('/api/chat/medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          category: selectedMedCategory,
          history: historySnapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Medical query failed');

      setTask3Messages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response_text,
          entities: data.entities,
          matched_pairs: data.matched_pairs || [],
        },
      ]);
    } catch (err: any) {
      setTask3Messages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error processing medical question: ${err.message}`,
        },
      ]);
    } finally {
      setIsTask3Generating(false);
    }
  };

  // ── Feature 4 Handlers (arXiv CS Domain Expert) ────────────────────────────
  const handleArxivFilterApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    loadArxivPapers(arxivSearchQuery, arxivCategory, arxivMinYear);
  };

  const handleFetchLiveArxiv = async () => {
    setIsFetchingLiveArxiv(true);
    try {
      const res = await fetch('/api/arxiv/fetch-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: arxivSearchQuery || 'transformer reasoning retrieval',
          category: arxivCategory === 'All' ? 'cs.AI' : arxivCategory,
        }),
      });
      const data = await res.json();
      if (data.papers) {
        loadArxivPapers(arxivSearchQuery, arxivCategory, arxivMinYear);
      }
    } catch (err) {
      console.error('Live arXiv fetch error:', err);
    } finally {
      setIsFetchingLiveArxiv(false);
    }
  };

  const handleSummarizePaper = async (paperId: string, mode: 'summary' | 'explain_simply') => {
    setSummarizingPaperId(`${paperId}_${mode}`);
    try {
      const res = await fetch('/api/arxiv/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, mode }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setPaperSummaries((prev) => ({
          ...prev,
          [paperId]: {
            mode: mode === 'explain_simply' ? 'Simplified Concept Explanation' : 'Executive Paper Summary',
            text: data.result,
          },
        }));
      }
    } catch (err) {
      console.error('Summarize error:', err);
    } finally {
      setSummarizingPaperId(null);
    }
  };

  const sendArxivExpertQuery = async (queryText: string) => {
    const prompt = queryText.trim();
    if (!prompt || isTask4Generating) return;

    const historySnapshot = [...task4Messages];
    setTask4Messages((prev) => [...prev, { role: 'user', content: prompt }]);
    setTask4Input('');
    setIsTask4Generating(true);

    try {
      const res = await fetch('/api/chat/arxiv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          category: arxivCategory,
          history: historySnapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query arXiv expert');

      setTask4Messages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response_text,
          cited_papers: data.cited_papers || [],
        },
      ]);
    } catch (err: any) {
      setTask4Messages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsTask4Generating(false);
    }
  };

  // ── Feature 5 Handlers (Sentiment-Aware Chat) ──────────────────────────────
  const sendSentimentMessage = async (textInput: string) => {
    const prompt = textInput.trim();
    if (!prompt || isTask5Generating) return;

    const historySnapshot = [...task5Messages];
    setTask5Messages((prev) => [...prev, { role: 'user', content: prompt }]);
    setTask5Input('');
    setIsTask5Generating(true);

    try {
      const res = await fetch('/api/chat/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: historySnapshot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sentiment analysis failed');

      setTask5Messages((prev) => {
        const updated = [...prev];
        const lastUserIdx = updated.length - 1;
        if (lastUserIdx >= 0 && updated[lastUserIdx].role === 'user') {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            sentiment: data.sentiment,
          };
        }
        updated.push({
          role: 'assistant',
          content: data.response_text,
          sentiment: data.sentiment,
          adaptive_strategy: data.adaptive_strategy,
        });
        return updated;
      });
    } catch (err: any) {
      setTask5Messages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsTask5Generating(false);
    }
  };

  // ── Feature 6 Handlers (Multilingual Chat) ─────────────────────────────────
  const sendMultilingualMessage = async (textInput: string) => {
    const prompt = textInput.trim();
    if (!prompt || isTask6Generating) return;

    const historySnapshot = [...task6Messages];
    setTask6Messages((prev) => [...prev, { role: 'user', content: prompt }]);
    setTask6Input('');
    setIsTask6Generating(true);

    try {
      const res = await fetch('/api/chat/multilingual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          targetLanguage,
          history: historySnapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Multilingual processing failed');

      if (Array.isArray(data.entity_alignments) && data.entity_alignments.length > 0) {
        setEntityGlossary((prev) => {
          const combined = [...data.entity_alignments, ...prev];
          const seen = new Set<string>();
          return combined
            .filter((item) => {
              const key = item.concept.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, 12);
        });
      }

      setTask6Messages((prev) => {
        const updated = [...prev];
        const lastUserIdx = updated.length - 1;
        if (lastUserIdx >= 0 && updated[lastUserIdx].role === 'user') {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            detected_language: data.detected_language,
            english_canonical: data.user_english_translation,
          };
        }
        updated.push({
          role: 'assistant',
          content: data.response_text,
          english_canonical: data.assistant_english_translation,
          detected_language: data.response_language,
          ambiguity_note: data.ambiguity_note,
          entity_alignments: data.entity_alignments || [],
        });
        return updated;
      });
    } catch (err: any) {
      setTask6Messages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsTask6Generating(false);
    }
  };

  // Compute Feature 5 Sentiment Analytics
  const userSentimentMessages = task5Messages.filter((m) => m.role === 'user' && m.sentiment);
  const avgPolarity =
    userSentimentMessages.length > 0
      ? userSentimentMessages.reduce((acc, m) => acc + (m.sentiment?.polarity || 0), 0) /
        userSentimentMessages.length
      : 0;
  const sustainedNegative =
    userSentimentMessages.length >= 2 &&
    userSentimentMessages.slice(-2).every((m) => m.sentiment?.label === 'negative');

  const taskNavItems: Array<{ id: TaskId; label: string; badge: string }> = [
    { id: 'task1', label: 'Feature 1 — Dynamic Knowledge Base', badge: 'Web + File' },
    { id: 'task2', label: 'Feature 2 — Multi-Modal Vision', badge: 'Vision' },
    { id: 'task3', label: 'Feature 3 — Medical Q&A', badge: 'MedQuAD' },
    { id: 'task4', label: 'Feature 4 — Domain Expert', badge: 'arXiv CS' },
    { id: 'task5', label: 'Feature 5 — Sentiment Analysis', badge: 'Emotion' },
    { id: 'task6', label: 'Feature 6 — Multilingual', badge: '6+ Langs' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Knowledge Assistant</h2>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Multi-Feature AI & Vision Suite
        </div>
        <hr className="divider" />

        <div>
          <h3>Select Feature</h3>
          <div className="task-radio-group">
            {taskNavItems.map((item) => (
              <div
                key={item.id}
                className={`task-radio-option ${activeTask === item.id ? 'active' : ''}`}
                onClick={() => setActiveTask(item.id)}
              >
                <span>{item.label}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider" />

        {activeTask === 'task1' && (
          <>
            <div>
              <h3>Knowledge Sources</h3>
              {sources.map((src) => (
                <div key={src.name} className="source-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      <span className={`status-dot ${src.is_active ? 'online' : 'offline'}`} />
                      <strong>{src.name}</strong>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {src.source_type}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    {src.last_updated ? `Updated: ${src.last_updated.slice(0, 16)}` : 'Seeded and Ready'}
                  </div>
                </div>
              ))}

              {/* Upload Local File from Computer */}
              <div className="source-card" style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Upload Local File (.txt, .md, .csv, .json)
                </div>
                <input
                  ref={kbFileUploadRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.log,.py,.ts"
                  onChange={handleLocalFileUploadToKB}
                  className="form-input"
                  style={{ fontSize: '0.78rem' }}
                />
              </div>

              <Expander title="Add Internet URL or Local Path">
                <form onSubmit={handleAddSource}>
                  <div className="form-field">
                    <label>Source Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g., Python Docs or Project README"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Internet URL or Workspace File Path</label>
                    <input
                      className="form-input"
                      placeholder="https://... or README.md"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Source Type</label>
                    <select
                      className="form-select"
                      value={newSourceType}
                      onChange={(e) => setNewSourceType(e.target.value as 'web' | 'rss' | 'file')}
                    >
                      <option value="web">Internet Web Page</option>
                      <option value="rss">Internet RSS Feed</option>
                      <option value="file">Local File on Disk</option>
                    </select>
                  </div>
                  <button type="submit" className="gradient-btn">
                    Add & Ingest Source
                  </button>
                </form>
              </Expander>

              {sources.length > 0 && (
                <Expander title="Remove Source">
                  <div className="form-field">
                    <label>Select source</label>
                    <select
                      className="form-select"
                      value={sourceToRemove}
                      onChange={(e) => setSourceToRemove(e.target.value)}
                    >
                      {sources.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="gradient-btn" onClick={handleRemoveSource}>
                    Remove
                  </button>
                </Expander>
              )}
            </div>

            <hr className="divider" />

            <div>
              <h3>Update Controls</h3>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="gradient-btn"
                  onClick={handleUpdateNow}
                  disabled={isUpdatingKB}
                >
                  {isUpdatingKB ? 'Updating...' : 'Update Now'}
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                  <input
                    type="checkbox"
                    checked={autoUpdateEnabled}
                    onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                  />
                  Auto
                </label>
              </div>
              {lastUpdateTime && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Last updated: {lastUpdateTime}
                </div>
              )}
              {statusNotice && (
                <div
                  style={{
                    marginTop: '0.45rem',
                    fontSize: '0.79rem',
                    color: statusNotice.type === 'success' ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  {statusNotice.text}
                </div>
              )}
            </div>

            <hr className="divider" />

            <div>
              <h3>Vector Store Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Sources</div>
                  <div className="metric-value">{sources.length}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Chunks</div>
                  <div className="metric-value">{totalDocuments}</div>
                </div>
              </div>
            </div>

            {updateLogs.length > 0 && (
              <Expander title={`Update History (${updateLogs.length})`}>
                {[...updateLogs]
                  .slice(-8)
                  .reverse()
                  .map((entry, idx) => {
                    const ts = (entry.timestamp || '').slice(0, 16).replace('T', ' ');
                    const name = entry.source || entry.type || '';
                    const added = entry.stats?.new_chunks ?? entry.stats?.total_new_chunks ?? 0;
                    return (
                      <div key={idx} className="log-entry">
                        <strong>{ts}</strong> — {name}
                        <br />
                        <span style={{ color: 'var(--text-secondary)' }}>+{added} chunks</span>
                      </div>
                    );
                  })}
              </Expander>
            )}
          </>
        )}

        {/* ── SIDEBAR: TASK 2 ──────────────────────────────────────────────── */}
        {activeTask === 'task2' && (
          <>
            <div>
              <h3>Image Upload</h3>
              <div className="form-field">
                <label>Upload an image for pixel, edge, and color analysis (JPG, PNG, WEBP)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageUpload}
                  className="form-input"
                />
              </div>
              {currentImagePreview && (
                <div style={{ marginTop: '0.45rem' }}>
                  <img
                    src={currentImagePreview}
                    alt={currentImageName || 'Uploaded'}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                  />
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.45rem' }}>
                    File: {currentImageName}
                  </div>
                  <button type="button" className="gradient-btn" onClick={clearCurrentImage}>
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <hr className="divider" />

            <div>
              <h3>Session Controls</h3>
              <button
                type="button"
                className="gradient-btn"
                onClick={() => {
                  setTask2Messages([]);
                  clearCurrentImage();
                }}
              >
                Clear Conversation
              </button>
            </div>

            <hr className="divider" />

            <div>
              <h3>Vision Architecture</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Uses <strong>Sharp Pixel & Sobel Gradient Analysis</strong> to compute:
                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem' }}>
                  <li>HSL Dominant Color Palette (%)</li>
                  <li>Sobel Edge Sharpness & Density</li>
                  <li>3x3 Spatial Focal Composition</li>
                  <li>Scene & Typography Detection</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* ── SIDEBAR: TASK 3 (MedQuAD Medical Q&A) ────────────────────────── */}
        {activeTask === 'task3' && (
          <>
            <div>
              <h3>MedQuAD Filters</h3>
              <div className="form-field">
                <label>Filter by Clinical Category</label>
                <select
                  className="form-select"
                  value={selectedMedCategory}
                  onChange={(e) => setSelectedMedCategory(e.target.value)}
                >
                  {medCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="metrics-grid" style={{ marginBottom: '0.65rem' }}>
                <div className="metric-card">
                  <div className="metric-label">Indexed Q&As</div>
                  <div className="metric-value">{totalMedPairs}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">NIH Sources</div>
                  <div className="metric-value">6</div>
                </div>
              </div>
              <button
                type="button"
                className="gradient-btn"
                onClick={handleSyncMedGithub}
                disabled={isSyncingMedGithub}
              >
                {isSyncingMedGithub ? 'Syncing XMLs...' : 'Sync Live MedQuAD GitHub XML'}
              </button>
              {medSyncNotice && (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: '0.4rem' }}>
                  {medSyncNotice}
                </div>
              )}
            </div>

            <hr className="divider" />

            <div>
              <h3>Medical NER Classification</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                <span className="entity-tag entity-disease">Disease</span>
                <span className="entity-tag entity-symptom">Symptom</span>
                <span className="entity-tag entity-treatment">Treatment</span>
                <span className="entity-tag entity-drug">Medication</span>
              </div>
            </div>

            <hr className="divider" />

            <div>
              <h3>Sample Clinical Queries</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  'What are the symptoms and treatments for Type 2 Diabetes and Metformin side effects?',
                  'How is Hypertension diagnosed and treated with Lisinopril or DASH diet?',
                  'What are the warning signs of Non-Small Cell Lung Cancer?',
                  'What medications help prevent Migraine headaches and photophobia?',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="secondary-btn"
                    style={{ textAlign: 'left' }}
                    onClick={() => sendMedicalQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SIDEBAR: TASK 4 (arXiv Domain Expert) ────────────────────────── */}
        {activeTask === 'task4' && (
          <>
            <div>
              <h3>arXiv CS Dataset Filter</h3>
              <form onSubmit={handleArxivFilterApply}>
                <div className="form-field">
                  <label>Search Title, Author, or Concept</label>
                  <input
                    className="form-input"
                    placeholder="e.g., Transformer, RAG, Mamba, Vaswani"
                    value={arxivSearchQuery}
                    onChange={(e) => setArxivSearchQuery(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>CS Category Subset</label>
                  <select
                    className="form-select"
                    value={arxivCategory}
                    onChange={(e) => {
                      setArxivCategory(e.target.value);
                      loadArxivPapers(arxivSearchQuery, e.target.value, arxivMinYear);
                    }}
                  >
                    <option value="All">All CS Categories (cs.*)</option>
                    <option value="cs.AI">cs.AI — Artificial Intelligence</option>
                    <option value="cs.CL">cs.CL — Computation & Language (NLP)</option>
                    <option value="cs.LG">cs.LG — Machine Learning</option>
                    <option value="cs.CV">cs.CV — Computer Vision</option>
                    <option value="cs.IR">cs.IR — Information Retrieval</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Minimum Publication Year: {arxivMinYear}</label>
                  <input
                    type="range"
                    min={2017}
                    max={2025}
                    value={arxivMinYear}
                    onChange={(e) => {
                      const yr = Number(e.target.value);
                      setArxivMinYear(yr);
                      loadArxivPapers(arxivSearchQuery, arxivCategory, yr);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
                <button type="submit" className="gradient-btn" style={{ marginBottom: '0.45rem' }}>
                  Filter Indexed Papers ({arxivPapers.length})
                </button>
              </form>

              <button
                type="button"
                className="secondary-btn"
                style={{ width: '100%' }}
                onClick={handleFetchLiveArxiv}
                disabled={isFetchingLiveArxiv}
              >
                {isFetchingLiveArxiv ? 'Querying Cornell arXiv API...' : 'Fetch Live Papers from arXiv API'}
              </button>
            </div>

            <hr className="divider" />

            <div>
              <h3>Sample Research Prompts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  'Compare Self-Attention in Transformers with Selective State Spaces in Mamba.',
                  'How does Corrective RAG (CRAG) mitigate hallucinations compared to standard RAG?',
                  'Explain Low-Rank Adaptation (LoRA) mathematically and why it saves memory.',
                  'How does Direct Preference Optimization (DPO) replace RLHF reward modeling?',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="secondary-btn"
                    style={{ textAlign: 'left' }}
                    onClick={() => {
                      setArxivSubTab('chat');
                      sendArxivExpertQuery(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SIDEBAR: TASK 5 (Sentiment-Aware Chatbot) ────────────────────── */}
        {activeTask === 'task5' && (
          <>
            <div>
              <h3>Conversation Telemetry</h3>
              <div className="metrics-grid" style={{ marginBottom: '0.6rem' }}>
                <div className="metric-card">
                  <div className="metric-label">Overall Sentiment</div>
                  <div className="metric-value" style={{ fontSize: '1.15rem' }}>
                    {avgPolarity > 0.15
                      ? 'Positive'
                      : avgPolarity < -0.15
                      ? 'Negative'
                      : 'Neutral'}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Avg Polarity</div>
                  <div className="metric-value" style={{ fontSize: '1.15rem' }}>
                    {avgPolarity >= 0 ? `+${avgPolarity.toFixed(2)}` : avgPolarity.toFixed(2)}
                  </div>
                </div>
              </div>

              {sustainedNegative && (
                <div className="banner-error" style={{ fontSize: '0.78rem', padding: '0.5rem 0.65rem' }}>
                  <strong>Sustained Negative Sentiment Detected:</strong> Priority Empathy & De-escalation Mode Active.
                </div>
              )}
            </div>

            <hr className="divider" />

            <div>
              <h3>Test Emotion Scenarios</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  {
                    label: 'Frustrated / Escalation',
                    text: 'I have tried resetting my configuration three times and the system keeps crashing! This is extremely frustrating!',
                  },
                  {
                    label: 'Distressed / Overwhelmed',
                    text: 'I am feeling really overwhelmed with my project release deadline and worried I will not finish in time.',
                  },
                  {
                    label: 'Positive / Satisfied',
                    text: 'The new knowledge base pipeline worked on the first try! Thank you so much, this is awesome!',
                  },
                  {
                    label: 'Neutral / Analytical',
                    text: 'What are the standard evaluation metrics for classification models?',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="secondary-btn"
                    style={{ textAlign: 'left' }}
                    onClick={() => sendSentimentMessage(item.text)}
                  >
                    <strong>{item.label}</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      "{item.text.slice(0, 62)}..."
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SIDEBAR: TASK 6 (Multilingual Support) ───────────────────────── */}
        {activeTask === 'task6' && (
          <>
            <div>
              <h3>Language Preferences</h3>
              <div className="form-field">
                <label>Response Language Mode</label>
                <select
                  className="form-select"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  <option value="auto">Auto-Detect & Match Input Language</option>
                  <option value="English">Force English (en)</option>
                  <option value="Hindi">Force Hindi (hi)</option>
                  <option value="Spanish">Force Spanish (es)</option>
                  <option value="French">Force French (fr)</option>
                  <option value="German">Force German (de)</option>
                  <option value="Bengali">Force Bengali (bn)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showCanonicalEnglish}
                  onChange={(e) => setShowCanonicalEnglish(e.target.checked)}
                />
                Show Canonical English Memory & Translation
              </label>
            </div>

            <hr className="divider" />

            <div>
              <h3>Multilingual & Code-Switching Prompts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  {
                    lang: 'Hindi (hi)',
                    text: 'मधुमेह (Diabetes) के मुख्य लक्षण और उपचार क्या हैं?',
                  },
                  {
                    lang: 'Spanish Follow-up (es)',
                    text: '¿Y qué medicamentos como la metformina se usan para tratarla?',
                  },
                  {
                    lang: 'French Switch (fr)',
                    text: 'Pouvez-vous résumer comment fonctionnent les réseaux Transformers en IA ?',
                  },
                  {
                    lang: 'Code-Mixed Hinglish (hi-en)',
                    text: 'Can you explain कि machine learning में overfitting को कैसे prevent करते हैं?',
                  },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="secondary-btn"
                    style={{ textAlign: 'left' }}
                    onClick={() => sendMultilingualMessage(sample.text)}
                  >
                    <strong>{sample.lang}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {sample.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {entityGlossary.length > 0 && (
              <>
                <hr className="divider" />
                <div>
                  <h3>Cross-Lingual Entity Glossary</h3>
                  {entityGlossary.slice(0, 5).map((ent, idx) => (
                    <div key={idx} className="source-card" style={{ fontSize: '0.76rem' }}>
                      <strong>{ent.concept}</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        EN: {ent.en} | HI: {ent.hi}
                        <br />
                        ES: {ent.es} | FR: {ent.fr}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </aside>

      <main className="main-area">
        <h1 className="main-title">Knowledge Assistant</h1>
        <p className="subtitle">
          Dynamic Knowledge Base, Image Analysis, MedQuAD Clinical Retrieval, arXiv CS Research Search, Sentiment Analysis, and Multilingual Chat
        </p>

        <hr className="divider" style={{ marginBottom: '1.25rem' }} />

        {activeTask === 'task1' && (
          <>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>
              Feature 1 — Dynamic Knowledge Base (Internet + Local Files)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 0 }}>
              Ingests live Internet Web Pages, RSS feeds, Local Workspace Files, and Uploaded User Files into the local vector store with SHA-256 deduplication and RAG synthesis.
            </p>

            <div>
              {kbMessages.length === 0 && (
                <div className="source-card" style={{ padding: '1rem' }}>
                  <strong>Sample Knowledge Base Queries:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.6rem' }}>
                    {[
                      'Who created Python and what are its main programming paradigms?',
                      'What topics are covered on Hacker News?',
                      'What are the 6 core features of the Knowledge Assistant platform?',
                      'Compare Python 2.0 and Python 3.0 release milestones.',
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="secondary-btn"
                        onClick={() => sendKbQuery(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {kbMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="chat-content">
                    <FormattedMessage content={msg.content} />
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <Expander title="Retrieved Sources & Citations">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} style={{ marginBottom: '0.25rem' }}>
                              <strong>{idx + 1}.</strong> {src}
                            </div>
                          ))}
                        </Expander>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isKbGenerating && (
                <div className="chat-message assistant-message">
                  <div className="chat-avatar ai-avatar">AI</div>
                  <div className="chat-content" style={{ color: 'var(--text-secondary)' }}>
                    Searching local vector store and synthesizing response...
                  </div>
                </div>
              )}
            </div>

            <form className="chat-input-bar" onSubmit={handleKbSubmit}>
              <div className="chat-input-inner">
                <input
                  type="text"
                  placeholder="Ask anything about your Internet sources or Local files..."
                  value={kbInput}
                  onChange={(e) => setKbInput(e.target.value)}
                  disabled={isKbGenerating}
                />
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ width: 'auto', padding: '0.45rem 1.1rem' }}
                  disabled={isKbGenerating || !kbInput.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}

        {activeTask === 'task2' && (
          <>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>
              Feature 2 — Multi-Modal AI Assistant (Text + Image Analysis)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 0 }}>
              Upload any image in the sidebar — the local <strong>Sharp Pixel, HSL Color & Sobel Edge Vision Engine</strong> inspects the image buffer locally and answers contextual questions across turns.
            </p>

            {currentImagePreview && (
              <div style={{ marginBottom: '1rem' }}>
                <Expander title="Staged Image (Ready for Local Vision Analysis)" defaultExpanded={true}>
                  <img
                    src={currentImagePreview}
                    alt={currentImageName || 'Current'}
                    style={{ maxWidth: '100%', maxHeight: '340px', borderRadius: '8px', display: 'block' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    {currentImageName} — Ask a question below or select a sample visual prompt:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {[
                      'Analyze this image and describe what you see',
                      'What are the dominant colors and lighting in this image?',
                      'What is the resolution, edge sharpness, and layout?',
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="secondary-btn"
                        onClick={() => setTask2Input(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </Expander>
              </div>
            )}

            <div>
              {task2Messages.length === 0 && !currentImagePreview && (
                <div className="source-card" style={{ padding: '1rem' }}>
                  <strong>How to test Multi-Modal Vision (Feature 2):</strong>
                  <ol style={{ margin: '0.45rem 0 0', paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Upload any <strong>JPG, PNG, or WEBP</strong> image using the sidebar uploader.</li>
                    <li>Ask <em>"What is in this image?"</em>, <em>"What colors are present?"</em>, or <em>"Is there text or diagram structure?"</em></li>
                    <li>Ask follow-up questions without re-uploading — the assistant retains extracted visual telemetry across turns.</li>
                  </ol>
                </div>
              )}

              {task2Messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="chat-content">
                    <FormattedMessage content={msg.content} />

                    {msg.image_analysis && (
                      <div style={{ marginTop: '0.8rem' }}>
                        <Expander title="Structured Vision Telemetry (Sharp Engine)" defaultExpanded={true}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div>
                              <strong>Caption:</strong> {msg.image_analysis.caption || 'N/A'}
                            </div>
                            {msg.image_analysis.dimensions && (
                              <div>
                                <strong>Resolution & Format:</strong> {msg.image_analysis.dimensions}
                              </div>
                            )}
                            {msg.image_analysis.objects?.length > 0 && (
                              <div>
                                <strong>Detected Structures:</strong> {msg.image_analysis.objects.join(' • ')}
                              </div>
                            )}
                            {msg.image_analysis.colors?.length > 0 && (
                              <div>
                                <strong>Dominant HSL Color Palette:</strong> {msg.image_analysis.colors.join(', ')}
                              </div>
                            )}
                            {msg.image_analysis.lighting && (
                              <div>
                                <strong>Lighting & Contrast:</strong> {msg.image_analysis.lighting}
                              </div>
                            )}
                            {msg.image_analysis.edge_density && (
                              <div>
                                <strong>Sobel Edge Density:</strong> {msg.image_analysis.edge_density}
                              </div>
                            )}
                            {msg.image_analysis.focal_region && (
                              <div>
                                <strong>Focal Composition:</strong> {msg.image_analysis.focal_region}
                              </div>
                            )}
                            {msg.image_analysis.scene_description && (
                              <div>
                                <strong>Scene Details:</strong> {msg.image_analysis.scene_description}
                              </div>
                            )}
                            {msg.image_analysis.text_in_image && (
                              <div>
                                <strong>Typography / Line Geometry:</strong> {msg.image_analysis.text_in_image}
                              </div>
                            )}
                            <div>
                              <strong>Confidence:</strong> {msg.image_analysis.confidence || 'high'}
                            </div>
                          </div>
                        </Expander>
                      </div>
                    )}

                    {msg.evidence && msg.evidence.length > 0 && (
                      <div style={{ marginTop: '0.45rem' }}>
                        <Expander title="Extracted Visual Evidence">
                          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                            {msg.evidence.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </Expander>
                      </div>
                    )}

                    {msg.confidence && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                        Confidence Rating: <strong>{msg.confidence.toUpperCase()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTask2Generating && (
                <div className="chat-message assistant-message">
                  <div className="chat-avatar ai-avatar">AI</div>
                  <div className="chat-content" style={{ color: 'var(--text-secondary)' }}>
                    Running local pixel, HSL color, and Sobel edge analysis...
                  </div>
                </div>
              )}
            </div>

            <form className="chat-input-bar" onSubmit={handleTask2Submit}>
              <div className="chat-input-inner">
                <input
                  type="text"
                  placeholder="Ask about the uploaded image (colors, scene, layout, resolution) or follow up..."
                  value={task2Input}
                  onChange={(e) => setTask2Input(e.target.value)}
                  disabled={isTask2Generating}
                />
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ width: 'auto', padding: '0.45rem 1.1rem' }}
                  disabled={isTask2Generating || !task2Input.trim()}
                >
                  Analyze & Send
                </button>
              </div>
            </form>
          </>
        )}

        {activeTask === 'task3' && (
          <>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>
              Feature 3 — Medical Q&A Chatbot (MedQuAD Dataset)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 0 }}>
              Local semantic retrieval over curated NIH MedQuAD Q&A pairs with automatic Medical Named Entity Recognition (Diseases, Symptoms, Treatments, Medications).
            </p>

            <div className="banner-warning">
              <strong>Medical Disclaimer:</strong> This assistant is for educational and informational purposes only using the MedQuAD dataset. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </div>

            <div>
              {task3Messages.length === 0 && (
                <div className="source-card" style={{ padding: '1rem' }}>
                  <strong>Ask any clinical question or select a sample query in the sidebar.</strong>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Active Category Filter: <strong>{selectedMedCategory}</strong> • Indexed MedQuAD Pairs: <strong>{totalMedPairs}</strong>
                  </div>
                </div>
              )}

              {task3Messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="chat-content">
                    <FormattedMessage content={msg.content} />

                    {/* Medical NER Badges */}
                    {msg.entities &&
                      (msg.entities.diseases.length > 0 ||
                        msg.entities.symptoms.length > 0 ||
                        msg.entities.treatments.length > 0 ||
                        msg.entities.drugs.length > 0) && (
                        <div style={{ marginTop: '0.8rem' }}>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                            Recognized Medical Entities (Clinical NER):
                          </div>
                          <div>
                            {msg.entities.diseases.map((d, idx) => (
                              <span key={`d-${idx}`} className="entity-tag entity-disease">
                                Disease: {d}
                              </span>
                            ))}
                            {msg.entities.symptoms.map((s, idx) => (
                              <span key={`s-${idx}`} className="entity-tag entity-symptom">
                                Symptom: {s}
                              </span>
                            ))}
                            {msg.entities.treatments.map((t, idx) => (
                              <span key={`t-${idx}`} className="entity-tag entity-treatment">
                                Treatment: {t}
                              </span>
                            ))}
                            {msg.entities.drugs.map((dr, idx) => (
                              <span key={`dr-${idx}`} className="entity-tag entity-drug">
                                Medication: {dr}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Retrieved MedQuAD Source Pairs */}
                    {msg.matched_pairs && msg.matched_pairs.length > 0 && (
                      <div style={{ marginTop: '0.8rem' }}>
                        <Expander title={`Retrieved MedQuAD Evidence (${msg.matched_pairs.length} Q&A matches)`}>
                          {msg.matched_pairs.map((pair, idx) => (
                            <div
                              key={pair.id || idx}
                              style={{
                                padding: '0.55rem 0',
                                borderBottom:
                                  idx < msg.matched_pairs!.length - 1
                                    ? '1px solid var(--border-subtle)'
                                    : 'none',
                              }}
                            >
                              <div>
                                <strong>[{pair.id}] {pair.question}</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', margin: '0.15rem 0' }}>
                                Source: {pair.source} • Category: {pair.category} • Focus: {pair.focus}
                              </div>
                              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                {pair.answer}
                              </div>
                            </div>
                          ))}
                        </Expander>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTask3Generating && (
                <div className="chat-message assistant-message">
                  <div className="chat-avatar ai-avatar">AI</div>
                  <div className="chat-content" style={{ color: 'var(--text-secondary)' }}>
                    Extracting medical entities and retrieving MedQuAD clinical pairs...
                  </div>
                </div>
              )}
            </div>

            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                sendMedicalQuery(task3Input);
              }}
            >
              <div className="chat-input-inner">
                <input
                  type="text"
                  placeholder="Ask a medical question (symptoms, diseases, treatments, medications)..."
                  value={task3Input}
                  onChange={(e) => setTask3Input(e.target.value)}
                  disabled={isTask3Generating}
                />
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ width: 'auto', padding: '0.45rem 1.1rem' }}
                  disabled={isTask3Generating || !task3Input.trim()}
                >
                  Ask MedQuAD
                </button>
              </div>
            </form>
          </>
        )}

        {activeTask === 'task4' && (
          <>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>
              Feature 4 — Domain Expert Chatbot (arXiv Computer Science)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 0 }}>
              Scientific paper search, executive summarization, simplified concept explanations, and research trend visualizations on the arXiv Computer Science corpus.
            </p>

            {/* Sub-navigation tabs */}
            <div className="subtab-bar">
              <button
                type="button"
                className={`subtab-btn ${arxivSubTab === 'chat' ? 'active' : ''}`}
                onClick={() => setArxivSubTab('chat')}
              >
                Domain Expert Chat
              </button>
              <button
                type="button"
                className={`subtab-btn ${arxivSubTab === 'search' ? 'active' : ''}`}
                onClick={() => setArxivSubTab('search')}
              >
                Paper Explorer & Summarizer ({arxivPapers.length})
              </button>
              <button
                type="button"
                className={`subtab-btn ${arxivSubTab === 'viz' ? 'active' : ''}`}
                onClick={() => setArxivSubTab('viz')}
              >
                Concept & Trend Visualizations
              </button>
            </div>

            {arxivSubTab === 'chat' && (
              <>
                <div>
                  {task4Messages.length === 0 && (
                    <div className="source-card" style={{ padding: '1rem' }}>
                      <strong>Ask complex Computer Science & AI research questions</strong>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                        The Domain Expert retrieves relevant arXiv CS abstracts, synthesizes technical findings with bold headlines and structured points, and cites primary papers.
                      </div>
                    </div>
                  )}

                  {task4Messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                    >
                      <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                        {msg.role === 'user' ? 'YOU' : 'AI'}
                      </div>
                      <div className="chat-content">
                        <FormattedMessage content={msg.content} />

                        {msg.cited_papers && msg.cited_papers.length > 0 && (
                          <div style={{ marginTop: '0.8rem' }}>
                            <Expander title={`Cited arXiv Papers (${msg.cited_papers.length})`}>
                              {msg.cited_papers.map((p) => (
                                <div key={p.id} style={{ marginBottom: '0.55rem' }}>
                                  <strong>[arXiv:{p.id}] {p.title}</strong> ({p.year})
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    {p.authors.join(', ')} • Categories: {p.categories.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </Expander>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTask4Generating && (
                    <div className="chat-message assistant-message">
                      <div className="chat-avatar ai-avatar">AI</div>
                      <div className="chat-content" style={{ color: 'var(--text-secondary)' }}>
                        Searching local arXiv CS index and synthesizing domain expert explanation...
                      </div>
                    </div>
                  )}
                </div>

                <form
                  className="chat-input-bar"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendArxivExpertQuery(task4Input);
                  }}
                >
                  <div className="chat-input-inner">
                    <input
                      type="text"
                      placeholder="Ask about an arXiv paper, algorithm, architecture, or follow-up question..."
                      value={task4Input}
                      onChange={(e) => setTask4Input(e.target.value)}
                      disabled={isTask4Generating}
                    />
                    <button
                      type="submit"
                      className="gradient-btn"
                      style={{ width: 'auto', padding: '0.45rem 1.1rem' }}
                      disabled={isTask4Generating || !task4Input.trim()}
                    >
                      Ask Expert
                    </button>
                  </div>
                </form>
              </>
            )}

            {arxivSubTab === 'search' && (
              <div>
                {arxivPapers.map((paper) => (
                  <div key={paper.id} className="paper-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.16)',
                            color: 'var(--primary-light)',
                            marginRight: '0.5rem',
                            fontWeight: 600,
                          }}
                        >
                          arXiv:{paper.id}
                        </span>
                        <strong style={{ fontSize: '1.04rem' }}>{paper.title}</strong>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                        {paper.year} • {paper.categories.join(', ')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.55rem' }}>
                      Authors: {paper.authors.join(', ')}
                    </div>

                    <div style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.65rem', color: '#e2e8f0' }}>
                      {paper.abstract}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {paper.key_concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.73rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-light)',
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleSummarizePaper(paper.id, 'summary')}
                        disabled={summarizingPaperId === `${paper.id}_summary`}
                      >
                        {summarizingPaperId === `${paper.id}_summary` ? 'Summarizing...' : 'Summarize Paper'}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleSummarizePaper(paper.id, 'explain_simply')}
                        disabled={summarizingPaperId === `${paper.id}_explain_simply`}
                      >
                        {summarizingPaperId === `${paper.id}_explain_simply` ? 'Explaining...' : 'Explain Concept Simply'}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setArxivSubTab('chat');
                          sendArxivExpertQuery(`Tell me more about the methodology and key contributions of "${paper.title}" (arXiv:${paper.id}).`);
                        }}
                      >
                        Discuss in Expert Chat
                      </button>
                    </div>

                    {paperSummaries[paper.id] && (
                      <div
                        style={{
                          marginTop: '0.85rem',
                          padding: '1rem',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.06)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                        }}
                      >
                        <FormattedMessage content={paperSummaries[paper.id].text} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {arxivSubTab === 'viz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="paper-card">
                  <h4 style={{ marginTop: 0 }}>CS Category Distribution (arXiv Subset)</h4>
                  {Object.entries(arxivAnalytics.categoryCounts).map(([cat, count]) => {
                    const maxCount = Math.max(...Object.values(arxivAnalytics.categoryCounts), 1);
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={cat} className="bar-row">
                        <div style={{ width: '90px', fontWeight: 600 }}>{cat}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ width: '65px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {count} papers
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="paper-card">
                  <h4 style={{ marginTop: 0 }}>Research Publication Timeline by Year</h4>
                  {Object.entries(arxivAnalytics.yearCounts)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([yr, count]) => {
                      const maxYr = Math.max(...Object.values(arxivAnalytics.yearCounts), 1);
                      const pct = Math.round((count / maxYr) * 100);
                      return (
                        <div key={yr} className="bar-row">
                          <div style={{ width: '90px', fontWeight: 600 }}>{yr}</div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ width: '65px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                            {count} papers
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="paper-card">
                  <h4 style={{ marginTop: 0 }}>Key Concept Index (Select a concept to query the Domain Expert)</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(arxivAnalytics.conceptCounts).map(([concept, count]) => (
                      <button
                        key={concept}
                        type="button"
                        className="secondary-btn"
                        style={{
                          fontSize: count > 1 ? '0.9rem' : '0.8rem',
                          borderColor: count > 1 ? 'var(--primary)' : 'var(--border-subtle)',
                        }}
                        onClick={() => {
                          setArxivSubTab('chat');
                          sendArxivExpertQuery(`Explain the concept of "${concept}" and how it is used in modern Computer Science research.`);
                        }}
                      >
                        {concept} ({count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTask === 'task5' && (
          <>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>
              Feature 5 — Sentiment-Aware & Emotionally Adaptive Chatbot
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 0 }}>
              Local VADER-style valence and fine-grained emotion classifier that detects user emotions in real time, adapts its response strategy, and tracks polarity shifts.
            </p>

            {userSentimentMessages.length > 0 && (
              <div className="paper-card" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.55rem' }}>
                  Conversation Sentiment Polarity Timeline (-1.0 Negative to +1.0 Positive)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: '74px', paddingTop: '0.5rem' }}>
                  {userSentimentMessages.map((m, idx) => {
                    const pol = m.sentiment?.polarity ?? 0;
                    const normalizedHeight = Math.max(18, Math.round(((pol + 1) / 2) * 60));
                    const barColor =
                      m.sentiment?.label === 'positive'
                        ? 'var(--success)'
                        : m.sentiment?.label === 'negative'
                        ? 'var(--error)'
                        : 'var(--primary-light)';
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: `${normalizedHeight}px`,
                            background: barColor,
                            borderRadius: '4px 4px 2px 2px',
                          }}
                          title={`Turn ${idx + 1}: ${m.sentiment?.label} (${pol.toFixed(2)})`}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          T{idx + 1} ({pol >= 0 ? `+${pol.toFixed(1)}` : pol.toFixed(1)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              {task5Messages.length === 0 && (
                <div className="source-card" style={{ padding: '1rem' }}>
                  <strong>Send a message or select one of the emotion test scenarios in the sidebar.</strong>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Each message displays a live sentiment classification badge, confidence score, fine-grained emotion distribution, and the assistant's adaptive response strategy.
                  </div>
                </div>
              )}

              {task5Messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="chat-content">
                    {msg.role === 'user' && msg.sentiment && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <span
                          className={`entity-tag ${
                            msg.sentiment.label === 'positive'
                              ? 'entity-treatment'
                              : msg.sentiment.label === 'negative'
                              ? 'entity-disease'
                              : 'entity-drug'
                          }`}
                        >
                          Sentiment: {msg.sentiment.label.toUpperCase()} ({Math.round((msg.sentiment.confidence || 0.9) * 100)}%)
                        </span>
                        <span className="entity-tag entity-symptom">
                          Primary Emotion: {msg.sentiment.primary_emotion}
                        </span>
                        {msg.sentiment.emotions?.slice(0, 3).map((em, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.73rem',
                              color: 'var(--text-secondary)',
                              alignSelf: 'center',
                            }}
                          >
                            {em.emotion}: {Math.round(em.score * 100)}%
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.adaptive_strategy && (
                      <div style={{ marginBottom: '0.55rem' }}>
                        <span className="entity-tag entity-drug">
                          Response Strategy: {msg.adaptive_strategy}
                        </span>
                      </div>
                    )}

                    <FormattedMessage content={msg.content} />
                  </div>
                </div>
              ))}

              {isTask5Generating && (
                <div className="chat-message assistant-message">
                  <div className="chat-avatar ai-avatar">AI</div>
                  <div className="chat-content" style={{ color: 'var(--text-secondary)' }}>
                    Analyzing sentiment polarity and adapting emotional response tone...
                  </div>
                </div>
              )}
            </div>

            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                sendSentimentMessage(task5Input);
              }}
            >
              <div className="chat-input-inner">
                <input
                  type="text"
                  placeholder="Express satisfaction, frustration, concern, or ask a question to test sentiment adaptation..."
                  value={task5Input}
                  onChange={(e) => setTask5Input(e.target.value)}
                  disabled={isTask5Generating}
                />
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ width: 'auto', padding: '0.45rem 1.1rem' }}
                  disabled={isTask5Generating || !task5Input.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}

        {activeTask === 'task6' && (
          <>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>
              Feature 6 — Multilingual Conversational Support
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 0 }}>
              Local script and n-gram language identification, mid-conversation language switching, mixed-language (code-switching) handling, and cross-lingual context retention across English, Hindi, Spanish, French, German, and Bengali.
            </p>

            <div>
              {task6Messages.length === 0 && (
                <div className="source-card" style={{ padding: '1rem' }}>
                  <strong>Start a conversation in any supported language or switch languages mid-session.</strong>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Select the sample prompts in the sidebar to test Hindi, Spanish, French, and Code-Mixed Hinglish while preserving full conversational memory.
                  </div>
                </div>
              )}

              {task6Messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </div>
                  <div className="chat-content">
                    {msg.detected_language && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <span className="entity-tag entity-drug">
                          Language: {msg.detected_language.name} ({msg.detected_language.code.toUpperCase()})
                          {typeof msg.detected_language.confidence === 'number'
                            ? ` • ${Math.round(msg.detected_language.confidence * 100)}%`
                            : ''}
                        </span>
                        {msg.detected_language.is_code_mixed && (
                          <span className="entity-tag entity-symptom">
                            Code-Mixed Input Detected
                          </span>
                        )}
                      </div>
                    )}

                    <FormattedMessage content={msg.content} />

                    {showCanonicalEnglish &&
                      msg.english_canonical &&
                      msg.detected_language?.code !== 'en' && (
                        <div
                          style={{
                            marginTop: '0.65rem',
                            padding: '0.55rem 0.8rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderLeft: '3px solid var(--primary)',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <strong>Canonical English Context:</strong> {msg.english_canonical}
                        </div>
                      )}

                    {msg.ambiguity_note && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: '0.45rem' }}>
                        <strong>Cross-Lingual Disambiguation:</strong> {msg.ambiguity_note}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTask6Generating && (
                <div className="chat-message assistant-message">
                  <div className="chat-avatar ai-avatar">AI</div>
                  <div className="chat-content" style={{ color: 'var(--text-secondary)' }}>
                    Detecting language, aligning cross-lingual context, and generating response...
                  </div>
                </div>
              )}
            </div>

            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                sendMultilingualMessage(task6Input);
              }}
            >
              <div className="chat-input-inner">
                <input
                  type="text"
                  placeholder="Type in English, Hindi, Spanish, French, German, Bengali, or mixed language..."
                  value={task6Input}
                  onChange={(e) => setTask6Input(e.target.value)}
                  disabled={isTask6Generating}
                />
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ width: 'auto', padding: '0.45rem 1.1rem' }}
                  disabled={isTask6Generating || !task6Input.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
