import time
import json
import hmac
import hashlib
import base64
import secrets
import httpx
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta

from ..config import (
    OPENAI_API_KEY,
    OPENAI_ORG_ID,
    AVAILABLE_MODELS,
    DEFAULT_MODEL,
    EPHEMERAL_KEY_EXPIRATION,
    INPUT_AUDIO_FORMAT,
    OUTPUT_AUDIO_FORMAT,
    SERVER_VAD
)

class OpenAIService:
    """Service for interacting with OpenAI's Realtime API."""
    
    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.org_id = OPENAI_ORG_ID
        self.base_url = "https://api.openai.com/v1"
        self.ephemeral_keys = {}  # Store ephemeral keys with expiration time
        
    async def generate_ephemeral_key(self, 
                                    scope: List[str] = None,
                                    expiration: int = EPHEMERAL_KEY_EXPIRATION) -> Dict[str, Any]:
        """
        Generate an ephemeral API key for client-side use.
        
        Args:
            scope: List of access scopes for the ephemeral key
            expiration: Expiration time in seconds
            
        Returns:
            Dictionary containing the ephemeral key and related information
        """
        if not scope:
            scope = ["realtime"]
            
        # Create a unique key ID
        key_id = f"ephemeral-{secrets.token_hex(8)}"
        
        # Set expiration time
        expiration_time = int(time.time()) + expiration
        
        # Create the payload
        payload = {
            "key_id": key_id,
            "org_id": self.org_id if self.org_id else "",
            "scope": scope,
            "exp": expiration_time
        }
        
        # Sign the payload using HMAC with SHA-256
        signature = hmac.new(
            self.api_key.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).digest()
        
        # Encode signature in base64
        signature_b64 = base64.b64encode(signature).decode()
        
        # Create the ephemeral key
        ephemeral_key = f"sk-ephemeral-{key_id}:{signature_b64}"
        
        # Store the key with its expiration time
        self.ephemeral_keys[key_id] = {
            "key": ephemeral_key,
            "expiration": expiration_time,
            "scope": scope
        }
        
        return {
            "key": ephemeral_key,
            "key_id": key_id,
            "expiration": expiration_time,
            "scope": scope
        }
    
    def is_key_valid(self, key_id: str) -> bool:
        """Check if an ephemeral key is valid and has not expired."""
        if key_id not in self.ephemeral_keys:
            return False
            
        key_data = self.ephemeral_keys[key_id]
        current_time = int(time.time())
        
        return key_data["expiration"] > current_time
    
    def cleanup_expired_keys(self) -> None:
        """Remove expired ephemeral keys from storage."""
        current_time = int(time.time())
        expired_keys = [
            key_id for key_id, key_data in self.ephemeral_keys.items()
            if key_data["expiration"] <= current_time
        ]
        
        for key_id in expired_keys:
            del self.ephemeral_keys[key_id]
    
    async def get_model_info(self, model_name: str = DEFAULT_MODEL) -> Dict[str, Any]:
        """
        Get information about a transcription model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Dictionary containing model information
        """
        if model_name not in AVAILABLE_MODELS:
            raise ValueError(f"Model {model_name} is not available. Available models: {list(AVAILABLE_MODELS.keys())}")
            
        openai_model = AVAILABLE_MODELS[model_name]
        
        return {
            "model_id": model_name,
            "openai_model": openai_model,
            "description": f"OpenAI {openai_model} for real-time transcription"
        }
    
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get information about all available transcription models.
        
        Returns:
            List of dictionaries containing model information
        """
        models = []
        for model_name in AVAILABLE_MODELS:
            model_info = await self.get_model_info(model_name)
            models.append(model_info)
            
        return models
        
    async def create_session_update_payload(self, 
                                          model_name: str = DEFAULT_MODEL,
                                          instructions: Optional[str] = None,
                                          modalities: List[str] = None) -> Dict[str, Any]:
        """
        Create a session update payload for the OpenAI Realtime API.
        
        Args:
            model_name: Name of the model to use
            instructions: Instructions for the model
            modalities: List of modalities to enable
            
        Returns:
            Session update payload
        """
        if model_name not in AVAILABLE_MODELS:
            raise ValueError(f"Model {model_name} is not available. Available models: {list(AVAILABLE_MODELS.keys())}")
            
        if not modalities:
            modalities = ["text"]
            
        session = {
            "input_audio_format": INPUT_AUDIO_FORMAT,
            "output_audio_format": OUTPUT_AUDIO_FORMAT,
            "modalities": modalities,
        }
        
        if SERVER_VAD:
            session["turn_detection"] = {"type": "server_vad"}
            
        if instructions:
            session["instructions"] = instructions
            
        return {
            "type": "session.update",
            "session": session
        }
        
    async def get_websocket_url(self, model_name: str = DEFAULT_MODEL) -> str:
        """
        Get the WebSocket URL for connecting to the OpenAI Realtime API.
        
        Args:
            model_name: Name of the model to use
            
        Returns:
            WebSocket URL
        """
        if model_name not in AVAILABLE_MODELS:
            raise ValueError(f"Model {model_name} is not available. Available models: {list(AVAILABLE_MODELS.keys())}")
            
        openai_model = AVAILABLE_MODELS[model_name]
        
        return f"wss://api.openai.com/v1/realtime?model={openai_model}"
        
    async def get_session_headers(self) -> Dict[str, str]:
        """
        Get the headers required for connecting to the OpenAI Realtime API.
        
        Returns:
            Dictionary of headers
        """
        return {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1"
        }
