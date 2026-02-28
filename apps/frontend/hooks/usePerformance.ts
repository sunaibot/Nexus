/**
 * 性能优化相关的 Hooks
 * 包括防抖、节流、虚拟列表、无限滚动等
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ========== 防抖 Hook ==========

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ========== 节流 Hook ==========

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(0)
  const timeout = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const remaining = delay - (now - lastRun.current)

      if (remaining <= 0) {
        lastRun.current = now
        callback(...args)
      } else {
        clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
          lastRun.current = Date.now()
          callback(...args)
        }, remaining)
      }
    },
    [callback, delay]
  ) as T
}

// ========== 无限滚动 Hook ==========

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
  disabled?: boolean
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 0, rootMargin = '100px', disabled = false } = options
  const observerRef = useRef<IntersectionObserver>()
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return

    const target = targetRef.current
    if (!target) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { threshold, rootMargin }
    )

    observerRef.current.observe(target)

    return () => observerRef.current?.disconnect()
  }, [onLoadMore, threshold, rootMargin, disabled])

  return targetRef
}

// ========== 虚拟列表 Hook（简化版） ==========

interface UseVirtualListOptions {
  itemHeight: number
  overscan?: number
  containerHeight: number
}

interface VirtualItem<T> {
  data: T
  index: number
  style: React.CSSProperties
}

export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
) {
  const { itemHeight, overscan = 5, containerHeight } = options
  const [scrollTop, setScrollTop] = useState(0)

  const { virtualItems, totalHeight, startIndex, endIndex } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, start - overscan)
    const endIndex = Math.min(items.length, start + visibleCount + overscan)

    const virtualItems: VirtualItem<T>[] = []
    for (let i = startIndex; i < endIndex; i++) {
      virtualItems.push({
        data: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        },
      })
    }

    return {
      virtualItems,
      totalHeight: items.length * itemHeight,
      startIndex,
      endIndex,
    }
  }, [items, scrollTop, itemHeight, overscan, containerHeight])

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    onScroll,
    containerStyle: {
      position: 'relative',
      height: containerHeight,
      overflow: 'auto',
    } as React.CSSProperties,
    listStyle: {
      position: 'relative',
      height: totalHeight,
    } as React.CSSProperties,
  }
}

// ========== 性能监控 Hook ==========

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 监听 Web Vitals
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const newMetrics: Partial<PerformanceMetrics> = {}

      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'web-vitals':
            if (entry.name === 'LCP') {
              newMetrics.lcp = entry.startTime
            } else if (entry.name === 'FID') {
              newMetrics.fid = entry.processingStart - entry.startTime
            } else if (entry.name === 'CLS') {
              newMetrics.cls = (entry as any).value
            }
            break
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              newMetrics.fcp = entry.startTime
            }
            break
          case 'navigation':
            newMetrics.ttfb = (entry as PerformanceNavigationTiming).responseStart
            break
        }
      })

      setMetrics((prev) => ({ ...prev, ...newMetrics }))
    })

    // 观察性能指标
    try {
      observer.observe({ entryTypes: ['paint', 'navigation'] })
    } catch (e) {
      console.warn('PerformanceObserver not supported')
    }

    return () => observer.disconnect()
  }, [])

  return metrics
}

// ========== 内存使用监控 Hook ==========

export function useMemoryMonitor() {
  const [memory, setMemory] = useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('memory' in performance)) return

    const updateMemory = () => {
      const memory = (performance as any).memory
      if (memory) {
        setMemory({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        })
      }
    }

    updateMemory()
    const interval = setInterval(updateMemory, 5000)

    return () => clearInterval(interval)
  }, [])

  return memory
}

// ========== RAF 节流 Hook ==========

export function useRafThrottle<T extends (...args: any[]) => any>(callback: T): T {
  const rafId = useRef<number>()
  const latestArgs = useRef<Parameters<T>>()

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      latestArgs.current = args

      if (rafId.current === undefined) {
        rafId.current = requestAnimationFrame(() => {
          if (latestArgs.current) {
            callback(...latestArgs.current)
          }
          rafId.current = undefined
        })
      }
    },
    [callback]
  )

  useEffect(() => {
    return () => {
      if (rafId.current !== undefined) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return throttled as T
}

// ========== 可见性变化 Hook ==========

export function useVisibilityChange(callback: (isVisible: boolean) => void) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      callback(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [callback])
}

// ========== 网络状态 Hook ==========

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 获取连接类型
    const connection = (navigator as any).connection
    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown')
      connection.addEventListener('change', () => {
        setConnectionType(connection.effectiveType || 'unknown')
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, connectionType }
}

// ========== 组件渲染次数监控（开发环境） ==========

export function useRenderCount(componentName: string) {
  const count = useRef(0)

  useEffect(() => {
    count.current++
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render count:`, count.current)
    }
  })

  return count.current
}
