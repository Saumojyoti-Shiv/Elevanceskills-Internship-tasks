"""
Image Analyzer module for multimodal capabilities using Google Gemini.
"""
import base64
import json
import logging
from typing import Dict, Any

from google import genai

logger = logging.getLogger(__name__)

class ImageAnalyzer:
    """
    Analyzes images using the Google Gemini multimodal capabilities.
    """

    def __init__(self, client: genai.Client, model_name: str) -> None:
        """
        Initializes the ImageAnalyzer.

        Args:
            client (genai.Client): The Gemini API client.
            model_name (str): The Gemini model identifier.
        """
        self.client = client
        self.model_name = model_name

    def _get_mime_type(self, filename: str) -> str:
        """
        Infers the MIME type from the file extension.

        Args:
            filename (str): The image filename.

        Returns:
            str: The corresponding MIME type.
        """
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        if ext in ['jpg', 'jpeg']:
            return 'image/jpeg'
        elif ext == 'png':
            return 'image/png'
        elif ext == 'webp':
            return 'image/webp'
        elif ext == 'heic':
            return 'image/heic'
        elif ext == 'heif':
            return 'image/heif'
        else:
            return 'image/jpeg'  # default fallback

    def analyze_image(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Sends an image to Gemini for structured analysis.

        Args:
            image_bytes (bytes): The raw image bytes.
            filename (str): The filename of the image.

        Returns:
            Dict[str, Any]: A dictionary containing caption, objects, 
                            scene_description, text_in_image, colors, and confidence.
        """
        mime_type = self._get_mime_type(filename)
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = (
            "Analyze this image and provide a structured JSON response. "
            "Do not wrap the response in markdown blocks like ```json, just return raw JSON string. "
            "The JSON must have the following keys:\n"
            "- caption: A short summary of the image.\n"
            "- objects: A list of main objects found in the image.\n"
            "- scene_description: A detailed description of the scene.\n"
            "- text_in_image: Any readable text found in the image, or an empty string if none.\n"
            "- colors: A list of dominant colors in the image.\n"
            "- confidence: A string indicating analysis confidence (high, medium, low).\n"
        )
        
        try:
            interaction = self.client.interactions.create(
                model=self.model_name,
                input=[
                    {"type": "text", "text": prompt},
                    {"type": "image", "data": b64_image, "mime_type": mime_type},
                ],
            )
            response_text = interaction.output_text.strip()
            
            # Clean up potential markdown formatting if the model still outputs it
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            try:
                result = json.loads(response_text)
                return result
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from Gemini response, returning raw text as fallback.")
                return {
                    "caption": "Failed to parse structured response",
                    "objects": [],
                    "scene_description": response_text,
                    "text_in_image": "",
                    "colors": [],
                    "confidence": "low"
                }
                
        except Exception as e:
            logger.error(f"Error during image analysis: {e}")
            return {
                "caption": "Analysis failed",
                "objects": [],
                "scene_description": str(e),
                "text_in_image": "",
                "colors": [],
                "confidence": "low"
            }

    def ask_about_image(self, image_bytes: bytes, question: str, context: str = '') -> str:
        """
        Sends an image and a question to Gemini to get a text answer.

        Args:
            image_bytes (bytes): The raw image bytes.
            question (str): The user's question about the image.
            context (str): Optional context for the question.

        Returns:
            str: The model's answer.
        """
        mime_type = self._get_mime_type("image.jpg")  # Default if we don't have the filename
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        text_content = ""
        if context:
            text_content += f"Context: {context}\n\n"
        text_content += f"Question: {question}"
        
        input_data = [
            {"type": "text", "text": text_content},
            {"type": "image", "data": b64_image, "mime_type": mime_type},
        ]
        
        try:
            interaction = self.client.interactions.create(
                model=self.model_name,
                input=input_data,
            )
            return interaction.output_text.strip()
        except Exception as e:
            logger.error(f"Error asking about image: {e}")
            return f"Error analyzing image: {str(e)}"
