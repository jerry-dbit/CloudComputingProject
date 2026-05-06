import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByUsername, getUserByEmail } from '@/lib/db/users';
import { generateId } from '@/lib/utils';
import type { StoredAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();

    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if username exists
    const existingByUsername = await getUserByUsername(username);
    if (existingByUsername) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
    }

    // Check if email exists
    const existingByEmail = await getUserByEmail(email);
    if (existingByEmail) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const user: StoredAuthUser = {
      id: generateId(),
      username,
      email,
      password,
      firstName,
      lastName,
      createdAt: now,
      updatedAt: now,
    };

    await createUser(user);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
