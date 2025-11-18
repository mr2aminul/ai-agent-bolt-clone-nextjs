import { NextRequest, NextResponse } from 'next/server';
import { fileOperations } from '@/lib/fs/operations';
import { fileQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface UpdateRequest {
  fileId: string;
  path: string;
  content: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateRequest = await request.json();
    const { fileId, path, content } = body;

    if (!fileId || !path || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, path, content' },
        { status: 400 }
      );
    }

    const result = await fileOperations.updateFile(path, content);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const size = Buffer.byteLength(content, 'utf-8');

    const dbFile = await fileQueries.update(fileId, {
      content,
      size,
      last_modified: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      file: dbFile,
    });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}
