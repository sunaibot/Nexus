/**
 * 路由辅助函数
 * 提供通用的路由处理逻辑，减少代码重复
 */

import { Request, Response, NextFunction } from 'express'
import { ErrorCode, ErrorCodeToStatus, ErrorCodeToMessage, AppError } from '../../types/error-codes.js'

// 统一成功响应格式
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    pageSize?: number
    timestamp?: string
  }
}

// 统一错误响应格式
interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, any>
  }
  timestamp: string
  requestId?: string
}

// 生成请求ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// 通用成功响应
export function successResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: SuccessResponse<T>['meta']
) {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  }
  return res.status(statusCode).json(response)
}

// 通用错误响应（支持新旧两种格式兼容）
export function errorResponse(
  res: Response,
  error: string | ErrorCode | AppError,
  statusCodeOrDetails?: number | Record<string, any>,
  details?: Record<string, any>
): Response {
  const requestId = generateRequestId()
  const timestamp = new Date().toISOString()

  // 处理 AppError 类型
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp,
      requestId,
    }
    return res.status(error.statusCode).json(response)
  }

  // 处理 ErrorCode 枚举
  if (typeof error === 'string' && Object.values(ErrorCode).includes(error as ErrorCode)) {
    const code = error as ErrorCode
    const statusCode = typeof statusCodeOrDetails === 'number'
      ? statusCodeOrDetails
      : ErrorCodeToStatus[code]
    const extraDetails = typeof statusCodeOrDetails === 'object'
      ? statusCodeOrDetails
      : details

    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message: ErrorCodeToMessage[code],
        details: extraDetails,
      },
      timestamp,
      requestId,
    }
    return res.status(statusCode).json(response)
  }

  // 处理字符串错误消息（兼容旧代码）
  const statusCode = typeof statusCodeOrDetails === 'number' ? statusCodeOrDetails : 500
  const extraDetails = typeof statusCodeOrDetails === 'object' ? statusCodeOrDetails : details

  const response: ErrorResponse = {
    success: false,
    error: {
      code: statusCode === 404 ? ErrorCode.NOT_FOUND :
            statusCode === 403 ? ErrorCode.FORBIDDEN :
            statusCode === 401 ? ErrorCode.UNAUTHORIZED :
            statusCode === 400 ? ErrorCode.BAD_REQUEST :
            ErrorCode.INTERNAL_ERROR,
      message: error,
      details: extraDetails,
    },
    timestamp,
    requestId,
  }
  return res.status(statusCode).json(response)
}

// 异步处理包装器，自动捕获错误并统一处理
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // 如果是 AppError，直接处理
      if (error instanceof AppError) {
        return errorResponse(res, error)
      }

      // 处理常见的数据库错误
      if (error.message?.includes('UNIQUE constraint failed')) {
        return errorResponse(res, ErrorCode.RESOURCE_EXISTS, 409, {
          field: error.message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/)?.[2],
        })
      }

      if (error.message?.includes('FOREIGN KEY constraint failed')) {
        return errorResponse(res, ErrorCode.VALIDATION_ERROR, 400, {
          message: '引用的资源不存在',
        })
      }

      // 其他错误交给下一个错误处理中间件
      next(error)
    })
  }
}

// 获取当前用户ID
export function getUserId(req: Request): string {
  return (req as any).user?.id
}

// 获取当前用户
export function getUser(req: Request): any {
  return (req as any).user
}

// 标准化ID参数（处理 string | string[] 类型）
export function normalizeId(id: string | string[] | undefined): string {
  if (id === undefined) return ''
  return Array.isArray(id) ? id[0] : id
}

// 获取客户端信息（IP和User-Agent）
export function getClientInfo(req: Request): { ip: string; userAgent: string } {
  return {
    ip: (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string,
    userAgent: (req.headers['user-agent'] || '') as string,
  }
}

// 通用CRUD路由创建器
interface CrudOptions<T> {
  getAll: (userId: string, ...args: any[]) => T[]
  getById: (id: string) => T | null
  create: (userId: string, data: any) => string | null
  update: (id: string, data: any) => boolean
  delete: (id: string) => boolean
  checkOwnership?: (item: T, userId: string) => boolean
  resourceName: string
}

// 权限检查中间件生成器
interface OwnershipOptions<T> {
  getResource: (id: string) => T | null
  checkOwnership: (resource: T, userId: string) => boolean
  resourceName: string
}

export function createOwnershipMiddleware<T>(options: OwnershipOptions<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req)
    const id = normalizeId(req.params.id)

    if (!id) {
      return errorResponse(res, ErrorCode.PARAM_MISSING, 400, {
        field: 'id',
        message: `${options.resourceName} ID is required`,
      })
    }

    const resource = options.getResource(id)
    if (!resource) {
      return errorResponse(res, ErrorCode.NOT_FOUND, 404, {
        resource: options.resourceName,
        id,
      })
    }

    if (!options.checkOwnership(resource, userId)) {
      return errorResponse(res, ErrorCode.PERMISSION_DENIED, 403)
    }

    // 将资源附加到请求对象，供后续使用
    ;(req as any).resource = resource
    next()
  }
}

// 简化的权限检查中间件（基于资源字段）
interface SimpleOwnershipOptions<T> {
  getResource: (id: string) => T | null
  resourceName: string
  ownershipField: keyof T
}

export function createSimpleOwnershipMiddleware<T extends Record<string, any>>(options: SimpleOwnershipOptions<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req)
    const id = normalizeId(req.params.id)

    if (!id) {
      return errorResponse(res, ErrorCode.PARAM_MISSING, 400, {
        field: 'id',
        message: `${options.resourceName} ID is required`,
      })
    }

    const resource = options.getResource(id)
    if (!resource) {
      return errorResponse(res, ErrorCode.NOT_FOUND, 404, {
        resource: options.resourceName,
        id,
      })
    }

    if (resource[options.ownershipField] !== userId) {
      return errorResponse(res, ErrorCode.PERMISSION_DENIED, 403)
    }

    // 将资源附加到请求对象，供后续使用
    ;(req as any).resource = resource
    next()
  }
}

// 通用错误处理（兼容旧代码）
export function handleError(res: Response, error: any, message: string) {
  console.error(`Error: ${message}`, error)

  // 如果已经是 AppError，使用新的错误响应格式
  if (error instanceof AppError) {
    return errorResponse(res, error)
  }

  // 兼容旧代码的字符串错误
  return errorResponse(res, message || '操作失败', 500, {
    originalError: error?.message || error,
  })
}

// 分页辅助函数
export function getPaginationParams(req: Request): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20))
  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}

// 排序辅助函数
export function getSortParams(
  req: Request,
  allowedFields: string[],
  defaultSort: string = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): { field: string; order: 'asc' | 'desc' } {
  const field = (req.query.sort as string) || defaultSort
  const order = ((req.query.order as string)?.toLowerCase() as 'asc' | 'desc') || defaultOrder

  return {
    field: allowedFields.includes(field) ? field : defaultSort,
    order: order === 'asc' || order === 'desc' ? order : defaultOrder,
  }
}
