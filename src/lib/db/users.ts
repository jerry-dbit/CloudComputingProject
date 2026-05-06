import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoredAuthUser } from '@/lib/auth';

const USERS_DB_PATH = path.join(process.cwd(), 'data', 'studyflow-users.json');

interface UsersDb {
  users: StoredAuthUser[];
}

const EMPTY_DB: UsersDb = {
  users: [],
};

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(path.dirname(USERS_DB_PATH), { recursive: true });
  try {
    await fs.access(USERS_DB_PATH);
  } catch {
    await fs.writeFile(USERS_DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
  }
}

async function readDb(): Promise<UsersDb> {
  await ensureDbFile();
  const raw = await fs.readFile(USERS_DB_PATH, 'utf-8');
  return JSON.parse(raw) as UsersDb;
}

async function writeDb(db: UsersDb): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(USERS_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getAllUsers(): Promise<StoredAuthUser[]> {
  const db = await readDb();
  return db.users;
}

export async function getUserByUsername(username: string): Promise<StoredAuthUser | null> {
  const db = await readDb();
  const normalized = username.trim().toLowerCase();
  return db.users.find((user) => user.username.toLowerCase() === normalized) ?? null;
}

export async function getUserByEmail(email: string): Promise<StoredAuthUser | null> {
  const db = await readDb();
  const normalized = email.trim().toLowerCase();
  return db.users.find((user) => (user.email || '').toLowerCase() === normalized) ?? null;
}

export async function getUserByIdentifier(identifier: string): Promise<StoredAuthUser | null> {
  const normalized = identifier.trim().toLowerCase();
  const byUsername = await getUserByUsername(normalized);
  if (byUsername) return byUsername;
  return getUserByEmail(normalized);
}

export async function createUser(user: StoredAuthUser): Promise<StoredAuthUser> {
  const db = await readDb();
  db.users.unshift(user);
  await writeDb(db);
  return user;
}

export async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
  const db = await readDb();
  const normalized = email.trim().toLowerCase();
  let updated = false;

  const nextUsers = db.users.map((user) => {
    if ((user.email || '').toLowerCase() !== normalized) {
      return user;
    }

    updated = true;
    return {
      ...user,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!updated) return false;

  db.users = nextUsers;
  await writeDb(db);
  return true;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Omit<StoredAuthUser, 'id' | 'password' | 'createdAt'>>
): Promise<StoredAuthUser | null> {
  const db = await readDb();
  const idx = db.users.findIndex((user) => user.id === userId);
  if (idx < 0) return null;

  const updated: StoredAuthUser = {
    ...db.users[idx],
    ...patch,
    id: db.users[idx].id,
    password: db.users[idx].password,
    createdAt: db.users[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };

  db.users[idx] = updated;
  await writeDb(db);
  return updated;
}
