/**
 * 统一错误处理系统
 * 解决重复代码问题：统一的错误处理和用户提示
 * 
 * 改进点：
 * 1. 统一的错误分类和处理策略
 * 2. 自动错误上报
 * 3. 用户友好的错误提示
 * 4. 错误边界组件
 */

import { useState, useCallback } from 'react'

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
  BUSINESS = 'BUSINESS',
}

// 错误严重级别
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// 应用错误类
export class AppError extends Error {
  public type: ErrorType
  public severity: ErrorSeverity
  public code?: string
  public details?: Record<string, any>
  public timestamp: number

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options: {
      severity?: ErrorSeverity
      code?: string
      details?: Record<string, any>
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = options.severity || ErrorSeverity.ERROR
    this.code = options.code
    this.details = options.details
    this.timestamp = Date.now()
  }
}

// HTTP 状态码映射到错误类型
export function mapHttpStatusToErrorType(status: number): ErrorType {
  switch (status) {
    case 401:
    case 403:
      return ErrorType.AUTH
    case 404:
      return ErrorType.NOT_FOUND
    case 422:
      return ErrorType.VALIDATION
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER
    default:
      if (status >= 400 && status < 500) {
        return ErrorType.BUSINESS
      }
      return ErrorType.UNKNOWN
  }
}

// 错误消息映射
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查网络设置',
  [ErrorType.AUTH]: '登录已过期，请重新登录',
  [ErrorType.VALIDATION]: '输入数据有误，请检查后重试',
  [ErrorType.NOT_FOUND]: '请求的资源不存在',
  [ErrorType.SERVER]: '服务器内部错误，请稍后重试',
  [ErrorType.UNKNOWN]: '发生未知错误，请稍后重试',
  [ErrorType.BUSINESS]: '操作失败，请稍后重试',
}

// 获取用户友好的错误消息
export function getUserFriendlyMessage(error: Error | AppError | unknown): string {
  if (error instanceof AppError) {
    return error.message || errorMessages[error.type]
  }
  
  if (error instanceof Error) {
    // 网络错误
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return errorMessages[ErrorType.NETWORK]
    }
    return error.message
  }
  
  return errorMessages[ErrorType.UNKNOWN]
}

// 错误处理器接口
export interface ErrorHandler {
  handle(error: Error | AppError | unknown, context?: string): void
  report(error: Error | AppError | unknown, context?: string): void
}

// 控制台错误处理器
export class ConsoleErrorHandler implements ErrorHandler {
  handle(error: Error | AppError | unknown, context?: string): void {
    const appError = this.normalizeError(error)
    
    console.group(`[Error] ${context || 'Unhandled Error'}`)
    console.error('Message:', appError.message)
    console.error('Type:', appError.type)
    console.error('Severity:', appError.severity)
    if (appError.code) console.error('Code:', appError.code)
    if (appError.details) console.error('Details:', appError.details)
    if (appError.stack) console.error('Stack:', appError.stack)
    console.groupEnd()
  }

  report(error: Error | AppError | unknown, context?: string): void {
    this.handle(error, context)
  }

  private normalizeError(error: Error | AppError | unknown): AppError {
    if (error instanceof AppError) {
      return error
    }
    
    if (error instanceof Error) {
      return new AppError(error.message, ErrorType.UNKNOWN, { cause: error })
    }
    
    return new AppError(String(error), ErrorType.UNKNOWN)
  }
}

// 全局错误处理器实例
let globalErrorHandler: ErrorHandler = new ConsoleErrorHandler()

export function setGlobalErrorHandler(handler: ErrorHandler): void {
  globalErrorHandler = handler
}

export function getGlobalErrorHandler(): ErrorHandler {
  return globalErrorHandler
}

// 处理错误
export function handleError(error: Error | AppError | unknown, context?: string): void {
  globalErrorHandler.handle(error, context)
}

// 上报错误
export function reportError(error: Error | AppError | unknown, context?: string): void {
  globalErrorHandler.report(error, context)
}

// 创建错误处理器 Hook
export interface UseErrorHandlerOptions {
  onError?: (error: AppError) => void
  context?: string
}

export interface UseErrorHandlerReturn {
  error: AppError | null
  handleError: (error: Error | AppError | unknown) => void
  clearError: () => void
  setError: (error: AppError | null) => void
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { onError, context } = options
  const [error, setError] = useState<AppError | null>(null)

  const handleErrorCallback = useCallback((err: Error | AppError | unknown) => {
    let appError: AppError
    
    if (err instanceof AppError) {
      appError = err
    } else if (err instanceof Error) {
      appError = new AppError(err.message, ErrorType.UNKNOWN, { cause: err })
    } else {
      appError = new AppError(String(err), ErrorType.UNKNOWN)
    }
    
    setError(appError)
    onError?.(appError)
    
    if (context) {
      globalErrorHandler.handle(appError, context)
    }
  }, [onError, context])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError: handleErrorCallback,
    clearError,
    setError,
  }
}

// 创建带错误处理的异步函数包装器
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    context?: string
    onError?: (error: AppError) => void
    rethrow?: boolean
  } = {}
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  const { context, onError, rethrow = false } = options

  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return await fn(...args)
    } catch (error) {
      let appError: AppError
      
      if (error instanceof AppError) {
        appError = error
      } else if (error instanceof Error) {
        appError = new AppError(error.message, ErrorType.UNKNOWN, { cause: error })
      } else {
        appError = new AppError(String(error), ErrorType.UNKNOWN)
      }
      
      if (context) {
        globalErrorHandler.handle(appError, context)
      }
      
      onError?.(appError)
      
      if (rethrow) {
        throw appError
      }
      
      return undefined
    }
  }
}

// 错误边界组件（用于 React Class Components）
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// 安全执行函数
export function safeExecute<T>(
  fn: () => T,
  defaultValue: T,
  context?: string
): T {
  try {
    return fn()
  } catch (error) {
    handleError(error, context)
    return defaultValue
  }
}

// 异步安全执行
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, context)
    return defaultValue
  }
}

export default {
  ErrorType,
  ErrorSeverity,
  AppError,
  mapHttpStatusToErrorType,
  getUserFriendlyMessage,
  ConsoleErrorHandler,
  setGlobalErrorHandler,
  getGlobalErrorHandler,
  handleError,
  reportError,
  useErrorHandler,
  withErrorHandling,
  safeExecute,
  safeExecuteAsync,
}
