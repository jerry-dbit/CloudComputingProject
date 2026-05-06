import { NextRequest, NextResponse } from 'next/server';
import { updateUserPassword } from '@/lib/db/users';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const newPassword = String(body.password || '');

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required.' },
        { status: 400 }
      );
    }

    const updated = await updateUserPassword(email, newPassword);
    if (!updated) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
