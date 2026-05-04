import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/db/local';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/rooms/[id]/leave'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = String(body.userId || 'user-1');

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
