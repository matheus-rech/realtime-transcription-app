import React, { useEffect, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  Badge,
  Flex
} from '@chakra-ui/react';
import { TranscriptionResult } from '../types';

interface TranscriptionDisplayProps {
  transcriptions: TranscriptionResult[];
  loading?: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcriptions,
  loading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcriptions come in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcriptions]);

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box
      width="100%"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      height="400px"
      bg="white"
      display="flex"
      flexDirection="column"
    >
      <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
        <Heading size="md">Transcription</Heading>
      </Box>

      <Box
        ref={containerRef}
        p={4}
        overflowY="auto"
        flex="1"
      >
        {transcriptions.length === 0 ? (
          <Text color="gray.400" textAlign="center" py={10}>
            {loading 
              ? 'Listening...' 
              : 'No transcriptions yet. Start speaking to see real-time transcription.'}
          </Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {transcriptions.map((transcription, index) => (
              <Box 
                key={index} 
                p={3} 
                borderRadius="md" 
                bg={!transcription.isFinal ? "blue.50" : undefined}
                borderWidth="1px"
                borderColor="gray.200"
              >
                <Flex justify="space-between" mb={2}>
                  <Badge colorScheme={transcription.isFinal ? 'green' : 'blue'}>
                    {transcription.isFinal ? 'Final' : 'Processing...'}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {formatTime(transcription.timestamp)}
                  </Text>
                </Flex>
                <Text>{transcription.text}</Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default TranscriptionDisplay; 