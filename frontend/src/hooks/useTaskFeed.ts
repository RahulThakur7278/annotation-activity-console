import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../lib/hooks';
import { handleTaskUpdated, handleTaskAssigned, handleAnnotationCreated } from '../lib/features/tasks/tasksSlice';
import { WsEvent } from '../lib/types';

export function useTaskFeed(url: string = 'ws://localhost:4000/ws') {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsEvent;
          switch (data.kind) {
            case 'task.updated':
              dispatch(handleTaskUpdated(data.payload));
              break;
            case 'task.assigned':
              dispatch(handleTaskAssigned(data.payload));
              break;
            case 'annotation.created':
              dispatch(handleAnnotationCreated(data.payload));
              break;
            default:
              // Ignore unknown event kinds
              break;
          }
        } catch (err) {
          console.error('Failed to parse websocket message', err);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
          // Reconnect with backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        // Close event will handle reconnection
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, dispatch]);

  return { isConnected };
}
