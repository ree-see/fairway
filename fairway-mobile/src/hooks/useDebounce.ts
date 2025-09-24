import { useEffect, useState } from 'react';

/**
 * Custom hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced search functionality
 * @param searchFunction - The async search function to call
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns Object containing search state and functions
 */
export function useDebouncedSearch<TResult>(
  searchFunction: (query: string) => Promise<TResult>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    const performSearch = async () => {
      try {
        setIsSearching(true);
        setError(null);
        const searchResults = await searchFunction(debouncedQuery);
        setResults(searchResults);
      } catch (err: any) {
        setError(err.message || 'Search failed');
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchFunction]);

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
  };
}