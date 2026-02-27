/**
 * 统一异步操作 Hook
 * 解决重复代码问题：加载状态、错误处理、数据管理
 * 
 * 改进点：
 * 1. 统一处理 loading、error、data 状态
 * 2. 支持自动执行和手动执行
 * 3. 支持防抖和节流
 * 4. 自动处理内存泄漏
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface UseAsyncOptions<T> {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始数据 */
  initialData?: T
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 依赖项数组，变化时重新执行 */
  deps?: React.DependencyList
  /** 防抖延迟（毫秒） */
  debounceMs?: number
  /** 节流延迟（毫秒） */
  throttleMs?: number
}

export interface UseAsyncReturn<T, P extends any[] = any[]> {
  /** 数据 */
  data: T | undefined
  /** 加载状态 */
  isLoading: boolean
  /** 错误信息 */
  error: Error | null
  /** 执行函数 */
  execute: (...params: P) => Promise<T | undefined>
  /** 重置状态 */
  reset: () => void
  /** 手动设置数据 */
  setData: (data: T | ((prev: T | undefined) => T)) => void
}

/**
 * 统一的异步操作 Hook
 * 
 * @example
 * // 自动执行
 * const { data, isLoading, error } = useAsync(fetchUserData, { immediate: true })
 * 
 * @example
 * // 手动执行
 * const { data, isLoading, error, execute } = useAsync(createUser)
 * const handleSubmit = async (values) => {
 *   const newUser = await execute(values)
 * }
 * 
 * @example
 * // 带依赖的自动执行
 * const { data } = useAsync(() => fetchBookmarks(page), {
 *   immediate: true,
 *   deps: [page]
 * })
 */
export function useAsync<T, P extends any[] = any[]>(
  asyncFunction: (...params: P) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, P> {
  const {
    immediate = false,
    initialData,
    onSuccess,
    onError,
    deps = [],
    debounceMs,
    throttleMs,
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 用于取消过期的异步操作
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastExecuteTimeRef = useRef<number>(0)

  // 清理函数
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const execute = useCallback(
    async (...params: P): Promise<T | undefined> => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // 防抖处理
      if (debounceMs && timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 节流处理
      if (throttleMs) {
        const now = Date.now()
        if (now - lastExecuteTimeRef.current < throttleMs) {
          return undefined
        }
        lastExecuteTimeRef.current = now
      }

      const doExecute = async (): Promise<T | undefined> => {
        setIsLoading(true)
        setError(null)

        try {
          const result = await asyncFunction(...params)
          
          if (isMountedRef.current) {
            setData(result)
            onSuccess?.(result)
          }
          
          return result
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          
          if (isMountedRef.current) {
            setError(error)
            onError?.(error)
          }
          
          throw error
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false)
          }
        }
      }

      if (debounceMs) {
        return new Promise((resolve, reject) => {
          timeoutRef.current = setTimeout(async () => {
            try {
              const result = await doExecute()
              resolve(result)
            } catch (err) {
              reject(err)
            }
          }, debounceMs)
        })
      }

      return doExecute()
    },
    [asyncFunction, debounceMs, throttleMs, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setIsLoading(false)
    setError(null)
  }, [initialData])

  // 自动执行
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as P))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    setData,
  }
}

/**
 * 分页查询 Hook
 * 专门用于分页数据的获取和管理
 */
export interface UsePaginationOptions<T> extends Omit<UseAsyncOptions<PaginatedData<T>>, 'immediate' | 'deps'> {
  pageSize?: number
  defaultPage?: number
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface UsePaginationReturn<T> extends Omit<UseAsyncReturn<PaginatedData<T>, [number]>, 'data' | 'setData'> {
  items: T[]
  pagination: PaginatedData<T>['pagination']
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  hasMore: boolean
  refresh: () => void
}

export function usePagination<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<PaginatedData<T>>,
  options: UsePaginationOptions<T> = {}
): UsePaginationReturn<T> {
  const { pageSize: initialPageSize = 20, defaultPage = 1, ...asyncOptions } = options

  const [page, setPage] = useState(defaultPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const {
    data,
    isLoading,
    error,
    execute,
    reset,
  } = useAsync<PaginatedData<T>, [number]>(
    (p) => fetchFunction(p, pageSize),
    {
      ...asyncOptions,
      immediate: true,
      deps: [page, pageSize],
    }
  )

  const refresh = useCallback(() => {
    execute(page)
  }, [execute, page])

  return {
    items: data?.items || [],
    pagination: data?.pagination || {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
    page,
    setPage,
    pageSize,
    setPageSize,
    hasMore: data?.pagination?.hasMore || false,
    isLoading,
    error,
    execute,
    reset,
    refresh,
  }
}

/**
 * 乐观更新 Hook
 * 用于需要乐观更新的操作
 */
export interface UseOptimisticOptions<T> {
  onError?: (error: Error, rollback: () => void) => void
}

export function useOptimistic<T>(
  currentData: T,
  setData: (data: T) => void
) {
  const rollbackRef = useRef<T | null>(null)

  const executeOptimistic = useCallback(
    async (
      optimisticData: T,
      asyncFunction: () => Promise<T>,
      options: UseOptimisticOptions<T> = {}
    ): Promise<T> => {
      // 保存回滚数据
      rollbackRef.current = currentData
      
      // 乐观更新
      setData(optimisticData)

      try {
        const result = await asyncFunction()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        
        // 回滚
        if (rollbackRef.current !== null) {
          setData(rollbackRef.current)
          options.onError?.(error, () => setData(rollbackRef.current!))
        }
        
        throw error
      }
    },
    [currentData, setData]
  )

  return { executeOptimistic }
}

export default useAsync
