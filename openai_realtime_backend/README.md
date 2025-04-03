# OpenAI Realtime Transcription Backend

This backend application provides a seamless interface to the OpenAI Realtime API, enabling real-time transcription of audio. The application is built using FastAPI and supports both WebSocket and WebRTC connections.

## Features

- **Realtime Transcription**: Transcribe audio in real-time using OpenAI's GPT-4o Transcribe and GPT-4o mini Transcribe models.
- **Multiple Connection Methods**: Support for both WebSocket and WebRTC connections.
- **Ephemeral API Keys**: Generate temporary API keys with limited scope for client-side connections.
- **Session Management**: Manage transcription sessions and handle WebRTC signaling.
- **Secure**: API key is kept secure on the server, with client-side connections using ephemeral keys.

## Prerequisites

- Python 3.9 or higher
- An OpenAI API key with access to the Realtime API
- (Optional) An OpenAI Organization ID

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/transcriber-openai.git
   cd transcriber-openai/openai_realtime_backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the example environment file and add your API key:
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

## Usage

### Starting the Server

Run the following command to start the server:

```bash
uvicorn openai_realtime_backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be accessible at `http://localhost:8000` by default.

### API Endpoints

#### Session Management

- `GET /api/v1/session/models`: Get a list of available transcription models.
- `GET /api/v1/session/models/{model_name}`: Get information about a specific model.
- `POST /api/v1/session/key`: Generate an ephemeral API key for client-side use.
- `POST /api/v1/session/update`: Create a session update payload for initializing a session.

#### Transcription

- `WebSocket /api/v1/ws/transcribe`: WebSocket endpoint for real-time transcription.
- `WebSocket /api/v1/rtc/transcribe`: WebRTC endpoint for real-time transcription.

### WebSocket Transcription Example

Here's an example of how to connect to the WebSocket endpoint for transcription:

```javascript
// Connect to WebSocket endpoint
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/transcribe?model=gpt4o');

// Send audio data
ws.onopen = () => {
  // First, send a session update
  ws.send(JSON.stringify({
    type: 'session.update',
    session: {
      modalities: ['text'],
      input_audio_format: 'pcm_mulaw',
      output_audio_format: 'pcm_mulaw'
    }
  }));
  
  // Then send audio data
  ws.send(JSON.stringify({
    type: 'input_audio_buffer.append',
    audio: base64EncodedAudioData
  }));
  
  // Commit the audio buffer
  ws.send(JSON.stringify({
    type: 'input_audio_buffer.commit'
  }));
};

// Receive transcription results
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'response.text.delta') {
    console.log('Transcription delta:', data.delta);
  } else if (data.type === 'response.text.done') {
    console.log('Transcription completed');
  }
};
```

### WebRTC Transcription Example

WebRTC connections are more complex and require additional signaling. Here's a simplified example:

```javascript
// Connect to WebRTC signaling WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/rtc/transcribe?model=gpt4o');

// Create a WebRTC connection
const rtcPeerConnection = new RTCPeerConnection();

// Add audio track to the connection
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    stream.getAudioTracks().forEach(track => {
      rtcPeerConnection.addTrack(track, stream);
    });
  });

// Create and send an offer
rtcPeerConnection.createOffer()
  .then(offer => rtcPeerConnection.setLocalDescription(offer))
  .then(() => {
    ws.send(JSON.stringify({
      type: 'rtc.offer',
      sdp: rtcPeerConnection.localDescription
    }));
  });

// Handle WebSocket messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'rtc.answer') {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  } else if (data.type === 'rtc.ice_candidate') {
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  } else if (data.type === 'response.text.delta') {
    console.log('Transcription delta:', data.delta);
  }
};

// Send ICE candidates
rtcPeerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({
      type: 'rtc.ice_candidate',
      candidate: event.candidate
    }));
  }
};
```

## Security Considerations

- **API Key Security**: The main API key is kept secure on the server, and clients use ephemeral keys with limited scope and expiration.
- **CORS**: The server includes CORS middleware, which should be configured for production to restrict allowed origins.
- **Input Validation**: All inputs are validated to prevent injection attacks.

## Deployment

For production deployment, consider the following:

1. Use a production-ready ASGI server like Uvicorn behind a reverse proxy like Nginx.
2. Set up SSL/TLS for secure connections.
3. Restrict CORS origins to only trusted domains.
4. Set up proper logging and monitoring.
5. Consider using a container solution like Docker for easier deployment.

## License

[MIT License](LICENSE)
