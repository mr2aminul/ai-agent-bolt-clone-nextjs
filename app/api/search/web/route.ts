import { NextRequest, NextResponse } from 'next/server';
import { webSearchService } from '@/lib/search/web-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SearchRequest {
  query: string;
  type?: 'general' | 'code' | 'docs' | 'best-practices';
  language?: string;
  framework?: string;
  maxResults?: number;
  projectId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, type = 'general', language, framework, maxResults = 10, projectId } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    let results;

    switch (type) {
      case 'code':
        if (!language) {
          return NextResponse.json(
            { error: 'Language is required for code search' },
            { status: 400 }
          );
        }
        results = await webSearchService.searchCode(query, language, { maxResults, projectId });
        break;

      case 'docs':
        if (!framework) {
          return NextResponse.json(
            { error: 'Framework is required for documentation search' },
            { status: 400 }
          );
        }
        results = await webSearchService.searchDocs(query, framework, { maxResults, projectId });
        break;

      case 'best-practices':
        if (!language && !framework) {
          return NextResponse.json(
            { error: 'Language or framework is required for best practices search' },
            { status: 400 }
          );
        }
        results = await webSearchService.searchBestPractices(
          query,
          language || framework!,
          { maxResults, projectId }
        );
        break;

      default:
        results = await webSearchService.search(query, { maxResults, projectId });
    }

    return NextResponse.json({
      success: true,
      query,
      type,
      results,
      count: results.length,
      formattedForLLM: webSearchService.formatForLLM(results),
    });
  } catch (error) {
    console.error('Error in web search:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'general';
    const language = searchParams.get('language') || undefined;
    const framework = searchParams.get('framework') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const projectId = searchParams.get('projectId') || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    let results;

    switch (type) {
      case 'code':
        if (!language) {
          return NextResponse.json(
            { error: 'Language is required for code search' },
            { status: 400 }
          );
        }
        results = await webSearchService.searchCode(query, language, { maxResults, projectId });
        break;

      case 'docs':
        if (!framework) {
          return NextResponse.json(
            { error: 'Framework is required for documentation search' },
            { status: 400 }
          );
        }
        results = await webSearchService.searchDocs(query, framework, { maxResults, projectId });
        break;

      case 'best-practices':
        if (!language && !framework) {
          return NextResponse.json(
            { error: 'Language or framework is required for best practices search' },
            { status: 400 }
          );
        }
        results = await webSearchService.searchBestPractices(
          query,
          language || framework!,
          { maxResults, projectId }
        );
        break;

      default:
        results = await webSearchService.search(query, { maxResults, projectId });
    }

    return NextResponse.json({
      success: true,
      query,
      type,
      results,
      count: results.length,
      formattedForLLM: webSearchService.formatForLLM(results),
    });
  } catch (error) {
    console.error('Error in web search:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}
