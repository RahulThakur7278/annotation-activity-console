import { selectFilteredAndSortedTasks } from './tasksSlice';

describe('tasksSlice Selectors', () => {
  const mockState = {
    tasks: {
      ids: ['t1', 't2', 't3'],
      entities: {
        t1: { id: 't1', title: 'A Task', type: 'image', status: 'in_progress', annotationCount: 1, updatedAt: 3000, assignee: null, meta: {} },
        t2: { id: 't2', title: 'Z Task', type: 'text', status: 'done', annotationCount: 0, updatedAt: 2000, assignee: null, meta: {} },
        t3: { id: 't3', title: 'C Task', type: 'image', status: 'todo', annotationCount: 2, updatedAt: 1000, assignee: null, meta: {} },
      },
      status: 'succeeded',
      error: null,
      total: 3,
      page: 1,
      pageSize: 20,
      isCachedData: false,
    }
  } as any;

  it('filters by type correctly', () => {
    const result = selectFilteredAndSortedTasks(mockState, 'image', 'all', 'updatedAt');
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual(['t1', 't3']);
  });

  it('filters by status correctly', () => {
    const result = selectFilteredAndSortedTasks(mockState, 'all', 'done', 'updatedAt');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t2');
  });

  it('sorts by title correctly', () => {
    const result = selectFilteredAndSortedTasks(mockState, 'all', 'all', 'title');
    expect(result.map(t => t.id)).toEqual(['t1', 't3', 't2']); // A, C, Z
  });
});
