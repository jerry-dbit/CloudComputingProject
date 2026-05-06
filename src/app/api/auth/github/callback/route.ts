import { NextRequest, NextResponse } from 'next/server';
import { createSessionValue, SESSION_COOKIE_NAME, type SessionUser } from '@/lib/auth/session';

type GithubUser = {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('github_oauth_state')?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/?auth_error=state_mismatch', appUrl));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?auth_error=config_missing', appUrl));
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/?auth_error=token_failed', appUrl));
    }

    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      }),
    ]);

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/?auth_error=user_fetch_failed', appUrl));
    }

    const ghUser = (await userRes.json()) as GithubUser;
    let email = ghUser.email || '';

    if (!email && emailsRes.ok) {
      const emails = (await emailsRes.json()) as GithubEmail[];
      const primary = emails.find((entry) => entry.primary && entry.verified);
      const anyVerified = emails.find((entry) => entry.verified);
      email = primary?.email || anyVerified?.email || '';
    }

    if (!email) {
      email = `${ghUser.login}@users.noreply.github.com`;
    }

    const sessionUser: SessionUser = {
      id: `github-${ghUser.id}`,
      username: ghUser.name?.trim() || ghUser.login,
      email,
      avatar: ghUser.avatar_url || '',
    };

    const sessionValue = createSessionValue(sessionUser);
    const response = NextResponse.redirect(new URL('/dashboard', appUrl));
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionValue,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });
    response.cookies.set({
      name: 'github_oauth_state',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=unexpected', appUrl));
  }
}
