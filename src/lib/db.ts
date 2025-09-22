import * as SQLite from 'expo-sqlite';
import { Entry, EntryType, IdeaAnalysis, Link } from '@/types/entry';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const runMigrations = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      transcript TEXT,
      audioPath TEXT,
      analysis TEXT,
      score INTEGER,
      colorKey TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      obsidianFilePath TEXT,
      remoteId TEXT,
      dirty INTEGER DEFAULT 1
    )`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY NOT NULL,
      fromId TEXT NOT NULL,
      toId TEXT NOT NULL,
      kind TEXT DEFAULT 'related',
      createdAt TEXT NOT NULL
    )`
  );

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_entries_updatedAt ON entries(updatedAt);');
};

export const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('ideacards.db').then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return databasePromise;
};

type EntryRow = Entry & { analysis: string | null; dirty: number };

const deserializeEntry = (row: EntryRow): Entry => ({
  ...row,
  analysis: row.analysis ? (JSON.parse(row.analysis) as IdeaAnalysis) : undefined,
  dirty: Boolean(row.dirty)
});

const serializeEntry = (entry: Entry): EntryRow => ({
  ...entry,
  analysis: entry.analysis ? JSON.stringify(entry.analysis) : null,
  dirty: entry.dirty ? 1 : 0
});

export const createEntry = async (entry: Entry) => {
  const db = await getDatabase();
  const serialized = serializeEntry(entry);
  await db.runAsync(
    `INSERT INTO entries (id, type, title, description, transcript, audioPath, analysis, score, colorKey, createdAt, updatedAt, obsidianFilePath, remoteId, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      serialized.id,
      serialized.type,
      serialized.title,
      serialized.description ?? null,
      serialized.transcript ?? null,
      serialized.audioPath ?? null,
      serialized.analysis,
      serialized.score ?? null,
      serialized.colorKey ?? null,
      serialized.createdAt,
      serialized.updatedAt,
      serialized.obsidianFilePath ?? null,
      serialized.remoteId ?? null,
      serialized.dirty
    ]
  );
};

export const updateEntry = async (entry: Entry) => {
  const db = await getDatabase();
  const serialized = serializeEntry(entry);
  await db.runAsync(
    `UPDATE entries SET
      type = ?,
      title = ?,
      description = ?,
      transcript = ?,
      audioPath = ?,
      analysis = ?,
      score = ?,
      colorKey = ?,
      createdAt = ?,
      updatedAt = ?,
      obsidianFilePath = ?,
      remoteId = ?,
      dirty = ?
    WHERE id = ?`,
    [
      serialized.type,
      serialized.title,
      serialized.description ?? null,
      serialized.transcript ?? null,
      serialized.audioPath ?? null,
      serialized.analysis,
      serialized.score ?? null,
      serialized.colorKey ?? null,
      serialized.createdAt,
      serialized.updatedAt,
      serialized.obsidianFilePath ?? null,
      serialized.remoteId ?? null,
      serialized.dirty,
      serialized.id
    ]
  );
};

export const markEntryClean = async (id: string, remoteId?: string) => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE entries SET dirty = 0, remoteId = COALESCE(?, remoteId) WHERE id = ?`,
    [remoteId ?? null, id]
  );
};

export const getEntryById = async (id: string): Promise<Entry | null> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<EntryRow>(`SELECT * FROM entries WHERE id = ?`, [id]);
  return result ? deserializeEntry(result) : null;
};

export const listEntriesByType = async (type: EntryType): Promise<Entry[]> => {
  const db = await getDatabase();
  const results = await db.getAllAsync<EntryRow>(
    `SELECT * FROM entries WHERE type = ? ORDER BY updatedAt DESC`,
    [type]
  );
  return results.map(deserializeEntry);
};

export const listDirtyEntries = async (): Promise<Entry[]> => {
  const db = await getDatabase();
  const results = await db.getAllAsync<EntryRow>(`SELECT * FROM entries WHERE dirty = 1`);
  return results.map(deserializeEntry);
};

export const createLink = async (link: Link) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO links (id, fromId, toId, kind, createdAt) VALUES (?, ?, ?, ?, ?)` ,
    [link.id, link.fromId, link.toId, link.kind, link.createdAt]
  );
};

export const listLinksForEntry = async (entryId: string): Promise<Link[]> => {
  const db = await getDatabase();
  return db.getAllAsync<Link>(
    `SELECT * FROM links WHERE fromId = ? OR toId = ?`,
    [entryId, entryId]
  );
};

export const deleteLink = async (linkId: string) => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM links WHERE id = ?`, [linkId]);
};
