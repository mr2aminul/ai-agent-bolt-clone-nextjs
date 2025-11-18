import { NextRequest, NextResponse } from 'next/server';
import { FileScanner } from '@/lib/fs/scanner';
import { fileQueries } from '@/lib/db/queries';
import * as path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ScanRequest {
  projectId: string;
  projectPath: string;
  includeContent?: boolean;
  maxFileSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json();
    const { projectId, projectPath, includeContent = false, maxFileSize } = body;

    if (!projectId || !projectPath) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, projectPath' },
        { status: 400 }
      );
    }

    const resolvedPath = path.resolve(projectPath);

    const scanner = new FileScanner({
      includeContent,
      maxFileSize,
      maxDepth: 10,
    });

    const files = await scanner.scanDirectory(resolvedPath, { includeContent });

    const existingFiles = await fileQueries.list(projectId);
    const existingFileMap = new Map(
      existingFiles.map((f) => [f.path, new Date(f.last_modified)])
    );

    const changes = await scanner.detectChanges(resolvedPath, existingFileMap);

    for (const file of changes.added) {
      await fileQueries.create(
        projectId,
        file.path,
        file.content,
        file.size,
        file.extension
      );
    }

    for (const file of changes.modified) {
      const existingFile = existingFiles.find((f) => f.path === file.path);
      if (existingFile) {
        await fileQueries.update(existingFile.id, {
          content: file.content,
          size: file.size,
          last_modified: file.modified.toISOString(),
        });
      }
    }

    for (const filePath of changes.deleted) {
      const existingFile = existingFiles.find((f) => f.path === filePath);
      if (existingFile) {
        await fileQueries.delete(existingFile.id);
      }
    }

    const stats = {
      totalFiles: files.filter((f) => f.type === 'file').length,
      totalFolders: files.filter((f) => f.type === 'folder').length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      added: changes.added.length,
      modified: changes.modified.length,
      deleted: changes.deleted.length,
    };

    return NextResponse.json({
      success: true,
      stats,
      files: files.slice(0, 100),
    });
  } catch (error) {
    console.error('Error scanning project:', error);
    return NextResponse.json(
      { error: 'Failed to scan project directory' },
      { status: 500 }
    );
  }
}
