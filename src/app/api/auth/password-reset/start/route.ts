import { NextRequest, NextResponse } from 'next/server';
import {
  createEmailVerificationChallenge,
  getEmailVerificationChallenge,
  isResendAllowed,
} from '@/lib/db/email-verification';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const username = String(body.username || '').trim();
    const firstName = String(body.firstName || '').trim();

    if (!isValidEmail(email) || !username) {
      return NextResponse.json({ error: 'Enter a valid account identifier.' }, { status: 400 });
    }

    const existing = await getEmailVerificationChallenge(email, 'password-reset');
    if (existing && !isResendAllowed(existing)) {
      return NextResponse.json(
        { error: 'Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    const { code } = await createEmailVerificationChallenge({
      email,
      firstName,
      username,
      purpose: 'password-reset',
    });

    // Send email asynchronously (fire-and-forget) for faster response
    sendVerificationEmail({
      to: email,
      code,
      firstName,
      username,
      purpose: 'password-reset',
    }).catch((error) => {
      console.error('Failed to send password reset email:', error);
    });

    return NextResponse.json({
      ok: true,
      deliveryMode: 'smtp',
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
    });
  } catch (error) {
    console.error('Error creating password reset code:', error);
    return NextResponse.json(
      { error: 'Failed to create reset code.' },
      { status: 500 }
    );
  }
}