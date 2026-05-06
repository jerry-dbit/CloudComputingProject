import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/db/local';
import { getUserFromRequest } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/rooms/[id]/leave'>
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = user.id;

    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const nextParticipants = room.participants.filter((p) => p.userId !== userId);
    const updated = await updateRoom(id, {
      participants: nextParticipants,
      isActive: nextParticipants.length > 0,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
