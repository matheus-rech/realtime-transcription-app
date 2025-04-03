// API Key types
export interface ApiKey {
  key: string;
  savedAt: number; // timestamp
}

export interface EphemeralKey {
  key: string;
  key_id: string;
  expiration: number;
  scope: string[];
}

// Transcription types
export interface TranscriptionResult {
  text: string;
  timestamp: number;
  isFinal: boolean;
}

// Connection types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  error?: string;
}

// Available models
export interface Model {
  model_id: string;
  openai_model: string;
  description: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  delta?: string;
  text?: string;
  error?: {
    message: string;
  };
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  [key: string]: unknown;
}

// Session update request
export interface SessionUpdateRequest {
  model?: string;
  instructions?: string;
  modalities?: string[];
}

// Define RTCSignalInit type
export interface RTCSignalInit {
  type: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

// WebRTC signaling types
export interface RTCSignal {
  type: 'offer' | 'answer' | 'ice_candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
  };
} 