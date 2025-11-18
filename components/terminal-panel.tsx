'use client';

import { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  id: number;
  type: 'command' | 'stdout' | 'stderr' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

interface ProjectConfig {
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
  installCommand?: string;
  environmentVariables?: Record<string, string>;
}

interface TerminalPanelProps {
  projectPath?: string | null;
}

export default function TerminalPanel({ projectPath }: TerminalPanelProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 0,
      type: 'info',
      content: 'Welcome to AI Project Builder Terminal',
      timestamp: new Date(),
    },
    {
      id: 1,
      type: 'info',
      content: 'Type commands to interact with your project (npm, node, php, python, git, etc.)',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lineIdRef = useRef(2);

  useEffect(() => {
    if (projectPath) {
      loadProjectConfig();
    }
  }, [projectPath]);

  const loadProjectConfig = async () => {
    if (!projectPath) return;

    try {
      const response = await fetch(`/api/projects/config?projectPath=${encodeURIComponent(projectPath)}`);
      const data = await response.json();
      if (data.success && data.config) {
        setProjectConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load project config:', error);
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: lineIdRef.current++,
        type,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const clearTerminal = () => {
    setLines([]);
    lineIdRef.current = 0;
  };

  const stopExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      addLine('error', 'Command execution stopped by user');
      setIsExecuting(false);
    }
  };

  const executeCommand = async (command: string) => {
    if (!command.trim() || isExecuting) return;

    addLine('command', `$ ${command}`);
    setHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);
    setIsExecuting(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          cwd: projectPath || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        addLine('error', errorData.error || 'Failed to execute command');
        setIsExecuting(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsExecuting(false);
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'stdout') {
                  addLine('stdout', parsed.data);
                } else if (parsed.type === 'stderr') {
                  addLine('stderr', parsed.data);
                } else if (parsed.type === 'error') {
                  addLine('error', parsed.data);
                } else if (parsed.type === 'exit') {
                  addLine('info', parsed.data);
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Command aborted by user');
      } else {
        console.error('Error executing command:', error);
        addLine('error', 'Failed to execute command');
      }
      setIsExecuting(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      executeCommand(input.trim());
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      stopExecution();
    }
  };

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'command':
        return 'text-blue-400';
      case 'stdout':
        return 'text-gray-300';
      case 'stderr':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 border-t border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Terminal</span>
          {projectPath && (
            <span className="text-xs text-gray-500">({projectPath})</span>
          )}
        </div>
        <div className="flex gap-2">
          {projectConfig?.installCommand && (
            <button
              onClick={() => executeCommand(projectConfig.installCommand!)}
              disabled={isExecuting}
              className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors text-gray-300 disabled:opacity-50"
              title="Install dependencies"
            >
              Install
            </button>
          )}
          {projectConfig?.buildCommand && (
            <button
              onClick={() => executeCommand(projectConfig.buildCommand!)}
              disabled={isExecuting}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white disabled:opacity-50"
              title="Build project"
            >
              Build
            </button>
          )}
          {projectConfig?.devCommand && (
            <button
              onClick={() => executeCommand(projectConfig.devCommand!)}
              disabled={isExecuting}
              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors text-white disabled:opacity-50"
              title="Start dev server"
            >
              Dev
            </button>
          )}
          {projectConfig?.testCommand && (
            <button
              onClick={() => executeCommand(projectConfig.testCommand!)}
              disabled={isExecuting}
              className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded transition-colors text-white disabled:opacity-50"
              title="Run tests"
            >
              Test
            </button>
          )}
          {isExecuting && (
            <button
              onClick={stopExecution}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors text-white"
            >
              Stop (Ctrl+C)
            </button>
          )}
          <button
            onClick={clearTerminal}
            disabled={isExecuting}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {lines.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap`}>
            {line.content}
          </div>
        ))}
        {isExecuting && (
          <div className="text-gray-500 animate-pulse">Executing...</div>
        )}
      </div>

      <div className="border-t border-gray-800 p-2">
        <div className="flex items-center gap-2 px-2">
          <span className="text-green-400 font-mono text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command... (npm, php, python, git, etc.)"
            disabled={isExecuting}
            className="flex-1 bg-transparent border-none outline-none text-gray-300 font-mono text-sm placeholder-gray-600 disabled:opacity-50"
          />
        </div>
        <div className="text-xs text-gray-600 px-2 mt-1">
          Tip: Use ↑/↓ for history, Ctrl+C to stop
        </div>
      </div>
    </div>
  );
}
