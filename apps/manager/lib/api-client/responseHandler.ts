/**
 * API 响应处理工具
 * 解决重复代码问题：统一的响应处理和错误转换
 * 
 * 改进点：
 * 1. 统一处理 ApiResponse 包装
 * 2. 自动提取 data 字段
 * 3. 统一的错误转换
 * 4. 支持默认值
 */

import type { ApiResponse, PaginatedResponse } from '../../types'
import { ApiError } from './client'

/**
 * 提取响应数据
 * 自动处理 ApiResponse 包装，提取 data 字段
 * 
 * @example
 * const data = extractResponse(await fetch('/api/users'))
 * const users = extractResponse(response, []) // 带默认值
 */
export function extractResponse<T>(response: ApiResponse<T>, defaultValue?: T): T {
  if (response.success && response.data !== undefined) {
    return response.data
  }
  
  if (defaultValue !== undefined) {
    return defaultValue
  }
  
  throw new ApiError(
    response.status || 500,
    response.error || response.message || '响应数据为空',
    response
  )
}

/**
 * 安全提取响应数据
 * 不会抛出错误，失败时返回默认值
 * 
 * @example
 * const data = safeExtractResponse(response, [])
 */
export function safeExtractResponse<T>(response: ApiResponse<T>, defaultValue: T): T {
  if (response.success && response.data !== undefined) {
    return response.data
  }
  return defaultValue
}

/**
 * 提取分页响应数据
 * 自动处理分页响应的默认值
 * 
 * @example
 * const { items, pagination } = extractPaginatedResponse(response)
 */
export function extractPaginatedResponse<T>(
  response: ApiResponse<PaginatedResponse<T>>,
  defaultPage: number = 1,
  defaultPageSize: number = 20
): PaginatedResponse<T> {
  return safeExtractResponse(response, {
    items: [],
    pagination: {
      page: defaultPage,
      pageSize: defaultPageSize,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
  })
}

/**
 * 创建响应处理器
 * 用于批量创建 API 函数
 * 
 * @example
 * const handler = createResponseHandler<User[]>([])
 * const users = handler(await fetch('/api/users'))
 */
export function createResponseHandler<T>(defaultValue: T) {
  return (response: ApiResponse<T>): T => {
    return safeExtractResponse(response, defaultValue)
  }
}

/**
 * 创建分页响应处理器
 * 
 * @example
 * const handler = createPaginatedHandler<User>(20)
 * const { items, pagination } = handler(response)
 */
export function createPaginatedHandler<T>(pageSize: number = 20) {
  return (response: ApiResponse<PaginatedResponse<T>>, page: number = 1): PaginatedResponse<T> => {
    return extractPaginatedResponse(response, page, pageSize)
  }
}

/**
 * API 函数包装器
 * 自动处理响应提取
 * 
 * @example
 * const fetchUsers = wrapApiFunction(
 *   () => request<ApiResponse<User[]>>('/api/users'),
 *   []
 * )
 */
export function wrapApiFunction<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<ApiResponse<T>>,
  defaultValue: T
): (...params: P) => Promise<T> {
  return async (...params: P): Promise<T> => {
    const response = await apiFunction(...params)
    return safeExtractResponse(response, defaultValue)
  }
}

/**
 * 分页 API 函数包装器
 * 
 * @example
 * const fetchUsersPaginated = wrapPaginatedApiFunction(
 *   (page, pageSize) => request<ApiResponse<PaginatedResponse<User>>>(`/api/users?page=${page}`),
 *   20
 * )
 */
export function wrapPaginatedApiFunction<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<ApiResponse<PaginatedResponse<T>>>,
  defaultPageSize: number = 20
): (...params: P) => Promise<PaginatedResponse<T>> {
  return async (...params: P): Promise<PaginatedResponse<T>> => {
    const response = await apiFunction(...params)
    return extractPaginatedResponse(response, 1, defaultPageSize)
  }
}

/**
 * 响应转换器
 * 用于转换响应数据格式
 * 
 * @example
 * const transform = createResponseTransformer<User, UserViewModel>(
 *   user => ({ ...user, displayName: user.name })
 * )
 * const viewModels = transform(response)
 */
export function createResponseTransformer<T, R>(
  transformer: (data: T) => R
): (response: ApiResponse<T>, defaultValue?: R) => R {
  return (response: ApiResponse<T>, defaultValue?: R): R => {
    const data = extractResponse(response, defaultValue as T)
    return transformer(data)
  }
}

/**
 * 批量响应处理器
 * 用于处理多个并行请求
 * 
 * @example
 * const [users, posts] = await handleBatchResponses([
 *   fetchUsers(),
 *   fetchPosts()
 * ], [[], []])
 */
export async function handleBatchResponses<T extends any[]>(
  promises: { [K in keyof T]: Promise<ApiResponse<T[K]>> },
  defaultValues: { [K in keyof T]: T[K] }
): Promise<T> {
  const responses = await Promise.all(promises)
  return responses.map((response, index) => 
    safeExtractResponse(response, defaultValues[index])
  ) as T
}

/**
 * 响应验证器
 * 验证响应是否符合预期
 * 
 * @example
 * const validator = createResponseValidator<User>(user => !!user.id)
 * if (validator(response)) {
 *   // 响应有效
 * }
 */
export function createResponseValidator<T>(
  validator: (data: T) => boolean
): (response: ApiResponse<T>) => boolean {
  return (response: ApiResponse<T>): boolean => {
    return response.success && response.data !== undefined && validator(response.data)
  }
}

/**
 * 错误响应处理器
 * 统一处理错误响应
 * 
 * @example
 * const error = handleErrorResponse(response)
 * if (error) {
 *   console.error(error.message)
 * }
 */
export function handleErrorResponse<T>(response: ApiResponse<T>): Error | null {
  if (response.success) {
    return null
  }
  
  return new ApiError(
    response.status || 500,
    response.error || response.message || '请求失败',
    response
  )
}

export default {
  extractResponse,
  safeExtractResponse,
  extractPaginatedResponse,
  createResponseHandler,
  createPaginatedHandler,
  wrapApiFunction,
  wrapPaginatedApiFunction,
  createResponseTransformer,
  handleBatchResponses,
  createResponseValidator,
  handleErrorResponse,
}
