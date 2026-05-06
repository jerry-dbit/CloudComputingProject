import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';
import { getDocumentById } from '@/lib/db/local';

function mapContentType(fileName: string): string {
  if (fileName.endsWith('.pdf')) return 'application/pdf';
  if (fileName.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (fileName.endsWith('.doc')) return 'application/msword';
  if (fileName.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/documents/[id]/file'>
) {
  try {
    const { id } = await context.params;
    const doc = await getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const wantsText = request.nextUrl.searchParams.get('format') === 'text';

    if (/^https?:\/\//i.test(doc.storageUrl)) {
      const res = await fetch(doc.storageUrl, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch remote file' }, { status: 502 });
      }

      const binary = Buffer.from(await res.arrayBuffer());
      if (!wantsText) {
        return new NextResponse(binary, {
          status: 200,
          headers: {
            'Content-Type': mapContentType(doc.fileName.toLowerCase()),
            'Cache-Control': 'no-store',
          },
        });
      }

      if (doc.fileType === 'txt') {
        return new NextResponse(binary.toString('utf-8'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      if (doc.fileType === 'docx' || doc.fileType === 'doc') {
        const extracted = await mammoth.extractRawText({ buffer: binary });
        return new NextResponse(extracted.value || '', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      return new NextResponse(binary, {
        headers: { 'Content-Type': mapContentType(doc.fileName.toLowerCase()) },
      });
    }

    const localPath = path.join(process.cwd(), 'public', doc.storagePath ?? `uploads/${doc.fileName}`);
    const file = await fs.readFile(localPath);

    if (wantsText && doc.fileType === 'txt') {
      return new NextResponse(file.toString('utf-8'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (wantsText && (doc.fileType === 'docx' || doc.fileType === 'doc')) {
      const extracted = await mammoth.extractRawText({ buffer: file });
      return new NextResponse(extracted.value || '', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': mapContentType(doc.fileName.toLowerCase()),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error loading document file:', error);
    return NextResponse.json({ error: 'Failed to load document file' }, { status: 500 });
  }
}
