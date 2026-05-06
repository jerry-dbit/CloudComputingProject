import { NextRequest, NextResponse } from 'next/server';
import { getUserByIdentifier } from '@/lib/db/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || '').trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required.' }, { status: 400 });
    }

    const user = await getUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json({ error: 'No matching account was found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
    });
  } catch (error) {
    console.error('Error looking up user:', error);
    return NextResponse.json({ error: 'Failed to look up user.' }, { status: 500 });
  }
}
