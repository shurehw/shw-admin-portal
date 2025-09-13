import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debounced fetch with AbortController
 */
export function useDebouncedFetch() {
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchWithCancel = useCallback(async (
    url: string,
    options?: RequestInit
  ) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was cancelled, this is expected
        return null
      }
      throw error
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return { fetchWithCancel }
}

/**
 * Combined hook for debounced search with cancellation
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const debouncedQuery = useDebounce(query, delay)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null)
      return
    }

    const performSearch = async () => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new controller
      abortControllerRef.current = new AbortController()
      
      setLoading(true)
      setError(null)

      try {
        const data = await searchFn(debouncedQuery)
        setResults(data)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err as Error)
        }
      } finally {
        setLoading(false)
      }
    }

    performSearch()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedQuery, searchFn])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    debouncedQuery
  }
}