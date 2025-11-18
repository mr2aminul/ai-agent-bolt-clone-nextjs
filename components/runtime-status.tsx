'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, AlertIcon } from './icons';

interface RuntimeInfo {
  runtime: 'node' | 'php' | 'python' | 'unknown';
  version: string | null;
  installed: boolean;
  path: string | null;
  packageManager?: string;
  packageManagerVersion?: string;
}

interface RuntimeStatusProps {
  onRuntimesDetected?: (runtimes: {
    node: RuntimeInfo;
    php: RuntimeInfo;
    python: RuntimeInfo;
  }) => void;
}

export default function RuntimeStatus({ onRuntimesDetected }: RuntimeStatusProps) {
  const [runtimes, setRuntimes] = useState<{
    node: RuntimeInfo;
    php: RuntimeInfo;
    python: RuntimeInfo;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    detectRuntimes();
  }, []);

  const detectRuntimes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/runtime/detect');
      const data = await response.json();
      if (data.success) {
        setRuntimes(data.runtimes);
        onRuntimesDetected?.(data.runtimes);
      }
    } catch (error) {
      console.error('Failed to detect runtimes:', error);
    } finally {
      setLoading(false);
    }
  };

  const RuntimeItem = ({ runtime }: { runtime: RuntimeInfo }) => {
    const label = runtime.runtime.charAt(0).toUpperCase() + runtime.runtime.slice(1);

    return (
      <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded">
        <div className="flex items-center gap-2">
          {runtime.installed ? (
            <CheckIcon className="w-4 h-4 text-green-400" />
          ) : (
            <AlertIcon className="w-4 h-4 text-red-400" />
          )}
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <div className="text-right">
          {runtime.installed ? (
            <>
              <p className="text-xs text-gray-300">{runtime.version}</p>
              {runtime.packageManager && (
                <p className="text-xs text-gray-500">
                  {runtime.packageManager} {runtime.packageManagerVersion || ''}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-red-400">Not installed</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <button className="px-3 py-1.5 bg-gray-800 rounded border border-gray-700 text-sm text-gray-400">
        Detecting...
      </button>
    );
  }

  if (!runtimes) return null;

  const installedCount = [runtimes.node, runtimes.php, runtimes.python].filter(
    (r) => r.installed
  ).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm text-white transition-colors"
      >
        Runtimes ({installedCount}/3)
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white">Runtime Environments</h3>
            </div>
            <div className="p-2 space-y-2">
              <RuntimeItem runtime={runtimes.node} />
              <RuntimeItem runtime={runtimes.php} />
              <RuntimeItem runtime={runtimes.python} />
            </div>
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  detectRuntimes();
                }}
                className="w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
              >
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
