import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getRooms, getRoomByCode } from '@/lib/db/local';
import { generateId, generateRoomCode } from '@/lib/utils';
import type { StudyRoom } from '@/types';
import { getUserFromRequest } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const rooms = await getRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const name = String(body.name || '').trim();
    const subject = String(body.subject || '').trim();
    const ownerId = user.id;
    const ownerName = user.username;
    const maxParticipants = Number(body.maxParticipants || 10);

    if (!name || !subject) {
      return NextResponse.json(
        { error: 'Room name and subject are required.' },
        { status: 400 }
      );
    }

    let code = String(body.code || '').trim().toUpperCase();
    if (!code) {
      code = generateRoomCode();
    }

    const existing = await getRoomByCode(code);
    if (existing) {
      code = generateRoomCode();
    }

    const now = new Date().toISOString();
    const room: StudyRoom = {
      id: generateId(),
      name,
      subject,
      code,
      ownerId,
      maxParticipants,
      currentDocumentId: null,
      sharedDocumentIds: [],
      participants: [
        {
          userId: ownerId,
          username: ownerName,
          avatar: '',
          joinedAt: now,
          isOwner: true,
        },
      ],
      createdAt: now,
      isActive: true,
    };

    const created = await createRoom(room);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
