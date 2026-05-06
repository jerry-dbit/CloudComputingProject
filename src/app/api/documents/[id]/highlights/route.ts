import { NextRequest, NextResponse } from 'next/server';
import { addHighlight, deleteHighlight, getDocumentById } from '@/lib/db/local';
import type { HighlightColor } from '@/types';
import { getUserFromRequest } from '@/lib/auth/session';

const VALID_COLORS = new Set<HighlightColor>(['yellow', 'green', 'pink', 'blue']);

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/documents/[id]/highlights'>
) {
  try {
    const { id } = await context.params;
    const doc = await getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(doc.highlights);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/documents/[id]/highlights'>
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!VALID_COLORS.has(body.color)) {
      return NextResponse.json({ error: 'Invalid highlight color' }, { status: 400 });
    }

    const required = ['page', 'xPct', 'yPct', 'widthPct', 'heightPct'];
    for (const key of required) {
      if (typeof body.position?.[key] !== 'number') {
        return NextResponse.json({ error: `Invalid highlight position: ${key}` }, { status: 400 });
      }
    }

    const created = await addHighlight(id, {
      userId: user.id,
      username: user.username,
      color: body.color,
      text: String(body.text || ''),
      position: {
        page: body.position.page,
        xPct: body.position.xPct,
        yPct: body.position.yPct,
        widthPct: body.position.widthPct,
        heightPct: body.position.heightPct,
      },
    });

    if (!created) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating highlight:', error);
    return NextResponse.json({ error: 'Failed to create highlight' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/documents/[id]/highlights'>
) {
  try {
    const { id } = await context.params;
    const highlightId = request.nextUrl.searchParams.get('highlightId');

    if (!highlightId) {
      return NextResponse.json({ error: 'Missing highlightId' }, { status: 400 });
    }

    const deleted = await deleteHighlight(id, highlightId);
    if (!deleted) {
      return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }
}
