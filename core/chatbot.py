"""
Chatbot module using Google Gemini API for fast, free inference.

Replaces the previous local HuggingFace model (Phi-3-mini) which was
too slow on CPU.  Gemini 2.5 Flash is free-tier and responds in seconds.

Setup:
  1. Get a free API key from https://aistudio.google.com/apikey
  2. Set it via environment variable:  set GEMINI_API_KEY=your_key_here
     or add it to a .env file in the project root.
"""
import logging
import os
from typing import List, Dict, Optional

from google import genai
import config

logger = logging.getLogger(__name__)


class ChatBot:
    """
    Chatbot powered by Google Gemini API.
    Drop-in replacement for the old local-model ChatBot — same public interface.
    """

    def __init__(self, model_name: str = config.MODEL_NAME) -> None:
        """
        Initializes the ChatBot with the Gemini API client.

        Args:
            model_name (str): The Gemini model identifier (e.g. 'gemini-2.5-flash').
        """
        self.model_loaded = False
        self.model_name = model_name
        self.history: List[Dict[str, str]] = []

        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            logger.error(
                "GEMINI_API_KEY environment variable is not set. "
                "Get a free key at https://aistudio.google.com/apikey"
            )
            return

        try:
            self.client = genai.Client(api_key=api_key)
            # Quick connectivity check — list models
            logger.info(f"Gemini client initialized for model: {model_name}")
            self.model_loaded = True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")

    def clear_history(self) -> None:
        """Clears the internal conversation history."""
        self.history.clear()

    def generate_response(
        self,
        user_message: str,
        context: str = "",
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: str = "",
    ) -> str:
        """
        Generates a response to the user's message via Google Gemini API.

        Args:
            user_message (str): The input message from the user.
            context (str): Additional context retrieved from the vector store.
            conversation_history (Optional[List[Dict[str, str]]]): Override history.
            system_prompt (str): System prompt instructions.

        Returns:
            str: The generated response.
        """
        history_to_use = (
            conversation_history if conversation_history is not None else self.history
        )

        # Add user message to history
        history_to_use.append({"role": "user", "content": user_message})

        # Enforce history limit
        if len(history_to_use) > config.MAX_CONVERSATION_HISTORY:
            history_to_use = history_to_use[-config.MAX_CONVERSATION_HISTORY:]
            if conversation_history is None:
                self.history = history_to_use

        if not self.model_loaded:
            response = (
                "⚠️ The Gemini API key is not configured. "
                "Please set the GEMINI_API_KEY environment variable.\n\n"
                "Get a free key at https://aistudio.google.com/apikey"
            )
            history_to_use.append({"role": "assistant", "content": response})
            return response

        # ── Build the prompt for Gemini ──────────────────────────────────
        parts: List[str] = []

        if system_prompt:
            parts.append(f"System Instructions:\n{system_prompt}")

        if context:
            parts.append(
                f"The following context was retrieved from the knowledge base. "
                f"Use it to answer the user's question:\n\n{context}"
            )

        # Include recent conversation history for continuity
        if len(history_to_use) > 1:
            history_text = "\n".join(
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in history_to_use[:-1]  # Exclude current message
            )
            parts.append(f"Conversation so far:\n{history_text}")

        parts.append(f"User: {user_message}")

        full_prompt = "\n\n---\n\n".join(parts)

        # ── Call Gemini API ──────────────────────────────────────────────
        try:
            interaction = self.client.interactions.create(
                model=self.model_name,
                input=full_prompt,
            )
            response_text = interaction.output_text.strip()
            history_to_use.append({"role": "assistant", "content": response_text})
            return response_text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return f"Sorry, I encountered an error while generating a response: {e}"
