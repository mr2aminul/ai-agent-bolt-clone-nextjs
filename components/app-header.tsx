'use client';

import ModelSelector from './model-selector';
import ProjectSelector from './project-selector';
import ChatList from './chat-list';

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

interface AppHeaderProps {
  selectedModel: string | null;
  onModelChange: (model: string) => void;
  currentProject: Project | null;
  onProjectChange: (project: Project) => void;
  onNewProject: () => void;
  currentChatId: string | null;
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
  onChatDelete: (chatId: string) => void;
}

export default function AppHeader({
  selectedModel,
  onModelChange,
  currentProject,
  onProjectChange,
  onNewProject,
  currentChatId,
  onChatSelect,
  onNewChat,
  onChatDelete,
}: AppHeaderProps) {
  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">AI Project Builder</h1>
        <ProjectSelector
          currentProject={currentProject}
          onProjectChange={onProjectChange}
          onNewProject={onNewProject}
        />
      </div>

      <div className="flex items-center gap-3">
        <ChatList
          projectId={currentProject?.id || null}
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onNewChat={onNewChat}
          onChatDelete={onChatDelete}
        />
        <div className="w-64">
          <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
        </div>
      </div>
    </header>
  );
}
