/**
 * Service 层类型定义
 * 定义通用的 Service 接口和类型
 */

// ========== 通用类型 ==========

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface SortParams {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: unknown
}

// ========== Service 接口 ==========

export interface IBaseService<T, CreateDTO, UpdateDTO> {
  // 基础 CRUD
  findById(id: string): T | null
  findAll(filters?: FilterParams): T[]
  create(data: CreateDTO): Promise<T>
  update(id: string, data: UpdateDTO): Promise<T | null>
  delete(id: string): boolean

  // 分页查询
  findPaginated(
    pagination: PaginationParams,
    filters?: FilterParams,
    sort?: SortParams
  ): PaginationResult<T>

  // 批量操作
  createMany(items: CreateDTO[]): Promise<T[]>
  updateMany(ids: string[], data: UpdateDTO): Promise<number>
  deleteMany(ids: string[]): number
}

// ========== 业务错误 ==========

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    )
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class PermissionError extends ServiceError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403)
    this.name = 'PermissionError'
  }
}

// ========== 查询构建器类型 ==========

export interface QueryCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'isNull'
  value?: unknown
}

export interface QueryOptions {
  conditions?: QueryCondition[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }[]
  limit?: number
  offset?: number
}
