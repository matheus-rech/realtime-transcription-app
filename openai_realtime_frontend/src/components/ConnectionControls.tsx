import React from 'react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
  Badge,
  VStack
} from '@chakra-ui/react';
import { 
  FiMic, 
  FiMicOff, 
  FiPlayCircle, 
  FiStopCircle,
  FiRefreshCw,
  FiRadio
} from 'react-icons/fi';
import { ConnectionStatus } from '../types';

interface ConnectionControlsProps {
  connectionStatus: ConnectionStatus;
  connectionError?: string;
  isRecording: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearTranscriptions: () => void;
  connectionType: 'websocket' | 'webrtc';
}

const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  connectionStatus,
  connectionError,
  isRecording,
  onConnect,
  onDisconnect,
  onStartRecording,
  onStopRecording,
  onClearTranscriptions,
  connectionType
}) => {
  // Get status color
  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get connection label
  const getConnectionLabel = () => {
    if (connectionType === 'websocket') {
      return 'WebSocket';
    } else {
      return 'WebRTC';
    }
  };

  // Get status description
  const getStatusDescription = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <Box 
      width="100%" 
      p={4} 
      borderRadius="md" 
      borderWidth="1px"
      borderColor="gray.200"
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack>
            <Tooltip label={connectionType === 'websocket' ? 'WebSocket connection' : 'WebRTC connection'}>
              <IconButton
                aria-label="Connection type"
                icon={connectionType === 'websocket' ? <FiRadio /> : <FiRadio />}
                variant="ghost"
                size="sm"
              />
            </Tooltip>
            <Text fontWeight="bold">{getConnectionLabel()} Connection</Text>
            <Badge colorScheme={getStatusColor(connectionStatus)}>
              {getStatusDescription(connectionStatus)}
            </Badge>
          </HStack>
          
          <HStack>
            {connectionStatus === 'connected' ? (
              <Button
                leftIcon={<FiStopCircle />}
                colorScheme="red"
                size="sm"
                onClick={onDisconnect}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                leftIcon={<FiPlayCircle />}
                colorScheme="green"
                size="sm"
                onClick={onConnect}
                isLoading={connectionStatus === 'connecting'}
                loadingText="Connecting"
                isDisabled={connectionStatus === 'connecting'}
              >
                Connect
              </Button>
            )}
          </HStack>
        </Flex>
        
        {connectionStatus === 'error' && connectionError && (
          <Text color="red.500" fontSize="sm">
            Error: {connectionError}
          </Text>
        )}
        
        <Flex justify="space-between" align="center">
          <Text>Recording Controls:</Text>
          <HStack>
            {isRecording ? (
              <Button
                leftIcon={<FiMicOff />}
                colorScheme="red"
                size="sm"
                onClick={onStopRecording}
                isDisabled={connectionStatus !== 'connected'}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                leftIcon={<FiMic />}
                colorScheme="blue"
                size="sm"
                onClick={onStartRecording}
                isDisabled={connectionStatus !== 'connected'}
              >
                Start Recording
              </Button>
            )}
            
            <Button
              leftIcon={<FiRefreshCw />}
              variant="outline"
              size="sm"
              onClick={onClearTranscriptions}
            >
              Clear Transcriptions
            </Button>
          </HStack>
        </Flex>
      </VStack>
    </Box>
  );
};

export default ConnectionControls; 