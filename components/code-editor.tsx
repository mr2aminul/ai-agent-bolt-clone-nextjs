'use client';

import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  filePath: string;
  initialContent: string;
  language?: string;
  onSave?: (content: string) => void;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({
  filePath,
  initialContent,
  language,
  onSave,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    setContent(initialContent);
    setIsDirty(false);
  }, [filePath, initialContent]);

  const detectLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      php: 'php',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      sh: 'shell',
      bash: 'shell',
      sql: 'sql',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setIsDirty(value !== initialContent);
      onChange?.(value);
    }
  };

  const handleSave = () => {
    if (onSave && isDirty) {
      onSave(content);
      setIsDirty(false);
    }
  };

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        handleSave();
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300 truncate">
            {filePath}
          </span>
          {isDirty && (
            <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded">
              Modified
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
              >
                Save (Ctrl+S)
              </button>
              <button
                onClick={() => {
                  setContent(initialContent);
                  setIsDirty(false);
                }}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
              >
                Discard
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language || detectLanguage(filePath)}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            folding: true,
            glyphMargin: true,
            contextmenu: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
}
