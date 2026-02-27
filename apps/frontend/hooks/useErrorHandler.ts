import { useCallback } from 'react'
import { useToast } from '../components/admin/Toast'
import { ApiError, NetworkError } from '../lib/api-client/client'

interface ErrorHandlerOptions {
  /** 错误标题 */
  title?: string
  /** 默认错误消息 (fallback) */
  fallback?: string
  /** 默认错误消息 (alias for fallback) */
  defaultMessage?: string
  /** 是否显示 Toast */
  showToast?: boolean
  /** 是否记录到控制台 */
  logError?: boolean
  /** 自定义处理函数 */
  onError?: (error: Error) => void
}

export function useErrorHandler() {
  const { showToast } = useToast()

  return useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const {
      title,
      fallback: fallbackOption,
      defaultMessage,
      showToast: shouldShowToast = true,
      logError = true,
      onError,
    } = options
    
    const fallback = fallbackOption || defaultMessage || '操作失败'

    let message: string
    let errorType: 'api' | 'network' | 'unknown' = 'unknown'

    if (error instanceof ApiError) {
      message = error.message
      errorType = 'api'
    } else if (error instanceof NetworkError) {
      message = error.message
      errorType = 'network'
    } else if (error instanceof Error) {
      message = error.message
    } else {
      message = fallback
    }

    // 显示 Toast
    if (shouldShowToast) {
      showToast('error', title || message)
    }

    // 记录错误
    if (logError) {
      console.error('[ErrorHandler]', {
        type: errorType,
        message,
        error,
        timestamp: new Date().toISOString(),
      })
    }

    // 自定义处理
    if (error instanceof Error) {
      onError?.(error)
    }

    return { message, errorType }
  }, [showToast])
}

// 异步操作包装器
export function useAsyncHandler() {
  const handleError = useErrorHandler()
  const { showToast } = useToast()

  return useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options: ErrorHandlerOptions & {
        onSuccess?: (data: T) => void
        successMessage?: string
      } = {}
    ): Promise<T | null> => {
      const { onSuccess, successMessage, ...errorOptions } = options

      try {
        const result = await asyncFn()
        onSuccess?.(result)
        if (successMessage) {
          showToast('success', successMessage)
        }
        return result
      } catch (error) {
        handleError(error, errorOptions)
        return null
      }
    },
    [handleError, showToast]
  )
}
