import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById } from '@/lib/db/local';
import {
  getDocumentPresence,
  upsertDocumentPresence,
} from '@/lib/realtime/store';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/collab/document/[id]'>
) {
  try {
    const { id } = await context.params;
    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      highlights: doc.highlights,
      cursors: getDocumentPresence(id),
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching document collaboration snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaboration snapshot' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/collab/document/[id]'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const cursors = upsertDocumentPresence(id, {
      userId: String(body.userId || 'user-1'),
      username: String(body.username || 'John Doe'),
      avatar: String(body.avatar || ''),
      x: Number(body.x || 0),
      y: Number(body.y || 0),
    });

    return NextResponse.json({ cursors });
  } catch (error) {
    console.error('Error posting document cursor:', error);
    return NextResponse.json({ error: 'Failed to update cursor' }, { status: 500 });
  }
}
