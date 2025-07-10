import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface JournalDB extends DBSchema {
  entries: {
    key: string;
    value: JournalEntry;
  };
}

let dbPromise: Promise<IDBPDatabase<JournalDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<JournalDB>("journal-sample", 1, {
      upgrade(db) {
        db.createObjectStore("entries", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function listEntries(): Promise<JournalEntry[]> {
  const db = await getDb();
  return db.getAll("entries");
}

export async function addEntry(content: string): Promise<JournalEntry> {
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const db = await getDb();
  await db.put("entries", entry);
  return entry;
}

export async function updateEntry(entry: JournalEntry): Promise<void> {
  const db = await getDb();
  await db.put("entries", { ...entry, updatedAt: Date.now() });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("entries", id);
}

export async function clearEntries(): Promise<void> {
  const db = await getDb();
  await db.clear("entries");
}
