import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAudioRecorderProps {
  onAudioData?: (base64Audio: string) => void;
  bufferSize?: number;
}

interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  error: string | null;
}

export const useAudioRecorder = ({
  onAudioData,
  bufferSize = 4096
}: UseAudioRecorderProps = {}): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Cleanup function to release resources
  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Convert audio buffer to base64
  const convertToBase64 = useCallback((buffer: Float32Array): string => {
    // Convert Float32Array to Int16Array (16-bit PCM)
    const pcmBuffer = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      // Scale to 16-bit range and convert to integer
      const s = Math.max(-1, Math.min(1, buffer[i]));
      pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to Uint8Array for base64 encoding
    const bytes = new Uint8Array(pcmBuffer.buffer);
    
    // Use a more efficient approach for large buffers
    const chunks: string[] = [];
    const chunkSize = 0x8000; // 32K chunks
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, [...chunk]));
    }
    
    const binary = chunks.join('');
    const base64 = btoa(binary);
    
    return base64;
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    
    try {
      // Reset any previous errors
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create audio context and nodes
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Create script processor for audio processing
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;
      
      // Process audio data
      processor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer;
        const audioData = inputBuffer.getChannelData(0);
        
        if (onAudioData) {
          const base64Audio = convertToBase64(audioData);
          onAudioData(base64Audio);
        }
      };
      
      // Connect the nodes
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to access microphone';
      
      setError(errorMessage);
      cleanup();
    }
  }, [isRecording, bufferSize, onAudioData, convertToBase64, cleanup]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    cleanup();
  }, [isRecording, cleanup]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    error
  };
}; 