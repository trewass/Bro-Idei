import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Entry, Link } from '@/types/entry';
import {
  createEntry as insertEntry,
  getEntryById,
  listDirtyEntries,
  markEntryClean,
  updateEntry as persistUpdate
} from './db';
import { env } from './env';

let client: SupabaseClient | null = null;

const getClient = () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase credentials are not configured');
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
};

const mapRemoteEntry = (payload: Record<string, any>): Entry => ({
  id: payload.id,
  type: payload.type,
  title: payload.title,
  description: payload.description ?? undefined,
  transcript: payload.transcript ?? undefined,
  audioPath: payload.audioPath ?? undefined,
  analysis: payload.analysis ?? undefined,
  score: payload.score ?? undefined,
  colorKey: payload.colorKey ?? undefined,
  createdAt: payload.createdAt,
  updatedAt: payload.updatedAt,
  obsidianFilePath: payload.obsidianFilePath ?? undefined,
  remoteId: payload.remoteId ?? payload.id,
  dirty: false
});

export const pushDirtyEntries = async (userId: string) => {
  const supabase = getClient();
  const dirtyEntries = await listDirtyEntries();
  if (dirtyEntries.length === 0) {
    return;
  }

  for (const entry of dirtyEntries) {
    const { error, data } = await supabase
      .from('notes')
      .upsert({
        ...entry,
        user_id: userId,
        analysis: entry.analysis ?? null
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to push entry', entry.id, error);
      continue;
    }

    await markEntryClean(entry.id, data?.id);
  }
};

export const pushLink = async (userId: string, link: Link) => {
  const supabase = getClient();
  const { error } = await supabase
    .from('links')
    .upsert({ ...link, user_id: userId });
  if (error) {
    console.warn('Failed to push link', error);
  }
};

export const pullChanges = async (userId?: string) => {
  const supabase = getClient();
  let query = supabase.from('notes').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const entry = mapRemoteEntry(row);
    const existing = await getEntryById(entry.id);
    if (!existing) {
        await insertEntry(entry);
    } else if (new Date(existing.updatedAt).getTime() < new Date(entry.updatedAt).getTime()) {
      await persistUpdate({ ...existing, ...entry, dirty: false });
    }
  }
};

type RealtimeHandlers = {
  onEntryUpsert?: (entry: Entry) => void;
  onEntryDelete?: (id: string) => void;
};

export const subscribeToRealtime = (handlers: RealtimeHandlers = {}) => {
  const supabase = getClient();
  const channel = supabase
    .channel('notes-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, async (payload) => {
      if (payload.eventType === 'DELETE' && handlers.onEntryDelete) {
        handlers.onEntryDelete(payload.old.id);
        return;
      }

      if (payload.new && handlers.onEntryUpsert) {
        const entry = mapRemoteEntry(payload.new as Record<string, any>);
        handlers.onEntryUpsert(entry);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
