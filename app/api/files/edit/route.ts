import { NextRequest, NextResponse } from 'next/server';
import { fileOperations } from '@/lib/fs/operations';
import { fileQueries } from '@/lib/db/queries';

export const runtime = 'nodejs';

type EditOperation =
  | { type: 'replace_lines'; startLine: number; endLine: number; content: string }
  | { type: 'insert_lines'; line: number; content: string }
  | { type: 'delete_lines'; startLine: number; endLine: number }
  | { type: 'find_replace'; find: string; replace: string; all?: boolean }
  | { type: 'regex_replace'; pattern: string; replace: string; flags?: string };

interface EditRequest {
  fileId: string;
  path: string;
  operations: EditOperation[];
}

class FileEditor {
  private lines: string[];

  constructor(content: string) {
    this.lines = content.split('\n');
  }

  applyOperation(op: EditOperation): void {
    switch (op.type) {
      case 'replace_lines':
        this.replaceLines(op.startLine, op.endLine, op.content);
        break;
      case 'insert_lines':
        this.insertLines(op.line, op.content);
        break;
      case 'delete_lines':
        this.deleteLines(op.startLine, op.endLine);
        break;
      case 'find_replace':
        this.findReplace(op.find, op.replace, op.all);
        break;
      case 'regex_replace':
        this.regexReplace(op.pattern, op.replace, op.flags);
        break;
    }
  }

  private replaceLines(startLine: number, endLine: number, content: string): void {
    const newLines = content.split('\n');
    this.lines.splice(startLine, endLine - startLine + 1, ...newLines);
  }

  private insertLines(line: number, content: string): void {
    const newLines = content.split('\n');
    this.lines.splice(line, 0, ...newLines);
  }

  private deleteLines(startLine: number, endLine: number): void {
    this.lines.splice(startLine, endLine - startLine + 1);
  }

  private findReplace(find: string, replace: string, all?: boolean): void {
    for (let i = 0; i < this.lines.length; i++) {
      if (all) {
        this.lines[i] = this.lines[i].split(find).join(replace);
      } else {
        if (this.lines[i].includes(find)) {
          this.lines[i] = this.lines[i].replace(find, replace);
          break;
        }
      }
    }
  }

  private regexReplace(pattern: string, replace: string, flags?: string): void {
    const regex = new RegExp(pattern, flags || 'g');
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i] = this.lines[i].replace(regex, replace);
    }
  }

  getContent(): string {
    return this.lines.join('\n');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body: EditRequest = await request.json();
    const { fileId, path, operations } = body;

    if (!fileId || !path || !operations || operations.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, path, operations' },
        { status: 400 }
      );
    }

    const readResult = await fileOperations.readFile(path);
    if (readResult.error || !readResult.content) {
      return NextResponse.json(
        { error: readResult.error || 'Failed to read file' },
        { status: 400 }
      );
    }

    const editor = new FileEditor(readResult.content);

    for (const operation of operations) {
      editor.applyOperation(operation);
    }

    const newContent = editor.getContent();

    const updateResult = await fileOperations.updateFile(path, newContent);

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 400 });
    }

    const size = Buffer.byteLength(newContent, 'utf-8');

    const dbFile = await fileQueries.update(fileId, {
      content: newContent,
      size,
      last_modified: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      file: dbFile,
      operationsApplied: operations.length,
    });
  } catch (error) {
    console.error('Error editing file:', error);
    return NextResponse.json(
      { error: 'Failed to edit file' },
      { status: 500 }
    );
  }
}
