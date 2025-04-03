# OpenAI Realtime Transcription Frontend

A comprehensive React-based frontend for interacting with OpenAI's Realtime API, providing real-time audio transcription capabilities using both WebRTC and WebSocket connections.

## Features

- API key management (stored securely in the browser's local storage)
- Support for multiple OpenAI Realtime transcription models
- WebRTC connection for direct audio streaming to OpenAI
- WebSocket connection as a fallback option
- Real-time transcription display with status indicators
- Clean, responsive UI built with Chakra UI

## Requirements

- Node.js 16+ and npm
- Backend server running at http://localhost:8001 (see the backend directory)
- Valid OpenAI API key with access to Realtime API

## Setup and Running

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create a `.env` file with:

```
VITE_API_URL=http://localhost:8001/api/v1
```

3. Run the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

## Building for Production

```bash
npm run build
```

This will create a production-ready build in the `dist` directory that can be served by any static file server.

## Usage

1. Enter your OpenAI API key in the API Key section
2. Select the desired transcription model
3. Choose between WebRTC or WebSocket connection
4. Connect to the Realtime API
5. Start recording and speaking to see real-time transcription

## Technologies Used

- React with TypeScript
- Vite for building and development
- Chakra UI for component styling
- WebRTC (using simple-peer) for real-time audio streaming
- WebSocket for alternative connection method
- Web Audio API for audio recording and processing
