import { search as duckDuckGoSearch } from 'duck-duck-scrape';
import { searchResultQueries } from '@/lib/db/queries';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  relevance?: number;
}

export interface SearchOptions {
  maxResults?: number;
  useCache?: boolean;
  projectId?: string;
}

export class WebSearchService {
  private cache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private cacheDuration = 24 * 60 * 60 * 1000;

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 10, useCache = true, projectId } = options;

    if (useCache) {
      const dbResult = await searchResultQueries.get(query, projectId);
      if (dbResult) {
        return dbResult.results as SearchResult[];
      }

      const cached = this.cache.get(query);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.results;
      }
    }

    try {
      const searchResults = await duckDuckGoSearch(query, {
        safeSearch: 0,
      });

      const results: SearchResult[] = searchResults.results
        .slice(0, maxResults)
        .map((result) => ({
          title: result.title,
          url: result.url,
          description: result.description,
        }));

      this.cache.set(query, { results, timestamp: Date.now() });

      await searchResultQueries.create(query, results, projectId);

      return results;
    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }

  async searchCode(query: string, language: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const codeQuery = `${language} ${query} code example site:github.com OR site:stackoverflow.com`;
    return this.search(codeQuery, options);
  }

  async searchDocs(query: string, framework: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const docsQuery = `${framework} ${query} documentation official`;
    return this.search(docsQuery, options);
  }

  async searchBestPractices(query: string, technology: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const practicesQuery = `${technology} ${query} best practices`;
    return this.search(practicesQuery, options);
  }

  formatForLLM(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant search results found.';
    }

    return results
      .map(
        (result, index) =>
          `${index + 1}. ${result.title}\n   URL: ${result.url}\n   ${result.description}`
      )
      .join('\n\n');
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const webSearchService = new WebSearchService();
