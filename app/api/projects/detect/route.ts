import { NextRequest, NextResponse } from 'next/server';
import { projectDetector } from '@/lib/project-detection/detector';
import { projectQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface DetectRequest {
  projectId: string;
  projectPath: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DetectRequest = await request.json();
    const { projectId, projectPath } = body;

    if (!projectId || !projectPath) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, projectPath' },
        { status: 400 }
      );
    }

    const projectType = await projectDetector.detectProjectType(projectPath);

    await projectQueries.update(projectId, {
      status: projectType.type,
      description: projectType.framework
        ? `${projectType.framework} project${projectType.features.length > 0 ? ` with ${projectType.features.join(', ')}` : ''}`
        : undefined,
    });

    return NextResponse.json({
      success: true,
      projectType,
    });
  } catch (error) {
    console.error('Error detecting project type:', error);
    return NextResponse.json(
      { error: 'Failed to detect project type' },
      { status: 500 }
    );
  }
}
