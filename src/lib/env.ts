import Constants from 'expo-constants';

type ExtraConfig = {
  assemblyAiApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  llmEndpoint?: string;
  defaultTheme?: 'light' | 'dark';
  supabaseUserId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const env = {
  assemblyAiApiKey: extra.assemblyAiApiKey ?? process.env.ASSEMBLYAI_API_KEY,
  supabaseUrl: extra.supabaseUrl ?? process.env.SUPABASE_URL,
  supabaseAnonKey: extra.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
  llmEndpoint: extra.llmEndpoint ?? process.env.LLM_ENDPOINT,
  defaultTheme: extra.defaultTheme ?? 'dark',
  supabaseUserId: extra.supabaseUserId ?? process.env.SUPABASE_USER_ID
};
