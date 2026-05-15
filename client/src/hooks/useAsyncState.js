import { useState, useCallback } from 'react';

/**
 * Manages a shared loading/error state pair and provides an `execute`
 * wrapper that handles the setLoading/setError/try/finally boilerplate
 * common to every data-fetching hook in this project.
 *
 * Usage:
 *   const { loading, error, execute } = useAsyncState();
 *
 *   const fetchData = useCallback(() =>
 *     execute(() => api.getAll(), 'Failed to fetch data'),
 *   [execute]);
 */
export function useAsyncState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFn, fallbackMessage = 'An error occurred') => {
    setLoading(true);
    setError(null);
    try {
      return await asyncFn();
    } catch (err) {
      const message = err.message || fallbackMessage;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, execute, clearError };
}

export default useAsyncState;
