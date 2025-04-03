import axios from 'axios';
import { EphemeralKey, Model, SessionUpdateRequest } from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
});

// Session API functions
export const getAvailableModels = async (): Promise<Model[]> => {
  const response = await api.get('/session/models');
  return response.data;
};

export const getModelInfo = async (modelName: string): Promise<Model> => {
  const response = await api.get(`/session/models/${modelName}`);
  return response.data;
};

export const generateEphemeralKey = async (
  scope?: string[],
  expiration?: number
): Promise<EphemeralKey> => {
  const response = await api.post('/session/key', {
    scope,
    expiration,
  });
  return response.data;
};

export const createSessionUpdate = async (
  request: SessionUpdateRequest
): Promise<any> => {
  const response = await api.post('/session/update', request);
  return response.data;
};

// Define WebSocket URL generators
export const getWebSocketTranscribeURL = (
  modelName: string,
  instructions?: string
): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
  const wsBase = baseUrl.replace(/^http/, 'ws');
  
  let url = `${wsBase}/api/v1/ws/transcribe?model=${modelName}`;
  if (instructions) {
    url += `&instructions=${encodeURIComponent(instructions)}`;
  }
  
  return url;
};

export const getWebRTCTranscribeURL = (
  modelName: string,
  apiKey?: string
): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
  const wsBase = baseUrl.replace(/^http/, 'ws');
  
  let url = `${wsBase}/api/v1/rtc/transcribe?model=${modelName}`;
  if (apiKey) {
    url += `&api_key=${encodeURIComponent(apiKey)}`;
  }
  
  return url;
};

export default api; 