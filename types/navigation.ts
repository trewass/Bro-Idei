// Типы для параметров маршрутов
export type RootStackParamList = {
  '(tabs)': undefined;
  'card/[id]': { id: string };
};

export type TabParamList = {
  index: undefined;
  create: undefined;
  settings: undefined;
};

// Типы для карточек страхов
export interface FearCard {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'in_progress' | 'completed';
  progress: number; // 0-100
  techniques: string[];
  notes: string[];
}

// Типы для настроек приложения
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  notificationTime?: string; // HH:MM format
  language: 'ru' | 'en';
}

// Типы для пользовательских данных
export interface UserData {
  cards: FearCard[];
  settings: AppSettings;
  statistics: {
    totalCards: number;
    completedCards: number;
    activeCards: number;
    averageCompletionTime: number; // в днях
  };
}