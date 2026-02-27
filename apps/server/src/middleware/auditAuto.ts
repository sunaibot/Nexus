/**
 * 自动审计中间件
 * 为敏感操作自动记录审计日志
 */

import { Request, Response, NextFunction } from 'express'
import { logAudit } from '../db/audit-enhanced.js'
import { getClientInfo } from '../routes/utils/index.js'

/**
 * 审计配置
 */
interface AuditConfig {
  action: string
  resourceType?: string
  getResourceId?: (req: Request) => string | undefined
  getDetails?: (req: Request, res: Response) => any
  skipSuccess?: boolean  // 是否跳过成功响应的记录
  skipFailure?: boolean  // 是否跳过失败响应的记录
}

/**
 * 敏感操作映射
 */
const SENSITIVE_OPERATIONS: Record<string, AuditConfig> = {
  // 认证操作
  'POST /api/auth/login': { action: 'LOGIN', resourceType: 'auth' },
  'POST /api/auth/logout': { action: 'LOGOUT', resourceType: 'auth' },
  'POST /api/auth/password': { action: 'PASSWORD_CHANGE', resourceType: 'auth' },

  // 书签操作
  'POST /api/bookmarks': { action: 'BOOKMARK_CREATE', resourceType: 'bookmark' },
  'PATCH /api/bookmarks/:id': {
    action: 'BOOKMARK_UPDATE',
    resourceType: 'bookmark',
    getResourceId: (req) => req.params.id as string
  },
  'DELETE /api/bookmarks/:id': {
    action: 'BOOKMARK_DELETE',
    resourceType: 'bookmark',
    getResourceId: (req) => req.params.id as string
  },

  // 分类操作
  'POST /api/categories': { action: 'CATEGORY_CREATE', resourceType: 'category' },
  'PATCH /api/categories/:id': {
    action: 'CATEGORY_UPDATE',
    resourceType: 'category',
    getResourceId: (req) => req.params.id as string
  },
  'DELETE /api/categories/:id': {
    action: 'CATEGORY_DELETE',
    resourceType: 'category',
    getResourceId: (req) => req.params.id as string
  },

  // 用户管理
  'POST /api/users': { action: 'USER_CREATE', resourceType: 'user' },
  'PATCH /api/users/:id': {
    action: 'USER_UPDATE',
    resourceType: 'user',
    getResourceId: (req) => req.params.id as string
  },
  'DELETE /api/users/:id': {
    action: 'USER_DELETE',
    resourceType: 'user',
    getResourceId: (req) => req.params.id as string
  },

  // 设置操作
  'PATCH /api/settings': { action: 'SETTINGS_UPDATE', resourceType: 'settings' },

  // 文件传输
  'POST /api/file-transfers': { action: 'FILE_UPLOAD', resourceType: 'file_transfer' },
  'DELETE /api/file-transfers/:id': {
    action: 'FILE_DELETE',
    resourceType: 'file_transfer',
    getResourceId: (req) => req.params.id as string
  },

  // 数据导入导出
  'POST /api/data/import': { action: 'BOOKMARK_IMPORT', resourceType: 'data' },
  'POST /api/data/export': { action: 'BOOKMARK_EXPORT', resourceType: 'data' },
}

/**
 * 生成路由键
 */
function getRouteKey(method: string, path: string): string {
  // 移除查询参数
  const cleanPath = path.split('?')[0]
  // 将动态参数替换为 :id 格式
  const normalizedPath = cleanPath.replace(/\/[a-f0-9]{8,}/gi, '/:id')
  return `${method} ${normalizedPath}`
}

/**
 * 自动审计中间件
 * 根据路由自动记录审计日志
 */
export function autoAuditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const routeKey = getRouteKey(req.method, req.originalUrl)
  const config = SENSITIVE_OPERATIONS[routeKey]

  if (!config) {
    next()
    return
  }

  // 保存原始end方法
  const originalEnd = res.end.bind(res)
  const chunks: Buffer[] = []

  // 拦截响应数据
  res.end = function(chunk: any, encoding?: BufferEncoding | (() => void), cb?: () => void): Response {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    // 恢复原始end并调用
    res.end = originalEnd
    const result = res.end(chunk, encoding as any, cb)

    // 异步记录审计日志
    const statusCode = res.statusCode
    const isSuccess = statusCode >= 200 && statusCode < 300

    // 根据配置决定是否记录
    if ((isSuccess && config.skipSuccess) || (!isSuccess && config.skipFailure)) {
      return result
    }

    // 解析响应数据
    let responseData: any = null
    if (chunks.length > 0) {
      try {
        const body = Buffer.concat(chunks).toString('utf8')
        responseData = JSON.parse(body)
      } catch {
        // 解析失败不记录响应数据
      }
    }

    // 获取用户信息
    const user = (req as any).user
    const { ip, userAgent } = getClientInfo(req)

    // 构建审计详情
    const details: any = {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      requestBody: sanitizeRequestBody(req.body),
      ...(config.getDetails?.(req, res) || {})
    }

    // 如果响应包含数据，记录关键信息
    if (responseData) {
      if (responseData.id) details.responseId = responseData.id
      if (responseData.title) details.title = responseData.title
      if (responseData.name) details.name = responseData.name
    }

    // 记录审计日志
    logAudit({
      userId: user?.id || null,
      username: user?.username || null,
      action: config.action,
      resourceType: config.resourceType,
      resourceId: config.getResourceId?.(req),
      details,
      ip,
      userAgent,
      sessionId: (req as any).sessionId
    })

    return result
  }

  next()
}

/**
 * 清理请求体（移除敏感信息）
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'auth']
  const sanitized: any = {}

  for (const [key, value] of Object.entries(body)) {
    // 检查是否为敏感字段
    const isSensitive = sensitiveFields.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    )

    if (isSensitive) {
      sanitized[key] = '***'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * 手动审计装饰器
 * 用于在特定路由上手动标记需要审计
 */
export function audit(config: AuditConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 保存原始json方法
    const originalJson = res.json.bind(res)

    res.json = function(data: any): Response {
      // 恢复原始json
      res.json = originalJson

      // 异步记录审计日志
      const user = (req as any).user
      const { ip, userAgent } = getClientInfo(req)
      const statusCode = res.statusCode
      const isSuccess = statusCode >= 200 && statusCode < 300

      if ((isSuccess && config.skipSuccess) || (!isSuccess && config.skipFailure)) {
        return originalJson(data)
      }

      const details = {
        method: req.method,
        path: req.originalUrl,
        statusCode,
        requestBody: sanitizeRequestBody(req.body),
        responseData: data,
        ...(config.getDetails?.(req, res) || {})
      }

      logAudit({
        userId: user?.id || null,
        username: user?.username || null,
        action: config.action,
        resourceType: config.resourceType,
        resourceId: config.getResourceId?.(req),
        details,
        ip,
        userAgent,
        sessionId: (req as any).sessionId
      })

      return originalJson(data)
    }

    next()
  }
}

/**
 * 批量操作审计
 * 用于批量删除、导入等操作
 */
export function auditBatch(action: string, resourceType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now()
    const originalJson = res.json.bind(res)

    res.json = function(data: any): Response {
      res.json = originalJson

      const user = (req as any).user
      const { ip, userAgent } = getClientInfo(req)
      const duration = Date.now() - startTime

      // 从请求体中获取批量操作的数量
      const count = req.body?.items?.length || req.body?.ids?.length || 0

      logAudit({
        userId: user?.id || null,
        username: user?.username || null,
        action,
        resourceType,
        details: {
          method: req.method,
          path: req.originalUrl,
          count,
          duration,
          requestBody: sanitizeRequestBody(req.body),
          responseData: data
        },
        ip,
        userAgent,
        riskLevel: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
      })

      return originalJson(data)
    }

    next()
  }
}
