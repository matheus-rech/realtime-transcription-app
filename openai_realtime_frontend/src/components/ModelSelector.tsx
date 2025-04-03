import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Select,
  Spinner,
  Text,
  Tooltip,
  IconButton,
  HStack
} from '@chakra-ui/react';
import { FiHelpCircle, FiRefreshCw } from 'react-icons/fi';
import { useModels } from '../contexts/ModelsContext';

const ModelSelector: React.FC = () => {
  const { models, loading, error, selectedModel, setSelectedModel, refreshModels } = useModels();

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const handleRefresh = () => {
    refreshModels();
  };

  return (
    <Box width="100%" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.200">
      <FormControl>
        <HStack alignItems="center" mb={2}>
          <FormLabel mb={0}>Transcription Model</FormLabel>
          <Tooltip
            label="Select the OpenAI model to use for transcription. GPT-4o offers better accuracy, while GPT-4o mini is faster and more cost-effective."
            hasArrow
            placement="top"
          >
            <IconButton
              aria-label="Model selection help"
              icon={<FiHelpCircle />}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
          <Box flex="1" />
          <IconButton
            aria-label="Refresh models"
            icon={<FiRefreshCw />}
            size="sm"
            isLoading={loading}
            onClick={handleRefresh}
          />
        </HStack>

        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" py={2}>
            <Spinner size="sm" mr={2} />
            <Text>Loading available models...</Text>
          </Box>
        ) : error ? (
          <Text color="red.500" fontSize="sm">
            Error loading models: {error}
          </Text>
        ) : (
          <Select value={selectedModel} onChange={handleModelChange}>
            {models.map(model => (
              <option key={model.model_id} value={model.model_id}>
                {model.description}
              </option>
            ))}
          </Select>
        )}

        <Text fontSize="xs" color="gray.500" mt={2}>
          {models.find(m => m.model_id === selectedModel)?.description}
        </Text>
      </FormControl>
    </Box>
  );
};

export default ModelSelector; 