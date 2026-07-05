import React from 'react';
import { useAppSelector } from '../lib/hooks';
import { selectTaskById } from '../lib/features/tasks/tasksSlice';
import { useTaskSummary } from '../hooks/useTaskSummary';
import { SafeMarkdown } from './SafeMarkdown';
import { Loader2, AlertCircle } from 'lucide-react';

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const task = useAppSelector((state) => selectTaskById(state, taskId));
  const { summary, isLoading, error } = useTaskSummary(taskId);

  if (!task) {
    return (
      <div className="p-8 text-center text-gray-500">
        Task not found or hasn't been loaded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="p-6 bg-white border-b shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            {task.id}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status: </span>
            <span className="font-medium text-gray-900 capitalize">{task.status.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-gray-500">Type: </span>
            <span className="font-medium text-gray-900 capitalize">{task.type}</span>
          </div>
          <div>
            <span className="text-gray-500">Assignee: </span>
            <span className="font-medium text-gray-900">{task.assignee ? task.assignee.name : 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-gray-500">Annotations: </span>
            <span className="font-medium text-gray-900">{task.annotationCount}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Last Updated: </span>
            <span className="font-medium text-gray-900">{new Date(task.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="p-6 flex-1 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          AI Summary
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </h3>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Failed to load summary</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border shadow-sm min-h-50">
            {summary ? (
              <SafeMarkdown content={summary} />
            ) : isLoading ? (
              <div className="text-gray-400 italic">Generating summary...</div>
            ) : (
              <div className="text-gray-400 italic">No summary available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
