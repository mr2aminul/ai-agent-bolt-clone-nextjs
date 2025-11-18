'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/app-header';
import ChatInterface from '@/components/chat-interface';
import FileExplorer, { FileNode } from '@/components/file-explorer';
import TerminalPanel from '@/components/terminal-panel';
import ResizablePanel from '@/components/resizable-panel';
import NewProjectModal from '@/components/new-project-modal';

interface Project {
  id: string;
  name: string;
  path: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface Chat {
  id: string;
  project_id: string;
  title: string | null;
  created_at: string;
}

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (currentProject?.path) {
      loadProjectFiles();
    } else {
      setProjectFiles([]);
    }
  }, [currentProject]);

  const loadProjectFiles = async () => {
    if (!currentProject?.id || !currentProject?.path) return;

    setLoadingFiles(true);
    try {
      const response = await fetch('/api/projects/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          projectPath: currentProject.path,
          includeContent: false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const treeData = buildFileTree(data.files || []);
        setProjectFiles(treeData);
      }
    } catch (error) {
      console.error('Failed to load project files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const buildFileTree = (files: any[]): FileNode[] => {
    const tree: FileNode[] = [];
    const map: Record<string, FileNode> = {};

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
      map[file.path] = node;
    });

    files.forEach((file) => {
      const node = map[file.path];
      const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
      const parent = map[parentPath];

      if (parent && parent.children) {
        parent.children.push(node);
      } else if (!parentPath || parentPath === file.path) {
        tree.push(node);
      }
    });

    return tree;
  };

  const handleCreateProject = async (name: string, description: string, path: string) => {
    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          name,
          description: description || undefined,
          path,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentProject(data.project);
        setShowNewProjectModal(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleNewChat = async () => {
    if (!currentProject) return;

    try {
      const response = await fetch('/api/chats/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          title: 'New Chat',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentChat(data.chat);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <AppHeader
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        currentProject={currentProject}
        onProjectChange={setCurrentProject}
        onNewProject={() => setShowNewProjectModal(true)}
        currentChatId={currentChat?.id || null}
        onChatSelect={setCurrentChat}
        onNewChat={handleNewChat}
        onChatDelete={(chatId) => {
          if (currentChat?.id === chatId) {
            setCurrentChat(null);
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <ResizablePanel
          direction="horizontal"
          defaultSize={40}
          minSize={25}
          maxSize={60}
          storageKey="chat-panel-size"
        >
          <div className="h-full p-2">
            <ChatInterface modelPath={selectedModel} />
          </div>
        </ResizablePanel>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ResizablePanel
            direction="vertical"
            defaultSize={70}
            minSize={40}
            maxSize={85}
            storageKey="editor-panel-size"
          >
            <div className="h-full p-2">
              {loadingFiles ? (
                <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-400">Loading files...</p>
                </div>
              ) : (
                <FileExplorer
                  files={projectFiles}
                  onFileSelect={(path) => console.log('Selected file:', path)}
                />
              )}
            </div>
          </ResizablePanel>

          <div className="flex-1 overflow-hidden">
            <TerminalPanel />
          </div>
        </div>
      </div>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
