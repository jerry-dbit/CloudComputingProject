import { NextRequest, NextResponse } from 'next/server';
import { consumeEmailVerificationCode } from '@/lib/db/email-verification';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const result = await consumeEmailVerificationCode(email, code, 'password-reset');
    if (!result.ok) {
      const message =
        result.reason === 'expired'
          ? 'That code has expired. Request a new one.'
          : result.reason === 'too_many_attempts'
            ? 'Too many invalid attempts. Request a new code.'
            : result.reason === 'missing'
              ? 'No reset code is active for that email.'
              : 'Invalid verification code.';

      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error confirming password reset code:', error);
    return NextResponse.json({ error: 'Failed to verify the reset code.' }, { status: 500 });
  }
}