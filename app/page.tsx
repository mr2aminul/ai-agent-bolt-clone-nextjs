'use client';

import { useState } from 'react';
import ModelSelector from '@/components/model-selector';
import ChatInterface from '@/components/chat-interface';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-4 bg-gray-950">
      <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)]">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">AI Project Builder</h1>
          <p className="text-gray-400">
            AI-powered massive project builder and updater
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-5rem)]">
          <div className="lg:col-span-1">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>

          <div className="lg:col-span-3 h-full">
            <ChatInterface modelPath={selectedModel} />
          </div>
        </div>
      </div>
    </main>
  );
}
