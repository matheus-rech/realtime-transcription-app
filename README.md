# Real-Time Transcription Application with OpenAI Realtime API

This project implements a real-time transcription application that leverages the OpenAI Realtime API to provide accurate and efficient transcription services. The application consists of a robust backend infrastructure for handling connections to the OpenAI Realtime API and managing transcription sessions.

## Features

- **Real-time Transcription**: Transcribe audio in real-time using OpenAI's Realtime API.
- **Support for Multiple Models**: Works with both GPT-4o Transcribe and GPT-4o mini Transcribe models.
- **Flexible Connection Options**: Supports both WebSocket and WebRTC connection methods.
- **Secure API Key Management**: Uses ephemeral API keys with limited scope and expiration times.
- **Robust Session Management**: Handles session lifecycle events, including connection establishment, data transfer, and disconnection.
- **Scalable and Extensible**: Designed to be scalable, handling multiple concurrent transcription sessions.

## Project Structure

The project is organized as follows:

```
transcriber-openai/
├── openai_realtime_backend/  # Backend server for OpenAI Realtime API
│   ├── config.py             # Configuration settings
│   ├── main.py               # Main application entry point
│   ├── requirements.txt      # Python dependencies
│   ├── routers/              # API route handlers
│   │   ├── session.py        # Session management routes
│   │   └── transcribe.py     # Transcription routes
│   └── services/             # Business logic
│       └── openai_service.py # OpenAI API interaction
└── README.md                 # This file
```

## Backend

The backend is built with FastAPI and provides endpoints for:

1. **Session Management**: Create and manage transcription sessions, generate ephemeral API keys.
2. **WebSocket Transcription**: Stream audio data over WebSocket for transcription.
3. **WebRTC Transcription**: Use WebRTC for low-latency audio streaming and transcription.

For detailed instructions on setting up and using the backend, see the [Backend README](openai_realtime_backend/README.md).

## Prerequisites

- Python 3.9 or higher
- An OpenAI API key with access to the Realtime API
- (Optional) An OpenAI Organization ID

## Quick Start

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/transcriber-openai.git
   cd transcriber-openai
   ```

2. Set up the backend:
   ```bash
   cd openai_realtime_backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

4. Start the backend server:
   ```bash
   # On Unix/Linux/Mac
   ./run.sh
   
   # On Windows
   run.bat
   ```

The backend server will be accessible at `http://localhost:8000`.

### API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Using the API

### Session Management

1. **Get Available Models**:
   ```
   GET /api/v1/session/models
   ```

2. **Generate an Ephemeral Key**:
   ```
   POST /api/v1/session/key
   
   {
     "scope": ["realtime"],
     "expiration": 3600
   }
   ```

### Transcription

1. **WebSocket Transcription**:
   Connect to the WebSocket endpoint at `/api/v1/ws/transcribe` and send audio data for transcription.

2. **WebRTC Transcription**:
   Connect to the WebRTC signaling endpoint at `/api/v1/rtc/transcribe` to establish a WebRTC connection for audio streaming and transcription.

See the [Backend README](openai_realtime_backend/README.md) for detailed examples.

## Security Considerations

- **API Key Security**: The server keeps the main OpenAI API key secure and uses ephemeral keys for client connections.
- **Input Validation**: All inputs are validated to prevent injection attacks.
- **CORS**: Configure CORS settings for production to restrict allowed origins.

## Deployment

For production deployment, consider:

1. Using a production-ready ASGI server like Uvicorn behind a reverse proxy like Nginx.
2. Setting up SSL/TLS for secure connections.
3. Restricting CORS to trusted domains only.
4. Implementing proper logging and monitoring.
5. Using container solutions like Docker for easier deployment.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 