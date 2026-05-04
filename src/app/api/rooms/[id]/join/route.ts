import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom } from '@/lib/db/local';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/rooms/[id]/join'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = String(body.userId || 'user-1');
    const username = String(body.username || 'John Doe');

    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const already = room.participants.find((p) => p.userId === userId);
    if (already) {
      return NextResponse.json(room);
    }

    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    const nextParticipants = [
      ...room.participants,
      {
        userId,
        username,
        avatar: '',
        joinedAt: new Date().toISOString(),
        isOwner: false,
      },
    ];

    const updated = await updateRoom(id, { participants: nextParticipants });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
