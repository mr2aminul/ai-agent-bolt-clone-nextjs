// @/app/api/models/route.ts
import { NextResponse } from 'next/server';
import { lmStudioService } from '@/lib/lm-studio/client';

export async function GET() {
  try {
    // Force HTTP fallback for API route
    const json = await fetch('http://127.0.0.1:1234/v1/models');
    if (!json.ok) {
      return NextResponse.json(
        { error: 'LM Studio HTTP endpoint not accessible' },
        { status: 503 }
      );
    }

    const data = await json.json();
    const models = Array.isArray(data.data)
      ? data.data.map((m: any) => ({
          path: m.id ?? String(m),
          type: 'model',
          capabilities: ['chat', 'completion'],
        }))
      : [];

    return NextResponse.json({ success: true, models, count: models.length });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models from LM Studio' },
      { status: 500 }
    );
  }
}
