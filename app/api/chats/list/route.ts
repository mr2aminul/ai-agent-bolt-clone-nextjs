import { NextRequest, NextResponse } from 'next/server';
import { chatQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    const chats = await chatQueries.list(projectId);

    return NextResponse.json({
      success: true,
      chats,
      count: chats.length,
    });
  } catch (error) {
    console.error('Error listing chats:', error);
    return NextResponse.json(
      { error: 'Failed to list chats' },
      { status: 500 }
    );
  }
}
