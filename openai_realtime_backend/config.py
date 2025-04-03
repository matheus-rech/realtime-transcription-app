import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_ORG_ID = os.getenv("OPENAI_ORG_ID")

# Available models for transcription
AVAILABLE_MODELS = {
    "gpt4o": "gpt-4o-transcribe",
    "gpt4o-mini": "gpt-4o-mini-transcribe"
}

# Default model to use
DEFAULT_MODEL = "gpt4o"

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# WebRTC/WebSocket settings
WEBSOCKET_PATH = "/api/v1/ws/transcribe"
WEBRTC_PATH = "/api/v1/rtc/transcribe"

# Ephemeral key expiration (in seconds)
EPHEMERAL_KEY_EXPIRATION = 3600  # 1 hour

# Audio settings
INPUT_AUDIO_FORMAT = "pcm_mulaw"
OUTPUT_AUDIO_FORMAT = "pcm_mulaw"
SAMPLE_RATE = 16000

# Session settings
SERVER_VAD = True  # Enable server-side Voice Activity Detection
