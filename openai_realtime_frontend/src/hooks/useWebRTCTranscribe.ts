import { useState, useEffect, useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { 
  ConnectionState, 
  TranscriptionResult, 
  WebSocketMessage,
  RTCSignal
} from '../types';
import { getWebRTCTranscribeURL, generateEphemeralKey } from '../services/api';

interface UseWebRTCTranscribeProps {
  modelName: string;
  apiKey: string;
  instructions?: string;
  autoConnect?: boolean;
}

interface UseWebRTCTranscribeReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isPeerConnected: boolean;
  isRecording: boolean;
  transcriptions: TranscriptionResult[];
  clearTranscriptions: () => void;
  connectionState: ConnectionState;
}

export const useWebRTCTranscribe = ({
  modelName,
  apiKey,
  instructions,
  autoConnect = false
}: UseWebRTCTranscribeProps): UseWebRTCTranscribeReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected'
  });
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const webSocketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

  // Cleanup function for connections
  const cleanup = useCallback(() => {
    // Clean up WebSocket
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    
    // Clean up WebRTC peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Clean up audio processing
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    setIsPeerConnected(false);
    setIsRecording(false);
  }, []);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && apiKey && modelName) {
      connect();
    }
    
    return () => {
      cleanup();
    };
  }, [autoConnect, apiKey, modelName, cleanup]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connection.established':
          setConnectionState({ status: 'connected' });
          break;
          
        case 'error':
          setConnectionState({
            status: 'error',
            error: message.error?.message || 'Error from server'
          });
          break;
          
        case 'rtc.answer':
          if (peerRef.current && message.sdp) {
            peerRef.current.signal({ type: 'answer', sdp: message.sdp.sdp });
          }
          break;
          
        case 'rtc.ice_candidate':
          if (peerRef.current && message.candidate) {
            peerRef.current.signal({ 
              type: 'candidate', 
              candidate: message.candidate.candidate,
              sdpMLineIndex: message.candidate.sdpMLineIndex,
              sdpMid: message.candidate.sdpMid
            });
          }
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
          // Other message types can be handled if needed
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  // Initialize WebRTC connection
  const connect = useCallback(async () => {
    try {
      setConnectionState({ status: 'connecting' });
      
      // Clean up any existing connections
      cleanup();
      
      // Generate an ephemeral key for WebRTC connection
      let ephemeralKey;
      try {
        ephemeralKey = await generateEphemeralKey(['realtime']);
      } catch (error) {
        throw new Error(`Failed to generate ephemeral key: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Open WebSocket for signaling
      const wsUrl = getWebRTCTranscribeURL(modelName, ephemeralKey.key);
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      
      ws.onopen = () => {
        // WebSocket connected, wait for connection.established message
        console.log('WebSocket opened for signaling');
      };
      
      ws.onmessage = handleWebSocketMessage;
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState({
          status: 'error',
          error: 'WebSocket signaling error'
        });
      };
      
      ws.onclose = () => {
        if (connectionState.status !== 'error') {
          setConnectionState({ status: 'disconnected' });
        }
      };
      
      // Wait for WebSocket to open
      await new Promise<void>((resolve, reject) => {
        const onOpen = () => {
          ws.removeEventListener('open', onOpen);
          resolve();
        };
        
        const onError = (event: Event) => {
          ws.removeEventListener('error', onError);
          reject(new Error('WebSocket failed to connect'));
        };
        
        ws.addEventListener('open', onOpen);
        ws.addEventListener('error', onError);
        
        // Already open
        if (ws.readyState === WebSocket.OPEN) {
          resolve();
        }
      });
      
    } catch (error) {
      console.error('Error connecting:', error);
      setConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to connect'
      });
      cleanup();
    }
  }, [apiKey, modelName, instructions, cleanup, handleWebSocketMessage]);

  // Disconnect from all connections
  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState({ status: 'disconnected' });
  }, [cleanup]);

  // Start recording audio and establish WebRTC connection
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Create WebRTC peer
      const peer = new SimplePeer({
        initiator: true,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });
      
      peerRef.current = peer;
      
      // Set up peer event handlers
      peer.on('signal', (data: RTCSignalInit) => {
        if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
          console.error('WebSocket not open for signaling');
          return;
        }
        
        // Convert the signal data to the format expected by the server
        let signal: RTCSignal;
        
        if (data.type === 'offer') {
          signal = {
            type: 'offer',
            sdp: data as RTCSessionDescriptionInit
          };
        } else if (data.type === 'answer') {
          signal = {
            type: 'answer',
            sdp: data as RTCSessionDescriptionInit
          };
        } else if (data.candidate) {
          signal = {
            type: 'ice_candidate',
            candidate: data as RTCIceCandidateInit
          };
        } else {
          console.error('Unknown signal type:', data);
          return;
        }
        
        webSocketRef.current.send(JSON.stringify(signal));
      });
      
      peer.on('connect', () => {
        console.log('Peer connected');
        setIsPeerConnected(true);
        setIsRecording(true);
        
        // Send session update for transcription
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
          const sessionUpdate = {
            type: 'session.update',
            session: {
              modalities: ['text'],
              instructions: instructions || 'Transcribe the audio accurately.'
            }
          };
          
          webSocketRef.current.send(JSON.stringify(sessionUpdate));
        }
      });
      
      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setConnectionState({
          status: 'error',
          error: `WebRTC error: ${err.message}`
        });
        cleanup();
      });
      
      peer.on('close', () => {
        setIsPeerConnected(false);
        setIsRecording(false);
      });
      
      // Wait for the peer connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebRTC connection timeout'));
        }, 30000); // 30 second timeout
        
        peer.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        peer.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start recording'
      });
      cleanup();
    }
  }, [isRecording, instructions, cleanup]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    setIsRecording(false);
  }, [isRecording]);

  // Clear transcriptions
  const clearTranscriptions = useCallback(() => {
    setTranscriptions([]);
  }, []);

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isPeerConnected,
    isRecording,
    transcriptions,
    clearTranscriptions,
    connectionState
  };
}; 