import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ApiKey } from '../types';
import { getApiKey, saveApiKey, removeApiKey, validateApiKey } from '../utils/apiKeyStorage';

interface ApiKeyContextType {
  apiKey: string | null;
  hasValidKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  validateAndSetApiKey: (key: string) => boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [hasValidKey, setHasValidKey] = useState<boolean>(false);

  // Load API key from storage on component mount
  useEffect(() => {
    const storedKey = getApiKey();
    if (storedKey) {
      setApiKeyState(storedKey.key);
      setHasValidKey(validateApiKey(storedKey.key));
    }
  }, []);

  const setApiKey = (key: string): void => {
    if (!key) {
      clearApiKey();
      return;
    }

    const isValid = validateApiKey(key);
    setHasValidKey(isValid);

    if (isValid) {
      setApiKeyState(key);
      saveApiKey(key);
    } else {
      clearApiKey();
    }
  };

  const clearApiKey = (): void => {
    setApiKeyState(null);
    setHasValidKey(false);
    removeApiKey();
  };

  const validateAndSetApiKey = (key: string): boolean => {
    const isValid = validateApiKey(key);
    if (isValid) {
      setApiKey(key);
    }
    return isValid;
  };

  const value = {
    apiKey,
    hasValidKey,
    setApiKey,
    clearApiKey,
    validateAndSetApiKey
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};

// Custom hook to use the API key context
export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}; 