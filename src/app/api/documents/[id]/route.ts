import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument, getDocumentById } from '@/lib/db/local';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/documents/[id]'>
) {
  try {
    const { id } = await context.params;
    const doc = await getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<'/api/documents/[id]'>
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteDocument(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
