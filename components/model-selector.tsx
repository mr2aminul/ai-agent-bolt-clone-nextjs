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
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <select className="w-full px-3 py-1.5 text-sm bg-red-900/20 border border-red-700 rounded text-red-400">
          <option>Error loading models</option>
        </select>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="w-full">
        <select className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-400">
          <option>No models available</option>
        </select>
      </div>
    );
  }

  return (
    <div className="w-full">
      <select
        value={selectedModel || ''}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
      >
        <option value="">Select Model...</option>
        {models.map((model) => (
          <option key={model.path} value={model.path}>
            {model.path}
          </option>
        ))}
      </select>
    </div>
  );
}
