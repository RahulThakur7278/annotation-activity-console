import { createSlice, createEntityAdapter, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskType, PaginatedResponse, WsTaskUpdated, WsTaskAssigned, WsAnnotationCreated } from '../../types';
import { normalizeTask, normalizeStatus, normalizeTimestamp } from '../../normalize';
import localforage from 'localforage';
import { RootState } from '../../store';

export const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => b.updatedAt - a.updatedAt,
});

export interface TasksState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  isCachedData: boolean;
}

const initialState = tasksAdapter.getInitialState<TasksState>({
  status: 'idle',
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
  isCachedData: false,
});

const CACHE_KEY = 'tasks_cache';

// Load from cache first
export const loadTasksFromCache = createAsyncThunk(
  'tasks/loadFromCache',
  async () => {
    const cached = await localforage.getItem<Task[]>(CACHE_KEY);
    return cached || [];
  }
);

// Fetch from API
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tasks?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data: PaginatedResponse<unknown> = await response.json();

      const normalizedTasks = data.items
        .map(normalizeTask)
        .filter((t): t is Task => t !== null);

      // Save to cache
      if (page === 1) {
        await localforage.setItem(CACHE_KEY, normalizedTasks);
      }

      return {
        items: normalizedTasks,
        total: data.total,
        page,
        pageSize,
      };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Unknown error');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Real-time event handlers
    handleTaskUpdated(state, action: PayloadAction<WsTaskUpdated['payload']>) {
      const existingTask = state.entities[action.payload.id];
      if (existingTask) {
        existingTask.status = normalizeStatus(action.payload.status);
        existingTask.updatedAt = normalizeTimestamp(action.payload.updatedAt);
      } else {
        // We received an update for a task not currently loaded.
        // Option 1: ignore it since we don't have the full payload to display
        // Option 2: fetch it or store a stub.
        // We will document that we ignore it because a partial task breaks the domain model (missing title, type, etc).
      }
    },
    handleTaskAssigned(state, action: PayloadAction<WsTaskAssigned['payload']>) {
      const existingTask = state.entities[action.payload.id];
      if (existingTask) {
        existingTask.assignee = action.payload.assignee;
      }
    },
    handleAnnotationCreated(state, action: PayloadAction<WsAnnotationCreated['payload']>) {
      const existingTask = state.entities[action.payload.taskId];
      if (existingTask) {
        existingTask.annotationCount += 1;
        existingTask.updatedAt = Math.max(existingTask.updatedAt, normalizeTimestamp(action.payload.at));
      }
    },
    // Filter/Sort configuration can be handled in local component state to keep Redux pure for entity storage,
    // or we can store filter criteria here. Let's rely on component state for filters, and use selectors.
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTasksFromCache.fulfilled, (state, action) => {
        if (state.status === 'idle') {
          tasksAdapter.setAll(state, action.payload);
          state.isCachedData = action.payload.length > 0;
        }
      })
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isCachedData = false;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        // If it's page 1, replace. Otherwise upsert.
        if (action.payload.page === 1) {
          tasksAdapter.setAll(state, action.payload.items);
        } else {
          tasksAdapter.upsertMany(state, action.payload.items);
        }
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { handleTaskUpdated, handleTaskAssigned, handleAnnotationCreated } = tasksSlice.actions;

export default tasksSlice.reducer;

// Selectors
export const {
  selectAll: selectAllTasks,
  selectById: selectTaskById,
  selectIds: selectTaskIds,
} = tasksAdapter.getSelectors<RootState>((state) => state.tasks);

// Memoized selector for filtered/sorted view
export const selectFilteredAndSortedTasks = createSelector(
  [
    selectAllTasks,
    (state: RootState, filterType: TaskType | 'all') => filterType,
    (state: RootState, filterType: TaskType | 'all', filterStatus: TaskStatus | 'all') => filterStatus,
    (state: RootState, filterType: TaskType | 'all', filterStatus: TaskStatus | 'all', sortField: 'updatedAt' | 'title') => sortField,
  ],
  (tasks, filterType, filterStatus, sortField) => {
    let result = tasks;

    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Sort by updated time (descending) as primary or secondary, plus one more
    return result.sort((a, b) => {
      if (sortField === 'title') {
        const titleCompare = a.title.localeCompare(b.title);
        if (titleCompare !== 0) return titleCompare;
        return b.updatedAt - a.updatedAt; // fallback to updatedAt
      }
      return b.updatedAt - a.updatedAt;
    });
  }
);
