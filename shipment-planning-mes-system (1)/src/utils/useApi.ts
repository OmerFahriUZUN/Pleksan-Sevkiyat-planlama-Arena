import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../services';

/**
 * Custom hook for API calls with loading, error, and data states
 * @example
 * const { data, loading, error, refetch } = useApi(
 *   () => shipmentPlansAPI.getAll(),
 *   [dependencies]
 * );
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook for paginated API calls
 * @example
 * const { items, page, nextPage, prevPage, loading } = usePaginatedApi(
 *   (pageNum) => shipmentPlansAPI.getAll(), // assumes backend pagination
 *   10 // itemsPerPage
 * );
 */
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<T[]>,
  itemsPerPage = 10
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const result = await apiCall(page, itemsPerPage);
        setItems(result);
        setHasMore(result.length === itemsPerPage);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [page]);

  return {
    items,
    page,
    hasMore,
    loading,
    error,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    goToPage: (pageNum: number) => setPage(pageNum),
  };
}

/**
 * Custom hook for async API calls (mutations like create, update, delete)
 * @example
 * const { execute, loading, error, success } = useApiMutation(
 *   (data) => shipmentPlansAPI.create(data)
 * );
 * 
 * const handleCreate = async () => {
 *   const result = await execute(newPlanData);
 *   if (result) { // success
 *     // do something
 *   }
 * };
 */
export function useApiMutation<T, R>(
  apiCall: (params: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<R | null>(null);

  const execute = useCallback(async (params: T): Promise<R | null> => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const result = await apiCall(params);
      setData(result);
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setLoading(false);
    setError('');
    setSuccess(false);
    setData(null);
  }, []);

  return { execute, loading, error, success, data, reset };
}

/**
 * Hook for debounced API search
 * @example
 * const { results, loading, error } = useApiSearch(
 *   (query) => customersAPI.search(query),
 *   500 // debounce ms
 * );
 * 
 * <input onChange={(e) => setSearchQuery(e.target.value)} />
 */
export function useApiSearch<T>(
  apiCall: (query: string) => Promise<T[]>,
  debounceMs = 500
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiCall(query);
        setResults(data);
      } catch (err) {
        setError(handleApiError(err));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { query, setQuery, results, loading, error };
}
