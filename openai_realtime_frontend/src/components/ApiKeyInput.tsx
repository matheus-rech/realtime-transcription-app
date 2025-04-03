import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Tooltip,
  useToast,
  VStack
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiInfo, FiKey, FiSave, FiTrash2 } from 'react-icons/fi';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ApiKeyInputProps {
  onSuccess?: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSuccess }) => {
  const { apiKey, hasValidKey, validateAndSetApiKey, clearApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const toast = useToast();

  const handleSaveApiKey = () => {
    if (!inputValue.trim()) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your OpenAI API key',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const isValid = validateAndSetApiKey(inputValue);
    
    if (isValid) {
      toast({
        title: 'API Key Saved',
        description: 'Your OpenAI API key has been saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setInputValue('');
      if (onSuccess) onSuccess();
    } else {
      toast({
        title: 'Invalid API Key',
        description: 'Please enter a valid OpenAI API key (starting with "sk-")',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveApiKey = () => {
    clearApiKey();
    setInputValue('');
    toast({
      title: 'API Key Removed',
      description: 'Your OpenAI API key has been removed',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveApiKey();
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <Box width="100%" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.200">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel display="flex" alignItems="center">
            <FiKey style={{ marginRight: '8px' }} />
            OpenAI API Key
            <Tooltip 
              label="Your API key is stored locally in your browser and never sent to our servers" 
              hasArrow
              placement="top"
            >
              <IconButton
                aria-label="Info about API key storage"
                icon={<FiInfo />}
                size="sm"
                variant="ghost"
                ml={2}
              />
            </Tooltip>
          </FormLabel>
          
          <InputGroup size="md">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder="Enter your OpenAI API key (sk-...)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              pr="4.5rem"
            />
            <InputRightElement width="4.5rem">
              <IconButton
                h="1.75rem"
                size="sm"
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                icon={showApiKey ? <FiEyeOff /> : <FiEye />}
                onClick={toggleShowApiKey}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Box display="flex" justifyContent="space-between">
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            onClick={handleSaveApiKey}
            isDisabled={!inputValue.trim()}
          >
            Save Key
          </Button>
          
          {hasValidKey && (
            <Button
              leftIcon={<FiTrash2 />}
              colorScheme="red"
              variant="outline"
              onClick={handleRemoveApiKey}
            >
              Remove Key
            </Button>
          )}
        </Box>

        {hasValidKey && (
          <Text color="green.500" fontSize="sm">
            API key is valid and saved
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default ApiKeyInput; 