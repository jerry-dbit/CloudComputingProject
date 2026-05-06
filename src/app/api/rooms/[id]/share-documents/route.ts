import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, getRoomById, updateRoom } from '@/lib/db/local';
import { getUserFromRequest } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const room = await getRoomById(id);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json();
    const documentId = String(body.documentId || '').trim();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const doc = await getDocumentById(documentId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (doc.ownerId !== user.id) {
      return NextResponse.json({ error: 'You can only share your own documents' }, { status: 403 });
    }

    const sharedDocumentIds = room.sharedDocumentIds ?? [];
    if (sharedDocumentIds.includes(documentId)) {
      return NextResponse.json(room);
    }

    const updated = await updateRoom(id, {
      sharedDocumentIds: [documentId, ...sharedDocumentIds],
      currentDocumentId: room.currentDocumentId ?? documentId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error sharing document with room:', error);
    return NextResponse.json(
      { error: 'Failed to share document with room' },
      { status: 500 }
    );
  }
}
