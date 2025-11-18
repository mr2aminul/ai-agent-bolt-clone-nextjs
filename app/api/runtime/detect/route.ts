import { NextResponse } from 'next/server';
import { runtimeDetector } from '@/lib/runtime/detector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runtimes = await runtimeDetector.detectAll();

    return NextResponse.json({
      success: true,
      runtimes,
    });
  } catch (error) {
    console.error('Error detecting runtimes:', error);
    return NextResponse.json(
      { error: 'Failed to detect runtimes' },
      { status: 500 }
    );
  }
}
