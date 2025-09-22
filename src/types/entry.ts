export type EntryType = 'idea' | 'note' | 'observation';

export interface IdeaAnalysis {
  summary: string;
  verdict: 'trash' | 'weak' | 'ok' | 'strong' | 'killer';
  reasoning: string;
  suggestions: string[];
  marketNotes?: string;
  score: number;
}

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  description?: string;
  transcript?: string;
  audioPath?: string;
  analysis?: IdeaAnalysis;
  score?: number;
  colorKey?: string;
  createdAt: string;
  updatedAt: string;
  obsidianFilePath?: string;
  remoteId?: string;
  dirty: boolean;
}

export interface Link {
  id: string;
  fromId: string;
  toId: string;
  kind: string;
  createdAt: string;
}
