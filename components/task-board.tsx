'use client';

import { useState } from 'react';
import { CheckIcon, ClockIcon, AlertIcon, PlusIcon, TrashIcon } from '@/components/icons';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgent?: string;
  createdAt: string;
  completedAt?: string;
}

interface TaskBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

const priorityColors: Record<number, string> = {
  1: 'bg-green-900/30 text-green-400 border-green-700',
  2: 'bg-blue-900/30 text-blue-400 border-blue-700',
  3: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
  4: 'bg-orange-900/30 text-orange-400 border-orange-700',
  5: 'bg-red-900/30 text-red-400 border-red-700',
};

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: AlertIcon,
    bgColor: 'bg-gray-800',
    borderColor: 'border-gray-700',
  },
  in_progress: {
    label: 'In Progress',
    icon: ClockIcon,
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700',
  },
  completed: {
    label: 'Completed',
    icon: CheckIcon,
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700',
  },
};

const TaskCard = ({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (status: Task['status']) => void;
  onDelete: () => void;
}) => {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const priorityClass = priorityColors[task.priority];

  const statusOptions: Task['status'][] = ['pending', 'in_progress', 'completed'];

  return (
    <div className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor} space-y-2`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-white">{task.title}</h4>
          <p className="text-xs text-gray-400 mt-1">{task.description}</p>
        </div>
        <button
          onClick={onDelete}
          className="ml-2 p-1 hover:bg-red-900/30 rounded transition-colors text-red-400"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 text-xs rounded border ${priorityClass}`}>
          P{task.priority}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>

      {task.assignedAgent && (
        <p className="text-xs bg-gray-700/50 rounded px-2 py-1">
          Agent: <span className="text-blue-400">{task.assignedAgent}</span>
        </p>
      )}

      <div className="flex gap-1 pt-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              task.status === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {statusConfig[status].label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function TaskBoard({
  tasks,
  onTaskStatusChange,
  onTaskDelete,
  onTaskCreate,
}: TaskBoardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
  }>({
    title: '',
    description: '',
    priority: 3,
  });

  const handleCreate = () => {
    if (newTask.title.trim()) {
      onTaskCreate?.({
        ...newTask,
        status: 'pending',
        assignedAgent: 'Unassigned',
      });
      setNewTask({ title: '', description: '', priority: 3 });
      setShowCreateForm(false);
    }
  };

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold text-white">Tasks</h3>
        {onTaskCreate && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <PlusIcon className="w-4 h-4 text-blue-400" />
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="p-3 border-b border-gray-800 space-y-2 bg-gray-800/50">
          <input
            type="text"
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-400"
          />
          <textarea
            placeholder="Description..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })
              }
              className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
            >
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  Priority {p}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {['pending', 'in_progress', 'completed'].map((status) => (
          <div key={status}>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              {statusConfig[status as Task['status']].label} ({groupedTasks[status as keyof typeof groupedTasks].length})
            </h4>
            <div className="space-y-2">
              {groupedTasks[status as keyof typeof groupedTasks].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(newStatus) => onTaskStatusChange(task.id, newStatus)}
                  onDelete={() => onTaskDelete(task.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
