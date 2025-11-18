import { NextRequest, NextResponse } from 'next/server';
import { fileOperations } from '@/lib/fs/operations';
import { fileQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface CreateRequest {
  projectId: string;
  path: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRequest = await request.json();
    const { projectId, path, content } = body;

    if (!projectId || !path || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, path, content' },
        { status: 400 }
      );
    }

    const result = await fileOperations.createFile(path, content);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const size = Buffer.byteLength(content, 'utf-8');
    const extension = path.split('.').pop();

    const dbFile = await fileQueries.create(projectId, path, content, size, extension);

    return NextResponse.json({
      success: true,
      file: dbFile,
    });
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}
