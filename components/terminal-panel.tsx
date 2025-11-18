'use client';

import { useState } from 'react';

export default function TerminalPanel() {
  const [output, setOutput] = useState<string[]>([
    '$ Welcome to AI Project Builder Terminal',
    '$ Type commands to interact with your project',
  ]);

  return (
    <div className="flex flex-col h-full bg-gray-950 border-t border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Terminal</span>
        </div>
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors text-gray-300">
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {output.map((line, index) => (
          <div key={index} className="text-gray-300">
            {line}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 p-2">
        <div className="flex items-center gap-2 px-2">
          <span className="text-green-400 font-mono text-sm">$</span>
          <input
            type="text"
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-gray-300 font-mono text-sm placeholder-gray-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                setOutput([...output, `$ ${e.currentTarget.value}`]);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
