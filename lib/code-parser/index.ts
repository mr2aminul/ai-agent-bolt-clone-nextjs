import { JavaScriptParser } from './js-parser';
import { PHPParser } from './php-parser';
import type { ParsedFile, ParserOptions } from './types';

export * from './types';
export * from './js-parser';
export * from './php-parser';

export class CodeParser {
  private jsParser: JavaScriptParser;
  private phpParser: PHPParser;

  constructor() {
    this.jsParser = new JavaScriptParser();
    this.phpParser = new PHPParser();
  }

  parse(filePath: string, code: string, options: ParserOptions = {}): ParsedFile {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return this.jsParser.parse(filePath, code, options);

      case 'php':
        return this.phpParser.parse(filePath, code, options);

      default:
        return {
          path: filePath,
          language: 'javascript',
          entities: [],
          imports: [],
          exports: [],
          hasErrors: true,
          errors: [`Unsupported file extension: ${extension}`],
        };
    }
  }

  detectLanguage(filePath: string): 'javascript' | 'typescript' | 'php' | 'unknown' {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'php':
        return 'php';
      default:
        return 'unknown';
    }
  }
}

export const codeParser = new CodeParser();
