'use client';

import { useState, useEffect } from 'react';
import type { ModelInfo } from '@/lib/lm-studio/client';

interface ModelSelectorProps {
  selectedModel: string | null;
  onModelChange: (modelPath: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/models');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch models');
      }

      setModels(data.models);

      if (data.models.length > 0 && !selectedModel) {
        onModelChange(data.models[0].path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="w-full p-4 border border-gray-700 rounded-lg bg-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 border border-red-500 rounded-lg bg-red-900/20">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <button
          onClick={fetchModels}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="w-full p-4 border border-yellow-500 rounded-lg bg-yellow-900/20">
        <p className="text-yellow-400 text-sm">
          No models found. Please download models in LM Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2 text-gray-300">
        Select Model
      </label>
      <select
        value={selectedModel || ''}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
      >
        {models.map((model) => (
          <option key={model.path} value={model.path}>
            {model.path} ({formatSize(model.size)})
          </option>
        ))}
      </select>

      {selectedModel && (
        <div className="mt-2 p-3 bg-gray-800/50 rounded-lg text-sm">
          {models.find(m => m.path === selectedModel) && (
            <div className="space-y-1 text-gray-400">
              <p><span className="font-medium">Type:</span> {models.find(m => m.path === selectedModel)?.type}</p>
              {models.find(m => m.path === selectedModel)?.architecture && (
                <p><span className="font-medium">Architecture:</span> {models.find(m => m.path === selectedModel)?.architecture}</p>
              )}
              <p>
                <span className="font-medium">Capabilities:</span>{' '}
                {models.find(m => m.path === selectedModel)?.capabilities?.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
