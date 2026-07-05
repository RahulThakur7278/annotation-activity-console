import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../lib/features/tasks/tasksSlice';
import { TaskList } from './TaskList';

function renderWithStore(ui: React.ReactElement, preloadedState: any) {
  const store = configureStore({
    reducer: { tasks: tasksReducer },
    preloadedState,
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('TaskList Component', () => {
  const mockTasksState = {
    tasks: {
      ids: ['t1', 't2'],
      entities: {
        t1: { id: 't1', title: 'Test Task 1', type: 'image', status: 'in_progress', annotationCount: 1, updatedAt: 1000, assignee: null, meta: {} },
        t2: { id: 't2', title: 'Test Task 2', type: 'text', status: 'done', annotationCount: 0, updatedAt: 2000, assignee: null, meta: {} },
      },
      status: 'succeeded',
      error: null,
      total: 2,
      page: 1,
      pageSize: 20,
      isCachedData: false,
    }
  };

  it('renders tasks and filters them correctly', () => {
    const handleSelect = jest.fn();
    renderWithStore(<TaskList selectedId={null} onSelect={handleSelect} />, mockTasksState);

    // Initial render shows both tasks
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();

    // Filter by type "image"
    const typeDropdown = screen.getAllByRole('combobox')[0];
    fireEvent.change(typeDropdown, { target: { value: 'image' } });

    // Task 1 should remain, Task 2 should disappear
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
  });
});
