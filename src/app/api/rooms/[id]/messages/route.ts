import { NextRequest, NextResponse } from 'next/server';
import { addRoomMessage, getRoomById, getRoomMessages } from '@/lib/db/local';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/rooms/[id]/messages'>
) {
  try {
    const { id } = await context.params;
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const messages = await getRoomMessages(id);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/rooms/[id]/messages'>
) {
  try {
    const { id } = await context.params;
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json();
    const text = String(body.text || '').trim();
    if (!text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const message = await addRoomMessage({
      roomId: id,
      userId: String(body.userId || 'user-1'),
      username: String(body.username || 'John Doe'),
      text,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
