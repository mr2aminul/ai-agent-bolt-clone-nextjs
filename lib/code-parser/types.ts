export interface CodeEntity {
  id: string;
  name: string;
  type: 'function' | 'class' | 'method' | 'property' | 'interface' | 'type';
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  params?: string[];
  returnType?: string;
  isAsync?: boolean;
  isExported?: boolean;
  parentClass?: string;
  visibility?: 'public' | 'private' | 'protected';
}

export interface ImportInfo {
  source: string;
  imports: string[];
  isDefault?: boolean;
  isNamespace?: boolean;
  line: number;
}

export interface ExportInfo {
  name: string;
  isDefault: boolean;
  line: number;
}

export interface ParsedFile {
  path: string;
  language: 'javascript' | 'typescript' | 'php';
  entities: CodeEntity[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  hasErrors: boolean;
  errors?: string[];
}

export interface ParserOptions {
  includeComments?: boolean;
  includePrivate?: boolean;
  sourceType?: 'module' | 'script';
}
