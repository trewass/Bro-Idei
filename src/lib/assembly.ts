import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { env } from './env';

const ASSEMBLY_BASE_URL = 'https://api.assemblyai.com/v2';

const client = axios.create({
  baseURL: ASSEMBLY_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  if (!env.assemblyAiApiKey) {
    throw new Error('Missing AssemblyAI API key');
  }
  config.headers = {
    ...config.headers,
    Authorization: env.assemblyAiApiKey
  };
  return config;
});

export interface TranscriptResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
}

export const uploadAudioFile = async (uri: string): Promise<string> => {
  if (!env.assemblyAiApiKey) {
    throw new Error('Missing AssemblyAI API key');
  }

  const response = await FileSystem.uploadAsync(`${ASSEMBLY_BASE_URL}/upload`, uri, {
    httpMethod: 'POST',
    headers: {
      Authorization: env.assemblyAiApiKey,
      'Transfer-Encoding': 'chunked'
    },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
  });

  if (response.status !== 200) {
    throw new Error(`AssemblyAI upload failed: ${response.status}`);
  }

  const data = JSON.parse(response.body) as { upload_url: string };
  return data.upload_url;
};

export const requestTranscript = async (
  audioUrl: string,
  options: Record<string, unknown> = {}
): Promise<TranscriptResult> => {
  const response = await client.post<TranscriptResult>('/transcript', {
    audio_url: audioUrl,
    ...options
  });
  return response.data;
};

export const fetchTranscript = async (id: string): Promise<TranscriptResult> => {
  const response = await client.get<TranscriptResult>(`/transcript/${id}`);
  return response.data;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollTranscriptUntilComplete = async (
  id: string,
  { interval = 2000, maxAttempts = 60 }: { interval?: number; maxAttempts?: number } = {}
): Promise<TranscriptResult> => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await fetchTranscript(id);
    if (result.status === 'completed' || result.status === 'error') {
      return result;
    }
    await sleep(interval);
  }
  throw new Error('Transcript polling exceeded maximum attempts');
};

export const transcribeAudioFile = async (uri: string) => {
  const audioUrl = await uploadAudioFile(uri);
  const transcript = await requestTranscript(audioUrl, { auto_highlights: true });
  const result = await pollTranscriptUntilComplete(transcript.id);
  if (result.status !== 'completed' || !result.text) {
    throw new Error(result.error ?? 'Transcript failed');
  }
  return result.text;
};
