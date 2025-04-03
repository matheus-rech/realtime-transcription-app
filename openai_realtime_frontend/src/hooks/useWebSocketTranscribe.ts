import { useState, useEffect, useCallback, useRef } from 'react';
import WebSocketAsPromised from 'websocket-as-promised';
import { 
  ConnectionState, 
  TranscriptionResult, 
  WebSocketMessage 
} from '../types';
import { getWebSocketTranscribeURL } from '../services/api';

interface UseWebSocketTranscribeProps {
  modelName: string;
  apiKey: string;
  instructions?: string;
  autoConnect?: boolean;
}

interface UseWebSocketTranscribeReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudioData: (audioBase64: string) => Promise<void>;
  commitAudio: () => Promise<void>;
  clearAudio: () => Promise<void>;
  transcriptions: TranscriptionResult[];
  clearTranscriptions: () => void;
  connectionState: ConnectionState;
}

export const useWebSocketTranscribe = ({
  modelName,
  apiKey,
  instructions,
  autoConnect = false
}: UseWebSocketTranscribeProps): UseWebSocketTranscribeReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected'
  });
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const webSocketRef = useRef<WebSocketAsPromised | null>(null);

  // Cleanup function for the WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.removeAllListeners();
      if (webSocketRef.current.isConnected) {
        webSocketRef.current.close();
      }
      webSocketRef.current = null;
    }
  }, []);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      cleanupWebSocket();
    };
  }, [cleanupWebSocket]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && apiKey && modelName) {
      connect();
    }
    
    return () => {
      cleanupWebSocket();
    };
  }, [autoConnect, apiKey, modelName, cleanupWebSocket]);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    try {
      setConnectionState({ status: 'connecting' });
      
      cleanupWebSocket();
      
      const wsUrl = getWebSocketTranscribeURL(modelName, instructions);
      
      const ws = new WebSocketAsPromised(wsUrl, {
        packMessage: (data) => JSON.stringify(data),
        unpackMessage: (data) => JSON.parse(data as string),
        attachRequestId: (data, requestId) => ({ ...data, id: requestId }),
        extractRequestId: (data) => data && data.id,
      });
      
      webSocketRef.current = ws;
      
      // Set up WebSocket event listeners
      ws.onOpen.addListener(() => {
        setConnectionState({ status: 'connected' });
      });
      
      ws.onClose.addListener(() => {
        setConnectionState({ status: 'disconnected' });
      });
      
      ws.onError.addListener((error) => {
        setConnectionState({ 
          status: 'error', 
          error: error.message || 'WebSocket connection error' 
        });
      });
      
      ws.onMessage.addListener((message) => {
        handleWebSocketMessage(message);
      });
      
      // Open the WebSocket connection
      await ws.open();
      
      // Send session update with API key
      await ws.send({
        type: 'session.update',
        session: {
          api_key: apiKey,
          modalities: ['text'],
          instructions: instructions || 'Transcribe the audio accurately.'
        }
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to connect to WebSocket'
      });
    }
  }, [apiKey, modelName, instructions, cleanupWebSocket]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (webSocketRef.current && webSocketRef.current.isConnected) {
      webSocketRef.current.close();
      setConnectionState({ status: 'disconnected' });
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'error':
        setConnectionState({
          status: 'error',
          error: message.error?.message || 'Error from server'
        });
        break;
        
      case 'response.text.delta':
        if (message.delta) {
          setTranscriptions(prev => {
            const newTranscriptions = [...prev];
            const lastTranscription = newTranscriptions[newTranscriptions.length - 1];
            
            if (lastTranscription && !lastTranscription.isFinal) {
              // Update the last transcription
              lastTranscription.text += message.delta;
            } else {
              // Add a new transcription
              newTranscriptions.push({
                text: message.delta,
                timestamp: Date.now(),
                isFinal: false
              });
            }
            
            return newTranscriptions;
          });
        }
        break;
        
      case 'response.text.done':
        setTranscriptions(prev => {
          const newTranscriptions = [...prev];
          const lastTranscription = newTranscriptions[newTranscriptions.length - 1];
          
          if (lastTranscription && !lastTranscription.isFinal) {
            lastTranscription.isFinal = true;
          }
          
          return newTranscriptions;
        });
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (message.text) {
          setTranscriptions(prev => [
            ...prev,
            {
              text: message.text,
              timestamp: Date.now(),
              isFinal: true
            }
          ]);
        }
        break;
        
      default:
        // Other message types can be handled here if needed
        break;
    }
  }, []);

  // Send audio data
  const sendAudioData = useCallback(async (audioBase64: string) => {
    if (webSocketRef.current && webSocketRef.current.isConnected) {
      await webSocketRef.current.send({
        type: 'input_audio_buffer.append',
        audio: audioBase64
      });
    } else {
      throw new Error('WebSocket is not connected');
    }
  }, []);

  // Commit audio buffer
  const commitAudio = useCallback(async () => {
    if (webSocketRef.current && webSocketRef.current.isConnected) {
      await webSocketRef.current.send({
        type: 'input_audio_buffer.commit'
      });
      
      // After committing, create a response to get transcription
      await webSocketRef.current.send({
        type: 'response.create'
      });
    } else {
      throw new Error('WebSocket is not connected');
    }
  }, []);

  // Clear audio buffer
  const clearAudio = useCallback(async () => {
    if (webSocketRef.current && webSocketRef.current.isConnected) {
      await webSocketRef.current.send({
        type: 'input_audio_buffer.clear'
      });
    } else {
      throw new Error('WebSocket is not connected');
    }
  }, []);

  // Clear transcriptions
  const clearTranscriptions = useCallback(() => {
    setTranscriptions([]);
  }, []);

  return {
    connect,
    disconnect,
    sendAudioData,
    commitAudio,
    clearAudio,
    transcriptions,
    clearTranscriptions,
    connectionState
  };
}; 