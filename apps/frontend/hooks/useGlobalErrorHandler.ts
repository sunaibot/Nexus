import { useEffect } from 'react'
import { useToast } from '../components/admin/Toast'

/**
 * 全局错误处理 Hook
 * 捕获未处理的 Promise 拒绝和全局错误
 */
export function useGlobalErrorHandler() {
  const { showToast } = useToast()

  useEffect(() => {
    // 处理未捕获的 Promise 拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未处理的 Promise 拒绝:', event.reason)
      
      // 显示错误提示
      showToast('error', '操作失败，请稍后重试')
      
      // 阻止默认处理
      event.preventDefault()
    }

    // 处理全局错误
    const handleError = (event: ErrorEvent) => {
      console.error('全局错误:', event.error)
      
      // 显示错误提示
      showToast('error', '发生错误，请刷新页面重试')
      
      // 阻止默认处理
      event.preventDefault()
    }

    // 注册事件监听器
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // 清理
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [showToast])
}

/**
 * API 错误分类
 */
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 分类 API 错误
 */
export function classifyApiError(error: any): ApiErrorType {
  if (!error) return ApiErrorType.UNKNOWN

  // 网络错误
  if (error.name === 'TypeError' && error.message?.includes('fetch')) {
    return ApiErrorType.NETWORK
  }

  // 超时错误
  if (error.name === 'AbortError') {
    return ApiErrorType.TIMEOUT
  }

  // HTTP 状态码错误
  if (error.status) {
    switch (error.status) {
      case 401:
        return ApiErrorType.UNAUTHORIZED
      case 403:
        return ApiErrorType.FORBIDDEN
      case 404:
        return ApiErrorType.NOT_FOUND
      case 422:
        return ApiErrorType.VALIDATION
      case 500:
      case 502:
      case 503:
      case 504:
        return ApiErrorType.SERVER
      default:
        return ApiErrorType.UNKNOWN
    }
  }

  return ApiErrorType.UNKNOWN
}

/**
 * 获取错误提示消息
 */
export function getErrorMessage(error: any, t?: (key: string) => string): string {
  const errorType = classifyApiError(error)
  
  const defaultMessages: Record<ApiErrorType, string> = {
    [ApiErrorType.NETWORK]: t?.('error.network') || '网络连接失败，请检查网络设置',
    [ApiErrorType.TIMEOUT]: t?.('error.timeout') || '请求超时，请稍后重试',
    [ApiErrorType.UNAUTHORIZED]: t?.('error.unauthorized') || '登录已过期，请重新登录',
    [ApiErrorType.FORBIDDEN]: t?.('error.forbidden') || '没有权限执行此操作',
    [ApiErrorType.NOT_FOUND]: t?.('error.not_found') || '请求的资源不存在',
    [ApiErrorType.VALIDATION]: t?.('error.validation') || '数据验证失败，请检查输入',
    [ApiErrorType.SERVER]: t?.('error.server') || '服务器错误，请稍后重试',
    [ApiErrorType.UNKNOWN]: t?.('error.unknown') || '发生未知错误，请稍后重试',
  }

  // 如果错误对象有自定义消息，优先使用
  if (error?.message && errorType === ApiErrorType.UNKNOWN) {
    return error.message
  }

  return defaultMessages[errorType]
}

/**
 * 处理 API 错误
 */
export function handleApiError(
  error: any,
  options: {
    showToast?: boolean
    redirectOnAuth?: boolean
    onError?: (error: any, type: ApiErrorType) => void
    t?: (key: string) => string
  } = {}
): ApiErrorType {
  const { showToast: shouldShowToast = true, redirectOnAuth = true, onError, t } = options

  const errorType = classifyApiError(error)
  const message = getErrorMessage(error, t)

  // 处理认证错误
  if (errorType === ApiErrorType.UNAUTHORIZED && redirectOnAuth) {
    // 清除登录状态
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 重定向到登录页
    window.location.href = '/login'
    return errorType
  }

  // 显示错误提示
  if (shouldShowToast) {
    // 使用全局 toast 方法（需要在组件内使用 useToast）
    const toastEvent = new CustomEvent('global:error', {
      detail: { message, type: 'error' },
    })
    window.dispatchEvent(toastEvent)
  }

  // 调用自定义错误处理器
  onError?.(error, errorType)

  return errorType
}
