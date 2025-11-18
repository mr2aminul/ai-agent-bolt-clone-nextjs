import * as fs from 'fs';
import * as path from 'path';

export interface FileOperationResult {
  success: boolean;
  path?: string;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt',
  '.css', '.scss', '.html', '.xml', '.yaml', '.yml',
  '.py', '.php', '.java', '.go', '.rs', '.c', '.cpp',
  '.sh', '.sql', '.env.example', '.gitignore',
];

export class FileOperations {
  sanitizePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    if (normalized.includes('..')) {
      throw new Error('Invalid file path: path traversal detected');
    }
    return normalized;
  }

  validatePath(filePath: string): void {
    const sanitized = this.sanitizePath(filePath);
    if (!sanitized) {
      throw new Error('Invalid file path');
    }
  }

  validateExtension(filePath: string): void {
    const ext = path.extname(filePath).toLowerCase();
    if (ext && !ALLOWED_EXTENSIONS.includes(ext) && ext !== '') {
      throw new Error(`File extension ${ext} is not allowed`);
    }
  }

  validateSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }
  }

  async createFile(filePath: string, content: string): Promise<FileOperationResult> {
    try {
      this.validatePath(filePath);
      this.validateExtension(filePath);

      const size = Buffer.byteLength(content, 'utf-8');
      this.validateSize(size);

      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(filePath, content, 'utf-8');

      return { success: true, path: filePath };
    } catch (error) {
      console.error('Failed to create file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async readFile(filePath: string): Promise<{ content?: string; error?: string }> {
    try {
      this.validatePath(filePath);

      const stats = await fs.promises.stat(filePath);
      this.validateSize(stats.size);

      const content = await fs.promises.readFile(filePath, 'utf-8');
      return { content };
    } catch (error) {
      console.error('Failed to read file:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateFile(filePath: string, content: string): Promise<FileOperationResult> {
    try {
      this.validatePath(filePath);
      this.validateExtension(filePath);

      const size = Buffer.byteLength(content, 'utf-8');
      this.validateSize(size);

      const exists = await fs.promises
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return { success: false, error: 'File does not exist' };
      }

      const backup = `${filePath}.backup`;
      await fs.promises.copyFile(filePath, backup);

      try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        await fs.promises.unlink(backup);
        return { success: true, path: filePath };
      } catch (error) {
        await fs.promises.copyFile(backup, filePath);
        await fs.promises.unlink(backup);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteFile(filePath: string): Promise<FileOperationResult> {
    try {
      this.validatePath(filePath);

      const exists = await fs.promises
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return { success: false, error: 'File does not exist' };
      }

      await fs.promises.unlink(filePath);
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Failed to delete file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      this.validatePath(filePath);
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const fileOperations = new FileOperations();
