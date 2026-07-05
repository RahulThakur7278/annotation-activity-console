import { Task, TaskStatus, TaskType } from './types';

/**
 * Normalizes a messy status string into our clean TaskStatus enum.
 * - 'in_progress', 'InProgress' -> 'in_progress'
 * - 'QA', 'qa' -> 'qa'
 * - 'BLOCKED', 'blocked' -> 'blocked'
 * - Unknown ones fallback to 'todo' or a default if we want, but let's map unknown to 'todo'.
 */
export function normalizeStatus(rawStatus: unknown): TaskStatus {
  if (typeof rawStatus !== 'string') return 'todo';
  const s = rawStatus.toLowerCase().trim();
  if (s === 'inprogress' || s === 'in_progress') return 'in_progress';
  if (s === 'done') return 'done';
  if (s === 'qa') return 'qa';
  if (s === 'blocked') return 'blocked';
  if (s === 'todo') return 'todo';
  
  // Graceful fallback for unexpected values
  return 'todo'; 
}

export function normalizeType(rawType: unknown): { type: TaskType, originalType?: string } {
  if (typeof rawType !== 'string') return { type: 'unknown', originalType: String(rawType) };
  const t = rawType.toLowerCase().trim();
  if (t === 'image' || t === 'audio' || t === 'text') {
    return { type: t as TaskType };
  }
  return { type: 'unknown', originalType: rawType };
}

export function normalizeTimestamp(rawDate: unknown): number {
  if (typeof rawDate === 'number') return rawDate;
  if (typeof rawDate === 'string') {
    const parsed = new Date(rawDate).getTime();
    if (!isNaN(parsed)) return parsed;
    // maybe it's a stringified epoch
    const parsedNum = parseInt(rawDate, 10);
    if (!isNaN(parsedNum)) return parsedNum;
  }
  // Fallback to current time if completely missing or unparseable
  return Date.now();
}

export function normalizeAnnotationCount(rawCount: unknown): number {
  if (typeof rawCount === 'number') return Math.max(0, rawCount);
  if (typeof rawCount === 'string') {
    const parsed = parseInt(rawCount, 10);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }
  return 0; // Default
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTask(raw: any): Task | null {
  if (!raw || typeof raw !== 'object' || !raw.id || typeof raw.id !== 'string') {
    // If we don't even have an ID, we cannot meaningfully store or track this task.
    // Documented decision: silently drop tasks without a valid string ID.
    return null;
  }

  const { type, originalType } = normalizeType(raw.type);
  const status = normalizeStatus(raw.status);
  const annotationCount = normalizeAnnotationCount(raw.annotationCount);
  const updatedAt = normalizeTimestamp(raw.updatedAt);

  // Safely grab assignee
  let assignee = null;
  if (raw.assignee && typeof raw.assignee === 'object' && raw.assignee.id && typeof raw.assignee.name === 'string') {
    assignee = {
      id: String(raw.assignee.id),
      name: String(raw.assignee.name),
    };
  }

  // Safely grab meta
  let meta: Record<string, unknown> = {};
  if (raw.meta && typeof raw.meta === 'object' && !Array.isArray(raw.meta)) {
    meta = { ...raw.meta };
  }

  const base = {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : 'Untitled Task',
    status,
    assignee,
    annotationCount,
    updatedAt,
    meta,
  };

  if (type === 'unknown') {
    return { ...base, type, originalType: originalType || 'unknown' } as Task;
  }

  return { ...base, type } as Task;
}
