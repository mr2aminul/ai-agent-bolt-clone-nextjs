import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  path: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  extension?: string;
  modified: Date;
  content?: string;
}

export interface ScanOptions {
  includeContent?: boolean;
  maxFileSize?: number;
  excludePatterns?: string[];
  maxDepth?: number;
}

const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.turbo',
  '.vercel',
  '__pycache__',
  'venv',
  '.env',
  '.env.local',
  '.DS_Store',
];

export class FileScanner {
  private excludePatterns: string[];
  private maxFileSize: number;
  private maxDepth: number;

  constructor(options: ScanOptions = {}) {
    this.excludePatterns = [
      ...DEFAULT_EXCLUDE_PATTERNS,
      ...(options.excludePatterns || []),
    ];
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024;
    this.maxDepth = options.maxDepth || 10;
  }

  shouldExclude(filePath: string): boolean {
    const pathParts = filePath.split(path.sep);
    return this.excludePatterns.some((pattern) =>
      pathParts.some((part) => part.includes(pattern))
    );
  }

  detectFileType(filePath: string): string | undefined {
    const ext = path.extname(filePath).toLowerCase();
    if (!ext) return undefined;
    return ext.slice(1);
  }

  async readFileContent(filePath: string): Promise<string | undefined> {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size > this.maxFileSize) {
        return undefined;
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error);
      return undefined;
    }
  }

  async scanDirectory(
    dirPath: string,
    options: ScanOptions = {},
    currentDepth: number = 0
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];

    if (currentDepth > this.maxDepth) {
      return results;
    }

    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (this.shouldExclude(fullPath)) {
          continue;
        }

        try {
          const stats = await fs.promises.stat(fullPath);

          if (entry.isDirectory()) {
            results.push({
              path: fullPath,
              name: entry.name,
              type: 'folder',
              size: 0,
              modified: stats.mtime,
            });

            const subResults = await this.scanDirectory(
              fullPath,
              options,
              currentDepth + 1
            );
            results.push(...subResults);
          } else if (entry.isFile()) {
            const metadata: FileMetadata = {
              path: fullPath,
              name: entry.name,
              type: 'file',
              size: stats.size,
              extension: this.detectFileType(fullPath),
              modified: stats.mtime,
            };

            if (options.includeContent && stats.size <= this.maxFileSize) {
              metadata.content = await this.readFileContent(fullPath);
            }

            results.push(metadata);
          }
        } catch (error) {
          console.warn(`Failed to process ${fullPath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to scan directory ${dirPath}:`, error);
    }

    return results;
  }

  async detectChanges(
    projectPath: string,
    existingFiles: Map<string, Date>
  ): Promise<{
    added: FileMetadata[];
    modified: FileMetadata[];
    deleted: string[];
  }> {
    const currentFiles = await this.scanDirectory(projectPath);
    const currentFileMap = new Map(
      currentFiles.map((f) => [f.path, f.modified])
    );

    const added: FileMetadata[] = [];
    const modified: FileMetadata[] = [];
    const deleted: string[] = [];

    for (const file of currentFiles) {
      if (!existingFiles.has(file.path)) {
        added.push(file);
      } else {
        const existingModified = existingFiles.get(file.path);
        if (existingModified && file.modified > existingModified) {
          modified.push(file);
        }
      }
    }

    existingFiles.forEach((_, filePath) => {
      if (!currentFileMap.has(filePath)) {
        deleted.push(filePath);
      }
    });

    return { added, modified, deleted };
  }
}
