import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'studyflow_session';

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  avatar: string;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.GITHUB_CLIENT_SECRET || '';
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf-8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf-8');
}

function signPayload(payloadBase64: string, secret: string) {
  return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
}

export function createSessionValue(user: SessionUser) {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('Missing AUTH_SECRET or GITHUB_CLIENT_SECRET for sessions.');
  }

  const payloadBase64 = toBase64Url(JSON.stringify(user));
  const signature = signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export function parseSessionValue(value: string | undefined): SessionUser | null {
  if (!value) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  const [payloadBase64, signature] = value.split('.');
  if (!payloadBase64 || !signature) return null;

  const expected = signPayload(payloadBase64, secret);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expected);

  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadBase64)) as SessionUser;
    if (!parsed?.id || !parsed?.username || !parsed?.email) {
      return null;
    }
    return {
      id: String(parsed.id),
      username: String(parsed.username),
      email: String(parsed.email),
      avatar: String(parsed.avatar || ''),
    };
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest) {
  return parseSessionValue(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function getUserFromServerCookie() {
  const cookieStore = await cookies();
  return parseSessionValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
