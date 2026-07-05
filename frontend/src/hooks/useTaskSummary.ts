import { useState, useEffect } from 'react';

export function useTaskSummary(taskId: string | null) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setSummary('');
      setError(null);
      return;
    }

    setSummary('');
    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();

    async function fetchStream() {
      try {
        const response = await fetch(`http://localhost:4000/api/tasks/${taskId}/summary`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }

        if (!response.body) {
          throw new Error('ReadableStream not yet supported in this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Basic SSE parsing
          // lines are separated by \n
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the incomplete line in the buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '');
              if (dataStr === 'end') {
                // Done
                break;
              }
              try {
                const chunk = JSON.parse(dataStr);
                setSummary((prev) => prev + chunk);
              } catch (e) {
                console.error('Failed to parse SSE chunk', e);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            console.log('Stream aborted');
          } else {
            setError(err.message);
          }
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchStream();

    return () => {
      abortController.abort();
    };
  }, [taskId]);

  return { summary, isLoading, error };
}
