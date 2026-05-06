import { NextRequest, NextResponse } from 'next/server';
import { getRoomById } from '@/lib/db/local';
import { getRoomPresence, upsertRoomPresence } from '@/lib/realtime/store';
import { getUserFromRequest } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/collab/room/[id]'>
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
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const cursors = upsertRoomPresence(id, {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      x: Number(body.x || 0),
      y: Number(body.y || 0),
    });

    return NextResponse.json({ cursors });
  } catch (error) {
    console.error('Error posting room cursor:', error);
    return NextResponse.json({ error: 'Failed to update room cursor' }, { status: 500 });
  }
}
