'use client';

import { useState } from 'react';
import AppHeader from '@/components/app-header';
import ChatInterface from '@/components/chat-interface';
import FileExplorer from '@/components/file-explorer';
import TerminalPanel from '@/components/terminal-panel';
import ResizablePanel from '@/components/resizable-panel';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <AppHeader
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        projectName="My Project"
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
              <FileExplorer
                files={[]}
                onFileSelect={(path) => console.log('Selected file:', path)}
              />
            </div>
          </ResizablePanel>

          <div className="flex-1 overflow-hidden">
            <TerminalPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
