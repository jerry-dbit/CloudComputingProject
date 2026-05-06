export interface AuthSessionUser {
  id: string;
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
}

export interface StoredAuthUser extends AuthSessionUser {
  password: string;
  createdAt: string;
  updatedAt: string;
}

export const AUTH_USERS_KEY = 'studyflow_users';
export const AUTH_SESSION_KEY = 'studyflow_session';
export const AUTH_COOKIE_NAME = 'studyflow_session';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_COMMON_PATTERNS = [
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'letmein',
  'admin',
  'studyflow',
];

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_MIN_LENGTH} characters`,
    'At least 1 uppercase letter (A-Z)',
    'At least 1 lowercase letter (a-z)',
    'At least 1 number (0-9)',
    'At least 1 special character',
    'No common passwords or obvious patterns',
  ];
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.';
  }

  const lowerCased = password.toLowerCase();
  if (PASSWORD_COMMON_PATTERNS.some((pattern) => lowerCased.includes(pattern))) {
    return 'Password cannot contain common password patterns or your app name.';
  }

  return null;
}

export function getDisplayName(user: Partial<AuthSessionUser> | null | undefined): string {
  if (!user) return 'Guest';

  const firstName = user.firstName?.trim() || '';
  const lastName = user.lastName?.trim() || '';
  const combined = `${firstName} ${lastName}`.trim();

  return combined || user.username?.trim() || 'Guest';
}

export function getInitials(user: Partial<AuthSessionUser> | null | undefined): string {
  if (!user) return 'SF';

  const firstName = user.firstName?.trim() || '';
  const lastName = user.lastName?.trim() || '';

  if (firstName || lastName) {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'SF';
  }

  return (user.username?.slice(0, 2) || 'SF').toUpperCase();
}

export function parseSessionUser(value: string | undefined | null): AuthSessionUser | null {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as AuthSessionUser;

    if (
      !parsed ||
      typeof parsed.id !== 'string' ||
      typeof parsed.username !== 'string' ||
      typeof parsed.firstName !== 'string' ||
      typeof parsed.lastName !== 'string'
    ) {
      return null;
    }

    return {
      ...parsed,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
    };
  } catch {
    return null;
  }
}

export function serializeSessionUser(user: AuthSessionUser): string {
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}