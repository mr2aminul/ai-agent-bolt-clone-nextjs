import { NextRequest, NextResponse } from 'next/server';
import { chatQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface DeleteRequest {
  chatId: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteRequest = await request.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing required field: chatId' },
        { status: 400 }
      );
    }

    await chatQueries.delete(chatId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}
