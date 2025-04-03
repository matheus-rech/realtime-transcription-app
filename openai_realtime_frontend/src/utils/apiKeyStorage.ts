import { ApiKey } from '../types';

const API_KEY_STORAGE_KEY = 'openai_realtime_api_key';

// Simple encryption/decryption for local storage
// Note: This is not highly secure but provides basic obfuscation
const encrypt = (text: string): string => {
  return btoa(text);
};

const decrypt = (text: string): string => {
  return atob(text);
};

// Store API key in localStorage
export const saveApiKey = (key: string): void => {
  const apiKey: ApiKey = {
    key,
    savedAt: Date.now()
  };
  
  localStorage.setItem(
    API_KEY_STORAGE_KEY,
    encrypt(JSON.stringify(apiKey))
  );
};

// Retrieve API key from localStorage
export const getApiKey = (): ApiKey | null => {
  const encrypted = localStorage.getItem(API_KEY_STORAGE_KEY);
  
  if (!encrypted) {
    return null;
  }
  
  try {
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted) as ApiKey;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
};

// Remove API key from localStorage
export const removeApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

// Validate API key format
export const validateApiKey = (key: string): boolean => {
  // Basic validation - OpenAI API keys typically start with 'sk-'
  return key.trim().startsWith('sk-') && key.trim().length > 10;
}; 