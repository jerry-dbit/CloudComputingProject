export interface VerificationEmailInput {
  to: string;
  code: string;
  firstName: string;
  username: string;
  purpose?: 'signup' | 'password-reset';
}

import nodemailer from 'nodemailer';

type DeliveryMode = 'smtp' | 'dev-console';

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM_EMAIL
  );
}

export function getEmailDeliveryMode(): DeliveryMode {
  if (hasSmtpConfig()) {
    return 'smtp';
  }

  return 'dev-console';
}

async function sendViaSmtp(input: VerificationEmailInput): Promise<void> {
  const purpose = input.purpose || 'signup';
  const subject =
    purpose === 'password-reset' ? 'Your StudyFlow password reset code' : 'Your StudyFlow verification code';
  const headline =
    purpose === 'password-reset' ? 'Reset your StudyFlow password' : 'Verify your StudyFlow account';
  const bodyText =
    purpose === 'password-reset'
      ? 'Use the code below to reset your StudyFlow password. The code expires in 10 minutes and can only be used once.'
      : 'Use the code below to verify your StudyFlow account. The code expires in 10 minutes and can only be used once.';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: input.to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin: 0 0 16px;">${headline}</h2>
        <p>Hi ${escapeHtml(input.firstName || input.username)},</p>
        <p>${bodyText}</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${input.code}</div>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Hi ${input.firstName || input.username}, ${bodyText} Code: ${input.code}.`,
  });
}

export async function sendVerificationEmail(input: VerificationEmailInput): Promise<DeliveryMode> {
  const purpose = input.purpose || 'signup';

  // SMTP is the primary email provider.
  if (hasSmtpConfig()) {
    try {
      await sendViaSmtp(input);
      return 'smtp';
    } catch (err) {
      console.error('SMTP delivery failed:', err);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Both Resend and SMTP delivery failed. Check provider credentials and network.');
      }
    }
  }

  // In production we require at least one provider to succeed.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email provider not configured or delivery failed. Set SMTP settings in .env.local.');
  }

  // Development fallback — print code to server console
  console.info('[StudyFlow] %s code for %s: %s', purpose, input.to, input.code);
  return 'dev-console';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}