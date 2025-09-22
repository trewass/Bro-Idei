import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Idea Cards',
  slug: 'ideacards',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'ideacards',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0F1115'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F1115'
    }
  },
  extra: {
    assemblyAiApiKey: process.env.ASSEMBLYAI_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    llmEndpoint: process.env.LLM_ENDPOINT,
    defaultTheme: 'dark',
    supabaseUserId: process.env.SUPABASE_USER_ID
  },
  experiments: {
    typedRoutes: true
  }
};

export default config;
