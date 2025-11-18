import * as parser from '@babel/parser';
import type { CodeEntity, ImportInfo, ExportInfo, ParsedFile, ParserOptions } from './types';

export class JavaScriptParser {
  parse(filePath: string, code: string, options: ParserOptions = {}): ParsedFile {
    const entities: CodeEntity[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const errors: string[] = [];

    try {
      const ast = parser.parse(code, {
        sourceType: options.sourceType || 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
      });

      const traverse = require('@babel/traverse').default;

      traverse(ast, {
        FunctionDeclaration(path: any) {
          const node = path.node;
          const loc = node.loc;
          if (!loc) return;

          entities.push({
            id: `${filePath}:${loc.start.line}:${loc.start.column}`,
            name: node.id?.name || 'anonymous',
            type: 'function',
            startLine: loc.start.line,
            endLine: loc.end.line,
            startColumn: loc.start.column,
            endColumn: loc.end.column,
            params: node.params.map((p: any) => p.name || 'param'),
            isAsync: node.async,
            isExported: path.parent.type === 'ExportNamedDeclaration' || path.parent.type === 'ExportDefaultDeclaration',
          });
        },

        ArrowFunctionExpression(path: any) {
          const node = path.node;
          const loc = node.loc;
          if (!loc) return;

          let name = 'anonymous';
          if (path.parent.type === 'VariableDeclarator' && path.parent.id) {
            name = path.parent.id.name;
          }

          entities.push({
            id: `${filePath}:${loc.start.line}:${loc.start.column}`,
            name,
            type: 'function',
            startLine: loc.start.line,
            endLine: loc.end.line,
            startColumn: loc.start.column,
            endColumn: loc.end.column,
            params: node.params.map((p: any) => p.name || 'param'),
            isAsync: node.async,
          });
        },

        ClassDeclaration(path: any) {
          const node = path.node;
          const loc = node.loc;
          if (!loc) return;

          const className = node.id?.name || 'AnonymousClass';

          entities.push({
            id: `${filePath}:${loc.start.line}:${loc.start.column}`,
            name: className,
            type: 'class',
            startLine: loc.start.line,
            endLine: loc.end.line,
            startColumn: loc.start.column,
            endColumn: loc.end.column,
            isExported: path.parent.type === 'ExportNamedDeclaration' || path.parent.type === 'ExportDefaultDeclaration',
          });

          node.body.body.forEach((member: any) => {
            if (member.type === 'ClassMethod' || member.type === 'ClassProperty') {
              const memberLoc = member.loc;
              if (!memberLoc) return;

              entities.push({
                id: `${filePath}:${memberLoc.start.line}:${memberLoc.start.column}`,
                name: member.key.name || 'anonymous',
                type: member.type === 'ClassMethod' ? 'method' : 'property',
                startLine: memberLoc.start.line,
                endLine: memberLoc.end.line,
                startColumn: memberLoc.start.column,
                endColumn: memberLoc.end.column,
                parentClass: className,
                params: member.params ? member.params.map((p: any) => p.name || 'param') : undefined,
                isAsync: member.async,
              });
            }
          });
        },

        ImportDeclaration(path: any) {
          const node = path.node;
          const loc = node.loc;
          if (!loc) return;

          const importNames: string[] = [];
          let isDefault = false;
          let isNamespace = false;

          node.specifiers.forEach((spec: any) => {
            if (spec.type === 'ImportDefaultSpecifier') {
              importNames.push(spec.local.name);
              isDefault = true;
            } else if (spec.type === 'ImportNamespaceSpecifier') {
              importNames.push(spec.local.name);
              isNamespace = true;
            } else if (spec.type === 'ImportSpecifier') {
              importNames.push(spec.imported.name);
            }
          });

          imports.push({
            source: node.source.value,
            imports: importNames,
            isDefault,
            isNamespace,
            line: loc.start.line,
          });
        },

        ExportDefaultDeclaration(path: any) {
          const node = path.node;
          const loc = node.loc;
          if (!loc) return;

          let name = 'default';
          if (node.declaration.type === 'Identifier') {
            name = node.declaration.name;
          } else if (node.declaration.id) {
            name = node.declaration.id.name;
          }

          exports.push({
            name,
            isDefault: true,
            line: loc.start.line,
          });
        },

        ExportNamedDeclaration(path: any) {
          const node = path.node;
          const loc = node.loc;
          if (!loc) return;

          if (node.declaration) {
            if (node.declaration.id) {
              exports.push({
                name: node.declaration.id.name,
                isDefault: false,
                line: loc.start.line,
              });
            } else if (node.declaration.declarations) {
              node.declaration.declarations.forEach((decl: any) => {
                if (decl.id) {
                  exports.push({
                    name: decl.id.name,
                    isDefault: false,
                    line: loc.start.line,
                  });
                }
              });
            }
          }

          if (node.specifiers) {
            node.specifiers.forEach((spec: any) => {
              exports.push({
                name: spec.exported.name,
                isDefault: false,
                line: loc.start.line,
              });
            });
          }
        },
      });

      return {
        path: filePath,
        language: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
        entities,
        imports,
        exports,
        hasErrors: false,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown parse error');
      return {
        path: filePath,
        language: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
        entities: [],
        imports: [],
        exports: [],
        hasErrors: true,
        errors,
      };
    }
  }
}
