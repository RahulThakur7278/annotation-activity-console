'use client';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { fetchTasks, loadTasksFromCache } from '../lib/features/tasks/tasksSlice';
import { useTaskFeed } from '../hooks/useTaskFeed';
import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';
import { AlertCircle, Loader2 } from 'lucide-react';

export function TaskConsole() {
  const dispatch = useAppDispatch();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { status, error, isCachedData } = useAppSelector((state) => state.tasks);
  
  // Connect to websocket
  const { isConnected } = useTaskFeed();

  // Load from cache first, then fetch fresh data
  useEffect(() => {
    dispatch(loadTasksFromCache()).then(() => {
      dispatch(fetchTasks({ page: 1, pageSize: 50 })); // Loading a reasonable chunk
    });
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar / List View */}
      <div className="w-1/2 flex flex-col border-r bg-white h-full overflow-hidden">
        <header className="p-4 border-b flex justify-between items-center bg-gray-100/50">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Activity Console</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">{isConnected ? 'Live' : 'Disconnected'}</span>
              
              {isCachedData && status === 'loading' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Updating from server...
                </span>
              )}
            </div>
          </div>
        </header>

        {status === 'failed' && !isCachedData && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load tasks: {error}</span>
          </div>
        )}

        {status === 'loading' && !isCachedData && (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {(status === 'succeeded' || isCachedData) && (
          <TaskList 
            selectedId={selectedTaskId}
            onSelect={setSelectedTaskId} 
          />
        )}
      </div>

      {/* Detail View */}
      <div className="w-1/2 h-full flex flex-col bg-gray-50 overflow-hidden">
        {selectedTaskId ? (
          <TaskDetail taskId={selectedTaskId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a task to view details
          </div>
        )}
      </div>
    </div>
  );
}
