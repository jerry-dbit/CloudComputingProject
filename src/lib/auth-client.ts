'use client';

import {
  AUTH_SESSION_KEY,
  clearSessionCookie,
  parseSessionUser,
  serializeSessionUser,
  type AuthSessionUser,
} from '@/lib/auth';

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readCookie(name: string): string | null {
  if (!canUseStorage()) return null;

  const prefix = `${name}=`;
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  return match ? match.slice(prefix.length) : null;
}

function persistSession(session: AuthSessionUser) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  document.cookie = serializeSessionUser(session);
}

export function getStoredSession(): AuthSessionUser | null {
  if (!canUseStorage()) return null;

  try {
    const stored = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthSessionUser;
      if (parsed?.id && parsed?.username) return parsed;
    }
  } catch {
    // fall through to cookie parsing
  }

  const cookieSession = parseSessionUser(readCookie('studyflow_session'));
  if (cookieSession) {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(cookieSession));
  }

  return cookieSession;
}

export function clearStoredSession() {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  document.cookie = clearSessionCookie();
}

export function loginWithStoredUser(username: string, password: string):
  | { user: AuthSessionUser }
  | { error: string } {
  // This function is kept for backward compatibility but should be replaced with API call
  // For now, it will return an error encouraging the use of server-side login
  return { error: 'Login must be performed via API. This function is deprecated.' };
}

export async function loginWithServerUser(
  identifier: string,
  password: string
): Promise<{ user: AuthSessionUser } | { error: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim().toLowerCase(),
        password,
      }),
    });

    const data = (await res.json()) as { ok?: boolean; user?: AuthSessionUser; error?: string };
    if (!res.ok || !data.user) {
      return { error: data.error || 'Login failed.' };
    }

    const session: AuthSessionUser = data.user;
    persistSession(session);
    return { user: session };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Failed to log in. Please try again.' };
  }
}

export function signupStoredUser(input: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): { user: AuthSessionUser } | { error: string } {
  // This function is kept for backward compatibility but should be replaced with API call
  // For now, it will return an error encouraging the use of server-side signup
  return { error: 'Signup must be performed via API. This function is deprecated.' };
}

export async function signupWithServerUser(input: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ user: AuthSessionUser } | { error: string }> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      }),
    });

    const data = (await res.json()) as { ok?: boolean; user?: AuthSessionUser; error?: string };
    if (!res.ok || !data.user) {
      return { error: data.error || 'Signup failed.' };
    }

    const session: AuthSessionUser = data.user;
    persistSession(session);
    return { user: session };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'Failed to sign up. Please try again.' };
  }
}

export function updateStoredSessionProfile(input: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}): { user: AuthSessionUser } | { error: string } {
  // This function is kept for backward compatibility
  // For now, it just updates the session cache without server persistence
  const currentSession = getStoredSession();
  if (!currentSession) {
    return { error: 'No active session found.' };
  }

  const nextSession: AuthSessionUser = {
    ...currentSession,
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
  };

  persistSession(nextSession);
  return { user: nextSession };
}

export function getStoredUserByIdentifier(identifier: string) {
  // This function is deprecated as it relied on localStorage
  // Users should now be fetched via server-side functions
  return null;
}

export function updateStoredUserPassword(email: string, password: string): boolean {
  // This function is deprecated as it relied on localStorage
  // Use updateServerUserPassword instead
  return false;
}

export async function updateServerUserPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: newPassword,
      }),
    });

    return res.ok;
  } catch (error) {
    console.error('Password reset error:', error);
    return false;
  }
}