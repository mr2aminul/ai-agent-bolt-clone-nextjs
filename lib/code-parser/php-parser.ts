import * as phpParser from 'php-parser';
import type { CodeEntity, ImportInfo, ExportInfo, ParsedFile, ParserOptions } from './types';

export class PHPParser {
  private parser: any;

  constructor() {
    this.parser = new (phpParser as any).Engine({
      parser: {
        extractDoc: true,
        php7: true,
      },
      ast: {
        withPositions: true,
      },
    });
  }

  parse(filePath: string, code: string, options: ParserOptions = {}): ParsedFile {
    const entities: CodeEntity[] = [];
    const imports: ImportInfo[] = [];
    const errors: string[] = [];

    try {
      const ast = this.parser.parseCode(code, filePath);

      this.traverseNode(ast, filePath, entities, imports, options);

      return {
        path: filePath,
        language: 'php',
        entities,
        imports,
        exports: [],
        hasErrors: false,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown parse error');
      return {
        path: filePath,
        language: 'php',
        entities: [],
        imports: [],
        exports: [],
        hasErrors: true,
        errors,
      };
    }
  }

  private traverseNode(
    node: any,
    filePath: string,
    entities: CodeEntity[],
    imports: ImportInfo[],
    options: ParserOptions,
    parentClass?: string
  ): void {
    if (!node || typeof node !== 'object') return;

    if (node.kind === 'class') {
      const className = node.name?.name || 'AnonymousClass';
      const loc = node.loc;

      if (loc) {
        entities.push({
          id: `${filePath}:${loc.start.line}:${loc.start.column}`,
          name: className,
          type: 'class',
          startLine: loc.start.line,
          endLine: loc.end.line,
          startColumn: loc.start.column,
          endColumn: loc.end.column,
        });
      }

      if (node.body) {
        node.body.forEach((member: any) => {
          this.traverseNode(member, filePath, entities, imports, options, className);
        });
      }
    } else if (node.kind === 'method') {
      const loc = node.loc;
      if (loc) {
        entities.push({
          id: `${filePath}:${loc.start.line}:${loc.start.column}`,
          name: node.name?.name || 'anonymous',
          type: 'method',
          startLine: loc.start.line,
          endLine: loc.end.line,
          startColumn: loc.start.column,
          endColumn: loc.end.column,
          parentClass,
          params: node.arguments?.map((arg: any) => arg.name?.name || 'param') || [],
          visibility: node.visibility || 'public',
        });
      }
    } else if (node.kind === 'function') {
      const loc = node.loc;
      if (loc) {
        entities.push({
          id: `${filePath}:${loc.start.line}:${loc.start.column}`,
          name: node.name?.name || 'anonymous',
          type: 'function',
          startLine: loc.start.line,
          endLine: loc.end.line,
          startColumn: loc.start.column,
          endColumn: loc.end.column,
          params: node.arguments?.map((arg: any) => arg.name?.name || 'param') || [],
        });
      }
    } else if (node.kind === 'property') {
      const loc = node.loc;
      if (loc) {
        entities.push({
          id: `${filePath}:${loc.start.line}:${loc.start.column}`,
          name: node.name?.name || 'anonymous',
          type: 'property',
          startLine: loc.start.line,
          endLine: loc.end.line,
          startColumn: loc.start.column,
          endColumn: loc.end.column,
          parentClass,
          visibility: node.visibility || 'public',
        });
      }
    } else if (node.kind === 'interface') {
      const loc = node.loc;
      if (loc) {
        entities.push({
          id: `${filePath}:${loc.start.line}:${loc.start.column}`,
          name: node.name?.name || 'AnonymousInterface',
          type: 'interface',
          startLine: loc.start.line,
          endLine: loc.end.line,
          startColumn: loc.start.column,
          endColumn: loc.end.column,
        });
      }
    } else if (node.kind === 'usegroup' || node.kind === 'useitem') {
      const loc = node.loc;
      if (loc && node.name) {
        const importName = typeof node.name === 'string' ? node.name : node.name.name;
        imports.push({
          source: importName,
          imports: [node.alias?.name || importName.split('\\').pop() || importName],
          line: loc.start.line,
        });
      }
    }

    if (Array.isArray(node)) {
      node.forEach((child) => this.traverseNode(child, filePath, entities, imports, options, parentClass));
    } else if (typeof node === 'object') {
      Object.values(node).forEach((value) => {
        if (value && typeof value === 'object') {
          this.traverseNode(value, filePath, entities, imports, options, parentClass);
        }
      });
    }
  }
}
