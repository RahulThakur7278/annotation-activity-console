import React, { useState } from 'react';
import { useAppSelector } from '../lib/hooks';
import { selectFilteredAndSortedTasks } from '../lib/features/tasks/tasksSlice';
import { TaskStatus, TaskType } from '../lib/types';
import { Search } from 'lucide-react';

interface TaskListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TaskList({ selectedId, onSelect }: TaskListProps) {
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'updatedAt' | 'title'>('updatedAt');
  const [search, setSearch] = useState('');

  const { total, page, pageSize } = useAppSelector((state) => state.tasks);
  const tasks = useAppSelector((state) => selectFilteredAndSortedTasks(state, filterType, filterStatus, sortField));

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Controls */}
      <div className="p-4 border-b space-y-3 bg-gray-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap text-sm">
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as TaskType | 'all')}
            className="border rounded-md px-2 py-1 bg-white"
          >
            <option value="all">All Types</option>
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="text">Text</option>
            <option value="unknown">Unknown</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="border rounded-md px-2 py-1 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="qa">QA</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>

          <select 
            value={sortField} 
            onChange={e => setSortField(e.target.value as 'updatedAt' | 'title')}
            className="border rounded-md px-2 py-1 bg-white"
          >
            <option value="updatedAt">Sort by Updated</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tasks found matching criteria.
          </div>
        ) : (
          <ul className="divide-y">
            {filteredTasks.map((task) => (
              <li 
                key={task.id}
                onClick={() => onSelect(task.id)}
                className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedId === task.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900">{task.title}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${task.status === 'done' ? 'bg-green-100 text-green-700' : ''}
                    ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                    ${task.status === 'blocked' ? 'bg-red-100 text-red-700' : ''}
                    ${task.status === 'qa' ? 'bg-purple-100 text-purple-700' : ''}
                    ${task.status === 'todo' ? 'bg-gray-100 text-gray-700' : ''}
                  `}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Type: {task.type}</span>
                  <span>
                    Updated: {new Date(task.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Assignee: {task.assignee ? task.assignee.name : 'Unassigned'}</span>
                  <span>Annotations: {task.annotationCount}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
        Showing {tasks.length} / {total} tasks (Page {page})
        {/* We only fetch page 1 in this simple setup, but this shows where pagination controls go */}
      </div>
    </div>
  );
}
