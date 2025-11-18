import { NextRequest, NextResponse } from 'next/server';
import { chatQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface CreateRequest {
  projectId: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRequest = await request.json();
    const { projectId, title } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    const chat = await chatQueries.create(projectId, title);

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
