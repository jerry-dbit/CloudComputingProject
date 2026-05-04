import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  ChatMessage,
  Document,
  Highlight,
  StudyRoom,
  StudyflowDb,
} from '@/types';
import { generateId } from '@/lib/utils';

const DB_PATH = path.join(process.cwd(), 'data', 'studyflow-db.json');

const EMPTY_DB: StudyflowDb = {
  documents: [],
  rooms: [],
  messages: [],
};

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
  }
}

export async function readDb(): Promise<StudyflowDb> {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as StudyflowDb;

  return {
    documents: parsed.documents ?? [],
    rooms: parsed.rooms ?? [],
    messages: parsed.messages ?? [],
  };
}

async function writeDb(db: StudyflowDb): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getDocuments(): Promise<Document[]> {
  const db = await readDb();
  return db.documents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const db = await readDb();
  return db.documents.find((doc) => doc.id === id) ?? null;
}

export async function createDocument(
  payload: Omit<Document, 'highlights' | 'annotations'>
): Promise<Document> {
  const db = await readDb();

  const doc: Document = {
    ...payload,
    highlights: [],
    annotations: [],
  };

  db.documents.unshift(doc);
  await writeDb(db);
  return doc;
}

export async function updateDocument(
  id: string,
  patch: Partial<Document>
): Promise<Document | null> {
  const db = await readDb();
  const idx = db.documents.findIndex((doc) => doc.id === id);
  if (idx < 0) return null;

  const updated = {
    ...db.documents[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  } as Document;

  db.documents[idx] = updated;
  await writeDb(db);
  return updated;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.documents.length;
  db.documents = db.documents.filter((doc) => doc.id !== id);

  if (db.documents.length === before) return false;

  for (const room of db.rooms) {
    if (room.currentDocumentId === id) {
      room.currentDocumentId = null;
    }
  }

  await writeDb(db);
  return true;
}

export async function addHighlight(
  documentId: string,
  payload: Omit<Highlight, 'id' | 'createdAt' | 'documentId'>
): Promise<Highlight | null> {
  const db = await readDb();
  const doc = db.documents.find((item) => item.id === documentId);
  if (!doc) return null;

  const highlight: Highlight = {
    id: generateId(),
    documentId,
    createdAt: new Date().toISOString(),
    ...payload,
  };

  doc.highlights.push(highlight);
  doc.updatedAt = new Date().toISOString();
  await writeDb(db);
  return highlight;
}

export async function deleteHighlight(
  documentId: string,
  highlightId: string
): Promise<boolean> {
  const db = await readDb();
  const doc = db.documents.find((item) => item.id === documentId);
  if (!doc) return false;

  const before = doc.highlights.length;
  doc.highlights = doc.highlights.filter((h) => h.id !== highlightId);
  doc.annotations = doc.annotations.filter((a) => a.highlightId !== highlightId);

  if (doc.highlights.length === before) return false;

  doc.updatedAt = new Date().toISOString();
  await writeDb(db);
  return true;
}

export async function getRooms(): Promise<StudyRoom[]> {
  const db = await readDb();
  return db.rooms
    .filter((room) => room.isActive)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRoomById(id: string): Promise<StudyRoom | null> {
  const db = await readDb();
  return db.rooms.find((room) => room.id === id) ?? null;
}

export async function getRoomByCode(code: string): Promise<StudyRoom | null> {
  const db = await readDb();
  return db.rooms.find((room) => room.code === code.toUpperCase()) ?? null;
}

export async function createRoom(payload: StudyRoom): Promise<StudyRoom> {
  const db = await readDb();
  db.rooms.unshift(payload);
  await writeDb(db);
  return payload;
}

export async function updateRoom(
  id: string,
  patch: Partial<StudyRoom>
): Promise<StudyRoom | null> {
  const db = await readDb();
  const idx = db.rooms.findIndex((room) => room.id === id);
  if (idx < 0) return null;

  const updated = {
    ...db.rooms[idx],
    ...patch,
    id,
  } as StudyRoom;

  db.rooms[idx] = updated;
  await writeDb(db);
  return updated;
}

export async function getRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const db = await readDb();
  return db.messages
    .filter((msg) => msg.roomId === roomId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addRoomMessage(
  payload: Omit<ChatMessage, 'id' | 'createdAt'>
): Promise<ChatMessage> {
  const db = await readDb();
  const msg: ChatMessage = {
    ...payload,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  db.messages.push(msg);
  await writeDb(db);
  return msg;
}
