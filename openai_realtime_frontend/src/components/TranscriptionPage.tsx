import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import ApiKeyInput from './ApiKeyInput';
import ModelSelector from './ModelSelector';
import ConnectionControls from './ConnectionControls';
import TranscriptionDisplay from './TranscriptionDisplay';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useModels } from '../contexts/ModelsContext';
import { useWebSocketTranscribe } from '../hooks/useWebSocketTranscribe';
import { useWebRTCTranscribe } from '../hooks/useWebRTCTranscribe';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { TranscriptionResult } from '../types';

const TranscriptionPage: React.FC = () => {
  const toast = useToast();
  const { apiKey, hasValidKey } = useApiKey();
  const { selectedModel } = useModels();
  const [tabIndex, setTabIndex] = useState(0);
  const [transcriptionType, setTranscriptionType] = useState<'websocket' | 'webrtc'>('webrtc');
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // WebSocket transcribe hook
  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendAudioData,
    commitAudio,
    transcriptions: wsTranscriptions,
    clearTranscriptions: clearWsTranscriptions,
    connectionState: wsConnectionState
  } = useWebSocketTranscribe({
    modelName: selectedModel,
    apiKey: apiKey || '',
    instructions: 'Transcribe the audio accurately.'
  });

  // WebRTC transcribe hook
  const {
    connect: connectWebRTC,
    disconnect: disconnectWebRTC,
    startRecording: startWebRTCRecording,
    stopRecording: stopWebRTCRecording,
    isRecording: isWebRTCRecording,
    transcriptions: rtcTranscriptions,
    clearTranscriptions: clearRtcTranscriptions,
    connectionState: rtcConnectionState
  } = useWebRTCTranscribe({
    modelName: selectedModel,
    apiKey: apiKey || '',
    instructions: 'Transcribe the audio accurately.'
  });

  // Audio recorder for WebSocket
  const handleAudioData = useCallback((audioData: string) => {
    if (wsConnectionState.status === 'connected') {
      sendAudioData(audioData).catch(console.error);
    }
  }, [wsConnectionState.status, sendAudioData]);

  const {
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    isRecording: isAudioRecording,
    error: audioRecorderError
  } = useAudioRecorder({
    onAudioData: handleAudioData
  });

  // Update tab index and transcription type
  const handleTabChange = (index: number) => {
    // Clean up previous connections
    disconnectWebSocket();
    disconnectWebRTC();
    stopAudioRecording();
    
    setTabIndex(index);
    setTranscriptionType(index === 0 ? 'webrtc' : 'websocket');
    setTranscriptions([]);
  };

  // Connect to the selected service
  const handleConnect = async () => {
    if (!hasValidKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your OpenAI API key first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (transcriptionType === 'websocket') {
        await connectWebSocket();
      } else {
        await connectWebRTC();
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Disconnect from the selected service
  const handleDisconnect = () => {
    if (isRecording) {
      handleStopRecording();
    }
    
    if (transcriptionType === 'websocket') {
      disconnectWebSocket();
    } else {
      disconnectWebRTC();
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    try {
      if (transcriptionType === 'websocket') {
        await startAudioRecording();
      } else {
        await startWebRTCRecording();
      }
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Recording Error',
        description: error instanceof Error ? error.message : 'Failed to start recording',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (transcriptionType === 'websocket') {
      stopAudioRecording();
      await commitAudio().catch(console.error);
    } else {
      await stopWebRTCRecording();
    }
    setIsRecording(false);
  };

  // Clear transcriptions
  const handleClearTranscriptions = () => {
    if (transcriptionType === 'websocket') {
      clearWsTranscriptions();
    } else {
      clearRtcTranscriptions();
    }
    setTranscriptions([]);
  };

  // Determine current connection state and transcriptions
  const currentConnectionState = transcriptionType === 'websocket' 
    ? wsConnectionState 
    : rtcConnectionState;
  
  const currentTranscriptions = transcriptionType === 'websocket'
    ? wsTranscriptions
    : rtcTranscriptions;
  
  const currentIsRecording = transcriptionType === 'websocket'
    ? isAudioRecording
    : isWebRTCRecording;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center" mb={4}>
          <Heading as="h1" size="xl">OpenAI Realtime Transcription</Heading>
          <Text mt={2} color="gray.600">
            Transcribe audio in real-time using OpenAI's Realtime API
          </Text>
        </Box>

        <ApiKeyInput />
        
        <ModelSelector />

        <Tabs index={tabIndex} onChange={handleTabChange} variant="enclosed">
          <TabList>
            <Tab>WebRTC Connection</Tab>
            <Tab>WebSocket Connection</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text>
                  WebRTC mode uses a peer-to-peer connection to send audio directly from your browser to OpenAI.
                  This is the recommended mode for most users.
                </Text>
                
                <ConnectionControls
                  connectionStatus={currentConnectionState.status}
                  connectionError={currentConnectionState.error}
                  isRecording={currentIsRecording}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onClearTranscriptions={handleClearTranscriptions}
                  connectionType="webrtc"
                />
                
                <TranscriptionDisplay
                  transcriptions={currentTranscriptions}
                  loading={currentIsRecording}
                />
              </VStack>
            </TabPanel>
            
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text>
                  WebSocket mode sends audio data through our server to the OpenAI API.
                  Use this mode if WebRTC doesn't work in your environment.
                </Text>
                
                <ConnectionControls
                  connectionStatus={currentConnectionState.status}
                  connectionError={currentConnectionState.error}
                  isRecording={currentIsRecording}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onClearTranscriptions={handleClearTranscriptions}
                  connectionType="websocket"
                />
                
                <TranscriptionDisplay
                  transcriptions={currentTranscriptions}
                  loading={currentIsRecording}
                />
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default TranscriptionPage; 