/**
 * 安全验证中间件
 * 提供统一的输入验证和安全检查
 */

import { Request, Response, NextFunction } from 'express'
import { z, ZodTypeAny } from 'zod'

/**
 * 验证错误响应
 */
interface ValidationError {
  field: string
  message: string
  value?: any
}

/**
 * 安全验证选项
 */
interface ValidationOptions {
  stripUnknown?: boolean  // 移除未知字段
  strict?: boolean        // 严格模式
  transform?: boolean     // 是否转换数据
}

/**
 * 创建增强的请求体验证中间件
 */
export function validateBodyEnhanced<T extends ZodTypeAny>(
  schema: T,
  options: ValidationOptions = {}
) {
  const { stripUnknown = true, strict = false } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate = req.body

      // 预处理：移除危险字符
      if (typeof dataToValidate === 'object' && dataToValidate !== null) {
        dataToValidate = sanitizeObject(dataToValidate)
      }

      const result = schema.safeParse(dataToValidate)

      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.path.length > 0 ? getNestedValue(dataToValidate, issue.path as (string | number)[]) : undefined
        }))

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors
          },
          timestamp: new Date().toISOString()
        })
        return
      }

      // 替换请求体为验证后的数据
      req.body = result.data
      ;(req as any).validatedBody = result.data

      next()
    } catch (error) {
      console.error('[Validation Error]', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_INTERNAL_ERROR',
          message: '验证过程发生错误'
        },
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * 创建增强的查询参数验证中间件
 */
export function validateQueryEnhanced<T extends ZodTypeAny>(
  schema: T,
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query)

      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.path.length > 0 ? getNestedValue(req.query, issue.path as (string | number)[]) : undefined
        }))

        res.status(400).json({
          success: false,
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            message: '查询参数验证失败',
            details: errors
          },
          timestamp: new Date().toISOString()
        })
        return
      }

      ;(req as any).validatedQuery = result.data
      next()
    } catch (error) {
      console.error('[Query Validation Error]', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_INTERNAL_ERROR',
          message: '查询参数验证过程发生错误'
        },
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * 创建增强的URL参数验证中间件
 */
export function validateParamsEnhanced<T extends ZodTypeAny>(
  schema: T,
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params)

      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.path.length > 0 ? getNestedValue(req.params, issue.path as (string | number)[]) : undefined
        }))

        res.status(400).json({
          success: false,
          error: {
            code: 'PARAMS_VALIDATION_ERROR',
            message: 'URL参数验证失败',
            details: errors
          },
          timestamp: new Date().toISOString()
        })
        return
      }

      req.params = result.data as any
      ;(req as any).validatedParams = result.data

      next()
    } catch (error) {
      console.error('[Params Validation Error]', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_INTERNAL_ERROR',
          message: 'URL参数验证过程发生错误'
        },
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * 对象消毒 - 移除危险字符
 */
function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // 检查键名是否包含危险字符
      if (isDangerousKey(key)) {
        console.warn(`[Security] Dangerous key detected: ${key}`)
        continue
      }
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  return obj
}

/**
 * 字符串消毒
 */
function sanitizeString(str: string): string {
  // 移除潜在的XSS攻击向量
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
}

/**
 * 检查键名是否危险
 */
function isDangerousKey(key: string): boolean {
  const dangerousPatterns = [
    /^\$/,           // MongoDB操作符
    /^__/,           // 双下划线开头
    /constructor/i,
    /prototype/i,
    /__proto__/i,
  ]
  return dangerousPatterns.some(pattern => pattern.test(key))
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: any, path: (string | number)[]): any {
  let current = obj
  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[key]
  }
  return current
}

/**
 * SQL注入检测中间件
 * 放宽检测规则，只对明显的SQL注入模式进行检测
 */
export function sqlInjectionDetector(req: Request, res: Response, next: NextFunction): void {
  // 更严格的SQL注入模式，减少误报
  const sqlPatterns = [
    // 经典的SQL注入模式：' OR '1'='1
    /(\b(OR|AND)\b\s*['"]\s*\d+\s*['"]\s*=\s*['"]\s*\d+)/i,
    // 注释符后跟SQL关键字
    /(--|#|\/\*)\s*(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)/i,
    // 分号后跟SQL关键字（多语句注入）
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)/i,
    // WAITFOR DELAY 时间盲注
    /(\bWAITFOR\b.*\bDELAY\b)/i,
    // 危险的存储过程
    /(\bEXEC\s*\(\s*['"])/i,
    // UNION SELECT 联合注入
    /(\bUNION\b.*\bSELECT\b)/i,
  ]

  // 安全的字段白名单 - 这些字段可以包含SQL关键字
  const safeFields = ['name', 'description', 'title', 'content', 'text', 'query', 'search']

  function checkValue(value: any, path: string): boolean {
    // 跳过白名单字段
    const fieldName = path.split('.').pop() || ''
    if (safeFields.includes(fieldName)) {
      return false
    }

    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          console.warn(`[Security] Potential SQL injection detected at ${path}: ${value.substring(0, 50)}`)
          return true
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (checkValue(val, `${path}.${key}`)) {
          return true
        }
      }
    }
    return false
  }

  const suspicious = checkValue(req.body, 'body') ||
                    checkValue(req.query, 'query') ||
                    checkValue(req.params, 'params')

  if (suspicious) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SECURITY_VIOLATION',
        message: '检测到潜在的安全威胁'
      },
      timestamp: new Date().toISOString()
    })
    return
  }

  next()
}

/**
 * 请求大小限制中间件
 */
export function createSizeLimiter(maxSize: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10)

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `请求体大小超过限制 (${Math.round(maxSize / 1024)}KB)`
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    next()
  }
}

/**
 * 内容类型验证中间件
 */
export function contentTypeValidator(allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.get('content-type') || ''

    // 允许没有Content-Type的请求（如GET请求）
    if (!contentType && req.method === 'GET') {
      next()
      return
    }

    const isAllowed = allowedTypes.some(type =>
      contentType.includes(type)
    )

    if (!isAllowed) {
      res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `不支持的Content-Type，只允许: ${allowedTypes.join(', ')}`
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    next()
  }
}

// ========== 常用验证Schema ==========

/**
 * ID参数Schema
 */
export const idParamSchema = z.object({
  id: z.string()
    .min(1, 'ID不能为空')
    .max(50, 'ID长度不能超过50字符')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID只能包含字母、数字、下划线和横线')
})

/**
 * 分页查询Schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

/**
 * 搜索查询Schema
 */
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  filters: z.record(z.string(), z.any()).optional()
})
