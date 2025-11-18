import { NextRequest, NextResponse } from 'next/server';
import { codeParser } from '@/lib/code-parser';
import { fileQueries, codeEntityQueries, codeImportQueries, codeExportQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

interface AnalyzeRequest {
  filePath: string;
  code: string;
  projectId?: string;
  fileId?: string;
  storeInDb?: boolean;
  options?: {
    includeComments?: boolean;
    includePrivate?: boolean;
    sourceType?: 'module' | 'script';
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { filePath, code, projectId, fileId, storeInDb = false, options } = body;

    if (!filePath || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: filePath, code' },
        { status: 400 }
      );
    }

    const result = codeParser.parse(filePath, code, options);
    const language = codeParser.detectLanguage(filePath);

    if (storeInDb && fileId) {
      await codeEntityQueries.deleteByFile(fileId);
      await codeImportQueries.deleteByFile(fileId);
      await codeExportQueries.deleteByFile(fileId);

      for (const entity of result.entities) {
        await codeEntityQueries.create(fileId, {
          ...entity,
          language,
        });
      }

      for (const importInfo of result.imports) {
        await codeImportQueries.create(fileId, importInfo);
      }

      for (const exportInfo of result.exports) {
        await codeExportQueries.create(fileId, exportInfo);
      }
    }

    return NextResponse.json({
      success: true,
      result,
      language,
      stats: {
        totalEntities: result.entities.length,
        functions: result.entities.filter(e => e.type === 'function').length,
        classes: result.entities.filter(e => e.type === 'class').length,
        methods: result.entities.filter(e => e.type === 'method').length,
        properties: result.entities.filter(e => e.type === 'property').length,
        imports: result.imports.length,
        exports: result.exports.length,
      },
      stored: storeInDb && fileId,
    });
  } catch (error) {
    console.error('Error analyzing code:', error);
    return NextResponse.json(
      { error: 'Failed to analyze code' },
      { status: 500 }
    );
  }
}
