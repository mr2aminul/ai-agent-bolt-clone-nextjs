import { NextRequest, NextResponse } from 'next/server';
import { dependencyTracker } from '@/lib/dependency-tracker';
import { fileQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    const projectId = searchParams.get('projectId');

    if (fileId) {
      const deps = await dependencyTracker.findDependencies(fileId);
      return NextResponse.json({ success: true, ...deps });
    }

    if (projectId) {
      const files = await fileQueries.list(projectId);
      const fileIds = files.map(f => f.id);
      const graph = await dependencyTracker.buildGraph(projectId, fileIds);

      return NextResponse.json({
        success: true,
        graph: {
          imports: Array.from(graph.imports.entries()),
          exports: Array.from(graph.exports.entries()),
        },
      });
    }

    return NextResponse.json({ error: 'Missing fileId or projectId' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 });
  }
}
