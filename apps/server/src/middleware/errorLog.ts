/**
 * 系统错误日志中间件
 * 捕获所有未处理的错误并记录到安全日志
 */

import { Request, Response, NextFunction } from 'express'
import { logSystemError, SYSTEM_ERROR_ACTIONS } from '../db/index.js'

/**
 * 错误日志中间件
 * 捕获路由处理中的错误并记录到审计日志
 */
export function errorLogMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 获取用户信息
  const user = (req as any).user
  const userId = user?.id || null
  const username = user?.username || null

  // 获取请求信息
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const userAgent = (req.headers['user-agent'] || '') as string

  // 判断错误类型
  let action: string = SYSTEM_ERROR_ACTIONS.INTERNAL_ERROR
  const errorMessage = err.message?.toLowerCase() || ''

  if (errorMessage.includes('database') || errorMessage.includes('sqlite') || errorMessage.includes('sql')) {
    action = SYSTEM_ERROR_ACTIONS.DATABASE_ERROR
  } else if (errorMessage.includes('api') || errorMessage.includes('request') || errorMessage.includes('response')) {
    action = SYSTEM_ERROR_ACTIONS.API_ERROR
  } else if (errorMessage.includes('external') || errorMessage.includes('fetch') || errorMessage.includes('axios')) {
    action = SYSTEM_ERROR_ACTIONS.EXTERNAL_SERVICE_ERROR
  }

  // 记录系统错误日志
  logSystemError(err, {
    action,
    path: req.path,
    method: req.method,
    userId,
    username,
    ip,
    userAgent,
    details: {
      query: req.query,
      body: req.body,
      params: req.params,
      statusCode: res.statusCode,
    }
  })

  console.error('[System Error]', err)

  // 继续传递错误到下一个错误处理中间件
  next(err)
}

/**
 * 包装异步路由处理函数，自动捕获错误
 * 用法: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 记录 API 错误（手动调用）
 * 用于在 catch 块中手动记录错误
 */
export function logAPIError(
  error: Error,
  req: Request,
  action: string = SYSTEM_ERROR_ACTIONS.API_ERROR
) {
  const user = (req as any).user
  const userId = user?.id || null
  const username = user?.username || null
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const userAgent = (req.headers['user-agent'] || '') as string

  logSystemError(error, {
    action,
    path: req.path,
    method: req.method,
    userId,
    username,
    ip,
    userAgent,
    details: {
      query: req.query,
      body: req.body,
      params: req.params,
    }
  })
}
