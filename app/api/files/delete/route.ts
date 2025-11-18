import { NextRequest, NextResponse } from 'next/server';
import { fileOperations } from '@/lib/fs/operations';
import { fileQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface DeleteRequest {
  fileId: string;
  path: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteRequest = await request.json();
    const { fileId, path } = body;

    if (!fileId || !path) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, path' },
        { status: 400 }
      );
    }

    const result = await fileOperations.deleteFile(path);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await fileQueries.delete(fileId);

    return NextResponse.json({
      success: true,
      path,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
