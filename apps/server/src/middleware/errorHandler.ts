/**
 * 统一错误处理中间件
 * 集中处理所有API错误，提供统一的错误响应格式
 */

import { Request, Response, NextFunction } from 'express'

/**
 * 应用错误类
 * 用于区分业务错误和系统错误
 */
export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  public errors: Record<string, string>

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400, 'VALIDATION_ERROR')
    this.errors = errors
  }
}

/**
 * 认证错误类
 */
export class AuthError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401, 'AUTH_ERROR')
  }
}

/**
 * 权限错误类
 */
export class PermissionError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, 'PERMISSION_ERROR')
  }
}

/**
 * 资源未找到错误类
 */
export class NotFoundError extends AppError {
  constructor(resource: string = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND')
  }
}

/**
 * 速率限制错误类
 */
export class RateLimitError extends AppError {
  public retryAfter: number

  constructor(message: string = '请求过于频繁', retryAfter: number = 60) {
    super(message, 429, 'RATE_LIMIT')
    this.retryAfter = retryAfter
  }
}

/**
 * 统一错误响应格式
 */
interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: Record<string, string>
  }
  timestamp: string
  requestId?: string
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 统一错误处理中间件
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = generateRequestId()
  const timestamp = new Date().toISOString()

  // 默认错误信息
  let statusCode = 500
  let errorCode = 'INTERNAL_ERROR'
  let message = '服务器内部错误'
  let details: Record<string, string> | undefined

  // 处理已知错误类型
  if (err instanceof AppError) {
    statusCode = err.statusCode
    errorCode = err.code
    message = err.message

    if (err instanceof ValidationError) {
      details = err.errors
    }

    if (err instanceof RateLimitError) {
      res.setHeader('Retry-After', err.retryAfter.toString())
    }
  } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
    // 处理验证库错误
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
    message = err.message
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    errorCode = 'AUTH_ERROR'
    message = '未授权访问'
  }

  // 记录错误日志
  const logData = {
    requestId,
    timestamp,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id
  }

  if (statusCode >= 500) {
    console.error('[ERROR]', logData)
  } else if (statusCode >= 400) {
    console.warn('[WARN]', logData)
  }

  // 发送错误响应
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      ...(details && { details })
    },
    timestamp,
    requestId
  }

  res.status(statusCode).json(response)
}

/**
 * 404错误处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `找不到路径: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND'
    },
    timestamp: new Date().toISOString()
  })
}

/**
 * 异步路由包装器
 * 自动捕获async函数中的错误
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 请求日志中间件
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  const requestId = generateRequestId()

  // 将requestId附加到请求对象
  ;(req as any).requestId = requestId

  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 50)
    }

    if (res.statusCode >= 400) {
      console.warn('[REQUEST]', logData)
    } else {
      console.log('[REQUEST]', logData)
    }
  })

  next()
}
