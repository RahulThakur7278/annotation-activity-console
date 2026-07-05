export type TaskStatus = 'in_progress' | 'done' | 'qa' | 'todo' | 'blocked';
export type TaskType = 'image' | 'audio' | 'text' | 'unknown';

export interface User {
  id: string;
  name: string;
}

export interface BaseTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: User | null;
  annotationCount: number;
  updatedAt: number;
  meta: Record<string, unknown>;
}

export interface ImageTask extends BaseTask {
  type: 'image';
}

export interface AudioTask extends BaseTask {
  type: 'audio';
}

export interface TextTask extends BaseTask {
  type: 'text';
}

export interface UnknownTask extends BaseTask {
  type: 'unknown';
  originalType: string; // Keep track of what it was
}

export type Task = ImageTask | AudioTask | TextTask | UnknownTask;

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface WsTaskUpdated {
  kind: 'task.updated';
  payload: {
    id: string;
    status: string;
    updatedAt: number;
  };
}

export interface WsTaskAssigned {
  kind: 'task.assigned';
  payload: {
    id: string;
    assignee: User | null;
  };
}

export interface WsAnnotationCreated {
  kind: 'annotation.created';
  payload: {
    taskId: string;
    by: string;
    at: number;
  };
}

export type WsEvent = WsTaskUpdated | WsTaskAssigned | WsAnnotationCreated;
