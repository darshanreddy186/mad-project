import { useCallback, useEffect, useRef, useState } from 'react';
import { searchShops } from '@/api/shops';
import { DISTANCE_UNIT } from '@/constants/config';
import { getErrorMessage } from '@/lib/errors';
import { unitToKm } from '@/lib/geo';
import { useAppStore } from '@/store/useAppStore';
import { useLocationStore } from '@/store/useLocationStore';
import type { Shop } from '@/types';
import { useDebounce } from './useDebounce';

/**
 * Runs the shared discovery query (search text + filters + location) with
 * pagination. Used by the search list and the map.
 */
export function useShopSearch({ pageSize = 20 }: { pageSize?: number } = {}) {
  const coords = useLocationStore((s) => s.coords);
  const hydrated = useLocationStore((s) => s.hydrated);
  const filters = useAppStore((s) => s.filters);
  const query = useDebounce(useAppStore((s) => s.searchQuery), 350);

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    (offset: number) =>
      searchShops({
        coords,
        radiusKm: coords && filters.maxDistance ? unitToKm(filters.maxDistance, DISTANCE_UNIT) : null,
        query,
        categories: filters.categories,
        minRating: filters.minRating,
        maxPriceLevel: filters.maxPriceLevel,
        sortBy: filters.sortBy,
        limit: pageSize,
        offset,
      }),
    [coords, filters, query, pageSize]
  );

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      try {
        const page = await fetchPage(0);
        if (id !== requestId.current) return;
        setShops(page);
        setHasMore(page.length === pageSize);
        setError(null);
      } catch (err) {
        if (id === requestId.current) setError(getErrorMessage(err));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchPage, pageSize]
  );

  useEffect(() => {
    if (hydrated) load('initial');
  }, [hydrated, load]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchPage(shops.length);
      if (id !== requestId.current) return;
      setShops((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        return [...prev, ...page.filter((s) => !seen.has(s.id))];
      });
      setHasMore(page.length === pageSize);
    } catch (err) {
      if (id === requestId.current) setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, fetchPage, shops.length, pageSize]);

  return {
    shops,
    loading: loading || !hydrated,
    loadingMore,
    refreshing,
    hasMore,
    error,
    hasLocation: Boolean(coords),
    refresh: () => load('refresh'),
    retry: () => load('initial'),
    loadMore,
  };
}
