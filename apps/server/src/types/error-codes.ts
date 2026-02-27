/**
 * 统一错误码定义
 * 提供标准化的错误码体系，便于前端处理和错误追踪
 */

export enum ErrorCode {
  // 系统级错误 (1xxx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 认证授权错误 (2xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  FORBIDDEN = 'FORBIDDEN',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // 请求错误 (3xxx)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PARAM_MISSING = 'PARAM_MISSING',
  PARAM_INVALID = 'PARAM_INVALID',

  // 资源错误 (4xxx)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_GONE = 'RESOURCE_GONE',

  // 业务逻辑错误 (5xxx)
  BOOKMARK_NOT_FOUND = 'BOOKMARK_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_URL = 'INVALID_URL',
  DUPLICATE_BOOKMARK = 'DUPLICATE_BOOKMARK',
  CATEGORY_HAS_BOOKMARKS = 'CATEGORY_HAS_BOOKMARKS',

  // 数据库错误 (6xxx)
  DB_ERROR = 'DB_ERROR',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',

  // 文件操作错误 (7xxx)
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
}

// HTTP 状态码映射
export const ErrorCodeToStatus: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT_ERROR]: 504,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.PERMISSION_DENIED]: 403,

  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.PARAM_MISSING]: 400,
  [ErrorCode.PARAM_INVALID]: 400,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_GONE]: 410,

  [ErrorCode.BOOKMARK_NOT_FOUND]: 404,
  [ErrorCode.CATEGORY_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.INVALID_URL]: 400,
  [ErrorCode.DUPLICATE_BOOKMARK]: 409,
  [ErrorCode.CATEGORY_HAS_BOOKMARKS]: 400,

  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.DB_CONNECTION_ERROR]: 500,
  [ErrorCode.DB_QUERY_ERROR]: 500,

  [ErrorCode.FILE_UPLOAD_ERROR]: 500,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: 415,
  [ErrorCode.FILE_NOT_FOUND]: 404,
}

// 错误消息映射（中文）
export const ErrorCodeToMessage: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用',
  [ErrorCode.TIMEOUT_ERROR]: '请求超时',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '请求过于频繁，请稍后再试',

  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.TOKEN_INVALID]: '无效的认证令牌',
  [ErrorCode.FORBIDDEN]: '禁止访问',
  [ErrorCode.PERMISSION_DENIED]: '权限不足',

  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCode.PARAM_MISSING]: '缺少必要参数',
  [ErrorCode.PARAM_INVALID]: '参数格式不正确',

  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.RESOURCE_EXISTS]: '资源已存在',
  [ErrorCode.RESOURCE_CONFLICT]: '资源冲突',
  [ErrorCode.RESOURCE_GONE]: '资源已删除',

  [ErrorCode.BOOKMARK_NOT_FOUND]: '书签不存在',
  [ErrorCode.CATEGORY_NOT_FOUND]: '分类不存在',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.INVALID_URL]: '无效的URL地址',
  [ErrorCode.DUPLICATE_BOOKMARK]: '书签已存在',
  [ErrorCode.CATEGORY_HAS_BOOKMARKS]: '分类下存在书签，无法删除',

  [ErrorCode.DB_ERROR]: '数据库错误',
  [ErrorCode.DB_CONNECTION_ERROR]: '数据库连接失败',
  [ErrorCode.DB_QUERY_ERROR]: '数据库查询错误',

  [ErrorCode.FILE_UPLOAD_ERROR]: '文件上传失败',
  [ErrorCode.FILE_TOO_LARGE]: '文件过大',
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: '不支持的文件类型',
  [ErrorCode.FILE_NOT_FOUND]: '文件不存在',
}

// 应用错误类
export class AppError extends Error {
  public code: ErrorCode
  public statusCode: number
  public details?: Record<string, any>
  public isOperational: boolean

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message || ErrorCodeToMessage[code])
    this.code = code
    this.statusCode = ErrorCodeToStatus[code]
    this.details = details
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      timestamp: new Date().toISOString(),
    }
  }
}

// 便捷的错误创建函数
export const createError = {
  notFound: (resource: string, id?: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource}${id ? ` (ID: ${id})` : ''}不存在`),

  unauthorized: (message?: string) =>
    new AppError(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message?: string) =>
    new AppError(ErrorCode.FORBIDDEN, message || '权限不足'),

  validation: (details: Record<string, string>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, '数据验证失败', details),

  badRequest: (message: string) =>
    new AppError(ErrorCode.BAD_REQUEST, message),

  internal: (message?: string) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, undefined, false),
}
