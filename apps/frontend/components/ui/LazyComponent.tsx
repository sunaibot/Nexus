/**
 * 组件懒加载工具
 * 支持 React.lazy、预加载、错误边界、加载状态
 */

import React, { 
  Suspense, 
  lazy, 
  ComponentType, 
  useState, 
  useEffect,
  useCallback,
  useRef
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

// 加载状态组件接口
interface LoadingProps {
  className?: string
  minHeight?: string | number
}

// 错误状态组件接口
interface ErrorProps {
  error: Error
  onRetry?: () => void
  className?: string
}

// 默认加载组件
const DefaultLoadingComponent: React.FC<LoadingProps> = ({ 
  className, 
  minHeight = '200px' 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={cn(
      'flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 rounded-lg',
      className
    )}
    style={{ minHeight }}
  >
    <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
  </motion.div>
)

// 默认错误组件
const DefaultErrorComponent: React.FC<ErrorProps> = ({ 
  error, 
  onRetry, 
  className 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg',
      className
    )}
  >
    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
    <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
      {error.message || '加载组件失败'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
      >
        重试
      </button>
    )}
  </motion.div>
)

// 懒加载组件配置
interface LazyComponentOptions {
  loading?: ComponentType<LoadingProps>
  error?: ComponentType<ErrorProps>
  minHeight?: string | number
  delay?: number // 延迟加载时间（用于低优先级组件）
  prefetch?: boolean // 是否预加载
}

/**
 * 创建懒加载组件
 */
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): React.FC<React.ComponentProps<T>> & { prefetch?: () => Promise<unknown> } {
  const {
    loading: LoadingComponent = DefaultLoadingComponent,
    error: ErrorComponent = DefaultErrorComponent,
    minHeight = '200px',
    delay = 0,
    prefetch = false,
  } = options

  const LazyComponent = lazy(factory)

  const ComponentWithLazy: React.FC<React.ComponentProps<T>> & { prefetch?: () => Promise<unknown> } = (props) => {
    const [shouldLoad, setShouldLoad] = useState(!delay)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldLoad(true), delay)
        return () => clearTimeout(timer)
      }
    }, [delay])

    const handleRetry = useCallback(() => {
      setError(null)
      setShouldLoad(false)
      setTimeout(() => setShouldLoad(true), 100)
    }, [])

    if (!shouldLoad) {
      return <LoadingComponent minHeight={minHeight} />
    }

    if (error) {
      return <ErrorComponent error={error} onRetry={handleRetry} />
    }

    return (
      <Suspense fallback={<LoadingComponent minHeight={minHeight} />}>
        <ErrorBoundary onError={setError}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    )
  }

  ComponentWithLazy.displayName = `Lazy(${(factory as any).name || 'Component'})`

  // 预加载功能
  if (prefetch) {
    ComponentWithLazy.prefetch = factory
  }

  return ComponentWithLazy
}

/**
 * 错误边界组件
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

/**
 * 可视区域懒加载组件
 * 只有当组件进入视口才加载
 */
interface InViewLazyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

export function InViewLazy({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0,
  triggerOnce = true,
}: InViewLazyProps) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, threshold, triggerOnce])

  return (
    <div ref={ref}>
      <AnimatePresence mode="wait">
        {isInView ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {fallback || <DefaultLoadingComponent />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * 预加载组件
 */
const prefetchCache = new Set<string>()

export function prefetchComponent(factory: () => Promise<unknown>): void {
  const key = factory.toString()
  if (prefetchCache.has(key)) return
  
  prefetchCache.add(key)
  
  // 使用 requestIdleCallback 在空闲时预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      factory()
    })
  } else {
    setTimeout(factory, 1)
  }
}

/**
 * 使用预加载的 Hook
 */
export function usePrefetch(factory: () => Promise<unknown>) {
  useEffect(() => {
    prefetchComponent(factory)
  }, [factory])
}

// 导出类型
export type { LazyComponentOptions, LoadingProps, ErrorProps }
