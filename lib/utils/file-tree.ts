import { FileNode } from '@/components/file-explorer';

export function buildFileTree(files: any[]): FileNode[] {
  if (!files || files.length === 0) return [];

  const root: FileNode[] = [];
  const nodeMap = new Map<string, FileNode>();

  files.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  files.forEach((file) => {
    const node: FileNode = {
      id: file.path,
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      modified: file.modified,
      children: file.type === 'folder' ? [] : undefined,
    };
    nodeMap.set(file.path, node);
  });

  files.forEach((file) => {
    const node = nodeMap.get(file.path);
    if (!node) return;

    const pathParts = file.path.split('/').filter(Boolean);

    if (pathParts.length === 1) {
      root.push(node);
    } else {
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);

      if (parent && parent.children) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }
  });

  return root;
}

export function getFileExtensionColor(extension?: string): string {
  if (!extension) return 'text-gray-400';

  const colorMap: Record<string, string> = {
    js: 'text-yellow-400',
    jsx: 'text-blue-400',
    ts: 'text-blue-500',
    tsx: 'text-blue-600',
    json: 'text-yellow-500',
    css: 'text-pink-400',
    scss: 'text-pink-500',
    html: 'text-orange-500',
    php: 'text-purple-500',
    py: 'text-blue-400',
    go: 'text-cyan-400',
    rs: 'text-orange-600',
    md: 'text-gray-300',
    txt: 'text-gray-400',
  };

  return colorMap[extension.toLowerCase()] || 'text-gray-400';
}
