import { normalizeTask, normalizeStatus, normalizeType } from './normalize';

describe('normalizer', () => {
  it('should handle messy statuses correctly', () => {
    expect(normalizeStatus('InProgress')).toBe('in_progress');
    expect(normalizeStatus('in_progress')).toBe('in_progress');
    expect(normalizeStatus('QA')).toBe('qa');
    expect(normalizeStatus('BLOCKED')).toBe('blocked');
    expect(normalizeStatus('unknown_status_garbage')).toBe('todo');
    expect(normalizeStatus(null)).toBe('todo');
  });

  it('should handle messy types', () => {
    expect(normalizeType('image')).toEqual({ type: 'image' });
    expect(normalizeType('audio')).toEqual({ type: 'audio' });
    expect(normalizeType('video')).toEqual({ type: 'unknown', originalType: 'video' });
    expect(normalizeType(123)).toEqual({ type: 'unknown', originalType: '123' });
  });

  it('should drop tasks without IDs', () => {
    expect(normalizeTask({})).toBeNull();
    expect(normalizeTask({ title: 'test' })).toBeNull();
    expect(normalizeTask(null)).toBeNull();
  });

  it('should normalize a full messy task correctly', () => {
    const raw = {
      id: 't1',
      title: 123, // bad title type
      type: 'video', // unknown type
      status: 'InProgress',
      assignee: null,
      annotationCount: '3', // string instead of number
      updatedAt: '2023-01-01T00:00:00Z', // ISO string
      meta: { foo: 'bar' }
    };

    const clean = normalizeTask(raw);
    expect(clean).not.toBeNull();
    if (clean) {
      expect(clean.id).toBe('t1');
      expect(clean.title).toBe('Untitled Task'); // Should fallback for bad title
      expect(clean.type).toBe('unknown');
      expect(clean.status).toBe('in_progress');
      expect(clean.annotationCount).toBe(3);
      expect(clean.updatedAt).toBe(1672531200000);
      expect(clean.meta).toEqual({ foo: 'bar' });
    }
  });
});
