import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { createDocument } from '@/lib/db/local';
import { getFileExtension, getFileTypeFromExtension, generateId } from '@/lib/utils';
import { persistFile } from '@/lib/upload';
import { getUserFromRequest } from '@/lib/auth/session';

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'txt']);

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file in request.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: pdf, docx, doc, txt.' },
        { status: 400 }
      );
    }

    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const id = generateId();
    const persistedName = `${id}-${safeName}`;
    const bytes = await file.arrayBuffer();

    const upload = await persistFile(Buffer.from(bytes), persistedName, file.type);
    const now = new Date().toISOString();

    const created = await createDocument({
      id,
      title: safeName.replace(/\.[^/.]+$/, ''),
      fileName: safeName,
      fileType: getFileTypeFromExtension(extension),
      fileSize: file.size,
      storageUrl: upload.storageUrl,
      storagePath: upload.storagePath,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
