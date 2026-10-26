"""
Main Streamlit application for the AI Knowledge Assistant.
Entry point for all tasks — implements Task 1 (Dynamic KB) and Task 2 (Multi-Modal Assistant).
"""
import streamlit as st
import sys
import os
import time
from datetime import datetime

# Ensure project root is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file (for GEMINI_API_KEY etc.)
from dotenv import load_dotenv
load_dotenv()

import config
from tasks.task1_dynamic_kb.sources import SourceManager
from tasks.task1_dynamic_kb.updater import KnowledgeBaseUpdater

# ── Page Config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Knowledge Assistant",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Custom CSS — Premium Dark Theme ──────────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    :root {
        --primary: #6C63FF;
        --primary-light: #8B83FF;
        --accent: #00D4AA;
        --accent-light: #33DDBB;
        --bg-dark: #0A0E14;
        --bg-card: rgba(255, 255, 255, 0.04);
        --bg-card-hover: rgba(255, 255, 255, 0.08);
        --border-subtle: rgba(255, 255, 255, 0.08);
        --text-primary: #E6EDF3;
        --text-secondary: #8B949E;
        --success: #3FB950;
        --warning: #D29922;
        --error: #F85149;
    }
    
    /* Global */
    .stApp {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0D1117 0%, #161B22 100%);
        border-right: 1px solid var(--border-subtle);
    }
    
    section[data-testid="stSidebar"] .stMarkdown h1,
    section[data-testid="stSidebar"] .stMarkdown h2,
    section[data-testid="stSidebar"] .stMarkdown h3 {
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }
    
    /* Gradient buttons */
    .stButton > button {
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        border: none;
        color: white;
        border-radius: 10px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(108, 99, 255, 0.2);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
    }
    
    .stButton > button:active {
        transform: translateY(0);
    }
    
    /* Chat messages — glassmorphism */
    .stChatMessage {
        background: var(--bg-card) !important;
        backdrop-filter: blur(12px);
        border: 1px solid var(--border-subtle);
        border-radius: 12px !important;
        margin-bottom: 0.75rem;
        animation: slideUp 0.4s ease-out;
    }
    
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Expander styling */
    .streamlit-expanderHeader {
        background: var(--bg-card);
        border-radius: 8px;
        border: 1px solid var(--border-subtle);
        font-weight: 500;
    }
    
    /* Metrics */
    [data-testid="stMetric"] {
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        padding: 1rem;
    }
    
    [data-testid="stMetricValue"] {
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }
    
    /* Source cards */
    .source-card {
        background: var(--bg-card);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        transition: all 0.2s ease;
    }
    
    .source-card:hover {
        background: var(--bg-card-hover);
        border-color: var(--primary);
    }
    
    /* Status badges */
    .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .status-active { background: rgba(63, 185, 80, 0.15); color: var(--success); }
    .status-inactive { background: rgba(248, 81, 73, 0.15); color: var(--error); }
    
    /* Title gradient */
    .main-title {
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 50%, var(--primary-light) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin-bottom: 0;
    }
    
    .subtitle {
        color: var(--text-secondary);
        font-size: 1.1rem;
        font-weight: 400;
        margin-top: 0;
    }
    
    /* Log entries */
    .log-entry {
        background: var(--bg-card);
        border-left: 3px solid var(--accent);
        border-radius: 0 8px 8px 0;
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.4rem;
        font-size: 0.85rem;
    }
    
    /* Remove default streamlit padding for cleaner look */
    .block-container {
        padding-top: 2rem;
    }
</style>
""", unsafe_allow_html=True)


# ── Lazy Initialization ─────────────────────────────────────────────────────
@st.cache_resource(show_spinner=False)
def load_embedding_manager():
    """Load the embedding model once and cache it across reruns."""
    from core.embeddings import EmbeddingManager
    return EmbeddingManager(model_name=config.EMBEDDING_MODEL)


@st.cache_resource(show_spinner=False)
def load_vector_store(_embedding_manager):
    """Load the vector store once and cache it across reruns.
    Accepts embedding_manager to avoid VectorStore creating a duplicate."""
    from core.vector_store import VectorStore
    return VectorStore(
        collection_name="knowledge_base",
        persist_dir=config.CHROMA_PERSIST_DIR,
        embedding_manager=_embedding_manager,
    )


@st.cache_resource(show_spinner=False)
def load_chatbot():
    """Load the chatbot LLM once and cache it across reruns."""
    from core.chatbot import ChatBot
    return ChatBot(model_name=config.MODEL_NAME)


def initialize_session_state():
    """Initialize all session state variables."""
    if "initialized" not in st.session_state:
        st.session_state.messages = []
        st.session_state.models_ready = False
        st.session_state.last_update_time = None
        st.session_state.auto_update_enabled = False
        st.session_state.initialized = True
    # Source manager always works (no ML model needed) — load immediately
    if "source_manager" not in st.session_state:
        st.session_state.source_manager = SourceManager()
    # Set defaults so the rest of the UI can always reference these keys
    st.session_state.setdefault("embedding_manager", None)
    st.session_state.setdefault("vector_store", None)
    st.session_state.setdefault("chatbot", None)
    st.session_state.setdefault("updater", None)
    # Task 2: Multi-Modal Assistant state
    st.session_state.setdefault("multimodal_chat", None)
    st.session_state.setdefault("task2_messages", [])
    st.session_state.setdefault("current_image_bytes", None)
    st.session_state.setdefault("current_image_name", None)


def try_load_models():
    """Attempt to load models with graceful fallback. Shows inline status."""
    errors = []

    # Step 1 — Embedding model (small, fast)
    try:
        with st.spinner("🔄 Loading embedding model..."):
            st.session_state.embedding_manager = load_embedding_manager()
    except Exception as e:
        errors.append(f"Embedding model: {e}")
        st.session_state.embedding_manager = None

    # Step 2 — Vector store (depends on embedding model)
    try:
        with st.spinner("🔄 Connecting to vector database..."):
            if st.session_state.embedding_manager is not None:
                st.session_state.vector_store = load_vector_store(
                    st.session_state.embedding_manager
                )
            else:
                errors.append("Vector store: skipped (embedding model not available)")
                st.session_state.vector_store = None
    except Exception as e:
        errors.append(f"Vector store: {e}")
        st.session_state.vector_store = None

    # Step 3 — Gemini API (lightweight, just sets up the client)
    try:
        with st.spinner("🔄 Connecting to Gemini API..."):
            st.session_state.chatbot = load_chatbot()
    except Exception as e:
        errors.append(f"Language model: {e}")
        st.session_state.chatbot = None

    st.session_state.models_ready = (
        st.session_state.embedding_manager is not None
        and st.session_state.vector_store is not None
        and st.session_state.chatbot is not None
    )

    # Updater needs embedding + vector store
    if st.session_state.embedding_manager and st.session_state.vector_store:
        st.session_state.updater = KnowledgeBaseUpdater(
            vector_store=st.session_state.vector_store,
            source_manager=st.session_state.source_manager,
            embedding_manager=st.session_state.embedding_manager,
        )
    else:
        st.session_state.updater = None

    # Task 2: MultiModal chat — reuses the same Gemini client
    if st.session_state.chatbot and st.session_state.chatbot.model_loaded:
        if st.session_state.multimodal_chat is None:
            from tasks.task2_multimodal.multimodal_chat import MultiModalChat
            st.session_state.multimodal_chat = MultiModalChat(
                client=st.session_state.chatbot.client,
                model_name=config.MODEL_NAME,
            )

    return errors


# ── Run Initialization (session state only — no heavy loading yet) ───────────
initialize_session_state()


# ══════════════════════════════════════════════════════════════════════════════
#  SIDEBAR
# ══════════════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown("## 🧠 AI Knowledge Assistant")
    st.markdown("---")
    
    # ── Task Navigation ──────────────────────────────────────────────────
    active_task = st.radio(
        "Select Task",
        ["📚 Task 1 — Dynamic KB", "🖼️ Task 2 — Multi-Modal"],
        key="active_task",
        horizontal=True,
    )
    st.markdown("---")
    
    # ── Task 1 Sidebar Controls ──────────────────────────────────────────
    if active_task == "📚 Task 1 — Dynamic KB":
        # ── Knowledge Sources ────────────────────────────────────────────
        st.markdown("### 📡 Knowledge Sources")
    
        sources = st.session_state.source_manager.get_all_sources()
        
        if sources:
            for src in sources:
                status = "active" if src.is_active else "inactive"
                icon = "🟢" if src.is_active else "🔴"
                type_icons = {"web": "🌐", "rss": "📡", "file": "📄"}
                type_icon = type_icons.get(src.source_type, "📎")
                
                st.markdown(
                    f'<div class="source-card">'
                    f'{icon} <strong>{src.name}</strong> {type_icon}<br/>'
                    f'<span style="color: var(--text-secondary); font-size: 0.8rem;">'
                    f'{src.source_type.upper()} • '
                    f'{"Updated: " + src.last_updated[:16] if src.last_updated else "Not yet updated"}'
                    f'</span></div>',
                    unsafe_allow_html=True
                )
        else:
            st.info("No sources configured yet.")
        
        # Add new source
        with st.expander("➕ Add New Source", expanded=False):
            with st.form("add_source_form", clear_on_submit=True):
                new_name = st.text_input("Source Name", placeholder="e.g., Python Docs")
                new_url = st.text_input("URL or File Path", placeholder="https://...")
                new_type = st.selectbox("Source Type", config.SUPPORTED_SOURCE_TYPES, 
                                       format_func=lambda x: {"web": "🌐 Web Page", "rss": "📡 RSS Feed", "file": "📄 Local File"}[x])
                submitted = st.form_submit_button("Add Source", use_container_width=True)
                
                if submitted:
                    if new_name and new_url:
                        st.session_state.source_manager.add_source(new_name, new_url, new_type)
                        st.success(f"✅ Added: {new_name}")
                        time.sleep(0.5)
                        st.rerun()
                    else:
                        st.error("Both name and URL are required.")
        
        # Remove source
        if sources:
            with st.expander("🗑️ Remove Source", expanded=False):
                source_to_remove = st.selectbox("Select source", [s.name for s in sources], key="remove_select")
                if st.button("Remove", use_container_width=True, key="remove_btn"):
                    st.session_state.source_manager.remove_source(source_to_remove)
                    if st.session_state.vector_store:
                        st.session_state.vector_store.delete_by_source(source_to_remove)
                    st.success(f"🗑️ Removed: {source_to_remove}")
                    time.sleep(0.5)
                    st.rerun()
        
        st.markdown("---")
        
        # ── Update Controls ──────────────────────────────────────────────
        st.markdown("### ⚡ Update Controls")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Update Now", use_container_width=True, disabled=st.session_state.updater is None):
                with st.spinner("Fetching & processing sources..."):
                    try:
                        stats = st.session_state.updater.update_all_sources()
                        st.session_state.last_update_time = datetime.now().strftime("%Y-%m-%d %H:%M")
                        st.success(f"✅ Done! +{stats['total_new_chunks']} chunks from {stats['sources_updated']} sources")
                    except Exception as e:
                        st.error(f"Update failed: {e}")
        
        with col2:
            auto_update = st.toggle("Auto", value=st.session_state.auto_update_enabled, key="auto_toggle")
            st.session_state.auto_update_enabled = auto_update
        
        if st.session_state.last_update_time:
            st.caption(f"Last updated: {st.session_state.last_update_time}")
        
        st.markdown("---")
        
        # ── Database Stats ───────────────────────────────────────────────
        st.markdown("### 📊 Database Stats")
        
        stat_col1, stat_col2 = st.columns(2)
        with stat_col1:
            st.metric("Sources", len(sources))
        with stat_col2:
            if st.session_state.vector_store:
                try:
                    stats = st.session_state.vector_store.get_collection_stats()
                    st.metric("Documents", stats.get("total_documents", 0))
                except Exception:
                    st.metric("Documents", "—")
            else:
                st.metric("Documents", "—")
        
        # ── Update History ───────────────────────────────────────────────
        if st.session_state.updater:
            logs = st.session_state.updater.get_update_log()
            if logs:
                with st.expander(f"📋 Update History ({len(logs)} entries)"):
                    for log_entry in reversed(logs[-10:]):  # Show last 10
                        ts = log_entry.get("timestamp", "")[:16]
                        source_name = log_entry.get("source", log_entry.get("type", ""))
                        stats = log_entry.get("stats", {})
                        st.markdown(
                            f'<div class="log-entry">'
                            f'<strong>{ts}</strong> — {source_name}<br/>'
                            f'<span style="color: var(--text-secondary);">'
                            f'+{stats.get("new_chunks", stats.get("total_new_chunks", 0))} chunks'
                            f'</span></div>',
                            unsafe_allow_html=True
                        )

    # ── Task 2 Sidebar Controls ──────────────────────────────────────────
    elif active_task == "🖼️ Task 2 — Multi-Modal":
        st.markdown("### 🖼️ Image Upload")
        
        uploaded_file = st.file_uploader(
            "Upload an image to analyze",
            type=["jpg", "jpeg", "png", "webp"],
            key="image_uploader",
        )
        
        if uploaded_file is not None:
            st.session_state.current_image_bytes = uploaded_file.getvalue()
            st.session_state.current_image_name = uploaded_file.name
            st.image(uploaded_file, caption=f"📷 {uploaded_file.name}", use_container_width=True)
        
        if st.session_state.current_image_bytes:
            if st.button("🗑️ Clear Image", use_container_width=True):
                st.session_state.current_image_bytes = None
                st.session_state.current_image_name = None
                st.rerun()
        
        st.markdown("---")
        
        st.markdown("### 💬 Chat Controls")
        if st.button("🗑️ Clear Conversation", use_container_width=True, key="clear_t2"):
            st.session_state.task2_messages = []
            if st.session_state.multimodal_chat:
                st.session_state.multimodal_chat.clear_history()
            st.session_state.current_image_bytes = None
            st.session_state.current_image_name = None
            st.rerun()
        
        st.markdown("---")
        st.markdown("### ℹ️ How to Use")
        st.markdown(
            "1. **Upload** an image using the uploader above\n"
            "2. **Ask** questions about the image in the chat\n"
            "3. **Follow up** — context is maintained across turns\n"
            "4. You can also chat **without** images"
        )


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN CONTENT
# ══════════════════════════════════════════════════════════════════════════════

# Header
st.markdown('<h1 class="main-title">AI Knowledge Assistant</h1>', unsafe_allow_html=True)
st.markdown('<p class="subtitle">Ask anything — powered by your dynamic knowledge base 🧠</p>', unsafe_allow_html=True)

# ── Load models AFTER header so the page is never blank ──────────────────────
model_errors = try_load_models()

# Model status banner
if model_errors:
    with st.expander("⚠️ Some models failed to load — running in fallback mode", expanded=True):
        for err in model_errors:
            st.warning(err)
        st.info(
            "💡 **Tip**: Make sure your `GEMINI_API_KEY` is set. "
            "Get a free key at [Google AI Studio](https://aistudio.google.com/apikey) "
            "and add it to a `.env` file in the project root:\n\n"
            "`GEMINI_API_KEY=your_key_here`"
        )
elif st.session_state.models_ready:
    st.success("✅ All models loaded and ready!", icon="🚀")

st.markdown("---")


# ══════════════════════════════════════════════════════════════════════════════
#  TASK 1 — Dynamic Knowledge Base Chat
# ══════════════════════════════════════════════════════════════════════════════
if active_task == "📚 Task 1 — Dynamic KB":

    # Display chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"], avatar="🧑‍💻" if msg["role"] == "user" else "🤖"):
            st.markdown(msg["content"])
            if msg.get("sources"):
                with st.expander("📚 Sources & Context"):
                    for i, src in enumerate(msg["sources"], 1):
                        st.markdown(f"**{i}.** {src}")

    # Chat input
    if prompt := st.chat_input("Ask a question about your knowledge base..."):
        # Display user message
        st.session_state.messages.append({"role": "user", "content": prompt, "sources": []})
        with st.chat_message("user", avatar="🧑‍💻"):
            st.markdown(prompt)
        
        # Generate response
        with st.chat_message("assistant", avatar="🤖"):
            sources_used = []
            
            with st.spinner("🔍 Searching knowledge base & generating response..."):
                # Step 1: Retrieve context from vector store
                context = ""
                if st.session_state.vector_store:
                    try:
                        results = st.session_state.vector_store.query(prompt, n_results=config.TOP_K_RESULTS)
                        if results and results.get("documents") and results["documents"][0]:
                            docs = results["documents"][0]
                            metadatas = results.get("metadatas", [[]])[0]
                            
                            context_parts = []
                            for i, doc in enumerate(docs):
                                context_parts.append(doc)
                                if i < len(metadatas) and metadatas[i]:
                                    source_info = metadatas[i].get("source", "Unknown")
                                    url_info = metadatas[i].get("url", "")
                                    sources_used.append(f"**{source_info}** — {url_info}")
                            
                            context = "\n\n---\n\n".join(context_parts)
                    except Exception as e:
                        st.warning(f"⚠️ Could not search knowledge base: {e}")
                
                # Step 2: Generate response with LLM
                if st.session_state.chatbot and st.session_state.chatbot.model_loaded:
                    try:
                        system_prompt = (
                            "You are a helpful AI Knowledge Assistant. Answer the user's question "
                            "based on the provided context. If the context doesn't contain relevant "
                            "information, say so honestly and provide what help you can. "
                            "Be concise, accurate, and cite sources when possible."
                        )
                        response_text = st.session_state.chatbot.generate_response(
                            user_message=prompt,
                            context=context,
                            system_prompt=system_prompt
                        )
                    except Exception as e:
                        response_text = f"I encountered an error while generating a response: {e}"
                else:
                    # Fallback response
                    if context:
                        response_text = (
                            f"🔍 **Found relevant information in the knowledge base:**\n\n"
                            f"{context[:1500]}\n\n"
                            f"---\n"
                            f"*Note: The language model is not loaded, so I'm showing raw search results. "
                            f"Please install/download the LLM for generated responses.*"
                        )
                    else:
                        response_text = (
                            f"I received your question: **\"{prompt}\"**\n\n"
                            f"However, I'm running in fallback mode:\n"
                            f"- The knowledge base {'is empty — try adding sources and clicking Update Now' if st.session_state.vector_store else 'could not be loaded'}.\n"
                            f"- The language model is not loaded.\n\n"
                            f"💡 Add some sources in the sidebar and update the knowledge base to get started!"
                        )
            
            st.markdown(response_text)
            
            # Show sources
            if sources_used:
                with st.expander("📚 Sources & Context"):
                    unique_sources = list(dict.fromkeys(sources_used))  # Deduplicate preserving order
                    for i, src in enumerate(unique_sources, 1):
                        st.markdown(f"**{i}.** {src}")
        
        # Save assistant response
        st.session_state.messages.append({
            "role": "assistant",
            "content": response_text,
            "sources": list(dict.fromkeys(sources_used))
        })


# ══════════════════════════════════════════════════════════════════════════════
#  TASK 2 — Multi-Modal AI Assistant
# ══════════════════════════════════════════════════════════════════════════════
elif active_task == "🖼️ Task 2 — Multi-Modal":

    st.markdown("#### 🖼️ Multi-Modal AI Assistant")
    st.caption("Upload images and ask questions — I can analyze visuals, reason across turns, and provide evidence-based answers.")

    # Display current image preview in main area if one is uploaded
    if st.session_state.current_image_bytes:
        with st.expander("📷 Current Image", expanded=True):
            st.image(st.session_state.current_image_bytes, caption=st.session_state.current_image_name, use_container_width=True)

    # Display Task 2 chat history
    for msg in st.session_state.task2_messages:
        avatar = "🧑‍💻" if msg["role"] == "user" else "🤖"
        with st.chat_message(msg["role"], avatar=avatar):
            st.markdown(msg["content"])
            # Show image analysis details
            if msg.get("image_analysis"):
                analysis = msg["image_analysis"]
                with st.expander("🔍 What I See — Image Analysis"):
                    st.markdown(f"**Caption:** {analysis.get('caption', 'N/A')}")
                    if analysis.get("objects"):
                        st.markdown(f"**Objects:** {', '.join(analysis['objects'])}")
                    if analysis.get("scene_description"):
                        st.markdown(f"**Scene:** {analysis['scene_description']}")
                    if analysis.get("text_in_image"):
                        st.markdown(f"**Text in Image:** {analysis['text_in_image']}")
                    if analysis.get("colors"):
                        st.markdown(f"**Colors:** {', '.join(analysis['colors'])}")
                    st.markdown(f"**Confidence:** {analysis.get('confidence', 'N/A')}")
            # Show evidence & confidence badge
            if msg.get("evidence"):
                with st.expander("📋 Evidence"):
                    for item in msg["evidence"]:
                        st.markdown(f"- {item}")
            if msg.get("confidence"):
                conf = msg["confidence"]
                color_map = {"high": "🟢", "medium": "🟡", "low": "🔴"}
                st.caption(f"Confidence: {color_map.get(conf, '⚪')} {conf.capitalize()}")

    # Chat input for Task 2
    if prompt := st.chat_input("Ask about the image, or ask anything..."):
        if not st.session_state.multimodal_chat:
            st.error("⚠️ Gemini API is not connected. Please check your GEMINI_API_KEY.")
        else:
            # Display user message
            user_display = prompt
            if st.session_state.current_image_bytes and not any(
                m.get("has_image") for m in st.session_state.task2_messages
                if m["role"] == "user"
            ):
                user_display = f"📷 *[Image: {st.session_state.current_image_name}]*\n\n{prompt}"

            st.session_state.task2_messages.append({
                "role": "user",
                "content": user_display,
                "has_image": st.session_state.current_image_bytes is not None,
            })
            with st.chat_message("user", avatar="🧑‍💻"):
                st.markdown(user_display)

            # Generate multimodal response
            with st.chat_message("assistant", avatar="🤖"):
                with st.spinner("🔍 Analyzing & generating response..."):
                    result = st.session_state.multimodal_chat.process_message(
                        text=prompt,
                        image_bytes=st.session_state.current_image_bytes,
                        image_filename=st.session_state.current_image_name or "",
                    )

                response_text = result["response_text"]
                st.markdown(response_text)

                # Show image analysis if available
                if result.get("image_analysis"):
                    analysis = result["image_analysis"]
                    with st.expander("🔍 What I See — Image Analysis"):
                        st.markdown(f"**Caption:** {analysis.get('caption', 'N/A')}")
                        if analysis.get("objects"):
                            st.markdown(f"**Objects:** {', '.join(analysis['objects'])}")
                        if analysis.get("scene_description"):
                            st.markdown(f"**Scene:** {analysis['scene_description']}")
                        if analysis.get("text_in_image"):
                            st.markdown(f"**Text in Image:** {analysis['text_in_image']}")
                        if analysis.get("colors"):
                            st.markdown(f"**Colors:** {', '.join(analysis['colors'])}")
                        st.markdown(f"**Confidence:** {analysis.get('confidence', 'N/A')}")

                # Show evidence
                if result.get("evidence"):
                    with st.expander("📋 Evidence"):
                        for item in result["evidence"]:
                            st.markdown(f"- {item}")

                # Confidence badge
                conf = result.get("confidence", "medium")
                color_map = {"high": "🟢", "medium": "🟡", "low": "🔴"}
                st.caption(f"Confidence: {color_map.get(conf, '⚪')} {conf.capitalize()}")

            # Save to task 2 messages
            st.session_state.task2_messages.append({
                "role": "assistant",
                "content": response_text,
                "image_analysis": result.get("image_analysis"),
                "evidence": result.get("evidence", []),
                "confidence": result.get("confidence", "medium"),
            })

            # Clear image after first use so follow-up questions don't re-send it
            # (the context is maintained in the multimodal_chat history)
            st.session_state.current_image_bytes = None
            st.session_state.current_image_name = None
