import { NextRequest, NextResponse } from 'next/server';
import { envManager } from '@/lib/runtime/env-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const variables = await envManager.readEnvFile(projectPath);

    return NextResponse.json({
      success: true,
      variables,
      count: variables.length,
    });
  } catch (error) {
    console.error('Error reading env file:', error);
    return NextResponse.json(
      { error: 'Failed to read environment variables' },
      { status: 500 }
    );
  }
}

interface UpdateEnvRequest {
  projectPath: string;
  key: string;
  value: string;
  comment?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateEnvRequest = await request.json();
    const { projectPath, key, value, comment } = body;

    if (!projectPath || !key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: projectPath, key, value' },
        { status: 400 }
      );
    }

    await envManager.updateEnvVariable(projectPath, key, value, comment);

    return NextResponse.json({
      success: true,
      message: 'Environment variable updated',
    });
  } catch (error) {
    console.error('Error updating env variable:', error);
    return NextResponse.json(
      { error: 'Failed to update environment variable' },
      { status: 500 }
    );
  }
}

interface DeleteEnvRequest {
  projectPath: string;
  key: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteEnvRequest = await request.json();
    const { projectPath, key } = body;

    if (!projectPath || !key) {
      return NextResponse.json(
        { error: 'Missing required fields: projectPath, key' },
        { status: 400 }
      );
    }

    await envManager.deleteEnvVariable(projectPath, key);

    return NextResponse.json({
      success: true,
      message: 'Environment variable deleted',
    });
  } catch (error) {
    console.error('Error deleting env variable:', error);
    return NextResponse.json(
      { error: 'Failed to delete environment variable' },
      { status: 500 }
    );
  }
}
