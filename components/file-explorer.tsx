'use client';

import { useState, useMemo } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FileIcon, FolderIcon } from '@/components/icons';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  searchQuery?: string;
}

const FileTreeItem = ({
  node,
  onFileSelect,
  searchQuery,
  level = 0,
}: {
  node: FileNode;
  onFileSelect: (path: string) => void;
  searchQuery?: string;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    return node.name.toLowerCase().includes(searchQuery.toLowerCase());
  }, [node.name, searchQuery]);

  if (!matchesSearch && isFolder && (!node.children || node.children.length === 0)) {
    return null;
  }

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div>
      <div
        className="flex items-center px-2 py-1 hover:bg-gray-800 cursor-pointer rounded text-sm"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
          } else {
            onFileSelect(node.path);
          }
        }}
      >
        {isFolder ? (
          <>
            {expanded ? (
              <ChevronDownIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            )}
            <FolderIcon className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-500" />
          </>
        ) : (
          <>
            <div className="w-4 mr-3" />
            <FileIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
          </>
        )}
        <span className="flex-1 truncate">{node.name}</span>
        {!isFolder && node.size && (
          <span className="text-xs text-gray-500 ml-2">{formatSize(node.size)}</span>
        )}
      </div>

      {isFolder && expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              onFileSelect={onFileSelect}
              searchQuery={searchQuery}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ files, onFileSelect, searchQuery = '' }: FileExplorerProps) {
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-3 border-b border-gray-800">
        <input
          type="text"
          placeholder="Search files..."
          defaultValue={searchQuery}
          className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No files found</p>
        ) : (
          files.map((file) => (
            <FileTreeItem
              key={file.id}
              node={file}
              onFileSelect={onFileSelect}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}
