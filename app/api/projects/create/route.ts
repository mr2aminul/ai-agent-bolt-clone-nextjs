import { NextRequest, NextResponse } from 'next/server';
import { projectQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface CreateRequest {
  userId: string;
  name: string;
  description?: string;
  path?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRequest = await request.json();
    const { userId, name, description, path } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name' },
        { status: 400 }
      );
    }

    const project = await projectQueries.create(
      userId,
      name,
      description,
      path
    );

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
