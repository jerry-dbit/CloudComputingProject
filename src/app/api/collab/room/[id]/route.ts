import { NextRequest, NextResponse } from 'next/server';
import { getRoomById } from '@/lib/db/local';
import { getRoomPresence, upsertRoomPresence } from '@/lib/realtime/store';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/collab/room/[id]'>
) {
  try {
    const { id } = await context.params;
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      cursors: getRoomPresence(id),
      participants: room.participants,
    });
  } catch (error) {
    console.error('Error fetching room collaboration snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room collaboration snapshot' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/collab/room/[id]'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const cursors = upsertRoomPresence(id, {
      userId: String(body.userId || 'user-1'),
      username: String(body.username || 'John Doe'),
      avatar: String(body.avatar || ''),
      x: Number(body.x || 0),
      y: Number(body.y || 0),
    });

    return NextResponse.json({ cursors });
  } catch (error) {
    console.error('Error posting room cursor:', error);
    return NextResponse.json({ error: 'Failed to update room cursor' }, { status: 500 });
  }
}
