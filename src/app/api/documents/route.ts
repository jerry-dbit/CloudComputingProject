import { NextRequest, NextResponse } from 'next/server';
import { getDocuments } from '@/lib/db/local';

export async function GET(request: NextRequest) {
  try {
    const documents = await getDocuments();
    const ownerId = request.nextUrl.searchParams.get('ownerId')?.trim();

    if (ownerId) {
      return NextResponse.json(documents.filter((doc) => doc.ownerId === ownerId));
    }

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
