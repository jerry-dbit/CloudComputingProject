import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomInt } from 'node:crypto';

const VERIFY_PATH = path.join(process.cwd(), 'data', 'email-verification.json');
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
export type VerificationPurpose = 'signup' | 'password-reset';

export interface EmailVerificationChallenge {
  email: string;
  purpose: VerificationPurpose;
  codeHash: string;
  codeLast4: string;
  firstName: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lastSentAt: string;
  attempts: number;
}

interface VerificationDb {
  challenges: EmailVerificationChallenge[];
}

const EMPTY_DB: VerificationDb = {
  challenges: [],
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

function normalizePurpose(purpose?: VerificationPurpose): VerificationPurpose {
  return purpose || 'signup';
}

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(path.dirname(VERIFY_PATH), { recursive: true });
  try {
    await fs.access(VERIFY_PATH);
  } catch {
    await fs.writeFile(VERIFY_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
  }
}

async function readDb(): Promise<VerificationDb> {
  await ensureDbFile();
  const raw = await fs.readFile(VERIFY_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as VerificationDb;

  const now = Date.now();
  return {
    challenges: (parsed.challenges ?? [])
      .map((challenge) => ({
        ...challenge,
        purpose: normalizePurpose(challenge.purpose),
      }))
      .filter((challenge) => Date.parse(challenge.expiresAt) > now),
  };
}

async function writeDb(db: VerificationDb): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(VERIFY_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function isResendAllowed(challenge: EmailVerificationChallenge | null): boolean {
  if (!challenge) return true;
  return Date.now() - Date.parse(challenge.lastSentAt) >= RESEND_COOLDOWN_MS;
}

export async function createEmailVerificationChallenge(input: {
  email: string;
  firstName: string;
  username: string;
  purpose?: VerificationPurpose;
}): Promise<{ challenge: EmailVerificationChallenge; code: string }> {
  const db = await readDb();
  const email = normalizeEmail(input.email);
  const purpose = normalizePurpose(input.purpose);
  const now = new Date().toISOString();
  const code = generateCode();
  const existingIndex = db.challenges.findIndex(
    (challenge) => challenge.email === email && challenge.purpose === purpose
  );

  const challenge: EmailVerificationChallenge = {
    email,
    purpose,
    codeHash: hashCode(code),
    codeLast4: code.slice(-4),
    firstName: input.firstName.trim(),
    username: input.username.trim(),
    createdAt: existingIndex >= 0 ? db.challenges[existingIndex].createdAt : now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    lastSentAt: now,
    attempts: 0,
  };

  if (existingIndex >= 0) {
    db.challenges[existingIndex] = challenge;
  } else {
    db.challenges.unshift(challenge);
  }

  await writeDb(db);
  return { challenge, code };
}

export async function getEmailVerificationChallenge(
  email: string,
  purpose?: VerificationPurpose
): Promise<EmailVerificationChallenge | null> {
  const db = await readDb();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPurpose = normalizePurpose(purpose);
  return (
    db.challenges.find(
      (challenge) => challenge.email === normalizedEmail && challenge.purpose === normalizedPurpose
    ) ?? null
  );
}

export async function consumeEmailVerificationCode(
  email: string,
  code: string,
  purpose?: VerificationPurpose
): Promise<{
  ok: boolean;
  reason?: 'missing' | 'expired' | 'too_many_attempts' | 'invalid';
  challenge?: EmailVerificationChallenge;
}> {
  const db = await readDb();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPurpose = normalizePurpose(purpose);
  const index = db.challenges.findIndex(
    (challenge) => challenge.email === normalizedEmail && challenge.purpose === normalizedPurpose
  );

  if (index < 0) {
    return { ok: false, reason: 'missing' };
  }

  const challenge = db.challenges[index];
  if (Date.parse(challenge.expiresAt) <= Date.now()) {
    db.challenges.splice(index, 1);
    await writeDb(db);
    return { ok: false, reason: 'expired' };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    db.challenges.splice(index, 1);
    await writeDb(db);
    return { ok: false, reason: 'too_many_attempts' };
  }

  const normalizedCode = code.replace(/\D/g, '').trim();
  const codeMatches = normalizedCode.length === 6 && hashCode(normalizedCode) === challenge.codeHash;

  if (!codeMatches) {
    challenge.attempts += 1;
    challenge.updatedAt = new Date().toISOString();
    db.challenges[index] = challenge;
    await writeDb(db);
    return { ok: false, reason: 'invalid', challenge };
  }

  db.challenges.splice(index, 1);
  await writeDb(db);
  return { ok: true, challenge };
}

export function getVerificationConfig() {
  return {
    codeTtlMinutes: CODE_TTL_MS / 60_000,
    resendCooldownSeconds: RESEND_COOLDOWN_MS / 1_000,
    maxAttempts: MAX_ATTEMPTS,
  };
}