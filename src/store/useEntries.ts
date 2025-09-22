import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Entry, EntryType } from '@/types/entry';
import {
  createEntry as insertEntry,
  getDatabase,
  getEntryById,
  listEntriesByType,
  updateEntry as persistUpdate
} from '@/lib/db';
import { getColorKeyForScore } from '@/lib/colors';
import { pullChanges, subscribeToRealtime, pushDirtyEntries } from '@/lib/sync';
import { env } from '@/lib/env';

interface EntriesState {
  entriesByType: Record<EntryType, Entry[]>;
  initialized: boolean;
  unsubscribeRealtime?: () => void;
  initialize: () => Promise<void>;
  refreshEntries: (type: EntryType) => Promise<void>;
  refreshEntry: (id: string) => Promise<Entry | null>;
  createEntry: (payload: Partial<Entry> & { type: EntryType; title: string }) => Promise<Entry>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<Entry | null>;
  syncFromRemote: () => Promise<void>;
  pushDirty: () => Promise<void>;
}

const emptyState: Record<EntryType, Entry[]> = {
  idea: [],
  note: [],
  observation: []
};

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entriesByType: { ...emptyState },
  initialized: false,
  unsubscribeRealtime: undefined,
  initialize: async () => {
    await getDatabase();
    await get().syncFromRemote();
    await Promise.all((Object.keys(emptyState) as EntryType[]).map((type) => get().refreshEntries(type)));
    const unsubscribe = subscribeToRealtime({
      onEntryUpsert: async (entry) => {
        const existing = await getEntryById(entry.id);
        if (existing) {
          await persistUpdate({ ...existing, ...entry, dirty: false });
        } else {
          await insertEntry(entry);
        }
        await get().refreshEntry(entry.id);
      }
    });
    set({ unsubscribeRealtime: unsubscribe });
    set({ initialized: true });
  },
  refreshEntries: async (type: EntryType) => {
    const items = await listEntriesByType(type);
    set((state) => ({
      entriesByType: {
        ...state.entriesByType,
        [type]: items
      }
    }));
  },
  refreshEntry: async (id: string) => {
    const entry = await getEntryById(id);
    if (entry) {
      set((state) => ({
        entriesByType: {
          ...state.entriesByType,
          [entry.type]: state.entriesByType[entry.type].map((existing) =>
            existing.id === entry.id ? entry : existing
          )
        }
      }));
    }
    return entry;
  },
  createEntry: async (payload) => {
    const now = new Date().toISOString();
    const colorKey = payload.score != null ? getColorKeyForScore(payload.score) : undefined;
    const entry: Entry = {
      id: payload.id ?? uuidv4(),
      type: payload.type,
      title: payload.title,
      description: payload.description,
      transcript: payload.transcript,
      audioPath: payload.audioPath,
      analysis: payload.analysis,
      score: payload.score,
      colorKey,
      createdAt: payload.createdAt ?? now,
      updatedAt: payload.updatedAt ?? now,
      obsidianFilePath: payload.obsidianFilePath,
      remoteId: payload.remoteId,
      dirty: payload.dirty ?? true
    };

    await insertEntry(entry);

    set((state) => ({
      entriesByType: {
        ...state.entriesByType,
        [entry.type]: [entry, ...state.entriesByType[entry.type]]
      }
    }));

    return entry;
  },
  updateEntry: async (id, updates) => {
    const current = await getEntryById(id);
    if (!current) {
      return null;
    }

    const merged: Entry = {
      ...current,
      ...updates,
      score: updates.score ?? current.score,
      analysis: updates.analysis ?? current.analysis,
      colorKey: updates.score != null ? getColorKeyForScore(updates.score) : current.colorKey,
      updatedAt: new Date().toISOString(),
      dirty: updates.dirty ?? true
    };

    await persistUpdate(merged);

    set((state) => ({
      entriesByType: {
        ...state.entriesByType,
        [merged.type]: state.entriesByType[merged.type].map((item) =>
          item.id === merged.id ? merged : item
        )
      }
    }));

    return merged;
  },
  syncFromRemote: async () => {
    await pullChanges(env.supabaseUserId);
  },
  pushDirty: async () => {
    if (!env.supabaseUserId) {
      console.warn('Supabase user id is not configured.');
      return;
    }
    await pushDirtyEntries(env.supabaseUserId);
  }
}));
