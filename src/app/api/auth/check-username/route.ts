import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();

    if (!username) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    const user = await getUserByUsername(username);
    return NextResponse.json({ exists: Boolean(user) });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Failed to check username.' }, { status: 500 });
  }
}
