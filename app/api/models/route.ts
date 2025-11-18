import { NextResponse } from 'next/server';
import { lmStudioService } from '@/lib/lm-studio/client';

export async function GET() {
  try {
    const isHealthy = await lmStudioService.healthCheck();

    if (!isHealthy) {
      return NextResponse.json(
        { error: 'LM Studio is not running or not accessible' },
        { status: 503 }
      );
    }

    const models = await lmStudioService.listModels();

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models from LM Studio' },
      { status: 500 }
    );
  }
}
