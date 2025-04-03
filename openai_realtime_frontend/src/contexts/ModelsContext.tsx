import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Model } from '../types';
import { getAvailableModels } from '../services/api';

interface ModelsContextType {
  models: Model[];
  loading: boolean;
  error: string | null;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  refreshModels: () => Promise<void>;
}

const ModelsContext = createContext<ModelsContextType | undefined>(undefined);

interface ModelsProviderProps {
  children: ReactNode;
  defaultModel?: string;
}

export const ModelsProvider: React.FC<ModelsProviderProps> = ({ 
  children, 
  defaultModel = 'gpt4o'  // Default to gpt4o model
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  const refreshModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const availableModels = await getAvailableModels();
      setModels(availableModels);
      
      // If the currently selected model isn't available anymore,
      // select the first available model
      if (availableModels.length > 0 && !availableModels.some(m => m.model_id === selectedModel)) {
        setSelectedModel(availableModels[0].model_id);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
      
      // Set default models as fallback
      setModels([
        {
          model_id: 'gpt4o',
          openai_model: 'gpt-4o-transcribe',
          description: 'OpenAI GPT-4o Transcribe'
        },
        {
          model_id: 'gpt4o-mini',
          openai_model: 'gpt-4o-mini-transcribe',
          description: 'OpenAI GPT-4o mini Transcribe'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load models on component mount
  useEffect(() => {
    refreshModels();
  }, []);

  const value = {
    models,
    loading,
    error,
    selectedModel,
    setSelectedModel,
    refreshModels
  };

  return (
    <ModelsContext.Provider value={value}>
      {children}
    </ModelsContext.Provider>
  );
};

// Custom hook to use the models context
export const useModels = (): ModelsContextType => {
  const context = useContext(ModelsContext);
  if (context === undefined) {
    throw new Error('useModels must be used within a ModelsProvider');
  }
  return context;
}; 