'use client';

import { useState } from 'react';
import CodeEditor from './code-editor';
import { FileIcon } from './icons';

interface EditorTab {
  id: string;
  path: string;
  content: string;
  isDirty?: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onSave: (tabId: string, content: string) => void;
  onContentChange: (tabId: string, content: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onSave,
  onContentChange,
}: EditorTabsProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center text-gray-500">
          <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No file open</p>
          <p className="text-sm mt-1">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap
              ${
                activeTabId === tab.id
                  ? 'bg-gray-900 text-white border border-gray-700'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }
            `}
          >
            <FileIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[150px]">
              {tab.path.split('/').pop()}
            </span>
            {tab.isDirty && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-1 hover:bg-gray-600 rounded p-0.5 flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab && (
          <CodeEditor
            key={activeTab.id}
            filePath={activeTab.path}
            initialContent={activeTab.content}
            onSave={(content) => onSave(activeTab.id, content)}
            onChange={(content) => onContentChange(activeTab.id, content)}
          />
        )}
      </div>
    </div>
  );
}
