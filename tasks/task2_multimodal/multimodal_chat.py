"""
MultiModalChat module for handling conversations with text and images.
"""
import base64
import logging
import datetime
from typing import List, Dict, Any, Optional

from google import genai

import config
from .image_analyzer import ImageAnalyzer

logger = logging.getLogger(__name__)

class MultiModalChat:
    """
    Chatbot that handles both text and multimodal (image) inputs,
    maintaining a conversational history.
    """

    def __init__(self, client: genai.Client, model_name: str = config.MODEL_NAME) -> None:
        """
        Initializes the MultiModalChat.

        Args:
            client (genai.Client): The Gemini API client.
            model_name (str): The Gemini model identifier.
        """
        self.client = client
        self.model_name = model_name
        self.history: List[Dict[str, Any]] = []
        self.image_analyzer = ImageAnalyzer(client=client, model_name=model_name)

    def clear_history(self) -> None:
        """Clears the conversation history."""
        self.history.clear()

    def get_history(self) -> List[Dict[str, Any]]:
        """
        Returns the conversation history.

        Returns:
            List[Dict[str, Any]]: The conversation history.
        """
        return self.history

    def process_message(self, text: str = '', image_bytes: Optional[bytes] = None, image_filename: str = '') -> Dict[str, Any]:
        """
        Processes a user message that may contain text and/or an image.

        Args:
            text (str): The user's text message.
            image_bytes (Optional[bytes]): Raw image bytes, if an image is provided.
            image_filename (str): The filename of the image, if provided.

        Returns:
            Dict[str, Any]: A dictionary containing the response text, optional image analysis,
                            evidence, and confidence level.
        """
        image_analysis = None
        current_time = datetime.datetime.now().isoformat()
        
        # 1. Handle image analysis if an image is provided
        if image_bytes:
            logger.info(f"Analyzing provided image: {image_filename}")
            image_analysis = self.image_analyzer.analyze_image(image_bytes, image_filename)
        
        # 2. Append user message to history
        user_message: Dict[str, Any] = {
            "role": "user",
            "content": text,
            "timestamp": current_time
        }
        if image_analysis:
            user_message["image_analysis"] = image_analysis
            
        self.history.append(user_message)
        
        # 3. Enforce history limit
        if len(self.history) > config.MAX_CONVERSATION_HISTORY:
            self.history = self.history[-config.MAX_CONVERSATION_HISTORY:]
            
        # 4. Build prompt
        system_instruction = (
            "You are a multimodal AI assistant. Provide evidence-based responses. "
            "If a user provides an image, reference what you see in the image and its structural analysis. "
            "Handle ambiguity by asking clarifying questions. "
            "Show your confidence levels when making claims."
        )
        
        prompt_parts = []
        prompt_parts.append(f"System: {system_instruction}")
        
        # Include history
        if len(self.history) > 1:
            prompt_parts.append("Conversation History:")
            for msg in self.history[:-1]:
                role_label = msg["role"].capitalize()
                content = msg["content"]
                analysis = msg.get("image_analysis")
                
                history_str = f"{role_label}: {content}"
                if analysis:
                    history_str += f"\n[User provided an image. Analysis: {analysis.get('caption', '')}]"
                prompt_parts.append(history_str)
        
        # Current message
        prompt_parts.append("Current Input:")
        if image_analysis:
            prompt_parts.append(f"Image Analysis Data: {image_analysis}")
        
        prompt_parts.append(f"User Text: {text}")
        
        # Build API input
        full_text_prompt = "\n\n".join(prompt_parts)
        api_input = [{"type": "text", "text": full_text_prompt}]
        
        if image_bytes:
            mime_type = self.image_analyzer._get_mime_type(image_filename)
            b64_image = base64.b64encode(image_bytes).decode('utf-8')
            api_input.append({"type": "image", "data": b64_image, "mime_type": mime_type})
            
        # 5. Call Gemini API
        try:
            interaction = self.client.interactions.create(
                model=self.model_name,
                input=api_input,
            )
            response_text = interaction.output_text.strip()
            
            # 6. Extract evidence and confidence from response (heuristic)
            evidence = []
            confidence = "medium"
            lower_response = response_text.lower()
            
            if image_analysis:
                evidence.extend(image_analysis.get('objects', []))
                
            if "i am highly confident" in lower_response or "high confidence" in lower_response:
                confidence = "high"
            elif "low confidence" in lower_response or "i am not sure" in lower_response:
                confidence = "low"
            
            # Append assistant response to history
            self.history.append({
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            return {
                "response_text": response_text,
                "image_analysis": image_analysis,
                "evidence": evidence,
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error processing multimodal message: {e}")
            error_response = f"I encountered an error processing your request: {str(e)}"
            
            self.history.append({
                "role": "assistant",
                "content": error_response,
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            return {
                "response_text": error_response,
                "image_analysis": image_analysis,
                "evidence": [],
                "confidence": "low"
            }
