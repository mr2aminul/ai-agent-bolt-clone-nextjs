'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/app-header';
import ChatInterface from '@/components/chat-interface';
import FileExplorer, { FileNode } from '@/components/file-explorer';
import EditorTabs from '@/components/editor-tabs';
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

interface EditorTab {
  id: string;
  path: string;
  content: string;
  isDirty?: boolean;
}

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

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

        const detectResponse = await fetch('/api/projects/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: data.project.id,
            projectPath: path,
          }),
        });

        if (detectResponse.ok) {
          await fetch('/api/projects/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: data.project.id,
              projectPath: path,
            }),
          });
        }
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

  const handleFileSelect = async (filePath: string) => {
    const existingTab = openTabs.find((tab) => tab.path === filePath);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    try {
      const response = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();

      if (data.success && data.content !== undefined) {
        const newTab: EditorTab = {
          id: `${Date.now()}-${filePath}`,
          path: filePath,
          content: data.content,
          isDirty: false,
        };

        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const handleTabClose = (tabId: string) => {
    const tab = openTabs.find((t) => t.id === tabId);
    if (tab?.isDirty) {
      if (!confirm(`"${tab.path}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));

    if (activeTabId === tabId) {
      const remainingTabs = openTabs.filter((t) => t.id !== tabId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[0].id : null);
    }
  };

  const handleSave = async (tabId: string, content: string) => {
    const tab = openTabs.find((t) => t.id === tabId);
    if (!tab) return;

    try {
      const filesList = await fetch(`/api/projects/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id,
          projectPath: currentProject?.path,
          includeContent: false,
        }),
      });

      const filesData = await filesList.json();
      const fileInfo = filesData.files?.find((f: any) => f.path === tab.path);

      if (!fileInfo) {
        console.error('File not found in database');
        return;
      }

      const response = await fetch('/api/files/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: fileInfo.id,
          path: tab.path,
          content,
        }),
      });

      if (response.ok) {
        setOpenTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, content, isDirty: false } : t))
        );
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleContentChange = (tabId: string, content: string) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content, isDirty: true } : t))
    );
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

        <div className="flex-1 flex overflow-hidden">
          <ResizablePanel
            direction="horizontal"
            defaultSize={30}
            minSize={20}
            maxSize={50}
            storageKey="file-explorer-size"
          >
            <div className="h-full p-2">
              {loadingFiles ? (
                <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-400">Loading files...</p>
                </div>
              ) : (
                <FileExplorer
                  files={projectFiles}
                  onFileSelect={handleFileSelect}
                />
              )}
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
                <EditorTabs
                  tabs={openTabs}
                  activeTabId={activeTabId}
                  onTabChange={setActiveTabId}
                  onTabClose={handleTabClose}
                  onSave={handleSave}
                  onContentChange={handleContentChange}
                />
              </div>
            </ResizablePanel>

            <div className="flex-1 overflow-hidden">
              <TerminalPanel projectPath={currentProject?.path} />
            </div>
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
