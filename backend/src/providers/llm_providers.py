from abc import ABC, abstractmethod
from openai import OpenAI
import google.generativeai as genai
from anthropic import Anthropic
from groq import Groq


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    def __init__(self, api_key, model):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    def chat(self, message, history):
        """Send a chat message and get response"""
        raise NotImplementedError


class OpenAIProvider(LLMProvider):
    """OpenAI API provider (GPT models)"""

    def __init__(self, api_key, model):
        super().__init__(api_key, model)
        self.client = OpenAI(api_key=api_key)

    def chat(self, message, history):
        """
        Send a chat message to OpenAI API

        Args:
            message: User message
            history: List of previous messages [{'role': 'user/assistant', 'content': '...'}]

        Returns:
            Assistant's response as string
        """
        try:
            messages = []

            for msg in history:
                messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })

            messages.append({
                'role': 'user',
                'content': message
            })

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")


class GeminiProvider(LLMProvider):
    """Google Gemini API provider"""

    def __init__(self, api_key, model):
        super().__init__(api_key, model)
        genai.configure(api_key=api_key)
        self.model_instance = genai.GenerativeModel(model)
        self.chat_session = None

    def chat(self, message, history):
        """
        Send a chat message to Gemini API

        Args:
            message: User message
            history: List of previous messages [{'role': 'user/assistant', 'content': '...'}]

        Returns:
            Assistant's response as string
        """
        try:
            if self.chat_session is None or len(history) == 0:
                gemini_history = []
                for msg in history:
                    role = 'user' if msg['role'] == 'user' else 'model'
                    gemini_history.append({
                        'role': role,
                        'parts': [msg['content']]
                    })

                self.chat_session = self.model_instance.start_chat(history=gemini_history)

            response = self.chat_session.send_message(message)

            return response.text

        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")


class AnthropicProvider(LLMProvider):
    """Anthropic Claude API provider"""

    def __init__(self, api_key, model):
        super().__init__(api_key, model)
        self.client = Anthropic(api_key=api_key)

    def chat(self, message, history):
        try:
            # Build Anthropic-style history
            messages = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})

            messages.append({"role": "user", "content": message})

            resp = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=messages,
            )

            # Anthropic SDK returns content as a list of blocks
            return resp.content[0].text

        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")


class GroqProvider(LLMProvider):
    """Groq API provider (Llama/Mixtral)"""

    def __init__(self, api_key, model):
        super().__init__(api_key, model)
        self.client = Groq(api_key=api_key)

    def chat(self, message, history):
        try:
            messages = []
            for msg in history:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

            messages.append({"role": "user", "content": message})

            resp = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=512,
            )

            return resp.choices[0].message.content

        except Exception as e:
            raise Exception(f"Groq API error: {str(e)}")
