import { NextRequest, NextResponse } from 'next/server';
import {
  createEmailVerificationChallenge,
  getEmailVerificationChallenge,
  getVerificationConfig,
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
    const firstName = String(body.firstName || '').trim();
    const username = String(body.username || '').trim();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const existing = await getEmailVerificationChallenge(email, 'signup');
    if (existing && !isResendAllowed(existing)) {
      return NextResponse.json(
        { error: `Please wait before requesting another code.` },
        { status: 429 }
      );
    }

    const { code } = await createEmailVerificationChallenge({
      email,
      firstName,
      username,
      purpose: 'signup',
    });

    const config = getVerificationConfig();

    // Send email asynchronously (fire-and-forget) for faster response
    sendVerificationEmail({
      to: email,
      code,
      firstName,
      username,
      purpose: 'signup',
    }).catch((error) => {
      console.error('Failed to send verification email:', error);
    });

    return NextResponse.json({
      ok: true,
      deliveryMode: 'smtp',
      expiresInSeconds: config.codeTtlMinutes * 60,
      resendAfterSeconds: config.resendCooldownSeconds,
    });
  } catch (error) {
    console.error('Error creating verification code:', error);
    return NextResponse.json(
      { error: 'Failed to create verification code.' },
      { status: 500 }
    );
  }
}