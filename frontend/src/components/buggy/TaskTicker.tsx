import React, { useEffect, useState } from "react"; 

type Task = { id: string; title: string; updatedAt: number }; 

export function TaskTicker({ apiBase }: { apiBase: string }) { 
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [selectedId, setSelectedId] = useState<string | null>(null); 
  const [tick, setTick] = useState(0); 
 
  // (A) keep a running clock for "x seconds ago" 
  useEffect(() => { 
    const id = setInterval(() => { 
      // BUG 1 FIXED: Use functional state update to avoid stale closure
      setTick((t) => t + 1); 
    }, 1000); 
    return () => clearInterval(id); 
  }, []); 
 
  // (B) refetch whenever selection changes 
  useEffect(() => { 
    // BUG 2 FIXED: Do not fetch if selectedId is null
    if (!selectedId) return;

    fetch(`${apiBase}/api/tasks/${selectedId}`) 
      .then((r) => r.json()) 
      .then((t) => { 
        setTasks((prev) => { 
          // BUG 3 FIXED: Do not mutate state directly
          // We also probably want to avoid duplicates if re-selecting the same task
          if (prev.some(existing => existing.id === t.id)) return prev;
          return [...prev, t]; 
        }); 
      }); 
  }, [selectedId, apiBase]); 
 
  // (C) newest first 
  // BUG 4 FIXED: Do not mutate the state array directly. Create a shallow copy first.
  const sorted = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt); 
 
  return ( 
    <ul> 
      {/* BUG 5 FIXED: Use unique `t.id` instead of array index `i` as key */}
      {sorted.map((t) => ( 
        <li key={t.id} onClick={() => setSelectedId(t.id)}> 
          {t.title} (updated {Math.floor((Date.now() - t.updatedAt) / 1000)}s ago) 
        </li> 
      ))} 
    </ul> 
  ); 
} 
