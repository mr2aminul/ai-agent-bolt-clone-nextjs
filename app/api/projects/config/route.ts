import { NextRequest, NextResponse } from 'next/server';
import { runtimeDetector } from '@/lib/runtime/detector';
import { projectQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface ConfigRequest {
  projectId: string;
  projectPath: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfigRequest = await request.json();
    const { projectId, projectPath } = body;

    if (!projectId || !projectPath) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, projectPath' },
        { status: 400 }
      );
    }

    const project = await projectQueries.get(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const config = await runtimeDetector.generateProjectConfig(
      projectPath,
      project.status,
      project.description || undefined
    );

    await runtimeDetector.saveProjectConfig(projectPath, config);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error generating project config:', error);
    return NextResponse.json(
      { error: 'Failed to generate project configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectPath = searchParams.get('projectPath');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectPath' },
        { status: 400 }
      );
    }

    const config = await runtimeDetector.loadProjectConfig(projectPath);

    if (!config) {
      return NextResponse.json(
        { error: 'Project configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error loading project config:', error);
    return NextResponse.json(
      { error: 'Failed to load project configuration' },
      { status: 500 }
    );
  }
}
