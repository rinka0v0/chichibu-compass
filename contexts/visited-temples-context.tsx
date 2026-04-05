import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'visited_temples';

type VisitedTemplesContextType = {
  visitedIds: Set<number>;
  toggle: (id: number) => void;
  isVisited: (id: number) => boolean;
  count: number;
};

const VisitedTemplesContext = createContext<VisitedTemplesContextType | null>(null);

export function VisitedTemplesProvider({ children }: { children: React.ReactNode }) {
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const ids: number[] = JSON.parse(raw);
        setVisitedIds(new Set(ids));
      }
    });
  }, []);

  const toggle = useCallback((id: number) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isVisited = useCallback((id: number) => visitedIds.has(id), [visitedIds]);

  return (
    <VisitedTemplesContext.Provider value={{ visitedIds, toggle, isVisited, count: visitedIds.size }}>
      {children}
    </VisitedTemplesContext.Provider>
  );
}

export function useVisitedTemples() {
  const ctx = useContext(VisitedTemplesContext);
  if (!ctx) throw new Error('useVisitedTemples must be used within VisitedTemplesProvider');
  return ctx;
}
