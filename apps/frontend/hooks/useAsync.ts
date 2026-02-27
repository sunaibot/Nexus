import { useState, useCallback, useRef, useEffect } from 'react'

export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

export interface UseAsyncReturn<T, P extends unknown[]> extends AsyncState<T> {
  execute: (...params: P) => Promise<T | null>
  reset: () => void
  setData: (data: T) => void
}

interface UseAsyncOptions<T, P extends unknown[]> {
  immediate?: boolean
  initialParams?: P
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useAsync<T, P extends unknown[] = unknown[]>(
  asyncFn: (...params: P) => Promise<T>,
  options: UseAsyncOptions<T, P> = {}
): UseAsyncReturn<T, P> {
  const { immediate, initialParams, onSuccess, onError } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await asyncFn(...params)
        if (isMounted.current) {
          setState({ data, isLoading: false, error: null })
          onSuccess?.(data)
        }
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : '操作失败'
        if (isMounted.current) {
          setState({ data: null, isLoading: false, error: message })
          onError?.(error as Error)
        }
        return null
      }
    },
    [asyncFn, onSuccess, onError]
  )

  useEffect(() => {
    if (immediate && initialParams) {
      execute(...initialParams)
    }
  }, [immediate, execute, initialParams])

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null })
  }, [])

  const setData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  return { ...state, execute, reset, setData }
}

export function useAsyncFn<T, P extends unknown[] = unknown[]>(
  asyncFn: (...params: P) => Promise<T>,
  options: Omit<UseAsyncOptions<T, P>, 'immediate' | 'initialParams'> = {}
): UseAsyncReturn<T, P> {
  return useAsync(asyncFn, options)
}

export function useAsyncImmediate<T, P extends unknown[] = unknown[]>(
  asyncFn: (...params: P) => Promise<T>,
  initialParams: P,
  options: Omit<UseAsyncOptions<T, P>, 'immediate' | 'initialParams'> = {}
): UseAsyncReturn<T, P> {
  return useAsync(asyncFn, { ...options, immediate: true, initialParams })
}
