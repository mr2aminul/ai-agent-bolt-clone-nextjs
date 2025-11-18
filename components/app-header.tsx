'use client';

import ModelSelector from './model-selector';

interface AppHeaderProps {
  selectedModel: string | null;
  onModelChange: (model: string) => void;
  projectName?: string;
}

export default function AppHeader({ selectedModel, onModelChange, projectName }: AppHeaderProps) {
  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">AI Project Builder</h1>
        {projectName && (
          <>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{projectName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
        </div>
      </div>
    </header>
  );
}
