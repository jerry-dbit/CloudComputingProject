import type { CursorPosition } from '@/types';

interface RoomPresence {
  [roomId: string]: CursorPosition[];
}

interface DocumentPresence {
  [documentId: string]: CursorPosition[];
}

interface RealtimeStore {
  roomPresence: RoomPresence;
  documentPresence: DocumentPresence;
}

declare global {
  // eslint-disable-next-line no-var
  var __studyflowRealtimeStore: RealtimeStore | undefined;
}

function getStore(): RealtimeStore {
  if (!global.__studyflowRealtimeStore) {
    global.__studyflowRealtimeStore = {
      roomPresence: {},
      documentPresence: {},
    };
  }
  return global.__studyflowRealtimeStore;
}

function prune(list: CursorPosition[]): CursorPosition[] {
  const now = Date.now();
  return list.filter((item) => now - new Date(item.updatedAt).getTime() < 15_000);
}

export function getDocumentPresence(documentId: string): CursorPosition[] {
  const store = getStore();
  store.documentPresence[documentId] = prune(store.documentPresence[documentId] ?? []);
  return store.documentPresence[documentId];
}

export function upsertDocumentPresence(
  documentId: string,
  cursor: Omit<CursorPosition, 'roomId' | 'updatedAt'>
): CursorPosition[] {
  const store = getStore();
  const next = prune(store.documentPresence[documentId] ?? []).filter(
    (item) => item.userId !== cursor.userId
  );

  next.push({
    ...cursor,
    roomId: documentId,
    updatedAt: new Date().toISOString(),
  });

  store.documentPresence[documentId] = next;
  return next;
}

export function getRoomPresence(roomId: string): CursorPosition[] {
  const store = getStore();
  store.roomPresence[roomId] = prune(store.roomPresence[roomId] ?? []);
  return store.roomPresence[roomId];
}

export function upsertRoomPresence(
  roomId: string,
  cursor: Omit<CursorPosition, 'roomId' | 'updatedAt'>
): CursorPosition[] {
  const store = getStore();
  const next = prune(store.roomPresence[roomId] ?? []).filter(
    (item) => item.userId !== cursor.userId
  );

  next.push({
    ...cursor,
    roomId,
    updatedAt: new Date().toISOString(),
  });

  store.roomPresence[roomId] = next;
  return next;
}
