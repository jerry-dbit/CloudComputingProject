import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/db/local';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/rooms/[id]'>
) {
  try {
    const { id } = await context.params;
    const room = await getRoomById(id);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<'/api/rooms/[id]'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateRoom(id, {
      currentDocumentId:
        body.currentDocumentId === null ? null : String(body.currentDocumentId || ''),
      isActive:
        typeof body.isActive === 'boolean' ? body.isActive : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
