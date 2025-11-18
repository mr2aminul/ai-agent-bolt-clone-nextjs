import { NextRequest, NextResponse } from 'next/server';
import { codeParser } from '@/lib/code-parser';

export const runtime = 'nodejs';

interface AnalyzeRequest {
  filePath: string;
  code: string;
  options?: {
    includeComments?: boolean;
    includePrivate?: boolean;
    sourceType?: 'module' | 'script';
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { filePath, code, options } = body;

    if (!filePath || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: filePath, code' },
        { status: 400 }
      );
    }

    const result = codeParser.parse(filePath, code, options);

    return NextResponse.json({
      success: true,
      result,
      language: codeParser.detectLanguage(filePath),
      stats: {
        totalEntities: result.entities.length,
        functions: result.entities.filter(e => e.type === 'function').length,
        classes: result.entities.filter(e => e.type === 'class').length,
        methods: result.entities.filter(e => e.type === 'method').length,
        properties: result.entities.filter(e => e.type === 'property').length,
        imports: result.imports.length,
        exports: result.exports.length,
      },
    });
  } catch (error) {
    console.error('Error analyzing code:', error);
    return NextResponse.json(
      { error: 'Failed to analyze code' },
      { status: 500 }
    );
  }
}
