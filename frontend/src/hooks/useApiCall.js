import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for handling API calls with automatic cleanup and race condition prevention
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApiCall = (apiFunction, options = {}) => {
  const {
    onSuccess,
    onError,
    showErrorToast = true,
    immediate = false,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute the API call
  const execute = useCallback(async (...args) => {
    // Cleanup any previous request
    cleanup();

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      // Pass abort signal to API function
      const result = await apiFunction(...args, {
        signal: abortControllerRef.current.signal,
      });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
        if (onSuccess) {
          onSuccess(result);
        }
      }

      return result;
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }

      // Only handle error if component is still mounted
      if (isMountedRef.current) {
        setError(err);
        
        if (showErrorToast) {
          toast.error(err.response?.data?.message || err.message || 'Xatolik yuz berdi');
        }
        
        if (onError) {
          onError(err);
        }
      }
      
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, cleanup, onSuccess, onError, showErrorToast]);

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Hook for debounced API calls
 * @param {Function} apiFunction - The API function to call
 * @param {number} delay - Debounce delay in milliseconds
 * @param {Object} options - Additional options
 */
export const useDebouncedApiCall = (apiFunction, delay = 500, options = {}) => {
  const timeoutRef = useRef(null);
  const apiCall = useApiCall(apiFunction, { ...options, immediate: false });

  const debouncedExecute = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      apiCall.execute(...args);
    }, delay);
  }, [apiCall.execute, delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...apiCall,
    execute: debouncedExecute,
  };
};

export default useApiCall;