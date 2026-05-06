import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    return NextResponse.json({ exists: Boolean(user) });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Failed to check email.' }, { status: 500 });
  }
}
