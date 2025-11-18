'use client';

import { useState, useEffect } from 'react';
import { FolderIcon, PlusIcon } from './icons';

interface Project {
  id: string;
  name: string;
  path: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface ProjectSelectorProps {
  currentProject: Project | null;
  onProjectChange: (project: Project) => void;
  onNewProject: () => void;
}

export default function ProjectSelector({
  currentProject,
  onProjectChange,
  onNewProject,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/list?userId=default-user');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
      >
        <FolderIcon className="w-4 h-4 text-yellow-500" />
        <span className="text-sm text-white">
          {currentProject ? currentProject.name : 'Select Project'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNewProject();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 rounded transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Project
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-sm text-gray-400">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No projects yet</div>
            ) : (
              <div className="p-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onProjectChange(project);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      currentProject?.id === project.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{project.name}</div>
                    {project.path && (
                      <div className="text-xs opacity-75 truncate">
                        {project.path}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
