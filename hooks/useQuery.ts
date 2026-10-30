import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/errors';

interface QueryOptions {
  /** Skip fetching until true (e.g. waiting for a session or id). */
  enabled?: boolean;
  /** Silently refetch when the screen regains focus. */
  refetchOnFocus?: boolean;
}

export interface QueryResult<T> {
  data: T | undefined;
  error: string | null;
  /** True during the first load only. */
  loading: boolean;
  /** True during pull-to-refresh. */
  refreshing: boolean;
  /** Pull-to-refresh: shows the refresh indicator. */
  refresh: () => Promise<void>;
  /** Background refetch without loading indicators. */
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * Minimal async data hook: loading/error/refresh state, stale-response
 * protection, and optional refetch-on-focus so lists update after editing.
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  { enabled = true, refetchOnFocus = false }: QueryOptions = {}
): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);
  const loadedOnce = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    const id = ++requestId.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const result = await fetcherRef.current();
      if (!mounted.current || id !== requestId.current) return;
      setData(result);
      setError(null);
      loadedOnce.current = true;
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    run(loadedOnce.current ? 'silent' : 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && enabled && loadedOnce.current) run('silent');
    }, [refetchOnFocus, enabled, run])
  );

  const refresh = useCallback(() => run('refresh'), [run]);
  const refetch = useCallback(() => run('silent'), [run]);

  return { data, error, loading, refreshing, refresh, refetch, setData };
}
